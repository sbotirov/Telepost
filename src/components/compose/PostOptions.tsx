'use client'

import type { PostOptions } from '@/types'
import { useTranslations } from 'next-intl'

interface Props {
  options: PostOptions
  autoDeleteHours?: number | null
  onOptionsChange: (opts: PostOptions) => void
  onAutoDeleteHoursChange?: (hours: number | null) => void
}

const toggleItems = [
  { key: 'disableComments' as const, icon: '💬', labelKey: 'DisableComments' },
  { key: 'disableNotification' as const, icon: '🔕', labelKey: 'SilentNotification' },
  { key: 'protectContent' as const, icon: '🛡️', labelKey: 'ProtectContent' },
  { key: 'pinMessage' as const, icon: '📌', labelKey: 'PinMessage' },
]

const AUTO_DELETE_PRESETS = [
  { hours: null, labelKey: 'Never' },
  { hours: 1, label: '1h' },
  { hours: 2, label: '2h' },
  { hours: 6, label: '6h' },
  { hours: 12, label: '12h' },
  { hours: 24, label: '24h' },
  { hours: 48, label: '48h' },
  { hours: 168, label: '7d' },
]

export default function PostOptions_({
  options,
  autoDeleteHours = null,
  onOptionsChange,
  onAutoDeleteHoursChange,
}: Props) {
  const t = useTranslations('Compose')

  function toggle(key: keyof PostOptions) {
    onOptionsChange({ ...options, [key]: !options[key] })
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">⚙️ {t('PostOptions')}</h3>
      <div className="grid grid-cols-2 gap-3">
        {toggleItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => toggle(item.key)}
            className="flex items-center gap-2 p-3 rounded-xl text-sm transition-all text-left"
            style={{
              background: options[item.key] ? 'hsl(250 85% 65% / 0.1)' : 'hsl(224 20% 14%)',
              border: options[item.key] ? '1px solid hsl(250 85% 65% / 0.3)' : '1px solid hsl(224 15% 20%)',
              color: options[item.key] ? 'hsl(250 85% 65%)' : 'hsl(215 15% 55%)',
            }}
          >
            <span>{item.icon}</span>
            <span className="text-xs">{t(item.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Auto-Delete Section */}
      <div className="pt-3 border-t space-y-2" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'hsl(215 15% 55%)' }}>
            <span>⏳</span>
            <span>{t('AutoDelete')}</span>
          </label>
          {autoDeleteHours && (
            <span className="text-xs font-semibold text-amber-400">
              {t('AutoDeleteAfter', { hours: autoDeleteHours })}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {AUTO_DELETE_PRESETS.map((preset) => {
            const isSelected = autoDeleteHours === preset.hours
            return (
              <button
                key={preset.hours === null ? 'never' : preset.hours}
                type="button"
                onClick={() => onAutoDeleteHoursChange?.(preset.hours)}
                className={`py-1 px-2.5 rounded-lg text-xs font-medium border transition-all ${isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'border-white/5 hover:bg-white/5 text-gray-400'}`}
              >
                {preset.labelKey ? t(preset.labelKey) : preset.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
