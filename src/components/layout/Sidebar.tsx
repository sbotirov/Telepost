'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Overview' },
  { href: '/dashboard/compose', icon: '✏️', label: 'Compose' },
  { href: '/dashboard/analytics', icon: '📈', label: 'Analytics' },
  { href: '/dashboard/templates', icon: '📑', label: 'Templates' },
  { href: '/dashboard/channels', icon: '📢', label: 'Channels' },
  { href: '/dashboard/scheduled', icon: '⏰', label: 'Scheduled' },
  { href: '/dashboard/history', icon: '📜', label: 'History' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('Sidebar')

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glass flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
        <span className="text-2xl">📡</span>
        <h1 className="text-xl font-bold gradient-text">TelePost</h1>
        <button onClick={onClose} className="lg:hidden ml-auto text-lg hover:opacity-70">✕</button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          let labelKey = 'Overview'
          if (item.href.includes('/compose')) labelKey = 'Compose'
          else if (item.href.includes('/analytics')) labelKey = 'Analytics'
          else if (item.href.includes('/templates')) labelKey = 'Templates'
          else if (item.href.includes('/channels')) labelKey = 'Channels'
          else if (item.href.includes('/scheduled')) labelKey = 'Scheduled'
          else if (item.href.includes('/history')) labelKey = 'History'
          else if (item.href.includes('/settings')) labelKey = 'Settings'
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'hover:bg-white/5'
              }`}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, hsl(250 85% 65% / 0.2), hsl(175 80% 50% / 0.1))',
                      borderLeft: '3px solid hsl(175 80% 50%)',
                      color: 'hsl(250 85% 65%)',
                    }
                  : { color: 'hsl(215 15% 55%)' }
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{t(labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t text-xs" style={{ borderColor: 'hsl(224 15% 20% / 0.5)', color: 'hsl(215 15% 40%)' }}>
        TelePost v1.0.0
      </div>
    </aside>
  )
}
