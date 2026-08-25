'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function BotSetupGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('Settings')

  const steps = [
    {
      num: '1',
      title: t('BotGuideStep1Title'),
      desc: t('BotGuideStep1Desc'),
      code: '/newbot',
    },
    {
      num: '2',
      title: t('BotGuideStep2Title'),
      desc: t('BotGuideStep2Desc'),
      code: 'my_awesome_channel_bot',
    },
    {
      num: '3',
      title: t('BotGuideStep3Title'),
      desc: t('BotGuideStep3Desc'),
      code: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
    },
    {
      num: '4',
      title: t('BotGuideStep4Title'),
      desc: t('BotGuideStep4Desc'),
      code: null,
    },
  ]

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
      >
        <span className="font-semibold text-indigo-300 flex items-center gap-2">
          🤖 {t('BotGuideTitle')}
        </span>
        <span className="text-gray-400 font-mono">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3.5 border-t border-white/5 bg-black/30 animate-fade-in text-gray-300">
          <p className="text-xs text-gray-400">
            {t('BotGuideIntro')}
          </p>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-white/5"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs shrink-0">
                  {step.num}
                </span>

                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-semibold text-white">{step.title}</p>
                  <p className="text-[11px] text-gray-400">{step.desc}</p>
                  {step.code && (
                    <code className="inline-block px-2 py-0.5 mt-1 rounded bg-black/50 text-[11px] font-mono text-indigo-300 select-all">
                      {step.code}
                    </code>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-[11px]">
            💡 {t('BotGuideTip')}
          </div>
        </div>
      )}
    </div>
  )
}
