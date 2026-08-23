'use client'

import { useState, useEffect, useTransition } from 'react'
import { getScheduledPosts, cancelScheduledPost } from '@/app/actions/posts'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface ScheduledChannel {
  channelId: string
  channel: {
    title: string
  }
}

interface ScheduledPostItem {
  id: string
  type: string
  text?: string | null
  scheduledAt: string | Date | null
  channels: ScheduledChannel[]
}

export default function ScheduledPage() {
  const [posts, setPosts] = useState<ScheduledPostItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, postId: string }>({ isOpen: false, postId: '' })
  const t = useTranslations('Scheduled')

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    const data = await getScheduledPosts()
    setPosts(data as unknown as ScheduledPostItem[])
  }

  function requestCancel(postId: string) {
    setConfirmModal({ isOpen: true, postId })
  }

  function handleCancel() {
    if (!confirmModal.postId) return
    startTransition(async () => {
      await cancelScheduledPost(confirmModal.postId)
      setConfirmModal({ isOpen: false, postId: '' })
      await loadPosts()
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t('Title')}</h2>
          <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('Description')}</p>
        </div>
        <button onClick={() => loadPosts()} className="p-2 rounded-lg hover:bg-white/5">🔄</button>
      </div>

      {posts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">⏰</div>
          <h3 className="text-lg font-semibold mb-2">{t('NoPosts')}</h3>
          <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('NoPostsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[hsl(224_15%_20%)] before:to-transparent">
          {posts.map((post) => (
            <div key={post.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow" style={{ background: 'hsl(224 25% 10%)', borderColor: 'hsl(38 95% 55%)', color: 'hsl(38 95% 55%)' }}>
                ⏰
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl glass hover:scale-[1.01] transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: 'hsl(38 95% 55%)' }}>
                    {post.scheduledAt ? format(new Date(post.scheduledAt), 'MMM d, yyyy h:mm a') : ''}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5">{post.type}</span>
                </div>
                
                <p className="text-sm mb-3 line-clamp-2">{post.text || t('MediaPost')}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    {post.channels.map((pc) => (
                      <span key={pc.channelId} className="text-[10px] px-2 py-1 rounded-full bg-white/5 whitespace-nowrap">
                        📢 {pc.channel.title}
                      </span>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => requestCancel(post.id)}
                    disabled={isPending}
                    className="text-xs px-3 py-1.5 rounded-lg ml-2 shrink-0 transition-colors hover:bg-white/10"
                    style={{ color: 'hsl(0 72% 60%)', border: '1px solid hsl(0 72% 60% / 0.3)' }}
                  >
                    {t('Cancel')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={t('ConfirmCancel')}
        onCancel={() => setConfirmModal({ isOpen: false, postId: '' })}
        onConfirm={handleCancel}
        confirmText={t('Confirm')}
        cancelText={t('Cancel')}
      />
    </div>
  )
}
