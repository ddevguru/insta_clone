"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageCircle, Plus } from 'lucide-react'
import Navbar from "@/components/navbar"

interface ChatUser {
  id: number
  username: string
  full_name: string
  profile_photo: string
  last_message: string
  last_message_time: string
  unread_count: number
  is_online: boolean
}

export default function ChatListPage() {
  const [chats, setChats] = useState<ChatUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchChats()
  }, [router])

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("token")

      // Enhanced mock chat data with realistic usernames
      // const mockChats: ChatUser[] = [
      //   {
      //     id: 1,
      //     username: "john_doe",
      //     full_name: "John Doe",
      //     profile_photo: "",
      //     last_message: "Hey! How are you doing?",
      //     last_message_time: new Date(Date.now() - 3600000).toISOString(),
      //     unread_count: 2,
      //     is_online: true,
      //   },
      //   {
      //     id: 2,
      //     username: "jane_smith",
      //     full_name: "Jane Smith",
      //     profile_photo: "",
      //     last_message: "Thanks for the help earlier!",
      //     last_message_time: new Date(Date.now() - 7200000).toISOString(),
      //     unread_count: 0,
      //     is_online: false,
      //   },
      //   {
      //     id: 3,
      //     username: "mike_wilson",
      //     full_name: "Mike Wilson",
      //     profile_photo: "",
      //     last_message: "See you tomorrow!",
      //     last_message_time: new Date(Date.now() - 86400000).toISOString(),
      //     unread_count: 1,
      //     is_online: true,
      //   },
      //   {
      //     id: 4,
      //     username: "sarah_jones",
      //     full_name: "Sarah Jones",
      //     profile_photo: "",
      //     last_message: "That sounds great!",
      //     last_message_time: new Date(Date.now() - 172800000).toISOString(),
      //     unread_count: 0,
      //     is_online: false,
      //   },
      //   {
      //     id: 5,
      //     username: "alex_brown",
      //     full_name: "Alex Brown",
      //     profile_photo: "",
      //     last_message: "Let's catch up soon",
      //     last_message_time: new Date(Date.now() - 259200000).toISOString(),
      //     unread_count: 3,
      //     is_online: true,
      //   },
      // ]

      // Try backend first, but don't let CORS errors break the app
      try {
        const response = await fetch("https://devloperwala.in/backend/api/chat/list.php", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json()
            if (data.success && data.chats) {
              setChats(data.chats)
              return
            }
          }
        }
      } catch (error) {
        console.log("Backend API not available, using mock data")
      }

      // Always use mock data for now
      // setChats(mockChats)
    } catch (error) {
      console.error("Error fetching chats:", error)
      // Set empty array on error
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  const handleChatClick = (userId: number) => {
    console.log("Navigating to chat with userId:", userId)
    router.push(`/chat/${userId}`)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`
    return date.toLocaleDateString()
  }

  const filteredChats = chats.filter(
    (chat) =>
      chat.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-20 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-20 px-4 pb-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <Button
              onClick={() => router.push("/search")}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredChats.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  className="flex items-center space-x-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 group"
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12 ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all duration-200">
                      <AvatarImage src={chat.profile_photo || "/placeholder.svg"} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {chat.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {chat.is_online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                        {chat.username}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatTime(chat.last_message_time)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">{chat.last_message || "No messages yet"}</p>
                      {chat.unread_count > 0 && (
                        <div className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                          {chat.unread_count > 9 ? "9+" : chat.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              {searchQuery ? (
                <>
                  <div className="text-gray-400 mb-4">
                    <Search className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
                  <p className="text-gray-600">Try searching with a different keyword</p>
                </>
              ) : (
                <>
                  <div className="text-gray-400 mb-4">
                    <MessageCircle className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-600 mb-6">Start a conversation with someone!</p>
                  <Button onClick={() => router.push("/search")} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Chat
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
