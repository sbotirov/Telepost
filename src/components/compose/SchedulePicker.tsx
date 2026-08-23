'use client'

import { useState, useSyncExternalStore } from 'react'
import type { RecurrenceRule } from '@/types'
import { useTranslations } from 'next-intl'

function subscribeTime(callback: () => void) {
  const timer = setInterval(callback, 30000)
  return () => clearInterval(timer)
}

function getTimeSnapshot() {
  return Date.now()
}

function getTimeServerSnapshot() {
  return 0
}

interface Props {
  mode: 'now' | 'schedule'
  scheduledAt: string
  isRecurring?: boolean
  recurrenceRule?: RecurrenceRule | null
  onModeChange: (mode: 'now' | 'schedule') => void
  onDateTimeChange: (dt: string) => void
  onRecurringChange?: (isRecurring: boolean, rule: RecurrenceRule | null) => void
}

const WEEKDAYS = [
  { day: 1, labelKey: 'Mon' },
  { day: 2, labelKey: 'Tue' },
  { day: 3, labelKey: 'Wed' },
  { day: 4, labelKey: 'Thu' },
  { day: 5, labelKey: 'Fri' },
  { day: 6, labelKey: 'Sat' },
  { day: 0, labelKey: 'Sun' },
]

export default function SchedulePicker({
  mode,
  scheduledAt,
  isRecurring = false,
  recurrenceRule,
  onModeChange,
  onDateTimeChange,
  onRecurringChange,
}: Props) {
  const t = useTranslations('Compose')
  const [recurringEnabled, setRecurringEnabled] = useState(isRecurring)
  const [recurType, setRecurType] = useState<'DAILY' | 'WEEKLY' | 'INTERVAL_HOURS'>(
    recurrenceRule?.type || 'DAILY'
  )
  const [interval, setInterval] = useState<number>(recurrenceRule?.interval || 1)
  const [selectedDays, setSelectedDays] = useState<number[]>(recurrenceRule?.days || [1, 2, 3, 4, 5])

  const now = useSyncExternalStore(subscribeTime, getTimeSnapshot, getTimeServerSnapshot)

  let countdown: string | null = null
  if (scheduledAt && now > 0) {
    const diff = new Date(scheduledAt).getTime() - now
    if (diff <= 0) {
      countdown = t('TimePassed')
    } else {
      const hours = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      countdown = t('PostsIn', { hours, mins })
    }
  }

  function updateRecurrence(enabled: boolean, type = recurType, intVal = interval, days = selectedDays) {
    if (!onRecurringChange) return
    if (!enabled) {
      onRecurringChange(false, null)
    } else {
      onRecurringChange(true, {
        type,
        interval: intVal,
        days: type === 'WEEKLY' ? days : undefined,
      })
    }
  }

  function toggleDay(day: number) {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day]
    setSelectedDays(updated)
    updateRecurrence(recurringEnabled, recurType, interval, updated)
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">⏰ {t('ScheduleTitle')}</h3>

      <div className="flex gap-2 mb-4">
        {(['now', 'schedule'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: mode === m ? 'hsl(250 85% 65% / 0.2)' : 'hsl(224 20% 14%)',
              color: mode === m ? 'hsl(250 85% 65%)' : 'hsl(215 15% 55%)',
              border: mode === m ? '1px solid hsl(250 85% 65% / 0.3)' : '1px solid transparent',
            }}
          >
            {m === 'now' ? `⚡ ${t('SendNow')}` : `📅 ${t('ScheduleTitle')}`}
          </button>
        ))}
      </div>

      {mode === 'schedule' && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: 'hsl(215 15% 55%)' }}>
              {t('ScheduleDateTime')}
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => onDateTimeChange(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="form-input w-full"
            />
            {countdown && (
              <p className="text-xs mt-1.5 text-center" style={{ color: 'hsl(250 85% 65%)' }}>{countdown}</p>
            )}
          </div>

          {/* Recurring Option */}
          <div className="p-3 rounded-xl border" style={{ background: 'hsl(224 20% 14%)', borderColor: 'hsl(224 15% 20%)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <span>🔁</span>
                <span>{t('RepeatSchedule')}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextState = !recurringEnabled
                  setRecurringEnabled(nextState)
                  updateRecurrence(nextState)
                }}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${recurringEnabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${recurringEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {recurringEnabled && (
              <div className="mt-3 pt-3 border-t space-y-3 animate-fade-in" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['DAILY', 'WEEKLY', 'INTERVAL_HOURS'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setRecurType(type)
                        updateRecurrence(true, type, interval, selectedDays)
                      }}
                      className={`py-1.5 px-2 rounded-lg font-medium border transition-all text-center ${recurType === type ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-white/5 hover:bg-white/5 text-gray-400'}`}
                    >
                      {type === 'DAILY' && t('Daily')}
                      {type === 'WEEKLY' && t('Weekly')}
                      {type === 'INTERVAL_HOURS' && t('Hourly')}
                    </button>
                  ))}
                </div>

                {recurType === 'INTERVAL_HOURS' && (
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: 'hsl(215 15% 55%)' }}>{t('Every')}:</span>
                    <input
                      type="number"
                      min={1}
                      max={72}
                      value={interval}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        setInterval(val)
                        updateRecurrence(true, recurType, val, selectedDays)
                      }}
                      className="form-input py-1 px-2 w-20 text-center text-xs"
                    />
                    <span style={{ color: 'hsl(215 15% 55%)' }}>{t('Hours')}</span>
                  </div>
                )}

                {recurType === 'DAILY' && (
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: 'hsl(215 15% 55%)' }}>{t('Every')}:</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={interval}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        setInterval(val)
                        updateRecurrence(true, recurType, val, selectedDays)
                      }}
                      className="form-input py-1 px-2 w-20 text-center text-xs"
                    />
                    <span style={{ color: 'hsl(215 15% 55%)' }}>{t('Days')}</span>
                  </div>
                )}

                {recurType === 'WEEKLY' && (
                  <div className="space-y-1">
                    <span className="text-[11px]" style={{ color: 'hsl(215 15% 55%)' }}>{t('SelectDays')}:</span>
                    <div className="flex gap-1">
                      {WEEKDAYS.map(({ day, labelKey }) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded ${selectedDays.includes(day) ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400'}`}
                        >
                          {t(labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
