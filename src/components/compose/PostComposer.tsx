'use client'

import { useState, useTransition } from 'react'
import { useEffect } from 'react'
import { getChannels } from '@/app/actions/channels'
import { createPost, sendPostNow } from '@/app/actions/posts'
import type { ChannelInfo, PostType, InlineKeyboard, PollInput, PostOptions, MediaFileInput, RecurrenceRule, TemplateItem } from '@/types'
import TextEditor from './TextEditor'
import MediaUploader from './MediaUploader'
import TtsGenerator from './TtsGenerator'
import PollCreator from './PollCreator'
import InlineKeyboardBuilder from './InlineKeyboardBuilder'
import SchedulePicker from './SchedulePicker'
import HashtagInput from './HashtagInput'
import PostOptions_ from './PostOptions'
import PostPreview from './PostPreview'
import TemplatePicker from './TemplatePicker'
import { useTranslations } from 'next-intl'

interface DraftChannel {
  channelId: string
  [key: string]: unknown
}

interface DraftMediaFile {
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
  type: string
  caption?: string | null
  sortOrder?: number
  [key: string]: unknown
}

interface DraftPost {
  id?: string
  text?: string | null
  hashtags?: string | null
  parseMode?: string
  mediaFiles?: DraftMediaFile[]
  ttsAudioPath?: string | null
  ttsText?: string | null
  ttsLanguage?: string | null
  poll?: {
    question?: string
    options?: string | string[]
    isAnonymous?: boolean
    type?: string
    correctOption?: number | null
    explanation?: string | null
    multiAnswer?: boolean
    [key: string]: unknown
  } | null
  inlineKeyboard?: string | null
  channels?: DraftChannel[]
  disableComments?: boolean
  disableNotification?: boolean
  protectContent?: boolean
  pinMessage?: boolean
  autoDeleteHours?: number | null
  isRecurring?: boolean
  recurrenceRule?: string | null
  [key: string]: unknown
}

interface Props {
  draft?: DraftPost | null
}

