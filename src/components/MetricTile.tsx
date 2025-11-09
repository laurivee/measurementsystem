'use client'

interface MetricTileProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function MetricTile({ title, value, subtitle, trend }: MetricTileProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-gray-600">{title}</div>
      <div className={`mt-2 text-3xl font-bold ${getTrendColor()}`}>{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
    </div>
  )
}

