'use client'

import type { Workstation, StageKey, Unit } from '@/types/database'

interface TopBarContextProps {
  workstation?: Workstation
  stage?: StageKey
  unit?: Unit
}

const stageLabels: Record<StageKey, string> = {
  order_info: 'Order Info',
  bead_prep: 'Bead Prep',
  insert_beads: 'Insert Beads',
  pack: 'Pack',
  ship: 'Ship',
}

export function TopBarContext({ workstation, stage, unit }: TopBarContextProps) {
  const parts = [
    workstation?.name,
    stage ? stageLabels[stage] : undefined,
    unit?.unit_number,
  ].filter(Boolean)

  if (parts.length === 0) return null

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-2">
      <div className="mx-auto flex max-w-6xl items-center gap-2 text-sm text-gray-600">
        {parts.map((part, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <span>•</span>}
            <span>{part}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

