'use client'

import { useState } from 'react'
import type { BlockerCode } from '@/types/database'

interface CompleteSheetProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    qty_good: number
    qty_defect: number
    defect_code?: string
    rework: boolean
  }) => void
}

const defectCodes = ['MISS_BEAD', 'THREAD_BREAK', 'COLOR_MISMATCH'] as const

export function CompleteSheet({ isOpen, onClose, onSubmit }: CompleteSheetProps) {
  const [qtyGood, setQtyGood] = useState(1)
  const [qtyDefect, setQtyDefect] = useState(0)
  const [defectCode, setDefectCode] = useState<string>('')
  const [rework, setRework] = useState(false)

  if (!isOpen) return null

  const handleSubmit = () => {
    onSubmit({
      qty_good: qtyGood,
      qty_defect: qtyDefect,
      defect_code: defectCode || undefined,
      rework,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-lg bg-white p-6 sm:max-w-md sm:rounded-lg">
        <h2 className="mb-4 text-xl font-semibold">Complete Stage</h2>

        <div className="space-y-4">
          {/* Quantity Good */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity Good</label>
            <input
              type="number"
              min="0"
              value={qtyGood}
              onChange={(e) => setQtyGood(parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          {/* Quantity Defect */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity Defect</label>
            <input
              type="number"
              min="0"
              value={qtyDefect}
              onChange={(e) => setQtyDefect(parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          {/* Defect Code */}
          {qtyDefect > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Defect Code</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {defectCodes.map((code) => (
                  <button
                    key={code}
                    onClick={() => setDefectCode(code)}
                    className={`rounded-full px-4 py-2 text-sm ${
                      defectCode === code
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {code.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rework Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rework"
              checked={rework}
              onChange={(e) => setRework(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="rework" className="text-sm font-medium text-gray-700">
              Rework
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="min-h-[48px] flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

