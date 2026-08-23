'use client'

import { useState, useEffect } from 'react'
import {
  getAnalyticsOverview,
  getViewsTimeline,
  getChannelGrowthData,
  getTopPerformingPosts,
  getPostTypeDistribution,
} from '@/app/actions/analytics'
import AnalyticsStatCards from '@/components/analytics/AnalyticsStatCards'
import ViewsTimelineChart from '@/components/analytics/ViewsTimelineChart'
import ChannelGrowthChart from '@/components/analytics/ChannelGrowthChart'
import PostTypeDistributionChart from '@/components/analytics/PostTypeDistributionChart'
import TopPerformingPosts from '@/components/analytics/TopPerformingPosts'
import MetricUpdateModal from '@/components/analytics/MetricUpdateModal'
import { useTranslations } from 'next-intl'
import type {
  AnalyticsOverview,
  ViewsTimelinePoint,
  ChannelGrowthSeries,
  TopPostItem,
} from '@/types'

export default function AnalyticsPage() {
  const t = useTranslations('Analytics')
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  const [overview, setOverview] = useState<AnalyticsOverview>({
    totalViews: 0,
    totalForwards: 0,
    totalReactions: 0,
    totalPostsSent: 0,
    avgViewsPerPost: 0,
    avgEngagementRate: 0,
    totalSubscribers: 0,
  })
  const [timeline, setTimeline] = useState<ViewsTimelinePoint[]>([])
  const [channelGrowth, setChannelGrowth] = useState<ChannelGrowthSeries[]>([])
  const [topPosts, setTopPosts] = useState<TopPostItem[]>([])
  const [distribution, setDistribution] = useState<Record<string, number>>({})

  const [editingPost, setEditingPost] = useState<TopPostItem | null>(null)

  useEffect(() => {
    let ignore = false
    async function fetchAnalytics() {
      try {
        const [ov, tl, cg, tp, dist] = await Promise.all([
          getAnalyticsOverview(),
          getViewsTimeline(period),
          getChannelGrowthData(),
          getTopPerformingPosts(10),
          getPostTypeDistribution(),
        ])
        if (!ignore) {
          setOverview(ov)
          setTimeline(tl)
          setChannelGrowth(cg)
          setTopPosts(tp)
          setDistribution(dist)
          setLoading(false)
        }
      } catch {
        if (!ignore) {
          setLoading(false)
        }
      }
    }
    fetchAnalytics()
    return () => {
      ignore = true
    }
  }, [period])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const [ov, tl, cg, tp, dist] = await Promise.all([
        getAnalyticsOverview(),
        getViewsTimeline(period),
        getChannelGrowthData(),
        getTopPerformingPosts(10),
        getPostTypeDistribution(),
      ])
      setOverview(ov)
      setTimeline(tl)
      setChannelGrowth(cg)
      setTopPosts(tp)
      setDistribution(dist)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{t('PageTitle')}</h2>
          <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>
            {t('PageDescription')}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold glass border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <span>{loading ? '⏳' : '🔄'}</span>
          <span>{t('RefreshData')}</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <AnalyticsStatCards overview={overview} />

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ViewsTimelineChart
            data={timeline}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>
        <div className="lg:col-span-1">
          <PostTypeDistributionChart data={distribution} />
        </div>
      </div>

      {/* Channel Growth & Top Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChannelGrowthChart data={channelGrowth} />
        <TopPerformingPosts
          posts={topPosts}
          onUpdateMetrics={(post) => setEditingPost(post)}
        />
      </div>

      {/* Metric Update Modal */}
      <MetricUpdateModal
        isOpen={!!editingPost}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
