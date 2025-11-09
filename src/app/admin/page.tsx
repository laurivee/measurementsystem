'use client'

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold">Admin</h1>
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Orders</h2>
            <p className="text-gray-600">Order management will be implemented here</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Units</h2>
            <p className="text-gray-600">Unit management will be implemented here</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Batches</h2>
            <p className="text-gray-600">Batch management will be implemented here</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Workstations</h2>
            <p className="text-gray-600">Workstation management will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

