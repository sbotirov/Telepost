// Post types matching Prisma schema
export type PostType = 'TEXT' | 'PHOTO' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'MEDIA_GROUP' | 'POLL' | 'TTS'
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED'
export type MediaType = 'PHOTO' | 'AUDIO' | 'VIDEO' | 'DOCUMENT'

export interface ChannelInfo {
  id: string
  chatId: string
  title: string
  description?: string | null
  username?: string | null
  memberCount?: number | null
  photoUrl?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface InlineButton {
  text: string
  url: string
}

export type InlineKeyboardRow = InlineButton[]
export type InlineKeyboard = InlineKeyboardRow[]

export interface PollInput {
  question: string
  options: string[]
  isAnonymous: boolean
  type: 'regular' | 'quiz'
  correctOption?: number
  explanation?: string
  multiAnswer: boolean
}

export interface PostOptions {
  disableComments: boolean
  disableNotification: boolean
  protectContent: boolean
  pinMessage: boolean
}

export interface TtsRequest {
  text: string
  language: string
  title?: string
}

export interface MediaFileInput {
  type: MediaType
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
  caption?: string
  sortOrder: number
}

export interface RecurrenceRule {
  type: 'DAILY' | 'WEEKLY' | 'INTERVAL_HOURS'
  interval?: number // e.g. every 2 days, every 6 hours
  days?: number[] // 0 for Sun, 1 for Mon...
  endAt?: string | null
}

export interface CreatePostInput {
  type: PostType
  text?: string
  parseMode: 'HTML' | 'MarkdownV2'
  channelIds: string[]
  mediaFiles?: MediaFileInput[]
  poll?: PollInput
  inlineKeyboard?: InlineKeyboard
  hashtags?: string[]
  options: PostOptions
  ttsText?: string
  ttsLanguage?: string
  ttsAudioPath?: string
  scheduledAt?: string | null
  draftId?: string
  autoDeleteHours?: number | null
  isRecurring?: boolean
  recurrenceRule?: RecurrenceRule | null
  recurrenceEndAt?: string | null
}

export interface SendResult {
  success: boolean
  messageId?: number
  error?: string
}

export interface EditPostInput {
  postId: string
  text?: string
  parseMode: 'HTML' | 'MarkdownV2'
  inlineKeyboard?: InlineKeyboard
}

export interface TemplateItem {
  id: string
  name: string
  type: 'TEMPLATE' | 'SIGNATURE'
  content: string
  hashtags?: string | null
  inlineKeyboard?: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TemplateInput {
  name: string
  type: 'TEMPLATE' | 'SIGNATURE'
  content: string
  hashtags?: string
  inlineKeyboard?: InlineKeyboard
  isDefault?: boolean
}

export type WatermarkPosition = 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER'

export interface WatermarkConfig {
  id?: string
  isEnabled: boolean
  type: 'TEXT' | 'IMAGE'
  text?: string | null
  imagePath?: string | null
  position: WatermarkPosition
  opacity: number
  fontSize: number
}

export interface DashboardStats {
  totalChannels: number
  postsToday: number
  scheduledPosts: number
  totalPosts: number
}

export interface PostFilter {
  search?: string
  channelId?: string
  type?: PostType
  status?: PostStatus
  dateFrom?: string
  dateTo?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

