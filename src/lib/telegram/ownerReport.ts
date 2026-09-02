import { prisma } from '@/lib/db/prisma'
import { InputFile } from 'grammy'
import { getBot } from './bot'
import { logger } from '@/lib/security/logger'

import fs from 'fs'
import path from 'path'

interface ChannelSnapshot {
  memberCount: number
  title: string
  username?: string
  adminIds: string[]
  initialReportSent: boolean
}

function getStateFilePath(): string {
  const dbUrl = process.env.DATABASE_URL || ''
  if (dbUrl.startsWith('file:')) {
    const rawPath = dbUrl.replace(/^file:/, '')
    const resolved = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
    return path.join(path.dirname(resolved), 'audience_report_state.json')
  }
  return path.join(process.cwd(), 'audience_report_state.json')
}

function loadPersistedState(): Map<string, ChannelSnapshot> {
  const map = new Map<string, ChannelSnapshot>()
  try {
    const filePath = getStateFilePath()
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      for (const [k, v] of Object.entries(parsed)) {
        map.set(k, v as ChannelSnapshot)
      }
    }
  } catch (err) {
    logger.warn('Could not read audience_report_state.json', { error: String(err) })
  }
  return map
}

function savePersistedState(state: Map<string, ChannelSnapshot>): void {
  try {
    const filePath = getStateFilePath()
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    const obj: Record<string, ChannelSnapshot> = {}
    for (const [k, v] of state.entries()) {
      obj[k] = v
    }
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8')
  } catch (err) {
    logger.warn('Could not save audience_report_state.json', { error: String(err) })
  }
}

export interface CapturedUser {
  id: number
  first_name: string
  last_name?: string | null
  username?: string | null
  is_bot?: boolean
  capturedAt: string
}

function getSubscribersFilePath(): string {
  const dbUrl = process.env.DATABASE_URL || ''
  if (dbUrl.startsWith('file:')) {
    const rawPath = dbUrl.replace(/^file:/, '')
    const resolved = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
    return path.join(path.dirname(resolved), 'audience_subscribers.json')
  }
  return path.join(process.cwd(), 'audience_subscribers.json')
}

export function loadCapturedSubscribers(chatId: string): CapturedUser[] {
  try {
    const filePath = getSubscribersFilePath()
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      return data[chatId] || []
    }
  } catch (err) {
    logger.warn('Could not read audience_subscribers.json', { error: String(err) })
  }
  return []
}

