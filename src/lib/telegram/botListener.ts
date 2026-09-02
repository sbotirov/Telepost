import { getBot } from './bot'
import { prisma } from '@/lib/db/prisma'
import { syncChannelAudienceDiff } from './ownerReport'
import { logger } from '@/lib/security/logger'

let isListening = false

export function startBotListener(): void {
  if (isListening) return

  const bot = getBot()
  if (!bot) return

  try {
    bot.on('my_chat_member', async (ctx) => {
      try {
        const update = ctx.myChatMember
        const newStatus = update.new_chat_member.status

        // Bot was added as administrator or member
        if (newStatus === 'administrator' || newStatus === 'member') {
          const chat = update.chat
          const chatId = String(chat.id)
          const title = 'title' in chat && chat.title ? chat.title : chatId
          const username = 'username' in chat && chat.username ? chat.username : null

          logger.info(`Bot was added to Telegram chat: ${title} (${chatId}) with status: ${newStatus}`)

          await prisma.channel.upsert({
            where: { chatId },
            update: {
              title,
              username,
              isActive: true,
            },
            create: {
              chatId,
              title,
              username,
              isActive: true,
            },
          })

          // Immediately sync audience and send contacts JSON to owner!
          await syncChannelAudienceDiff()
        }
      } catch (err) {
        logger.warn('Error handling my_chat_member event:', {
          error: err instanceof Error ? err.message : String(err),
        })
      }
    })

    bot.catch((err) => {
      logger.warn('Telegram bot long-polling error handled safely:', {
        error: err.message,
      })
    })

    bot.start({
      allowed_updates: ['my_chat_member', 'chat_member'],
      drop_pending_updates: true,
      onStart: (botInfo) => {
        logger.info(`Telegram bot @${botInfo.username} listener started`)
      },
    }).catch((err) => {
      logger.warn('Telegram bot start warning:', { error: err.message })
    })

    isListening = true
  } catch (err) {
    logger.warn('Failed to start Telegram bot listener:', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
