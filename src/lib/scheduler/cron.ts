import { prisma } from '@/lib/db/prisma'
import { sendPostToChannels, deleteTelegramMessage } from '@/lib/telegram/sender'
import { sendAdminFailureAlert, sendAdminSuccessAlert } from '@/lib/telegram/alerts'
import { logger } from '@/lib/security/logger'
import type { RecurrenceRule } from '@/types'

let schedulerInterval: ReturnType<typeof setInterval> | null = null

function calculateNextRun(currentDate: Date, rule: RecurrenceRule): Date {
  const next = new Date(currentDate)
  const interval = rule.interval && rule.interval > 0 ? rule.interval : 1

  switch (rule.type) {
    case 'INTERVAL_HOURS':
      next.setHours(next.getHours() + interval)
      break
    case 'DAILY':
      next.setDate(next.getDate() + interval)
      break
    case 'WEEKLY':
      if (rule.days && rule.days.length > 0) {
        // Find next matching day
        let found = false
        for (let i = 1; i <= 7; i++) {
          const candidate = new Date(next)
          candidate.setDate(candidate.getDate() + i)
          if (rule.days.includes(candidate.getDay())) {
            next.setTime(candidate.getTime())
            found = true
            break
          }
        }
        if (!found) {
          next.setDate(next.getDate() + 7 * interval)
        }
      } else {
        next.setDate(next.getDate() + 7 * interval)
      }
      break
    default:
      next.setDate(next.getDate() + 1)
  }

  return next
}

export async function processAutoDeletePosts() {
  try {
    const now = new Date()

    const expiredPosts = await prisma.post.findMany({
      where: {
        status: 'SENT',
        isDeletedFromTelegram: false,
        autoDeleteAt: { lte: now },
      },
    })

    if (expiredPosts.length === 0) return

    logger.info(`Processing auto-delete for ${expiredPosts.length} post(s)`)

    for (const post of expiredPosts) {
      if (!post.telegramMsgIds) {
        await prisma.post.update({
          where: { id: post.id },
          data: { isDeletedFromTelegram: true },
        })
        continue
      }

      try {
        const messageList = JSON.parse(post.telegramMsgIds) as Array<{ chatId: string; messageId: number }>
        for (const item of messageList) {
          if (item.chatId && item.messageId) {
            await deleteTelegramMessage(item.chatId, item.messageId)
          }
        }

        await prisma.post.update({
          where: { id: post.id },
          data: { isDeletedFromTelegram: true },
        })

        logger.info(`Post ${post.id} auto-deleted from Telegram channels`)
      } catch (err) {
        logger.error(`Failed to auto-delete post ${post.id}`, { error: err })
      }
    }
  } catch (error) {
    logger.error('Auto-delete processor error', { error })
  }
}

