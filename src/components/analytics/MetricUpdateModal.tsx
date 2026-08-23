'use client'

import { useState, useTransition } from 'react'
import { updatePostMetrics } from '@/app/actions/analytics'
import { useTranslations } from 'next-intl'
import type { TopPostItem } from '@/types'

interface Props {
  isOpen: boolean
  post: TopPostItem | null
  onClose: () => void
  onSuccess: () => void
}

export default function MetricUpdateModal({ isOpen, post, onClose, onSuccess }: Props) {
  const t = useTranslations('Analytics')
  const [views, setViews] = useState(post?.viewsCount || 0)
  const [forwards, setForwards] = useState(post?.forwardsCount || 0)
  const [reactions, setReactions] = useState(post?.reactionsCount || 0)
  const [isPending, startTransition] = useTransition()

  if (!isOpen || !post) return null

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!post) return

    startTransition(async () => {
      await updatePostMetrics(post.id, {
        viewsCount: Number(views),
        forwardsCount: Number(forwards),
        reactionsCount: Number(reactions),
      })
      onSuccess()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <form
        onSubmit={handleSave}
        className="w-full max-w-md glass rounded-2xl p-6 space-y-4 shadow-2xl border"
        style={{ borderColor: 'hsl(224 15% 20% / 0.8)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
          <h3 className="text-base font-bold flex items-center gap-2">
            ⚙️ {t('UpdateMetricsTitle')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-sm"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-400 line-clamp-2">
          {post.text || `[${post.type} Post]`}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1 font-medium text-gray-400">
              👁️ {t('Views')}
            </label>
            <input
              type="number"
              min="0"
              value={views}
              onChange={(e) => setViews(parseInt(e.target.value) || 0)}
              className="form-input text-sm font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium text-gray-400">
              🔁 {t('Forwards')}
            </label>
            <input
              type="number"
              min="0"
              value={forwards}
              onChange={(e) => setForwards(parseInt(e.target.value) || 0)}
              className="form-input text-sm font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium text-gray-400">
              ❤️ {t('Reactions')}
            </label>
            <input
              type="number"
              min="0"
              value={reactions}
              onChange={(e) => setReactions(parseInt(e.target.value) || 0)}
              className="form-input text-sm font-mono"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors disabled:opacity-50 text-gray-400"
          >
            {t('Cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: 'hsl(250 85% 65%)' }}
          >
            {isPending ? '⏳ ...' : t('Save')}
          </button>
        </div>
      </form>
    </div>
  )
}
