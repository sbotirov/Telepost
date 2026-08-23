'use server'

import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import type {
  AnalyticsOverview,
  ViewsTimelinePoint,
  ChannelGrowthSeries,
  TopPostItem,
  AdminSettingConfig,
  PostType,
} from '@/types'

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const [totalPostsSent, posts, channels] = await Promise.all([
    prisma.post.count({ where: { status: 'SENT' } }),
    prisma.post.findMany({
      where: { status: 'SENT' },
      select: {
        viewsCount: true,
        forwardsCount: true,
        reactionsCount: true,
      },
    }),
    prisma.channel.findMany({
      where: { isActive: true },
      select: { memberCount: true },
    }),
  ])

  const totalViews = posts.reduce((acc, p) => acc + (p.viewsCount || 0), 0)
  const totalForwards = posts.reduce((acc, p) => acc + (p.forwardsCount || 0), 0)
  const totalReactions = posts.reduce((acc, p) => acc + (p.reactionsCount || 0), 0)
  const totalSubscribers = channels.reduce((acc, c) => acc + (c.memberCount || 0), 0)

  const avgViewsPerPost = totalPostsSent > 0 ? Math.round(totalViews / totalPostsSent) : 0
  const avgEngagementRate =
    totalViews > 0
      ? Number((((totalForwards + totalReactions) / totalViews) * 100).toFixed(2))
      : 0

  return {
    totalViews,
    totalForwards,
    totalReactions,
    totalPostsSent,
    avgViewsPerPost,
    avgEngagementRate,
    totalSubscribers,
  }
}

export async function getViewsTimeline(period: '7d' | '30d' | '90d' = '30d'): Promise<ViewsTimelinePoint[]> {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const posts = await prisma.post.findMany({
    where: {
      status: 'SENT',
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      viewsCount: true,
      forwardsCount: true,
      reactionsCount: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Create date map for all days in range
  const timelineMap = new Map<string, ViewsTimelinePoint>()
  for (let i = 0; i <= days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().split('T')[0]
    timelineMap.set(key, {
      date: key,
      views: 0,
      forwards: 0,
      reactions: 0,
      postsCount: 0,
    })
  }

  // Populate actual posts data
  for (const post of posts) {
    const key = new Date(post.createdAt).toISOString().split('T')[0]
    const existing = timelineMap.get(key)
    if (existing) {
      existing.views += post.viewsCount || 0
      existing.forwards += post.forwardsCount || 0
      existing.reactions += post.reactionsCount || 0
      existing.postsCount += 1
    }
  }

  return Array.from(timelineMap.values())
}

export async function getChannelGrowthData(): Promise<ChannelGrowthSeries[]> {
  const channels = await prisma.channel.findMany({
    where: { isActive: true },
    include: {
      snapshots: {
        orderBy: { date: 'asc' },
        take: 30,
      },
    },
  })

  const now = new Date()

  return channels.map((ch) => {
    let history = ch.snapshots.map((s) => ({
      date: new Date(s.date).toISOString().split('T')[0],
      memberCount: s.memberCount,
    }))

    // If no snapshots yet, generate initial baseline points
    if (history.length === 0) {
      const current = ch.memberCount || 0
      history = [
        {
          date: new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0],
          memberCount: Math.max(0, current - 5),
        },
        {
          date: now.toISOString().split('T')[0],
          memberCount: current,
        },
      ]
    }

    return {
      channelId: ch.id,
      title: ch.title,
      currentMembers: ch.memberCount || 0,
      history,
    }
  })
}

export async function getTopPerformingPosts(limit = 10): Promise<TopPostItem[]> {
  const posts = await prisma.post.findMany({
    where: { status: 'SENT' },
    include: {
      channels: { include: { channel: true } },
    },
    orderBy: [
      { viewsCount: 'desc' },
      { forwardsCount: 'desc' },
      { reactionsCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  })

  return posts.map((p) => ({
    id: p.id,
    type: p.type as PostType,
    text: p.text,
    viewsCount: p.viewsCount,
    forwardsCount: p.forwardsCount,
    reactionsCount: p.reactionsCount,
    reactionsJson: p.reactionsJson,
    sentAt: p.sentAt || p.createdAt,
    channels: p.channels.map((pc) => ({
      channelId: pc.channel.id,
      title: pc.channel.title,
    })),
  }))
}

export async function getPostTypeDistribution(): Promise<Record<string, number>> {
  const distribution = await prisma.post.groupBy({
    by: ['type'],
    _count: {
      id: true,
    },
  })

  const result: Record<string, number> = {}
  for (const item of distribution) {
    result[item.type] = item._count.id
  }
  return result
}

export async function updatePostMetrics(
  postId: string,
  metrics: { viewsCount?: number; forwardsCount?: number; reactionsCount?: number; reactionsJson?: string }
) {
  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      viewsCount: metrics.viewsCount !== undefined ? metrics.viewsCount : undefined,
      forwardsCount: metrics.forwardsCount !== undefined ? metrics.forwardsCount : undefined,
      reactionsCount: metrics.reactionsCount !== undefined ? metrics.reactionsCount : undefined,
      reactionsJson: metrics.reactionsJson !== undefined ? metrics.reactionsJson : undefined,
    },
  })

  revalidatePath('/dashboard/analytics')
  revalidatePath('/dashboard/history')
  return updated
}

export async function getAdminSettings(): Promise<AdminSettingConfig> {
  const setting = await prisma.adminSetting.findFirst()
  if (!setting) {
    const created = await prisma.adminSetting.create({
      data: {
        adminChatId: process.env.ADMIN_CHAT_ID || null,
        notifyOnFailure: true,
        notifyOnSuccess: false,
      },
    })
    return {
      id: created.id,
      adminChatId: created.adminChatId,
      notifyOnFailure: created.notifyOnFailure,
      notifyOnSuccess: created.notifyOnSuccess,
    }
  }

  return {
    id: setting.id,
    adminChatId: setting.adminChatId,
    notifyOnFailure: setting.notifyOnFailure,
    notifyOnSuccess: setting.notifyOnSuccess,
  }
}

export async function updateAdminSettings(config: AdminSettingConfig) {
  const existing = await prisma.adminSetting.findFirst()
  let result
  if (existing) {
    result = await prisma.adminSetting.update({
      where: { id: existing.id },
      data: {
        adminChatId: config.adminChatId || null,
        notifyOnFailure: config.notifyOnFailure,
        notifyOnSuccess: config.notifyOnSuccess,
      },
    })
  } else {
    result = await prisma.adminSetting.create({
      data: {
        adminChatId: config.adminChatId || null,
        notifyOnFailure: config.notifyOnFailure,
        notifyOnSuccess: config.notifyOnSuccess,
      },
    })
  }

  revalidatePath('/dashboard/settings')
  return result
}

export async function takeDailyChannelSnapshots() {
  const channels = await prisma.channel.findMany({ where: { isActive: true } })
  const now = new Date()

  for (const channel of channels) {
    if (channel.memberCount !== null && channel.memberCount !== undefined) {
      await prisma.channelGrowthSnapshot.create({
        data: {
          channelId: channel.id,
          memberCount: channel.memberCount,
          date: now,
        },
      })
    }
  }
}
