'use client'

import { useState } from 'react'
import type { StageKey } from '@/types/database'

interface StageCardProps {
  stage: StageKey
  stageLabel: string
  isStarted: boolean
  isCompleted: boolean
  onStart: () => void
  onComplete: () => void
}

const stageLabels: Record<StageKey, string> = {
  order_info: 'Order Info',
  bead_prep: 'Bead Prep',
  insert_beads: 'Insert Beads',
  pack: 'Pack',
  ship: 'Ship',
}

export function StageCard({
  stage,
  stageLabel,
  isStarted,
  isCompleted,
  onStart,
  onComplete,
}: StageCardProps) {
  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-100 border-green-500'
    if (isStarted) return 'bg-yellow-100 border-yellow-500'
    return 'bg-gray-100 border-gray-300'
  }

  const getStatusText = () => {
    if (isCompleted) return 'Completed'
    if (isStarted) return 'In Progress'
    return 'Not Started'
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${getStatusColor()}`}>
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{stageLabel}</h3>
        <p className="text-sm text-gray-600">{getStatusText()}</p>
      </div>

      <div className="flex gap-2">
        {!isStarted && (
          <button
            onClick={onStart}
            className="min-h-[48px] flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            Start
          </button>
        )}

        {isStarted && !isCompleted && (
          <button
            onClick={onComplete}
            className="min-h-[48px] flex-1 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 active:bg-green-800"
          >
            Complete
          </button>
        )}
      </div>
    </div>
  )
}

