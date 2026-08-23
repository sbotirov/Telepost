import { InputFile, InlineKeyboard as GrammyInlineKeyboard } from 'grammy'
import { getBot } from './bot'
import { logger } from '@/lib/security/logger'
import type { SendResult, InlineKeyboard as IKB } from '@/types'
import type { SendOptions, AudioOptions, PollConfig } from './types'
import fs from 'fs'
import path from 'path'

function buildInlineKeyboard(keyboard: IKB): GrammyInlineKeyboard {
  const kb = new GrammyInlineKeyboard()
  for (const row of keyboard) {
    for (const button of row) {
      kb.url(button.text, button.url)
    }
    kb.row()
  }
  return kb
}

function getReplyMarkup(options?: SendOptions) {
  if (!options?.replyMarkup || options.replyMarkup.length === 0) return undefined
  return buildInlineKeyboard(options.replyMarkup)
}

function resolveFilePath(filePath: string): string {
  if (filePath.startsWith('/uploads')) {
    return path.join(process.cwd(), 'public', filePath)
  }
  if (path.isAbsolute(filePath)) return filePath
  return path.join(process.cwd(), 'public', filePath)
}

export async function sendTextPost(
  chatId: string,
  text: string,
  options?: SendOptions
): Promise<SendResult> {
  try {
    const bot = getBot()
    if (!bot) return { success: false, error: 'Bot not configured' }

    const msg = await bot.api.sendMessage(chatId, text, {
      parse_mode: options?.parseMode || 'HTML',
      reply_markup: getReplyMarkup(options),
      disable_notification: options?.disableNotification,
      protect_content: options?.protectContent,
    } as Record<string, unknown>)

    logger.info(`Text message sent to ${chatId}`, { messageId: msg.message_id })
    return { success: true, messageId: msg.message_id }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Failed to send text to ${chatId}`, { error: errMsg })
    return { success: false, error: errMsg }
  }
}

export async function sendPhotoPost(
  chatId: string,
  photoPath: string,
  caption?: string,
  options?: SendOptions
): Promise<SendResult> {
  try {
    const bot = getBot()
    if (!bot) return { success: false, error: 'Bot not configured' }

    const absolutePath = resolveFilePath(photoPath)
    const photo = new InputFile(fs.createReadStream(absolutePath))

    const msg = await bot.api.sendPhoto(chatId, photo, {
      caption,
      parse_mode: options?.parseMode || 'HTML',
      reply_markup: getReplyMarkup(options),
      disable_notification: options?.disableNotification,
      protect_content: options?.protectContent,
    } as Record<string, unknown>)

    logger.info(`Photo sent to ${chatId}`, { messageId: msg.message_id })
    return { success: true, messageId: msg.message_id }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Failed to send photo to ${chatId}`, { error: errMsg })
    return { success: false, error: errMsg }
  }
}

export async function sendAudioPost(
  chatId: string,
  audioPath: string,
  options?: AudioOptions
): Promise<SendResult> {
  try {
    const bot = getBot()
    if (!bot) return { success: false, error: 'Bot not configured' }

    const absolutePath = resolveFilePath(audioPath)
    const audio = new InputFile(fs.createReadStream(absolutePath))

    const msg = await bot.api.sendAudio(chatId, audio, {
      caption: options?.title,
      parse_mode: options?.parseMode || 'HTML',
      title: options?.title,
      performer: options?.performer,
      duration: options?.duration,
      reply_markup: getReplyMarkup(options),
      disable_notification: options?.disableNotification,
      protect_content: options?.protectContent,
    } as Record<string, unknown>)

    logger.info(`Audio sent to ${chatId}`, { messageId: msg.message_id })
    return { success: true, messageId: msg.message_id }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Failed to send audio to ${chatId}`, { error: errMsg })
    return { success: false, error: errMsg }
  }
}

export async function sendVideoPost(
  chatId: string,
  videoPath: string,
  caption?: string,
  options?: SendOptions
): Promise<SendResult> {
  try {
    const bot = getBot()
    if (!bot) return { success: false, error: 'Bot not configured' }

    const absolutePath = resolveFilePath(videoPath)
    const video = new InputFile(fs.createReadStream(absolutePath))

    const msg = await bot.api.sendVideo(chatId, video, {
      caption,
      parse_mode: options?.parseMode || 'HTML',
      reply_markup: getReplyMarkup(options),
      disable_notification: options?.disableNotification,
      protect_content: options?.protectContent,
    } as Record<string, unknown>)

    logger.info(`Video sent to ${chatId}`, { messageId: msg.message_id })
    return { success: true, messageId: msg.message_id }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Failed to send video to ${chatId}`, { error: errMsg })
    return { success: false, error: errMsg }
  }
}

