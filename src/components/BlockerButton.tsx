'use client'

import { useState } from 'react'
import type { BlockerCode, StageKey } from '@/types/database'

interface BlockerButtonProps {
  unitId: string
  stage: StageKey
  onRecord: (data: { blocker_code: BlockerCode; blocker_minutes: number }) => void
}

const blockerCodes: { code: BlockerCode; label: string }[] = [
  { code: 'MATERIAL_SHORTAGE', label: 'Material Shortage' },
  { code: 'EQUIPMENT_FAILURE', label: 'Equipment Failure' },
  { code: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { code: 'WAITING_FOR_PREVIOUS_STAGE', label: 'Waiting for Previous Stage' },
  { code: 'OTHER', label: 'Other' },
]

const quickDurations = [1, 5, 10, 30]

export function BlockerButton({ unitId, stage, onRecord }: BlockerButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState<BlockerCode | null>(null)
  const [minutes, setMinutes] = useState<number>(5)

  const handleSubmit = () => {
    if (selectedCode) {
      onRecord({ blocker_code: selectedCode, blocker_minutes: minutes })
      setIsOpen(false)
      setSelectedCode(null)
      setMinutes(5)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="min-h-[48px] rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 active:bg-red-800"
      >
        Blocker
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50 sm:items-center sm:justify-center">
          <div className="w-full rounded-t-lg bg-white p-6 sm:max-w-md sm:rounded-lg">
            <h2 className="mb-4 text-xl font-semibold">Record Blocker</h2>

            <div className="space-y-4">
              {/* Blocker Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <div className="mt-2 space-y-2">
                  {blockerCodes.map(({ code, label }) => (
                    <button
                      key={code}
                      onClick={() => setSelectedCode(code)}
                      className={`w-full rounded-lg border-2 p-3 text-left ${
                        selectedCode === code
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quickDurations.map((min) => (
                    <button
                      key={min}
                      onClick={() => setMinutes(min)}
                      className={`rounded-full px-4 py-2 text-sm ${
                        minutes === min
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="Custom minutes"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedCode}
                  className="min-h-[48px] flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:bg-gray-300"
                >
                  Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

