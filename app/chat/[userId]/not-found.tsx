import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-md">
        <div className="text-gray-400 mb-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Chat Not Found</h2>
        <p className="text-gray-600 mb-6">The conversation you're looking for doesn't exist or has been removed.</p>
        <div className="space-y-2">
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link href="/chat">Back to Messages</Link>
          </Button>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
