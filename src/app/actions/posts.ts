'use server'

import { prisma } from '@/lib/db/prisma'
import { sendPostToChannels, editPublishedTelegramMessage } from '@/lib/telegram/sender'
import { sendAdminFailureAlert, sendAdminSuccessAlert } from '@/lib/telegram/alerts'
import { logAudit } from '@/lib/security/audit'
import { revalidatePath } from 'next/cache'
import type { CreatePostInput, EditPostInput, PostFilter, DashboardStats } from '@/types'

export async function createPost(data: CreatePostInput) {
  if (data.draftId) {
    try {
      await prisma.post.delete({ where: { id: data.draftId } })
    } catch {
      // Ignore if draft doesn't exist
    }
  }

  const post = await prisma.post.create({
    data: {
      type: data.type,
      text: data.text || null,
      parseMode: data.parseMode,
      inlineKeyboard: data.inlineKeyboard ? JSON.stringify(data.inlineKeyboard) : null,
      hashtags: data.hashtags?.join(',') || null,
      disableComments: data.options.disableComments,
      protectContent: data.options.protectContent,
      disableNotification: data.options.disableNotification,
      pinMessage: data.options.pinMessage,
      ttsText: data.ttsText || null,
      ttsLanguage: data.ttsLanguage || null,
      ttsAudioPath: data.ttsAudioPath || null,
      autoDeleteHours: data.autoDeleteHours || null,
      isRecurring: data.isRecurring || false,
      recurrenceRule: data.recurrenceRule ? JSON.stringify(data.recurrenceRule) : null,
      recurrenceEndAt: data.recurrenceEndAt ? new Date(data.recurrenceEndAt) : null,
      status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      channels: {
        create: data.channelIds.map((channelId) => ({ channelId })),
      },
      mediaFiles: data.mediaFiles
        ? {
            create: data.mediaFiles.map((mf) => ({
              type: mf.type,
              filePath: mf.filePath,
              fileName: mf.fileName,
              fileSize: mf.fileSize,
              mimeType: mf.mimeType,
              caption: mf.caption || null,
              sortOrder: mf.sortOrder,
            })),
          }
        : undefined,
      poll: data.poll
        ? {
            create: {
              question: data.poll.question,
              options: JSON.stringify(data.poll.options),
              isAnonymous: data.poll.isAnonymous,
              type: data.poll.type,
              correctOption: data.poll.correctOption ?? null,
              explanation: data.poll.explanation || null,
              multiAnswer: data.poll.multiAnswer,
            },
          }
        : undefined,
    },
    include: {
      channels: { include: { channel: true } },
      mediaFiles: true,
      poll: true,
    },
  })

  await logAudit('post.create', { postId: post.id, type: data.type })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/history')
  revalidatePath('/dashboard/scheduled')

  return post
}

export async function sendPostNow(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      channels: { include: { channel: true } },
      mediaFiles: { orderBy: { sortOrder: 'asc' } },
      poll: true,
    },
  })

  if (!post) throw new Error('Post not found')

  await prisma.post.update({
    where: { id: postId },
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

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      status: allSuccess ? 'SENT' : 'FAILED',
      sentAt: allSuccess ? new Date() : null,
      autoDeleteAt,
      telegramMsgIds: JSON.stringify(messageIds),
      errorMessage: errors.length > 0 ? JSON.stringify(errors) : null,
    },
  })

  // Trigger admin alerts
  const channelTitles = post.channels.map((pc) => pc.channel.title)
  if (!allSuccess || errors.length > 0) {
    sendAdminFailureAlert({
      postId,
      type: post.type,
      text: post.text,
      channelTitles,
      errors,
    }).catch(() => {})
  } else {
    sendAdminSuccessAlert(postId, post.type, channelTitles).catch(() => {})
  }

  await logAudit('post.send', { postId, success: allSuccess, channels: channelChatIds.length })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/history')
  revalidatePath('/dashboard/scheduled')
  revalidatePath('/dashboard/analytics')

  return { success: allSuccess, errors, post: updated }
}

