'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function ChannelHelpGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('Channels')

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
      >
        <span className="font-semibold text-indigo-300 flex items-center gap-2">
          💡 {t('HelpTitle')}
        </span>
        <span className="text-gray-400 font-mono">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 border-t border-white/5 bg-black/30 animate-fade-in text-gray-300 leading-relaxed">
          {/* Step 1: Admin Permission */}
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-2.5">
            <span className="text-base shrink-0">⚠️</span>
            <div>
              <p className="font-bold">{t('HelpAdminRequiredTitle')}</p>
              <p className="text-[11px] opacity-90">{t('HelpAdminRequiredDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Public Channel */}
            <div className="p-3 rounded-lg border border-white/5 bg-white/5 space-y-1.5">
              <p className="font-bold text-white flex items-center gap-1.5">
                🌐 {t('HelpPublicTitle')}
              </p>
              <p className="text-[11px] text-gray-400">{t('HelpPublicDesc')}</p>
              <code className="block p-1.5 rounded bg-black/40 text-[11px] font-mono text-indigo-300 select-all">
                @kanal_username
              </code>
            </div>

            {/* Private Channel */}
            <div className="p-3 rounded-lg border border-white/5 bg-white/5 space-y-1.5">
              <p className="font-bold text-white flex items-center gap-1.5">
                🔒 {t('HelpPrivateTitle')}
              </p>
              <p className="text-[11px] text-gray-400">{t('HelpPrivateDesc')}</p>
              <code className="block p-1.5 rounded bg-black/40 text-[11px] font-mono text-indigo-300 select-all">
                -1001234567890
              </code>
            </div>
          </div>

          {/* How to get Private ID */}
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <p className="font-semibold text-white">🔍 {t('HelpHowToGetIdTitle')}</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-400">
              <li>{t('HelpHowToGetIdStep1')}</li>
              <li>{t('HelpHowToGetIdStep2')}</li>
              <li>{t('HelpHowToGetIdStep3')}</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
