'use client'

import type { AnalyticsOverview } from '@/types'
import { useTranslations } from 'next-intl'

interface Props {
  overview: AnalyticsOverview
}

export default function AnalyticsStatCards({ overview }: Props) {
  const t = useTranslations('Analytics')

  const cards = [
    {
      icon: '👁️',
      title: t('TotalViews'),
      value: overview.totalViews.toLocaleString(),
      subtext: `${overview.avgViewsPerPost} ${t('AvgPerPost')}`,
      color: 'hsl(250 85% 65%)',
      bgGradient: 'linear-gradient(135deg, hsl(250 85% 65% / 0.15), hsl(250 85% 65% / 0.05))',
    },
    {
      icon: '🔁',
      title: t('TotalForwards'),
      value: overview.totalForwards.toLocaleString(),
      subtext: `${overview.totalPostsSent} ${t('TotalPostsSent')}`,
      color: 'hsl(175 80% 50%)',
      bgGradient: 'linear-gradient(135deg, hsl(175 80% 50% / 0.15), hsl(175 80% 50% / 0.05))',
    },
    {
      icon: '❤️',
      title: t('TotalReactions'),
      value: overview.totalReactions.toLocaleString(),
      subtext: t('EmojiReactions'),
      color: 'hsl(340 85% 60%)',
      bgGradient: 'linear-gradient(135deg, hsl(340 85% 60% / 0.15), hsl(340 85% 60% / 0.05))',
    },
    {
      icon: '⚡',
      title: t('EngagementRate'),
      value: `${overview.avgEngagementRate}%`,
      subtext: `${overview.totalSubscribers.toLocaleString()} ${t('Subscribers')}`,
      color: 'hsl(38 95% 55%)',
      bgGradient: 'linear-gradient(135deg, hsl(38 95% 55% / 0.15), hsl(38 95% 55% / 0.05))',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="glass rounded-2xl p-5 border hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between space-y-3"
          style={{
            background: card.bgGradient,
            borderColor: 'hsl(224 15% 20% / 0.6)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">{card.icon}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10" style={{ color: card.color }}>
              Live
            </span>
          </div>

          <div>
            <h4 className="text-2xl font-black font-mono tracking-tight" style={{ color: card.color }}>
              {card.value}
            </h4>
            <p className="text-xs font-semibold text-gray-300">{card.title}</p>
          </div>

          <p className="text-[11px] text-gray-400 border-t border-white/5 pt-2">
            {card.subtext}
          </p>
        </div>
      ))}
    </div>
  )
}