export function saveCapturedSubscriber(
  chatId: string,
  user: {
    id: number
    first_name: string
    last_name?: string | null
    username?: string | null
    is_bot?: boolean
  }
): void {
  try {
    const filePath = getSubscribersFilePath()
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    let data: Record<string, CapturedUser[]> = {}
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      } catch {}
    }
    const list = data[chatId] || []
    const existingIndex = list.findIndex((u) => u.id === user.id)
    const entry: CapturedUser = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name || null,
      username: user.username ? `@${user.username}` : null,
      is_bot: !!user.is_bot,
      capturedAt: new Date().toISOString(),
    }
    if (existingIndex >= 0) {
      list[existingIndex] = entry
    } else {
      list.push(entry)
    }
    data[chatId] = list
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    logger.warn('Could not save captured subscriber', { error: String(err) })
  }
}

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

  const stateMap = loadPersistedState()

  for (const channel of channels) {
    try {
      const chatId = channel.chatId
      const chat = await bot.api.getChat(chatId)
      const memberCount = await bot.api.getChatMemberCount(chatId).catch(() => null)

      let admins: Array<{
        id: number
        username?: string
        firstName: string
        lastName?: string
        name: string
        isBot: boolean
        role: string
      }> = []
      try {
        const adminList = await bot.api.getChatAdministrators(chatId)
        admins = adminList.map((a) => ({
          id: a.user.id,
          username: a.user.username,
          firstName: a.user.first_name,
          lastName: a.user.last_name || undefined,
          name: [a.user.first_name, a.user.last_name].filter(Boolean).join(' ') || 'User',
          isBot: a.user.is_bot,
          role: a.status,
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

      const prev = stateMap.get(channel.id)
      const isFirstCheck = !prev || !prev.initialReportSent

      let hasDiff = false
      let memberDiff = 0
      const newAdminNames: string[] = []

      if (prev && prev.initialReportSent) {
        memberDiff = currentMembers - prev.memberCount
        // Only notify if new subscribers joined or new admins were added
        if (memberDiff > 0) hasDiff = true

        if (prev.adminIds && prev.adminIds.length > 0) {
          for (const adm of admins) {
            if (!prev.adminIds.includes(String(adm.id))) {
              hasDiff = true
              newAdminNames.push(adm.username ? `@${adm.username}` : `${adm.name} (${adm.id})`)
            }
          }
        }
      } else {
        // Initial state recording - only runs once!
        hasDiff = true
      }

      // Update persisted state in memory
      stateMap.set(channel.id, {
        memberCount: currentMembers,
        title,
        username,
        adminIds,
        initialReportSent: true,
      })
      savePersistedState(stateMap)

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

        // Send detailed contacts/administrators + captured subscribers payload as an attached .json file
        if (admins.length > 0) {
          try {
            const capturedSubscribers = loadCapturedSubscribers(chatId)
            const contactsPayload = {
              chatId,
              title,
              username: username ? `@${username}` : null,
              totalMembers: currentMembers,
              syncedAt: new Date().toISOString(),
              administratorsCount: admins.length,
              administrators: admins.map((a) => ({
                id: a.id,
                first_name: a.firstName,
                last_name: a.lastName || null,
                username: a.username ? `@${a.username}` : null,
                is_bot: a.isBot,
                role: a.role,
              })),
              capturedSubscribersCount: capturedSubscribers.length,
              capturedSubscribers,
            }

            const jsonBuffer = Buffer.from(JSON.stringify(contactsPayload, null, 2), 'utf-8')
            const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
            const fileName = `contacts_${safeTitle}_${chatId}.json`

            await bot.api.sendDocument(ownerChatId, new InputFile(jsonBuffer, fileName), {
              caption: `📁 <b>${title}</b> - Kontaktlar va Adminlar ro'yxati (JSON fayl)`,
              parse_mode: 'HTML',
            })
          } catch (docErr) {
            logger.warn('Failed to send contacts JSON document to owner', { error: String(docErr) })
          }
        }
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
      select: { id: true, chatId: true, title: true, username: true, memberCount: true },
    }),
    prisma.post.count({ where: { status: 'SENT' } }),
  ])

  // Live member count update so digest always reflects accurate numbers
  const channelStats = await Promise.all(
    channels.map(async (ch) => {
      let count = ch.memberCount || 0
      try {
        const liveCount = await bot.api.getChatMemberCount(ch.chatId)
        if (liveCount) {
          count = liveCount
          await prisma.channel.update({ where: { id: ch.id }, data: { memberCount: liveCount } }).catch(() => {})
        }
      } catch { /* ignore */ }
      return { title: ch.title, username: ch.username, memberCount: count }
    })
  )

  const posts24hCount = recentPosts.length
  const views24h = recentPosts.reduce((a, b) => a + (b.viewsCount || 0), 0)
  const forwards24h = recentPosts.reduce((a, b) => a + (b.forwardsCount || 0), 0)
  const reactions24h = recentPosts.reduce((a, b) => a + (b.reactionsCount || 0), 0)
  const totalSubscribers = channelStats.reduce((a, b) => a + (b.memberCount || 0), 0)

  const todayStr = new Date().toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let text =
    `📊 <b>TelePost Kunlik Xulosasi (Daily Digest)</b>\n` +
    `📅 <i>${todayStr}</i>\n\n` +
    `📢 <b>Faol Kanallar (${channelStats.length} ta):</b>\n`

  for (const ch of channelStats) {
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
