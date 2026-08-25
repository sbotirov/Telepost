'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { getAllChannels, addChannel, removeChannel, toggleChannel } from '@/app/actions/channels'
import ChannelHelpGuide from '@/components/channels/ChannelHelpGuide'
import type { ChannelInfo } from '@/types'
import { useTranslations } from 'next-intl'

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelInfo[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [chatId, setChatId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('Channels')

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    if (showAddForm) {
      inputRef.current?.focus()
    }
  }, [showAddForm])

  async function loadChannels() {
    const data = await getAllChannels()
    setChannels(data as unknown as ChannelInfo[])
  }

  function handleAdd(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!chatId.trim()) return
    setError('')
    startTransition(async () => {
      try {
        await addChannel(chatId.trim())
        setChatId('')
        setShowAddForm(false)
        await loadChannels()
      } catch (e) {
        setError(e instanceof Error ? e.message : t('FailedToAdd'))
      }
    })
  }

  function handleRemove(id: string, title: string) {
    if (!confirm(t('ConfirmRemove', { title }))) return
    startTransition(async () => {
      await removeChannel(id)
      await loadChannels()
    })
  }

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      await toggleChannel(id, !isActive)
      await loadChannels()
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t('Title')}</h2>
          <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('Description')}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl font-medium text-sm text-white hover:scale-105 transition-transform glow-effect"
          style={{ background: 'linear-gradient(135deg, hsl(250 85% 65%), hsl(175 80% 50%))' }}
        >
          {t('AddChannelBtn')}
        </button>
      </div>

      {/* Add Channel Form */}
      {showAddForm && (
        <div className="glass rounded-2xl p-5 space-y-4 animate-fade-in border border-indigo-500/20 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              📢 {t('AddChannel')}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-gray-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                autoFocus
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder={t('Placeholder')}
                className="flex-1 form-input text-sm"
              />
              <button
                type="submit"
                disabled={isPending || !chatId.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all hover:scale-105"
                style={{ background: 'hsl(250 85% 65%)' }}
              >
                {isPending ? '⏳ ...' : t('Add')}
              </button>
            </div>
            {error && <p className="text-sm" style={{ color: 'hsl(0 72% 60%)' }}>⚠️ {error}</p>}
          </form>

          {/* Interactive Visual Guide */}
          <ChannelHelpGuide />
        </div>
      )}

      {/* Channel Grid */}
      {channels.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📢</div>
          <h3 className="text-lg font-semibold mb-2">{t('NoChannels')}</h3>
          <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('NoChannelsDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <div key={channel.id} className="glass rounded-2xl p-5 hover:scale-[1.01] transition-all duration-200 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: 'hsl(250 85% 65% / 0.15)' }}>
                    📢
                  </div>
                  <div>
                    <h4 className="font-semibold">{channel.title}</h4>
                    {channel.username && (
                      <p className="text-xs" style={{ color: 'hsl(215 15% 55%)' }}>@{channel.username}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(channel.id, channel.title)}
                  className="opacity-0 group-hover:opacity-100 text-sm p-1.5 rounded-lg hover:bg-white/10 transition-all"
                  style={{ color: 'hsl(0 72% 60%)' }}
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                {channel.memberCount && (
                  <span className="text-xs" style={{ color: 'hsl(215 15% 55%)' }}>
                    👥 {channel.memberCount.toLocaleString()} {t('Members')}
                  </span>
                )}
                <button
                  onClick={() => handleToggle(channel.id, channel.isActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${channel.isActive ? '' : 'opacity-50'}`}
                  style={{ background: channel.isActive ? 'hsl(145 65% 50%)' : 'hsl(224 15% 20%)' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200"
                    style={{ transform: channel.isActive ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
