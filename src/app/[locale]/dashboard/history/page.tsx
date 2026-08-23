'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPostHistory, deletePost } from '@/app/actions/posts'
import { getChannels } from '@/app/actions/channels'
import { format, formatDistanceToNow } from 'date-fns'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'
import EditPostModal from '@/components/history/EditPostModal'
import type { PostFilter, PostStatus } from '@/types'

const statusColors: Record<string, string> = {
  SENT: 'status-sent',
  FAILED: 'status-failed',
  SCHEDULED: 'status-scheduled',
  DRAFT: 'status-draft',
  SENDING: 'status-sending',
}

interface HistoryChannel {
  channelId: string
  channel: {
    title: string
    [key: string]: unknown
  }
}

interface HistoryPost {
  id: string
  type: string
  text?: string | null
  parseMode: string
  inlineKeyboard?: string | null
  status: string
  createdAt: string | Date
  autoDeleteAt?: string | Date | null
  isDeletedFromTelegram?: boolean
  isRecurring?: boolean
  channels: HistoryChannel[]
  [key: string]: unknown
}

interface ChannelOption {
  id: string
  title: string
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<HistoryPost[]>([])
  const [channels, setChannels] = useState<ChannelOption[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const t = useTranslations('History')
  
  // Filters
  const [search, setSearch] = useState('')
  const [channelId, setChannelId] = useState('')
  const [status, setStatus] = useState('')
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, postId: string }>({ isOpen: false, postId: '' })
  const [editingPost, setEditingPost] = useState<HistoryPost | null>(null)

  useEffect(() => {
    getChannels().then((data) => setChannels(data as unknown as ChannelOption[]))
  }, [])

  const loadPosts = useCallback(async () => {
    setLoading(true)
    const filters: PostFilter = {}
    if (search) filters.search = search
    if (channelId) filters.channelId = channelId
    if (status) filters.status = status as PostStatus

    const data = await getPostHistory(page, 20, filters)
    setPosts(data.items as unknown as HistoryPost[])
    setTotal(data.totalPages)
    setLoading(false)
  }, [page, search, channelId, status])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts()
    }, 500)
    return () => clearTimeout(timer)
  }, [loadPosts])

  function requestDelete(id: string) {
    setConfirmModal({ isOpen: true, postId: id })
  }

  async function handleDelete() {
    if (!confirmModal.postId) return
    await deletePost(confirmModal.postId)
    setConfirmModal({ isOpen: false, postId: '' })
    loadPosts()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{t('Title')}</h2>
          <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('Description')}</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search')}
              className="pl-8 py-1.5 text-sm w-40"
            />
          </div>
          
          <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="py-1.5 text-sm w-32">
            <option value="">{t('AllChannels')}</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className="py-1.5 text-sm w-28">
            <option value="">{t('AllStatus')}</option>
            <option value="SENT">{t('StatusSent')}</option>
            <option value="FAILED">{t('StatusFailed')}</option>
            <option value="DRAFT">{t('StatusDraft')}</option>
          </select>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading && posts.length === 0 ? (
          <div className="p-12 text-center text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('Loading')}</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('NoPosts')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr style={{ background: 'hsl(224 20% 14%)', color: 'hsl(215 15% 55%)' }}>
                  <th className="px-4 py-3 font-medium">{t('ColType')}</th>
                  <th className="px-4 py-3 font-medium">{t('ColContent')}</th>
                  <th className="px-4 py-3 font-medium">{t('ColChannels')}</th>
                  <th className="px-4 py-3 font-medium">{t('ColStatus')}</th>
                  <th className="px-4 py-3 font-medium">{t('ColDate')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('ColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-1 rounded bg-white/5 text-xs">{post.type}</span>
                        {post.isRecurring && (
                          <span className="text-xs" title={t('RecurringPost')}>🔁</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="truncate">{post.text || t('MediaPost')}</p>
                      {post.autoDeleteAt && !post.isDeletedFromTelegram && (
                        <p className="text-[10px] text-amber-400">
                          ⏳ {t('AutoDeletesIn')} {formatDistanceToNow(new Date(post.autoDeleteAt))}
                        </p>
                      )}
                      {post.isDeletedFromTelegram && (
                        <p className="text-[10px] text-red-400">
                          🗑️ {t('DeletedFromTelegram')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {post.channels.slice(0, 2).map((pc) => (
                          <span key={pc.channelId} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px]">
                            {pc.channel?.title || 'Channel'}
                          </span>
                        ))}
                        {post.channels.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[10px]">+{post.channels.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statusColors[post.status] || 'status-draft'}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(215 15% 55%)' }}>
                      {format(new Date(post.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-3">
                      {post.status === 'SENT' && !post.isDeletedFromTelegram && post.type !== 'POLL' && (
                        <button
                          onClick={() => setEditingPost(post)}
                          className="text-xs hover:opacity-70 transition-opacity font-medium"
                          style={{ color: 'hsl(175 80% 50%)' }}
                        >
                          ✏️ {t('EditMessage')}
                        </button>
                      )}
                      {post.status === 'DRAFT' && (
                        <Link href={`../dashboard/compose?draftId=${post.id}`} className="text-xs hover:opacity-70 transition-opacity" style={{ color: 'hsl(250 85% 65%)' }}>
                          {t('EditDraft')}
                        </Link>
                      )}
                      <button onClick={() => requestDelete(post.id)} className="text-xs hover:opacity-70" style={{ color: 'hsl(0 72% 60%)' }}>
                        {t('Delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {total > 1 && (
          <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 hover:bg-white/5"
            >
              {t('Previous')}
            </button>
            <span className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('PageInfo', { page, total })}</span>
            <button
              onClick={() => setPage(p => Math.min(total, p + 1))}
              disabled={page === total}
              className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 hover:bg-white/5"
            >
              {t('Next')}
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={t('ConfirmDelete')}
        onCancel={() => setConfirmModal({ isOpen: false, postId: '' })}
        onConfirm={handleDelete}
        confirmText={t('Confirm')}
        cancelText={t('Cancel')}
      />

      <EditPostModal
        isOpen={!!editingPost}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSuccess={() => {
          setEditingPost(null)
          loadPosts()
        }}
      />
    </div>
  )
}