export default function PostComposer({ draft }: Props) {
  const [channels, setChannels] = useState<ChannelInfo[]>([])
  const [selectedChannels, setSelectedChannels] = useState<string[]>(draft?.channels?.map((c) => c.channelId) || [])
  const [text, setText] = useState(() => {
    if (!draft?.text) return ''
    if (draft.hashtags) {
      const hashtagStr = draft.hashtags.split(',').map((h: string) => `#${h}`).join(' ')
      return draft.text.replace('\n\n' + hashtagStr, '')
    }
    return draft.text
  })
  const [parseMode, setParseMode] = useState<'HTML' | 'MarkdownV2'>(
    (draft?.parseMode as 'HTML' | 'MarkdownV2') || 'HTML'
  )
  const [mediaFiles, setMediaFiles] = useState<MediaFileInput[]>(() => {
    if (!draft?.mediaFiles) return []
    return draft.mediaFiles.map((m, idx) => ({
      filePath: m.filePath,
      fileName: m.fileName,
      fileSize: m.fileSize,
      mimeType: m.mimeType,
      type: m.type as MediaFileInput['type'],
      caption: m.caption || undefined,
      sortOrder: m.sortOrder ?? idx,
    }))
  })
  const [ttsAudioPath, setTtsAudioPath] = useState<string | null>(draft?.ttsAudioPath || null)
  const [ttsText, setTtsText] = useState(draft?.ttsText || '')
  const [ttsLanguage, setTtsLanguage] = useState(draft?.ttsLanguage || 'uz-UZ') // Default to Uzbek as requested
  const [pollEnabled, setPollEnabled] = useState(!!draft?.poll)
  const [poll, setPoll] = useState<PollInput>(() => {
    if (draft?.poll) {
      const opts = typeof draft.poll.options === 'string' ? JSON.parse(draft.poll.options) : draft.poll.options
      return {
        question: draft.poll.question || '',
        options: Array.isArray(opts) ? opts : ['', ''],
        isAnonymous: draft.poll.isAnonymous ?? true,
        type: (draft.poll.type as 'regular' | 'quiz') || 'regular',
        correctOption: draft.poll.correctOption ?? undefined,
        explanation: draft.poll.explanation ?? undefined,
        multiAnswer: draft.poll.multiAnswer ?? false,
      }
    }
    return { question: '', options: ['', ''], isAnonymous: true, type: 'regular', multiAnswer: false }
  })
  const [keyboard, setKeyboard] = useState<InlineKeyboard>(draft?.inlineKeyboard ? JSON.parse(draft.inlineKeyboard) : [])
  const [hashtags, setHashtags] = useState<string[]>(draft?.hashtags ? draft.hashtags.split(',') : [])
  const [options, setOptions] = useState<PostOptions>({
    disableComments: draft?.disableComments || false,
    disableNotification: draft?.disableNotification || false,
    protectContent: draft?.protectContent || false,
    pinMessage: draft?.pinMessage || false,
  })
  const [autoDeleteHours, setAutoDeleteHours] = useState<number | null>(draft?.autoDeleteHours || null)
  const [isRecurring, setIsRecurring] = useState<boolean>(draft?.isRecurring || false)
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(
    draft?.recurrenceRule ? JSON.parse(draft.recurrenceRule) : null
  )
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const t = useTranslations('Compose')

  useEffect(() => {
    getChannels().then((data) => setChannels(data as unknown as ChannelInfo[]))
  }, [])

  function getPostType(): PostType {
    if (pollEnabled) return 'POLL'
    if (ttsAudioPath) return 'TTS'
    if (mediaFiles.length > 1) return 'MEDIA_GROUP'
    if (mediaFiles.length === 1) {
      const t = mediaFiles[0].type
      if (t === 'PHOTO') return 'PHOTO'
      if (t === 'AUDIO') return 'AUDIO'
      if (t === 'VIDEO') return 'VIDEO'
      return 'DOCUMENT'
    }
    return 'TEXT'
  }

  function buildFullText(): string {
    let fullText = text
    if (hashtags.length > 0) {
      fullText += '\n\n' + hashtags.map((h) => `#${h}`).join(' ')
    }
    return fullText
  }

  function handleApplyTemplate(template: TemplateItem) {
    setText(template.content)
    if (template.hashtags) {
      setHashtags(template.hashtags.split(','))
    }
    if (template.inlineKeyboard) {
      try {
        setKeyboard(JSON.parse(template.inlineKeyboard))
      } catch {
        // Ignore
      }
    }
  }

  function handleInsertSignature(signature: string) {
    setText((prev: string) => (prev ? `${prev}\n\n${signature}` : signature))
  }

  async function handleSubmit(action: 'send' | 'schedule' | 'draft') {
    if (selectedChannels.length === 0) {
      setStatus({ type: 'error', message: t('SelectChannelErr') })
      return
    }

    setStatus(null)
    startTransition(async () => {
      try {
        const postData = {
          type: getPostType(),
          text: buildFullText() || undefined,
          parseMode,
          channelIds: selectedChannels,
          mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
          poll: pollEnabled ? poll : undefined,
          inlineKeyboard: keyboard.length > 0 ? keyboard : undefined,
          hashtags: hashtags.length > 0 ? hashtags : undefined,
          options,
          ttsText: ttsText || undefined,
          ttsLanguage: ttsLanguage || undefined,
          ttsAudioPath: ttsAudioPath || undefined,
          autoDeleteHours,
          isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : null,
          scheduledAt: action === 'schedule' ? new Date(scheduledAt).toISOString() : null,
          draftId: draft?.id,
        }

        const post = await createPost(postData)

        if (action === 'send') {
          const result = await sendPostNow(post.id)
          if (result.success) {
            setStatus({ type: 'success', message: t('PostSent') })
            resetForm()
          } else {
            setStatus({ type: 'error', message: `${t('SomeChannelsFailed')} ${result.errors.map((e) => e.error).join(', ')}` })
          }
        } else if (action === 'schedule') {
          setStatus({ type: 'success', message: `${t('PostScheduledFor')} ${new Date(scheduledAt).toLocaleString()}` })
          resetForm()
        } else {
          setStatus({ type: 'success', message: t('DraftSaved') })
        }
      } catch (e) {
        setStatus({ type: 'error', message: e instanceof Error ? e.message : t('Failed') })
      }
    })
  }

  function resetForm() {
    setText('')
    setMediaFiles([])
    setTtsAudioPath(null)
    setTtsText('')
    setPollEnabled(false)
    setPoll({ question: '', options: ['', ''], isAnonymous: true, type: 'regular', multiAnswer: false })
    setKeyboard([])
    setHashtags([])
    setAutoDeleteHours(null)
    setIsRecurring(false)
    setRecurrenceRule(null)
    setScheduleMode('now')
    setScheduledAt('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
      {/* Left Column - Form */}
      <div className="lg:col-span-3 space-y-5">
        {/* Channel Selector */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📢 {t('SelectChannel')}</h3>
          <div className="flex flex-wrap gap-2">
            {channels.length === 0 ? (
              <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('NoChannels')}</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedChannels(selectedChannels.length === channels.length ? [] : channels.map((c) => c.id))}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'hsl(224 20% 14%)', color: 'hsl(215 15% 55%)' }}
                >
                  {selectedChannels.length === channels.length ? t('DeselectAll') : t('SelectAll')}
                </button>
                {channels.map((ch) => {
                  const selected = selectedChannels.includes(ch.id)
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedChannels(selected ? selectedChannels.filter((id) => id !== ch.id) : [...selectedChannels, ch.id])}
                      className="px-3 py-1.5 rounded-xl text-sm transition-all duration-200"
                      style={{
                        background: selected ? 'hsl(250 85% 65% / 0.2)' : 'hsl(224 20% 14%)',
                        border: selected ? '1px solid hsl(250 85% 65% / 0.5)' : '1px solid transparent',
                        color: selected ? 'hsl(250 85% 65%)' : 'hsl(215 15% 55%)',
                      }}
                    >
                      📢 {ch.title}
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* Template & Signature Picker */}
        <div className="flex justify-end">
          <TemplatePicker
            onApplyTemplate={handleApplyTemplate}
            onInsertSignature={handleInsertSignature}
            currentText={text}
            currentHashtags={hashtags}
            currentKeyboard={keyboard}
          />
        </div>

        <TextEditor value={text} onChange={setText} parseMode={parseMode} onParseModeChange={setParseMode} />
        <MediaUploader files={mediaFiles} onFilesChange={setMediaFiles} />
        <TtsGenerator onAudioGenerated={(path) => setTtsAudioPath(path)} ttsText={ttsText} onTtsTextChange={setTtsText} ttsLanguage={ttsLanguage} onTtsLanguageChange={setTtsLanguage} />
        <HashtagInput hashtags={hashtags} onHashtagsChange={setHashtags} />
        <PostOptions_
          options={options}
          autoDeleteHours={autoDeleteHours}
          onOptionsChange={setOptions}
          onAutoDeleteHoursChange={setAutoDeleteHours}
        />
        <PollCreator poll={poll} onPollChange={setPoll} enabled={pollEnabled} onToggle={setPollEnabled} />
        <InlineKeyboardBuilder keyboard={keyboard} onKeyboardChange={setKeyboard} />
        <SchedulePicker
          mode={scheduleMode}
          scheduledAt={scheduledAt}
          isRecurring={isRecurring}
          recurrenceRule={recurrenceRule}
          onModeChange={setScheduleMode}
          onDateTimeChange={setScheduledAt}
          onRecurringChange={(rec, rule) => {
            setIsRecurring(rec)
            setRecurrenceRule(rule)
          }}
        />

        {/* Status Message */}
        {status && (
          <div className={`px-4 py-3 rounded-xl text-sm ${status.type === 'success' ? 'status-sent' : 'status-failed'}`}>
            {status.message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleSubmit('send')}
            disabled={isPending}
            className="flex-1 min-w-[140px] py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 glow-effect"
            style={{ background: 'linear-gradient(135deg, hsl(250 85% 65%), hsl(175 80% 50%))' }}
          >
            {isPending ? '⏳ ' + t('Sending') : '📤 ' + t('SendNow')}
          </button>
          {scheduleMode === 'schedule' && (
            <button
              type="button"
              onClick={() => handleSubmit('schedule')}
              disabled={isPending || !scheduledAt}
              className="flex-1 min-w-[140px] py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ border: '1px solid hsl(250 85% 65%)', color: 'hsl(250 85% 65%)' }}
            >
              ⏰ {t('SchedulePost')}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={isPending}
            className="py-3 px-6 rounded-xl font-semibold transition-all hover:bg-white/5 disabled:opacity-50"
            style={{ color: 'hsl(215 15% 55%)' }}
          >
            💾 {t('Draft')}
          </button>
        </div>
      </div>

      {/* Right Column - Preview */}
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-6">
          <PostPreview
            text={buildFullText()}
            parseMode={parseMode}
            mediaFiles={mediaFiles}
            poll={pollEnabled ? poll : undefined}
            keyboard={keyboard}
            channelName={channels.find((c) => selectedChannels.includes(c.id))?.title || t('Channel')}
            ttsAudioPath={ttsAudioPath}
          />
        </div>
      </div>
    </div>
  )
}
