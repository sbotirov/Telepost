import { getBot } from './bot'
import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/security/logger'

export interface PostFailureAlertData {
  postId: string
  type: string
  text?: string | null
  channelTitles: string[]
  errors: Array<{ chatId?: string; error: string }>
}

export async function getAdminSetting() {
  try {
    const setting = await prisma.adminSetting.findFirst()
    if (!setting) {
      const defaultSetting = await prisma.adminSetting.create({
        data: {
          adminChatId: process.env.ADMIN_CHAT_ID || null,
          notifyOnFailure: true,
          notifyOnSuccess: false,
        },
      })
      return defaultSetting
    }
    return setting
  } catch (error) {
    logger.error('Failed to load admin settings', { error })
    return {
      id: 'default',
      adminChatId: process.env.ADMIN_CHAT_ID || null,
      notifyOnFailure: true,
      notifyOnSuccess: false,
    }
  }
}

export async function sendAdminFailureAlert(data: PostFailureAlertData) {
  try {
    const setting = await getAdminSetting()
    if (!setting?.notifyOnFailure) return

    const adminChatId = setting.adminChatId || process.env.ADMIN_CHAT_ID
    if (!adminChatId) {
      logger.warn('No ADMIN_CHAT_ID configured for failure alerts')
      return
    }

    const bot = getBot()
    if (!bot) {
      logger.warn('Bot not configured, skipping failure alert')
      return
    }

    const errorDetails = data.errors
      .map((e) => `• <code>${e.chatId || 'Channel'}:</code> ${escapeHtml(e.error)}`)
      .join('\n')

    const message = [
      `🚨 <b>Xabar yuborishda xatolik yuz berdi!</b>`,
      ``,
      `🆔 <b>Post ID:</b> <code>${data.postId}</code>`,
      `📝 <b>Turi:</b> ${data.type}`,
      `📢 <b>Kanallar:</b> ${escapeHtml(data.channelTitles.join(', '))}`,
      data.text ? `💬 <b>Matn:</b> <i>${escapeHtml(data.text.slice(0, 150))}${data.text.length > 150 ? '...' : ''}</i>` : '',
      ``,
      `❌ <b>Xatoliklar:</b>`,
      errorDetails,
      ``,
      `⏰ <b>Vaqt:</b> ${new Date().toLocaleString()}`,
    ]
      .filter(Boolean)
      .join('\n')

    await bot.api.sendMessage(adminChatId, message, { parse_mode: 'HTML' })
    logger.info(`Failure alert sent to admin ${adminChatId} for post ${data.postId}`)
  } catch (error) {
    logger.error('Failed to send admin failure alert', { error })
  }
}

export async function sendAdminSuccessAlert(postId: string, type: string, channelTitles: string[]) {
  try {
    const setting = await getAdminSetting()
    if (!setting?.notifyOnSuccess) return

    const adminChatId = setting.adminChatId || process.env.ADMIN_CHAT_ID
    if (!adminChatId) return

    const bot = getBot()
    if (!bot) return

    const message = [
      `✅ <b>Xabar muvaffaqiyatli chop etildi!</b>`,
      ``,
      `🆔 <b>Post ID:</b> <code>${postId}</code>`,
      `📝 <b>Turi:</b> ${type}`,
      `📢 <b>Kanallar:</b> ${escapeHtml(channelTitles.join(', '))}`,
      `⏰ <b>Vaqt:</b> ${new Date().toLocaleString()}`,
    ].join('\n')

    await bot.api.sendMessage(adminChatId, message, { parse_mode: 'HTML' })
  } catch (error) {
    logger.error('Failed to send admin success alert', { error })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
