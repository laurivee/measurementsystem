'use client'

import type { StageKey } from '@/types/database'

interface WipData {
  stage: StageKey
  count: number
  medianCycleTime?: string
}

interface WipBoardProps {
  wipData: WipData[]
}

const stageLabels: Record<StageKey, string> = {
  order_info: 'Order Info',
  bead_prep: 'Bead Prep',
  insert_beads: 'Insert Beads',
  pack: 'Pack',
  ship: 'Ship',
}

export function WipBoard({ wipData }: WipBoardProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Work In Progress</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {wipData.map(({ stage, count, medianCycleTime }) => (
          <div
            key={stage}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="text-sm font-medium text-gray-600">{stageLabels[stage]}</div>
            <div className="mt-2 text-2xl font-bold">{count}</div>
            {medianCycleTime && (
              <div className="mt-1 text-xs text-gray-500">Median: {medianCycleTime}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

