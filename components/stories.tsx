"use client"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Story {
  id: number
  user_id: number
  username: string
  profile_photo: string
  has_story: boolean
}

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([])

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/stories/list.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setStories(data.stories)
      }
    } catch (error) {
      console.error("Error fetching stories:", error)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {/* Add Story Button */}
        <div className="flex flex-col items-center space-y-2 flex-shrink-0">
          <div className="relative group">
            <Avatar className="w-16 h-16 ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all duration-200">
              <AvatarImage
                src={
                  JSON.parse(localStorage.getItem("user") || "{}").profile_photo
                    ? `https://devloperwala.in/backend${JSON.parse(localStorage.getItem("user") || "{}").profile_photo}`
                    : "/placeholder.svg"
                }
              />
              <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                {JSON.parse(localStorage.getItem("user") || "{}").username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              className="absolute -bottom-1 -right-1 rounded-full w-6 h-6 p-0 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="h-3 w-3 text-white" />
            </Button>
          </div>
          <span className="text-xs text-gray-600 font-medium">Your story</span>
        </div>

        {/* Stories */}
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center space-y-2 flex-shrink-0 group cursor-pointer">
            <div
              className={`p-0.5 rounded-full transition-all duration-200 ${
                story.has_story ? "bg-blue-600 shadow-md group-hover:shadow-lg" : "bg-gray-200"
              }`}
            >
              <Avatar className="w-16 h-16 border-2 border-white">
                <AvatarImage
                  src={
                    story.profile_photo
                      ? `https://devloperwala.in/backend${story.profile_photo}`
                      : "/placeholder.svg"
                  }
                />
                <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                  {story.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs text-gray-600 font-medium truncate w-16 text-center group-hover:text-gray-800 transition-colors duration-200">
              {story.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
