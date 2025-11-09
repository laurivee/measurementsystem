'use client'

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-2 text-xl font-semibold">WIP Board</h2>
            <p className="text-gray-600">
              WipBoard component will be implemented here
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-2 text-xl font-semibold">FPY</h2>
            <p className="text-gray-600">
              MetricTile component will be implemented here
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-2 text-xl font-semibold">Throughput</h2>
            <p className="text-gray-600">
              MetricTile component will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