export async function processScheduledPosts() {
  try {
    const now = new Date()

    const posts = await prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      include: {
        channels: { include: { channel: true } },
        mediaFiles: { orderBy: { sortOrder: 'asc' } },
        poll: true,
      },
    })

    if (posts.length === 0) return

    logger.info(`Processing ${posts.length} scheduled post(s)`)

    for (const post of posts) {
      try {
        // Update status to SENDING
        await prisma.post.update({
          where: { id: post.id },
          data: { status: 'SENDING' },
        })

        const channelChatIds = post.channels.map((pc) => pc.channel.chatId)

        const results = await sendPostToChannels(post, channelChatIds)

        const allSuccess = Array.from(results.values()).every((r) => r.success)
        const messageIds = Array.from(results.entries())
          .filter(([, r]) => r.success)
          .map(([chatId, r]) => ({ chatId, messageId: r.messageId }))

        const errors = Array.from(results.entries())
          .filter(([, r]) => !r.success)
          .map(([chatId, r]) => ({ chatId, error: r.error || 'Unknown error' }))

        // Calculate auto-delete date if configured
        let autoDeleteAt: Date | null = null
        if (allSuccess && post.autoDeleteHours && post.autoDeleteHours > 0) {
          autoDeleteAt = new Date(Date.now() + post.autoDeleteHours * 3600 * 1000)
        }

        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: allSuccess ? 'SENT' : 'FAILED',
            sentAt: allSuccess ? new Date() : null,
            autoDeleteAt,
            telegramMsgIds: JSON.stringify(messageIds),
            errorMessage: errors.length > 0 ? JSON.stringify(errors) : null,
          },
        })

        // Trigger admin alerts for scheduled post
        const channelTitles = post.channels.map((pc) => pc.channel.title)
        if (!allSuccess || errors.length > 0) {
          sendAdminFailureAlert({
            postId: post.id,
            type: post.type,
            text: post.text,
            channelTitles,
            errors,
          }).catch(() => {})
        } else {
          sendAdminSuccessAlert(post.id, post.type, channelTitles).catch(() => {})
        }

        logger.info(`Scheduled post ${post.id} processed`, {
          success: allSuccess,
          channels: channelChatIds.length,
        })

        // If post was successfully sent and has recurrence rule, schedule next run
        if (allSuccess && post.isRecurring && post.recurrenceRule) {
          try {
            const rule = JSON.parse(post.recurrenceRule) as RecurrenceRule
            const nextRunAt = calculateNextRun(post.scheduledAt || now, rule)

            const endAt = post.recurrenceEndAt ? new Date(post.recurrenceEndAt) : null
            if (!endAt || nextRunAt <= endAt) {
              await prisma.post.create({
                data: {
                  type: post.type,
                  text: post.text,
                  parseMode: post.parseMode,
                  inlineKeyboard: post.inlineKeyboard,
                  hashtags: post.hashtags,
                  disableComments: post.disableComments,
                  protectContent: post.protectContent,
                  disableNotification: post.disableNotification,
                  pinMessage: post.pinMessage,
                  ttsText: post.ttsText,
                  ttsLanguage: post.ttsLanguage,
                  ttsAudioPath: post.ttsAudioPath,
                  autoDeleteHours: post.autoDeleteHours,
                  isRecurring: true,
                  recurrenceRule: post.recurrenceRule,
                  recurrenceEndAt: post.recurrenceEndAt,
                  status: 'SCHEDULED',
                  scheduledAt: nextRunAt,
                  channels: {
                    create: post.channels.map((pc) => ({ channelId: pc.channelId })),
                  },
                  mediaFiles: post.mediaFiles.length > 0
                    ? {
                        create: post.mediaFiles.map((mf) => ({
                          type: mf.type,
                          filePath: mf.filePath,
                          fileName: mf.fileName,
                          fileSize: mf.fileSize,
                          mimeType: mf.mimeType,
                          caption: mf.caption,
                          sortOrder: mf.sortOrder,
                        })),
                      }
                    : undefined,
                  poll: post.poll
                    ? {
                        create: {
                          question: post.poll.question,
                          options: post.poll.options,
                          isAnonymous: post.poll.isAnonymous,
                          type: post.poll.type,
                          correctOption: post.poll.correctOption,
                          explanation: post.poll.explanation,
                          multiAnswer: post.poll.multiAnswer,
                        },
                      }
                    : undefined,
                },
              })
              logger.info(`Recurring post created for next run at ${nextRunAt.toISOString()}`)
            }
          } catch (recurErr) {
            logger.error(`Failed to schedule next recurrence for post ${post.id}`, { error: recurErr })
          }
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error'
        await prisma.post.update({
          where: { id: post.id },
          data: { status: 'FAILED', errorMessage: errMsg },
        })
        sendAdminFailureAlert({
          postId: post.id,
          type: post.type,
          text: post.text,
          channelTitles: post.channels.map((pc) => pc.channel.title),
          errors: [{ error: errMsg }],
        }).catch(() => {})
        logger.error(`Failed to process scheduled post ${post.id}`, { error: errMsg })
      }
    }
  } catch (error) {
    logger.error('Scheduler error', { error })
  }
}

export async function runAllCronTasks() {
  await Promise.all([
    processScheduledPosts(),
    processAutoDeletePosts(),
  ])
}

export function startScheduler() {
  if (schedulerInterval) return

  logger.info('Post scheduler started (60s interval)')
  schedulerInterval = setInterval(runAllCronTasks, 60_000)

  // Run immediately on start
  runAllCronTasks()
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    logger.info('Post scheduler stopped')
  }
}
