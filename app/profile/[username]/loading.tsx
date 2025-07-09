export default function Loading() {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto pt-20 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  