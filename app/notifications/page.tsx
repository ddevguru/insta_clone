"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, UserPlus, Gift } from "lucide-react"
import Navbar from "@/components/navbar"

interface Notification {
  id: number
  type: "like" | "comment" | "follow" | "follow_request" | "gift"
  user_id: number
  username: string
  profile_photo: string
  post_id?: number
  post_image?: string
  gift_name?: string
  message: string
  is_read: boolean
  created_at: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("No token found, redirecting to login")
      router.push("/login")
      return
    }
    fetchNotifications()
  }, [router])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token")
      console.log("Token:", token) // Debug token
      const response = await fetch("https://devloperwala.in/backend/api/notifications/list.php", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("Fetch failed with status:", response.status, response.statusText)
        const text = await response.text()
        console.error("Response text:", text)
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setNotifications(data.notifications)
      } else {
        console.error("Fetch notifications failed:", data.message)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem("token")
      await fetch("https://devloperwala.in/backend/api/notifications/mark-read.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notification_id: notificationId }),
      })
      fetchNotifications()
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleFollowRequest = async (userId: number, action: "accept" | "decline") => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/user/handle-follow-request.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, action }),
      })

      const data = await response.json()
      if (data.success) {
        fetchNotifications()
      } else {
        console.error(`Failed to ${action} follow request:`, data.message)
      }
    } catch (error) {
      console.error(`Error handling follow request:`, error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />
      case "comment":
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case "follow":
      case "follow_request":
        return <UserPlus className="h-5 w-5 text-green-500" />
      case "gift":
        return <Gift className="h-5 w-5 text-purple-500" />
      default:
        return <Heart className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    return `${Math.floor(diffInSeconds / 604800)}w`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-md mx-auto pt-16">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-black">Notifications</h1>
          </div>
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-md mx-auto pt-16 pb-20">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-black">Notifications</h1>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                When someone likes or comments on your posts, you'll see it here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer ${
                  !notification.is_read ? "bg-blue-50" : ""
                }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                {/* Profile Avatar */}
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={notification.profile_photo || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gray-200 text-black font-semibold">
                      {notification.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Notification Type Icon */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black">
                        <span className="font-semibold">{notification.username}</span>{" "}
                        <span className="text-gray-600">{notification.message}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.created_at)}</p>

                      {/* Follow Request Actions */}
                      {notification.type === "follow_request" && (
                        <div className="flex space-x-2 mt-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFollowRequest(notification.user_id, "accept")
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white h-8 px-4 text-xs"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFollowRequest(notification.user_id, "decline")
                            }}
                            className="border-gray-300 text-black hover:bg-gray-50 h-8 px-4 text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Post Thumbnail */}
                    {notification.post_image && (
                      <div className="ml-3 flex-shrink-0">
                        <img
                          src={notification.post_image || "/placeholder.svg"}
                          alt="Post"
                          className="w-10 h-10 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Unread Indicator */}
                {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
