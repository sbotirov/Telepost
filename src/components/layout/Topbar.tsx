'use client'

import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslations } from 'next-intl'

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const [showDropdown, setShowDropdown] = useState(false)
  const t = useTranslations('Topbar')
  const tSidebar = useTranslations('Sidebar')
  
  // Try to match the pathname to a translation key
  let titleKey = 'Overview'
  if (pathname.includes('/compose')) titleKey = 'Compose'
  else if (pathname.includes('/templates')) titleKey = 'Templates'
  else if (pathname.includes('/channels')) titleKey = 'Channels'
  else if (pathname.includes('/scheduled')) titleKey = 'Scheduled'
  else if (pathname.includes('/history')) titleKey = 'History'
  else if (pathname.includes('/settings')) titleKey = 'Settings'
  
  const title = tSidebar(titleKey)

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b relative z-50" style={{ background: 'hsl(224 25% 10% / 0.8)', backdropFilter: 'blur(12px)', borderColor: 'hsl(224 15% 20% / 0.5)' }}>
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors">
          <span className="text-xl">☰</span>
        </button>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors relative">
          <span className="text-lg">🔔</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, hsl(250 85% 65%), hsl(175 80% 50%))' }}>
              A
            </div>
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl py-2 z-50 animate-fade-in shadow-xl">
                <div className="px-4 py-2 text-sm font-medium" style={{ color: 'hsl(215 15% 55%)' }}>
                  Admin
                </div>
                <hr className="my-1" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }} />
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                  style={{ color: 'hsl(0 72% 60%)' }}
                >
                  🚪 {t('SignOut')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