export async function sendDocumentPost(
  chatId: string,
  docPath: string,
  caption?: string,
  options?: SendOptions
): Promise<SendResult> {
  try {
    const bot = getBot()
    if (!bot) return { success: false, error: 'Bot not configured' }

    const absolutePath = resolveFilePath(docPath)
    const doc = new InputFile(fs.createReadStream(absolutePath))

    const msg = await bot.api.sendDocument(chatId, doc, {
      caption,
      parse_mode: options?.parseMode || 'HTML',
      reply_markup: getReplyMarkup(options),
      disable_notification: options?.disableNotification,
      protect_content: options?.protectContent,
    } as Record<string, unknown>)

    logger.info(`Document sent to ${chatId}`, { messageId: msg.message_id })
    return { success: true, messageId: msg.message_id }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Failed to send document to ${chatId}`, { error: errMsg })
    return { success: false, error: errMsg }
  }
}

export async function sendPollPost(
  chatId: string,
  question: string,
  pollOptions: string[],
  config?: PollConfig
): Promise<SendResult> {
  try {
    const bot = getBot()
    if (!bot) return { success: false, error: 'Bot not configured' }

    const msg = await bot.api.sendPoll(chatId, question, pollOptions, {
      is_anonymous: config?.isAnonymous ?? true,
      type: config?.type || 'regular',
      correct_option_id: config?.correctOptionId,
      explanation: config?.explanation,
      allows_multiple_answers: config?.allowsMultipleAnswers,
    } as Record<string, unknown>)

    logger.info(`Poll sent to ${chatId}`, { messageId: msg.message_id })
    return { success: true, messageId: msg.message_id }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Failed to send poll to ${chatId}`, { error: errMsg })
    return { success: false, error: errMsg }
  }
}

export async function sendTtsAudioPost(
  chatId: string,
  ttsFilePath: string,
  caption?: string,
  options?: SendOptions
): Promise<SendResult> {
  return sendAudioPost(chatId, ttsFilePath, {
    ...options,
    title: caption || 'TTS Audio',
    performer: 'TelePost TTS',
  })
}

