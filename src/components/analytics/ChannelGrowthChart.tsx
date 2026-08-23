'use client'

import { useState } from 'react'
import type { ChannelGrowthSeries } from '@/types'
import { useTranslations } from 'next-intl'

interface Props {
  data: ChannelGrowthSeries[]
}

const channelPalette = [
  'hsl(250 85% 65%)',
  'hsl(175 80% 50%)',
  'hsl(38 95% 55%)',
  'hsl(340 85% 60%)',
  'hsl(210 85% 60%)',
  'hsl(145 65% 50%)',
]

export default function ChannelGrowthChart({ data }: Props) {
  const t = useTranslations('Analytics')
  const [selectedChannelId, setSelectedChannelId] = useState<string | 'ALL'>('ALL')

  const series = data || []
  if (series.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-sm" style={{ color: 'hsl(215 15% 55%)' }}>
        <p className="text-3xl mb-2">📢</p>
        <p>{t('NoChannelData')}</p>
      </div>
    )
  }

  const activeSeries =
    selectedChannelId === 'ALL'
      ? series
      : series.filter((s) => s.channelId === selectedChannelId)

  // Find max member count
  let maxMembers = 10
  for (const s of activeSeries) {
    for (const h of s.history) {
      if (h.memberCount > maxMembers) maxMembers = h.memberCount
    }
  }

  const width = 800
  const height = 220
  const paddingX = 40
  const paddingY = 30
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            🚀 {t('ChannelGrowth')}
          </h3>
          <p className="text-xs" style={{ color: 'hsl(215 15% 55%)' }}>
            {t('ChannelGrowthDesc')}
          </p>
        </div>

        {/* Channel Filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedChannelId('ALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              selectedChannelId === 'ALL'
                ? 'bg-white/15 text-white'
                : 'text-gray-400 hover:text-white bg-black/20'
            }`}
          >
            {t('AllChannels')}
          </button>
          {series.map((s, idx) => (
            <button
              key={s.channelId}
              onClick={() => setSelectedChannelId(s.channelId)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                selectedChannelId === s.channelId
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white bg-black/20'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: channelPalette[idx % channelPalette.length] }}
              />
              <span className="truncate max-w-[100px]">{s.title}</span>
              <span className="text-[10px] opacity-70">({s.currentMembers})</span>
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[260px]">
          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = height - paddingY - ratio * chartHeight
            const val = Math.round(ratio * maxMembers)
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="hsl(224 15% 20% / 0.5)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="hsl(215 15% 45%)"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {/* Series lines */}
          {activeSeries.map((s, sIdx) => {
            const color = channelPalette[sIdx % channelPalette.length]
            const hist = s.history
            if (hist.length === 0) return null

            const pts = hist.map((h, hIdx) => {
              const x = paddingX + (hIdx / Math.max(hist.length - 1, 1)) * chartWidth
              const y = height - paddingY - (h.memberCount / maxMembers) * chartHeight
              return { x, y, memberCount: h.memberCount }
            })

            const pathD = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')

            return (
              <g key={s.channelId}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {pts.map((p, pIdx) => (
                  <circle
                    key={pIdx}
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    fill={color}
                    stroke="hsl(224 25% 10%)"
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
