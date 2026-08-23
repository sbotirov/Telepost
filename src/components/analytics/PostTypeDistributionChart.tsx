'use client'

import { useTranslations } from 'next-intl'

interface Props {
  data: Record<string, number>
}

const typeColors: Record<string, { color: string; icon: string; name: string }> = {
  TEXT: { color: 'hsl(210 85% 60%)', icon: '📝', name: 'Text' },
  PHOTO: { color: 'hsl(250 85% 65%)', icon: '🖼️', name: 'Photo' },
  VIDEO: { color: 'hsl(175 80% 50%)', icon: '🎬', name: 'Video' },
  AUDIO: { color: 'hsl(38 95% 55%)', icon: '🎵', name: 'Audio' },
  DOCUMENT: { color: 'hsl(280 75% 60%)', icon: '📄', name: 'Document' },
  POLL: { color: 'hsl(340 85% 60%)', icon: '📊', name: 'Poll' },
  TTS: { color: 'hsl(145 65% 50%)', icon: '🔊', name: 'TTS Voice' },
  MEDIA_GROUP: { color: 'hsl(250 85% 65%)', icon: '🖼️', name: 'Album' },
}

export default function PostTypeDistributionChart({ data }: Props) {
  const t = useTranslations('Analytics')
  const total = Object.values(data || {}).reduce((a, b) => a + b, 0)

  if (total === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-sm" style={{ color: 'hsl(215 15% 55%)' }}>
        <p className="text-2xl mb-1">📊</p>
        <p>{t('NoPostsYet')}</p>
      </div>
    )
  }

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-base font-bold flex items-center gap-2">
          🧩 {t('PostTypeDistribution')}
        </h3>
        <p className="text-xs" style={{ color: 'hsl(215 15% 55%)' }}>
          {t('PostTypeDistributionDesc')}
        </p>
      </div>

      {/* Progress Bar Stack */}
      <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-black/40 p-0.5 border border-white/5">
        {entries.map(([type, count]) => {
          const pct = ((count / total) * 100).toFixed(1)
          const conf = typeColors[type] || { color: 'hsl(215 15% 55%)', icon: '📝', name: type }
          return (
            <div
              key={type}
              style={{
                width: `${pct}%`,
                background: conf.color,
              }}
              title={`${conf.name}: ${count} (${pct}%)`}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
            />
          )
        })}
      </div>

      {/* Legend & Count Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
        {entries.map(([type, count]) => {
          const pct = Math.round((count / total) * 100)
          const conf = typeColors[type] || { color: 'hsl(215 15% 55%)', icon: '📝', name: type }
          return (
            <div
              key={type}
              className="p-2.5 rounded-xl border border-white/5 bg-black/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{conf.icon}</span>
                <div>
                  <p className="text-xs font-semibold">{conf.name}</p>
                  <p className="text-[10px] text-gray-400">{count} {t('Posts')}</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono" style={{ color: conf.color }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
