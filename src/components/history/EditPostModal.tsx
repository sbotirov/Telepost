'use client'

import { useState, useTransition } from 'react'
import { editPublishedPost } from '@/app/actions/posts'
import { useTranslations } from 'next-intl'
import type { InlineKeyboard } from '@/types'
import InlineKeyboardBuilder from '@/components/compose/InlineKeyboardBuilder'

interface PostItem {
  id: string
  text?: string | null
  parseMode: string
  inlineKeyboard?: string | null
  type: string
  [key: string]: unknown
}

interface Props {
  isOpen: boolean
  post: PostItem | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditPostModal({ isOpen, post, onClose, onSuccess }: Props) {
  const t = useTranslations('History')
  const tCompose = useTranslations('Compose')
  const [text, setText] = useState(post?.text || '')
  const [parseMode, setParseMode] = useState<'HTML' | 'MarkdownV2'>(
    (post?.parseMode as 'HTML' | 'MarkdownV2') || 'HTML'
  )
  const [keyboard, setKeyboard] = useState<InlineKeyboard>(
    post?.inlineKeyboard ? (typeof post.inlineKeyboard === 'string' ? JSON.parse(post.inlineKeyboard) : (post.inlineKeyboard as unknown as InlineKeyboard)) : []
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !post) return null

  function handleSave() {
    if (!post) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await editPublishedPost({
          postId: post.id,
          text,
          parseMode,
          inlineKeyboard: keyboard.length > 0 ? keyboard : undefined,
        })

        if (res.success) {
          onSuccess()
          onClose()
        } else {
          setError(res.errors?.map((e) => e.error).join(', ') || 'Failed to edit message in Telegram')
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error occurred while editing message')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl glass rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
          <h3 className="text-lg font-bold flex items-center gap-2">
            ✏️ {t('EditPublishedPost')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium" style={{ color: 'hsl(215 15% 55%)' }}>
                {t('PostContent')}
              </label>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setParseMode('HTML')}
                  className={`px-2 py-0.5 rounded ${parseMode === 'HTML' ? 'bg-indigo-500 text-white font-semibold' : 'bg-white/5 text-gray-400'}`}
                >
                  HTML
                </button>
                <button
                  type="button"
                  onClick={() => setParseMode('MarkdownV2')}
                  className={`px-2 py-0.5 rounded ${parseMode === 'MarkdownV2' ? 'bg-indigo-500 text-white font-semibold' : 'bg-white/5 text-gray-400'}`}
                >
                  Markdown
                </button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="form-input font-mono text-sm"
              placeholder={tCompose('WritePostPlaceholder')}
            />
          </div>

          {post.type !== 'POLL' && (
            <InlineKeyboardBuilder keyboard={keyboard} onKeyboardChange={setKeyboard} />
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
            style={{ color: 'hsl(215 15% 55%)' }}
          >
            {t('Cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, hsl(250 85% 65%), hsl(175 80% 50%))' }}
          >
            {isPending ? `⏳ ${t('Saving')}` : `💾 ${t('UpdateInTelegram')}`}
          </button>
        </div>
      </div>
    </div>
  )
}
