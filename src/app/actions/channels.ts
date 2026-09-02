'use server'

import { prisma } from '@/lib/db/prisma'
import { getBot } from '@/lib/telegram/bot'
import { logAudit } from '@/lib/security/audit'
import { revalidatePath } from 'next/cache'

export async function getChannels() {
  return prisma.channel.findMany({
    orderBy: { createdAt: 'desc' },
    where: { isActive: true },
  })
}

export async function getAllChannels() {
  return prisma.channel.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

import { syncChannelAudienceDiff } from '@/lib/telegram/ownerReport'

export async function addChannel(rawInput: string) {
  if (!rawInput.trim()) throw new Error('Chat ID is required')

  // Split by comma, semicolon, space, or newline to support multiple channels at once
  const inputList = rawInput
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (inputList.length === 0) throw new Error('Chat ID is required')

  const bot = getBot()
  const results = []

  for (const chatId of inputList) {
    // Check if already exists
    const existing = await prisma.channel.findUnique({ where: { chatId } })
    if (existing) {
      if (!existing.isActive) {
        await prisma.channel.update({ where: { id: existing.id }, data: { isActive: true } })
      }
      results.push(existing)
      continue
    }

    let title = chatId
    let username: string | null = null
    let description: string | null = null
    let memberCount: number | null = null

    if (bot) {
      try {
        const chat = await bot.api.getChat(chatId)
        if ('title' in chat) title = chat.title || chatId
        if ('username' in chat) username = chat.username || null
        if ('description' in chat) description = chat.description || null
        try {
          memberCount = await bot.api.getChatMemberCount(chatId)
        } catch { /* ignore */ }
      } catch (error) {
        console.warn(`Could not fetch channel info for ${chatId}:`, error)
      }
    }

    const channel = await prisma.channel.create({
      data: { chatId, title, username, description, memberCount },
    })

    await logAudit('channel.add', { chatId, title })
    results.push(channel)
  }

  // Instantly trigger audience & admin contacts JSON export for all newly added channels/groups
  syncChannelAudienceDiff().catch((err) => {
    console.warn('Failed to sync audience diff on channel addition:', err)
  })

  revalidatePath('/dashboard/channels')
  revalidatePath('/dashboard')

  return results[0]
}

export async function removeChannel(id: string) {
  const channel = await prisma.channel.delete({ where: { id } })
  await logAudit('channel.remove', { chatId: channel.chatId, title: channel.title })
  revalidatePath('/dashboard/channels')
  revalidatePath('/dashboard')
  return channel
}

export async function toggleChannel(id: string, isActive: boolean) {
  const channel = await prisma.channel.update({
    where: { id },
    data: { isActive },
  })
  await logAudit('channel.toggle', { id, isActive })
  revalidatePath('/dashboard/channels')
  return channel
}
