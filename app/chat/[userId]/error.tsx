"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Chat page error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-md">
        <div className="text-gray-400 mb-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">There was an error loading the chat.</p>
        <div className="space-y-2">
          <Button onClick={reset} className="w-full bg-blue-600 hover:bg-blue-700">
            Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/chat")} className="w-full">
            Back to Messages
          </Button>
        </div>
      </div>
    </div>
  )
}
