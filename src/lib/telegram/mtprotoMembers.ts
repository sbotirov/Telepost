import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { logger } from '@/lib/security/logger'

// Official Telegram Client App ID & Hash
const API_ID = 6
const API_HASH = 'eb06d4abfb49dc3eeb1aeb98ae0f581e'

export interface FullSubscriberInfo {
  id: string
  first_name: string
  last_name: string | null
  username: string | null
  phone: string | null
  is_bot: boolean
}

let cachedClient: TelegramClient | null = null

async function getMtprotoClient(): Promise<TelegramClient | null> {
  const token = process.env.BOT_TOKEN
  if (!token) return null

  if (cachedClient) {
    if (cachedClient.connected) return cachedClient
  }

  const client = new TelegramClient(new StringSession(''), API_ID, API_HASH, {
    connectionRetries: 3,
  })

  await client.start({
    botAuthToken: token,
  })

  cachedClient = client
  return client
}

/**
 * Fetches the entire participant/subscriber list for a channel/supergroup
 * using Telegram MTProto Client protocol.
 */
export async function fetchAllChannelParticipants(chatId: string): Promise<FullSubscriberInfo[]> {
  try {
    const client = await getMtprotoClient()
    if (!client) return []

    logger.info(`Fetching full MTProto participants for ${chatId}...`)
    const participants = await client.getParticipants(chatId, {
      limit: 5000,
    })

    const results: FullSubscriberInfo[] = participants.map((p) => ({
      id: String(p.id),
      first_name: p.firstName || '',
      last_name: p.lastName || null,
      username: p.username ? `@${p.username}` : null,
      phone: p.phone || null,
      is_bot: !!p.bot,
    }))

    logger.info(`Successfully fetched ${results.length} full participants from ${chatId}`)
    return results
  } catch (error) {
    logger.warn('MTProto participant fetch failed (falling back to bot API):', {
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}
