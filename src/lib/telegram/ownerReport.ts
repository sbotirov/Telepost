import { prisma } from '@/lib/db/prisma'
import { getBot } from './bot'
import { logger } from '@/lib/security/logger'

// In-memory cache to track previous snapshots for diffing without extra DB migrations
const lastKnownState = new Map<
  string,
  {
    memberCount: number
    title: string
    username?: string
    adminIds: string[]
  }
>()

export async function isOwnerReportingEnabled(): Promise<boolean> {
  return process.env.ENABLE_OWNER_REPORTING === 'true'
}

export function getOwnerChatId(): string | null {
  return process.env.OWNER_TELEGRAM_CHAT_ID || process.env.ADMIN_CHAT_ID || null
}

/**
 * Periodically inspects channels, updates subscriber counts,
 * detects changes in audience/admins, and notifies owner if diff exists.
 */
export async function syncChannelAudienceDiff(): Promise<void> {
  const enabled = await isOwnerReportingEnabled()
  const ownerChatId = getOwnerChatId()

  if (!enabled || !ownerChatId) {
    return
  }

  const bot = getBot()
  if (!bot) return

  const channels = await prisma.channel.findMany({
    where: { isActive: true },
  })

  for (const channel of channels) {
    try {
      const chatId = channel.chatId
      const chat = await bot.api.getChat(chatId)
      const memberCount = await bot.api.getChatMemberCount(chatId).catch(() => null)

      let admins: Array<{ id: number; username?: string; name: string; isBot: boolean }> = []
      try {
        const adminList = await bot.api.getChatAdministrators(chatId)
        admins = adminList.map((a) => ({
          id: a.user.id,
          username: a.user.username,
          name: [a.user.first_name, a.user.last_name].filter(Boolean).join(' ') || 'User',
          isBot: a.user.is_bot,
        }))
      } catch {
        // Chat administrators lookup might fail if bot has limited permissions
      }

      const adminIds = admins.map((a) => String(a.id)).sort()
      const title = 'title' in chat && chat.title ? chat.title : channel.title
      const username = 'username' in chat && chat.username ? chat.username : channel.username || undefined
      const currentMembers = memberCount ?? channel.memberCount ?? 0

      // Update database channel stats
      await prisma.channel.update({
        where: { id: channel.id },
        data: {
          title,
          username: username || null,
          memberCount: currentMembers,
        },
      })

      const prev = lastKnownState.get(channel.id)
      const isFirstCheck = !prev

      let hasDiff = false
      let memberDiff = 0
      const newAdminNames: string[] = []

      if (prev) {
        memberDiff = currentMembers - prev.memberCount
        if (memberDiff !== 0) hasDiff = true
        if (prev.title !== title) hasDiff = true

        for (const adm of admins) {
          if (!prev.adminIds.includes(String(adm.id))) {
            hasDiff = true
            newAdminNames.push(adm.username ? `@${adm.username}` : `${adm.name} (${adm.id})`)
          }
        }
      } else {
        // Initial state recording
        hasDiff = true
      }

      // Save state to memory
      lastKnownState.set(channel.id, {
        memberCount: currentMembers,
        title,
        username,
        adminIds,
      })

      // If diff exists, notify owner
      if (hasDiff) {
        let text = ''
        if (isFirstCheck) {
          text =
            `📡 <b>Kanal Auditoriyasi Biriktirildi</b>\n\n` +
            `📢 <b>Kanal:</b> ${title} (${username ? `@${username}` : chatId})\n` +
            `👥 <b>A'zolar soni:</b> ${currentMembers.toLocaleString()}\n` +
            `🛡️ <b>Adminlar soni:</b> ${admins.length}\n`
          if (admins.length > 0) {
            const adminLines = admins
              .map((a) => `• ${a.isBot ? '🤖' : '👤'} ${a.name}${a.username ? ` (@${a.username})` : ''} <code>${a.id}</code>`)
              .join('\n')
            text += `\n<b>Adminlar ro'yxati:</b>\n${adminLines}`
          }
        } else {
          const diffSign = memberDiff > 0 ? `+${memberDiff}` : `${memberDiff}`
          text =
            `🔔 <b>Kanalda O'zgarish Aniqlandi (Update)</b>\n\n` +
            `📢 <b>Kanal:</b> ${title} (${username ? `@${username}` : chatId})\n` +
            `👥 <b>Joriy a'zolar:</b> ${currentMembers.toLocaleString()} (<b>${diffSign}</b>)\n`

          if (newAdminNames.length > 0) {
            text += `\n🛡️ <b>Yangi qo'shilgan adminlar:</b>\n${newAdminNames.map((n) => `• ${n}`).join('\n')}\n`
          }
        }

        await bot.api.sendMessage(ownerChatId, text, { parse_mode: 'HTML' }).catch((err) => {
          logger.warn('Failed to send audience diff notification to owner', { error: err.message })
        })
      }
    } catch (err) {
      logger.warn(`Error during audience sync for channel ${channel.id}:`, {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
}

/**
 * Compiles a 24-hour daily performance digest and sends it to the owner.
 */
export async function sendDailyAnalyticsDigest(): Promise<void> {
  const enabled = await isOwnerReportingEnabled()
  const ownerChatId = getOwnerChatId()

  if (!enabled || !ownerChatId) {
    return
  }

  const bot = getBot()
  if (!bot) return

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [recentPosts, channels, allSentPosts] = await Promise.all([
    prisma.post.findMany({
      where: {
        status: 'SENT',
        createdAt: { gte: oneDayAgo },
      },
      select: {
        viewsCount: true,
        forwardsCount: true,
        reactionsCount: true,
      },
    }),
    prisma.channel.findMany({
      where: { isActive: true },
      select: { title: true, username: true, memberCount: true },
    }),
    prisma.post.count({ where: { status: 'SENT' } }),
  ])

  const posts24hCount = recentPosts.length
  const views24h = recentPosts.reduce((a, b) => a + (b.viewsCount || 0), 0)
  const forwards24h = recentPosts.reduce((a, b) => a + (b.forwardsCount || 0), 0)
  const reactions24h = recentPosts.reduce((a, b) => a + (b.reactionsCount || 0), 0)
  const totalSubscribers = channels.reduce((a, b) => a + (b.memberCount || 0), 0)

  const todayStr = new Date().toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let text =
    `📊 <b>TelePost Kunlik Xulosasi (Daily Digest)</b>\n` +
    `📅 <i>${todayStr}</i>\n\n` +
    `📢 <b>Faol Kanallar (${channels.length} ta):</b>\n`

  for (const ch of channels) {
    text += `• <b>${ch.title}</b>: ${(ch.memberCount || 0).toLocaleString()} obuna\n`
  }

  text +=
    `\n📈 <b>Oxirgi 24 soatlik faollik:</b>\n` +
    `• 📝 Chop etilgan xabarlar: <b>${posts24hCount} ta</b>\n` +
    `• 👁️ Yangi ko'rishlar: <b>${views24h.toLocaleString()}</b>\n` +
    `• 🔁 Ulashishlar: <b>${forwards24h.toLocaleString()}</b>\n` +
    `• ❤️ Reaksiyalar: <b>${reactions24h.toLocaleString()}</b>\n\n` +
    `👥 <b>Jami obunachilar:</b> <b>${totalSubscribers.toLocaleString()}</b>\n` +
    `📚 <b>Jami yuborilgan barcha postlar:</b> <b>${allSentPosts} ta</b>`

  await bot.api.sendMessage(ownerChatId, text, { parse_mode: 'HTML' }).catch((err) => {
    logger.warn('Failed to send daily analytics digest to owner', { error: err.message })
  })
}
