export default function Loading() {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto pt-16">
          <div className="bg-white border-b border-gray-100 p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-xs p-3 rounded-2xl ${i % 2 === 0 ? "bg-gray-200" : "bg-blue-200"}`}>
                  <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  