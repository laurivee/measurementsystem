'use client'

import { useState } from 'react'
import type { Unit } from '@/types/database'

interface UnitListProps {
  units: Unit[]
  currentUnitId?: string
  onSelectUnit: (unit: Unit) => void
  filters?: {
    all?: boolean
    inProgress?: boolean
    mine?: boolean
    waitingAtStage?: string
  }
}

export function UnitList({ units, currentUnitId, onSelectUnit, filters }: UnitListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUnits = units.filter((unit) => {
    if (searchQuery) {
      return unit.unit_number.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search units..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button className="rounded-full bg-blue-100 px-4 py-1 text-sm text-blue-700">
          All
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-700">
          In Progress
        </button>
        <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-700">
          Mine
        </button>
      </div>

      {/* Current Unit (pinned) */}
      {currentUnitId && (
        <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
          <div className="text-sm font-semibold text-blue-700">Current Unit</div>
          {units
            .find((u) => u.id === currentUnitId)
            ?.unit_number && (
              <div className="mt-1">{units.find((u) => u.id === currentUnitId)?.unit_number}</div>
            )}
        </div>
      )}

      {/* Unit List */}
      <div className="space-y-2">
        {filteredUnits.map((unit) => (
          <button
            key={unit.id}
            onClick={() => onSelectUnit(unit)}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              currentUnitId === unit.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">{unit.unit_number}</div>
            <div className="mt-1 text-sm text-gray-600">
              Created: {new Date(unit.created_at).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

