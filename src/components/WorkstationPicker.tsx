'use client'

import { useState } from 'react'
import type { Workstation } from '@/types/database'

interface WorkstationPickerProps {
  workstations: Workstation[]
  onSelect: (workstation: Workstation) => void
  selectedId?: string
}

export function WorkstationPicker({
  workstations,
  onSelect,
  selectedId,
}: WorkstationPickerProps) {
  return (
    <div className="space-y-2">
      {workstations.map((workstation) => (
        <button
          key={workstation.id}
          onClick={() => onSelect(workstation)}
          className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
            selectedId === workstation.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="font-semibold">{workstation.name}</div>
          {workstation.description && (
            <div className="mt-1 text-sm text-gray-600">{workstation.description}</div>
          )}
        </button>
      ))}
    </div>
  )
}

