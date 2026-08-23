'use client'

import { useState } from 'react'
import type { ViewsTimelinePoint } from '@/types'
import { useTranslations } from 'next-intl'

interface Props {
  data: ViewsTimelinePoint[]
  period: '7d' | '30d' | '90d'
  onPeriodChange: (period: '7d' | '30d' | '90d') => void
}

export default function ViewsTimelineChart({ data, period, onPeriodChange }: Props) {
  const t = useTranslations('Analytics')
  const [activeMetric, setActiveMetric] = useState<'views' | 'forwards' | 'reactions'>('views')
  const [hoveredPoint, setHoveredPoint] = useState<ViewsTimelinePoint | null>(null)

  const points = data || []
  const values = points.map((p) => p[activeMetric] || 0)
  const maxValue = Math.max(...values, 10)

  const width = 800
  const height = 260
  const paddingX = 40
  const paddingY = 30
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2

  // Generate SVG path points
  const svgPoints = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(points.length - 1, 1)) * chartWidth
    const val = p[activeMetric] || 0
    const y = height - paddingY - (val / maxValue) * chartHeight
    return { x, y, point: p, value: val }
  })

  const pathD =
    svgPoints.length > 0
      ? `M ${svgPoints[0].x} ${svgPoints[0].y} ` +
        svgPoints.slice(1).map((pt) => `L ${pt.x} ${pt.y}`).join(' ')
      : ''

  const areaD =
    svgPoints.length > 0
      ? `${pathD} L ${svgPoints[svgPoints.length - 1].x} ${height - paddingY} L ${svgPoints[0].x} ${height - paddingY} Z`
      : ''

  const metricColors = {
    views: {
      stroke: 'hsl(250 85% 65%)',
      fillStart: 'hsl(250 85% 65% / 0.35)',
      fillEnd: 'hsl(250 85% 65% / 0.0)',
      label: t('Views'),
      icon: '👁️',
    },
    forwards: {
      stroke: 'hsl(175 80% 50%)',
      fillStart: 'hsl(175 80% 50% / 0.35)',
      fillEnd: 'hsl(175 80% 50% / 0.0)',
      label: t('Forwards'),
      icon: '🔁',
    },
    reactions: {
      stroke: 'hsl(340 85% 60%)',
      fillStart: 'hsl(340 85% 60% / 0.35)',
      fillEnd: 'hsl(340 85% 60% / 0.0)',
      label: t('Reactions'),
      icon: '❤️',
    },
  }

  const currentConfig = metricColors[activeMetric]

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            📈 {t('ViewsOverTime')}
          </h3>
          <p className="text-xs" style={{ color: 'hsl(215 15% 55%)' }}>
            {t('ViewsOverTimeDesc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex rounded-xl p-1 bg-black/20 border border-white/10">
            {(['views', 'forwards', 'reactions'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeMetric === metric
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {metricColors[metric].icon} {metricColors[metric].label}
              </button>
            ))}
          </div>

          {/* Period Selector */}
          <div className="flex rounded-xl p-1 bg-black/20 border border-white/10">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  period === p ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[300px] overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentConfig.fillStart} />
              <stop offset="100%" stopColor={currentConfig.fillEnd} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = height - paddingY - ratio * chartHeight
            const val = Math.round(ratio * maxValue)
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="hsl(224 15% 20% / 0.5)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="hsl(215 15% 45%)"
                  fontFamily="sans-serif"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </text>
              </g>
            )
          })}

          {/* Area under curve */}
          {areaD && <path d={areaD} fill="url(#areaGradient)" />}

          {/* Line path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={currentConfig.stroke}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {svgPoints.map((pt, idx) => {
            // Show every few labels or points to avoid clutter
            const isHovered = hoveredPoint?.date === pt.point.date
            return (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 3.5}
                  fill={isHovered ? '#fff' : currentConfig.stroke}
                  stroke="hsl(224 25% 10%)"
                  strokeWidth="2"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt.point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            )
          })}

          {/* Date Axis labels (first, middle, last) */}
          {svgPoints.length > 0 && (
            <>
              <text
                x={svgPoints[0].x}
                y={height - 10}
                fontSize="10"
                fill="hsl(215 15% 45%)"
              >
                {svgPoints[0].point.date.slice(5)}
              </text>
              {svgPoints.length > 2 && (
                <text
                  x={svgPoints[Math.floor(svgPoints.length / 2)].x}
                  y={height - 10}
                  fontSize="10"
                  textAnchor="middle"
                  fill="hsl(215 15% 45%)"
                >
                  {svgPoints[Math.floor(svgPoints.length / 2)].point.date.slice(5)}
                </text>
              )}
              <text
                x={svgPoints[svgPoints.length - 1].x}
                y={height - 10}
                fontSize="10"
                textAnchor="end"
                fill="hsl(215 15% 45%)"
              >
                {svgPoints[svgPoints.length - 1].point.date.slice(5)}
              </text>
            </>
          )}
        </svg>

        {/* Interactive Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-4 glass rounded-xl p-3 shadow-xl border border-white/10 text-xs animate-fade-in pointer-events-none"
            style={{ background: 'hsl(224 25% 12% / 0.95)' }}
          >
            <p className="font-bold text-gray-200 mb-1">📅 {hoveredPoint.date}</p>
            <div className="space-y-0.5">
              <p style={{ color: 'hsl(250 85% 65%)' }}>👁️ {t('Views')}: <b>{hoveredPoint.views}</b></p>
              <p style={{ color: 'hsl(175 80% 50%)' }}>🔁 {t('Forwards')}: <b>{hoveredPoint.forwards}</b></p>
              <p style={{ color: 'hsl(340 85% 60%)' }}>❤️ {t('Reactions')}: <b>{hoveredPoint.reactions}</b></p>
              <p className="text-gray-400">📝 {t('PostsCount')}: <b>{hoveredPoint.postsCount}</b></p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
