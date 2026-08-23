'use client'

import { useState, useEffect } from 'react'
import { getChannels } from '@/app/actions/channels'
import type { ChannelInfo } from '@/types'

interface Props {
  selectedChannels: string[]
  onChannelsChange: (channels: string[]) => void
}

export default function ChannelSelector({ selectedChannels, onChannelsChange }: Props) {
  const [channels, setChannels] = useState<ChannelInfo[]>([])

  useEffect(() => {
    getChannels().then((data) => setChannels(data as unknown as ChannelInfo[]))
  }, [])

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📢 Select Channels</h3>
      <div className="flex flex-wrap gap-2">
        {channels.length === 0 ? (
          <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>No channels available. Add channels in the Channels page.</p>
        ) : (
          <>
            <button
              onClick={() => onChannelsChange(selectedChannels.length === channels.length ? [] : channels.map((c) => c.id))}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ background: 'hsl(224 20% 14%)', color: 'hsl(215 15% 55%)' }}
            >
              {selectedChannels.length === channels.length ? 'Deselect All' : 'Select All'}
            </button>
            {channels.map((ch) => {
              const selected = selectedChannels.includes(ch.id)
              return (
                <button
                  key={ch.id}
                  onClick={() => onChannelsChange(selected ? selectedChannels.filter((id) => id !== ch.id) : [...selectedChannels, ch.id])}
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
  )
}