export async function editPublishedPost(data: EditPostInput) {
  const post = await prisma.post.findUnique({
    where: { id: data.postId },
    include: {
      channels: { include: { channel: true } },
      mediaFiles: true,
      poll: true,
    },
  })

  if (!post) throw new Error('Post not found')
  if (post.status !== 'SENT' || !post.telegramMsgIds) {
    throw new Error('Can only edit published posts with Telegram message records')
  }

  const messageList = JSON.parse(post.telegramMsgIds) as Array<{ chatId: string; messageId: number }>
  const editPayload = {
    type: post.type,
    text: data.text || null,
    parseMode: data.parseMode,
    inlineKeyboard: data.inlineKeyboard ? JSON.stringify(data.inlineKeyboard) : null,
  }

  const editErrors: Array<{ chatId: string; error?: string }> = []

  for (const item of messageList) {
    if (item.chatId && item.messageId) {
      const res = await editPublishedTelegramMessage(item.chatId, item.messageId, editPayload)
      if (!res.success) {
        editErrors.push({ chatId: item.chatId, error: res.error })
      }
    }
  }

  const updated = await prisma.post.update({
    where: { id: data.postId },
    data: {
      text: data.text || null,
      parseMode: data.parseMode,
      inlineKeyboard: editPayload.inlineKeyboard,
    },
  })

  await logAudit('post.edit_published', { postId: data.postId, errors: editErrors.length })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/history')

  return {
    success: editErrors.length === 0,
    errors: editErrors,
    post: updated,
  }
}

export async function schedulePost(postId: string, scheduledAt: string) {
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      status: 'SCHEDULED',
      scheduledAt: new Date(scheduledAt),
    },
  })

  await logAudit('post.schedule', { postId, scheduledAt })
  revalidatePath('/dashboard/scheduled')
  revalidatePath('/dashboard')

  return post
}

export async function cancelScheduledPost(postId: string) {
  const post = await prisma.post.update({
    where: { id: postId },
    data: { status: 'DRAFT', scheduledAt: null },
  })

  await logAudit('post.cancel', { postId })
  revalidatePath('/dashboard/scheduled')
  revalidatePath('/dashboard')

  return post
}

export async function deletePost(postId: string) {
  await prisma.post.delete({ where: { id: postId } })
  await logAudit('post.delete', { postId })
  revalidatePath('/dashboard/history')
  revalidatePath('/dashboard/scheduled')
  revalidatePath('/dashboard')
}

export async function getPostHistory(
  page = 1,
  limit = 20,
  filters?: PostFilter
) {
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (filters?.search) {
    where.text = { contains: filters.search }
  }
  if (filters?.type) {
    where.type = filters.type
  }
  if (filters?.status) {
    where.status = filters.status
  }
  if (filters?.channelId) {
    where.channels = { some: { channelId: filters.channelId } }
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        channels: { include: { channel: true } },
        mediaFiles: true,
        poll: true,
      },
    }),
    prisma.post.count({ where }),
  ])

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getScheduledPosts() {
  return prisma.post.findMany({
    where: { status: 'SCHEDULED' },
    orderBy: { scheduledAt: 'asc' },
    include: {
      channels: { include: { channel: true } },
      mediaFiles: true,
      poll: true,
    },
  })
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalChannels, postsToday, scheduledPosts, totalPosts] = await Promise.all([
    prisma.channel.count({ where: { isActive: true } }),
    prisma.post.count({ where: { createdAt: { gte: today } } }),
    prisma.post.count({ where: { status: 'SCHEDULED' } }),
    prisma.post.count(),
  ])

  return { totalChannels, postsToday, scheduledPosts, totalPosts }
}

export async function getRecentPosts(limit = 10) {
  return prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      channels: { include: { channel: true } },
    },
  })
}