export async function sendPostToChannels(
  post: {
    type: string
    text?: string | null
    parseMode: string
    inlineKeyboard?: string | null
    disableNotification: boolean
    protectContent: boolean
    ttsAudioPath?: string | null
    mediaFiles: Array<{ type: string; filePath: string; caption?: string | null }>
    poll?: { question: string; options: string; isAnonymous: boolean; type: string; correctOption?: number | null; explanation?: string | null; multiAnswer: boolean } | null
  },
  channelChatIds: string[]
): Promise<Map<string, SendResult>> {
  const results = new Map<string, SendResult>()

  const keyboard: IKB | undefined = post.inlineKeyboard
    ? JSON.parse(post.inlineKeyboard)
    : undefined

  const baseOptions: SendOptions = {
    parseMode: post.parseMode as 'HTML' | 'MarkdownV2',
    replyMarkup: keyboard,
    disableNotification: post.disableNotification,
    protectContent: post.protectContent,
  }

  for (const chatId of channelChatIds) {
    let result: SendResult

    switch (post.type) {
      case 'TEXT':
        result = await sendTextPost(chatId, post.text || '', baseOptions)
        break

      case 'PHOTO':
        if (post.mediaFiles.length > 0) {
          result = await sendPhotoPost(chatId, post.mediaFiles[0].filePath, post.text || undefined, baseOptions)
        } else {
          result = { success: false, error: 'No photo file' }
        }
        break

      case 'AUDIO':
        if (post.mediaFiles.length > 0) {
          result = await sendAudioPost(chatId, post.mediaFiles[0].filePath, { ...baseOptions, title: post.text || undefined })
        } else {
          result = { success: false, error: 'No audio file' }
        }
        break

      case 'VIDEO':
        if (post.mediaFiles.length > 0) {
          result = await sendVideoPost(chatId, post.mediaFiles[0].filePath, post.text || undefined, baseOptions)
        } else {
          result = { success: false, error: 'No video file' }
        }
        break

      case 'DOCUMENT':
        if (post.mediaFiles.length > 0) {
          result = await sendDocumentPost(chatId, post.mediaFiles[0].filePath, post.text || undefined, baseOptions)
        } else {
          result = { success: false, error: 'No document file' }
        }
        break

      case 'TTS':
        if (post.ttsAudioPath) {
          result = await sendTtsAudioPost(chatId, post.ttsAudioPath, post.text || undefined, baseOptions)
        } else {
          result = { success: false, error: 'No TTS audio file' }
        }
        break

      case 'POLL':
        if (post.poll) {
          const pollOpts = JSON.parse(post.poll.options) as string[]
          result = await sendPollPost(chatId, post.poll.question, pollOpts, {
            isAnonymous: post.poll.isAnonymous,
            type: post.poll.type as 'regular' | 'quiz',
            correctOptionId: post.poll.correctOption ?? undefined,
            explanation: post.poll.explanation ?? undefined,
            allowsMultipleAnswers: post.poll.multiAnswer,
          })
        } else {
          result = { success: false, error: 'No poll data' }
        }
        break

      default:
        result = await sendTextPost(chatId, post.text || '', baseOptions)
    }

    results.set(chatId, result)

    // Small delay between channels to avoid rate limiting
    if (channelChatIds.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  return results
}

export async function editPublishedTelegramMessage(
  chatId: string,
  messageId: number,
  post: {
    type: string
    text?: string | null
    parseMode: string
    inlineKeyboard?: string | null
  }
): Promise<SendResult> {
  try {
    const bot = getBot()
    if (!bot) return { success: false, error: 'Bot not configured' }

    const keyboard: IKB | undefined = post.inlineKeyboard
      ? JSON.parse(post.inlineKeyboard)
      : undefined

    const reply_markup = keyboard ? buildInlineKeyboard(keyboard) : undefined

    if (post.type === 'TEXT') {
      await bot.api.editMessageText(chatId, messageId, post.text || '', {
        parse_mode: post.parseMode as 'HTML' | 'MarkdownV2',
        reply_markup,
      })
    } else if (post.type === 'POLL') {
      // Telegram Polls cannot have their questions/options edited via Bot API
      return { success: false, error: 'Poll messages cannot be edited in Telegram' }
    } else {
      // PHOTO, VIDEO, AUDIO, DOCUMENT, TTS, MEDIA_GROUP
      await bot.api.editMessageCaption(chatId, messageId, {
        caption: post.text || undefined,
        parse_mode: post.parseMode as 'HTML' | 'MarkdownV2',
        reply_markup,
      })
    }

    logger.info(`Message ${messageId} in ${chatId} edited successfully`)
    return { success: true, messageId }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Failed to edit message ${messageId} in ${chatId}`, { error: errMsg })
    return { success: false, error: errMsg }
  }
}

export async function deleteTelegramMessage(
  chatId: string,
  messageId: number
): Promise<SendResult> {
  try {
    const bot = getBot()
    if (!bot) return { success: false, error: 'Bot not configured' }

    await bot.api.deleteMessage(chatId, messageId)
    logger.info(`Message ${messageId} in ${chatId} deleted from Telegram`)
    return { success: true, messageId }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Failed to delete message ${messageId} in ${chatId}`, { error: errMsg })
    return { success: false, error: errMsg }
  }
}

