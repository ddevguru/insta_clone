"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, MessageCircle, Play } from "lucide-react"
import Navbar from "@/components/navbar"

interface Post {
  id: number
  user_id: number
  username: string
  image_url: string
  likes_count: number
  comments_count: number
  type?: "post" | "reel"
}

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchExplorePosts()
  }, [])

  const fetchExplorePosts = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/posts/explore.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error("Error fetching explore posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostClick = (post: Post) => {
    router.push(`/post/${post.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-20 px-4">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-20 px-4 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore</h1>
          <p className="text-gray-600">Discover amazing content from the community</p>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post, index) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post)}
                className={`relative group cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] ${
                  index % 7 === 0 ? "md:col-span-2 md:row-span-2" : "aspect-square"
                }`}
              >
                <img
                  src={
                    post.image_url
                      ? `https://devloperwala.in/backend${post.image_url}`
                      : "/placeholder.svg?height=300&width=300"
                  }
                  alt="Post"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=300&width=300"
                  }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex items-center space-x-6 text-white">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-6 w-6 fill-white" />
                      <span className="font-semibold text-lg">{post.likes_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-6 w-6 fill-white" />
                      <span className="font-semibold text-lg">{post.comments_count.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Post Type Indicator */}
                {post.type === "reel" && (
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2">
                    <Play className="h-4 w-4 text-white fill-white" />
                  </div>
                )}

                {/* User Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white font-semibold text-sm">@{post.username}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Posts to Explore</h2>
            <p className="text-gray-600 mb-6">Check back later for new content to discover</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                💡 <strong>Tip:</strong> Follow more users to see more content in your explore feed
              </p>
            </div>
          </div>
        )}

        {/* Load More Placeholder */}
        {posts.length > 0 && (
          <div className="text-center mt-12">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-gray-500 text-sm font-medium">You've seen it all! 🎉</p>
              <p className="text-gray-400 text-xs mt-1">Check back later for more amazing content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
