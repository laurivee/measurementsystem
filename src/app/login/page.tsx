'use client'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Measurement System</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <div className="mt-8 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow">
            <p className="text-center text-gray-500">
              Login form will be implemented here
            </p>
            <p className="mt-4 text-center text-sm text-gray-400">
              Using Supabase Auth
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

