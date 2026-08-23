'use client'

import type { TopPostItem } from '@/types'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface Props {
  posts: TopPostItem[]
  onUpdateMetrics?: (post: TopPostItem) => void
}

const rankBadges = ['🥇', '🥈', '🥉']

export default function TopPerformingPosts({ posts, onUpdateMetrics }: Props) {
  const t = useTranslations('Analytics')

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            🏆 {t('TopPerformingPosts')}
          </h3>
          <p className="text-xs" style={{ color: 'hsl(215 15% 55%)' }}>
            {t('TopPerformingPostsDesc')}
          </p>
        </div>

        <Link
          href="/dashboard/history"
          className="text-xs hover:opacity-75 font-semibold text-indigo-400"
        >
          {t('ViewAllPosts')} →
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p>{t('NoPostsFound')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, idx) => (
            <div
              key={post.id}
              className="p-4 rounded-xl border border-white/5 bg-black/15 hover:bg-white/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Rank & Content */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="text-xl shrink-0">
                  {rankBadges[idx] || `#${idx + 1}`}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-200 line-clamp-2">
                    {post.text || `[${post.type} Post]`}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-400">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono">
                      {post.type}
                    </span>
                    {post.channels.map((ch) => (
                      <span
                        key={ch.channelId}
                        className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-gray-300"
                      >
                        📢 {ch.title}
                      </span>
                    ))}
                    {post.sentAt && (
                      <span className="text-[10px]">
                        {new Date(post.sentAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics Breakdown */}
              <div className="flex items-center gap-4 shrink-0 sm:justify-end">
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span
                    className="flex items-center gap-1 font-bold"
                    style={{ color: 'hsl(250 85% 65%)' }}
                    title={t('Views')}
                  >
                    👁️ {post.viewsCount.toLocaleString()}
                  </span>
                  <span
                    className="flex items-center gap-1 font-bold"
                    style={{ color: 'hsl(175 80% 50%)' }}
                    title={t('Forwards')}
                  >
                    🔁 {post.forwardsCount.toLocaleString()}
                  </span>
                  <span
                    className="flex items-center gap-1 font-bold"
                    style={{ color: 'hsl(340 85% 60%)' }}
                    title={t('Reactions')}
                  >
                    ❤️ {post.reactionsCount.toLocaleString()}
                  </span>
                </div>

                {onUpdateMetrics && (
                  <button
                    onClick={() => onUpdateMetrics(post)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors"
                    title={t('EditMetrics')}
                  >
                    ⚙️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
