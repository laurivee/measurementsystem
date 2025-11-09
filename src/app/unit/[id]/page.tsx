'use client'

export default function UnitDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Unit {params.id}</h1>
        <div className="space-y-4">
          <p className="text-gray-600">
            Stage cards with Start/Complete buttons will be implemented here
          </p>
        </div>
      </div>
    </div>
  )
}

