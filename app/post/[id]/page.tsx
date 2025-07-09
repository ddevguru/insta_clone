"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react"
import Navbar from "@/components/navbar"

interface Post {
  id: number
  user_id: number
  username: string
  profile_photo: string
  content: string
  image_url: string | null
  video_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  is_liked: boolean
  type: "post" | "reel"
}

interface Comment {
  id: number
  user_id: number
  username: string
  profile_photo: string
  comment: string
  created_at: string
  likes_count: number
  is_liked: boolean
}

export default function PostDetailPage() {
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchPostData()
  }, [postId])

  const fetchPostData = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`https://devloperwala.in/backend/api/posts/detail.php?id=${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setPost(data.post)
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Error fetching post data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!post) return

    try {
      const token = localStorage.getItem("token")
      const endpoint =
        post.type === "post"
          ? "https://devloperwala.in/backend/api/posts/like.php"
          : "https://devloperwala.in/backend/api/reels/like.php"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [`${post.type}_id`]: post.id }),
      })
      const data = await response.json()
      if (data.success) {
        fetchPostData()
      }
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim() || !post) return

    try {
      const token = localStorage.getItem("token")
      const endpoint =
        post.type === "post"
          ? "https://devloperwala.in/backend/api/posts/comment.php"
          : "https://devloperwala.in/backend/api/reels/comment.php"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [`${post.type}_id`]: post.id, comment: newComment }),
      })
      const data = await response.json()
      if (data.success) {
        setNewComment("")
        fetchPostData()
      }
    } catch (error) {
      console.error("Error commenting:", error)
    }
  }

  const toggleVideo = () => {
    const video = document.getElementById(`video-${post?.id}`) as HTMLVideoElement
    if (video) {
      if (isPlaying) {
        video.pause()
        setIsPlaying(false)
      } else {
        video.play()
        setIsPlaying(true)
      }
    }
  }

  const toggleMute = () => {
    const video = document.getElementById(`video-${post?.id}`) as HTMLVideoElement
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
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
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-20 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-20 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Post Not Found</h2>
            <p className="text-gray-600 mb-6">This post may have been deleted or doesn't exist.</p>
            <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-20 px-4 pb-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-xl hover:bg-gray-100 mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Post</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Media */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {post.type === "post" && post.image_url && (
                <div className="aspect-square relative">
                  <img
                    src={`https://devloperwala.in/backend/${post.image_url}`}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {post.type === "reel" && post.video_url && (
                <div className="aspect-square relative bg-black group">
                  <video
                    id={`video-${post.id}`}
                    className="w-full h-full object-cover cursor-pointer"
                    loop
                    muted={isMuted}
                    playsInline
                    onClick={toggleVideo}
                  >
                    <source src={`https://devloperwala.in/backend/${post.video_url}`} type="video/mp4" />
                  </video>

                  {/* Video Controls */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="text-white bg-black/30 hover:bg-black/50 rounded-full w-16 h-16"
                      onClick={toggleVideo}
                    >
                      {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                    </Button>
                  </div>

                  {/* Mute Button */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white bg-black/30 hover:bg-black/50 rounded-full w-10 h-10"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Post Info & Comments */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Post Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 ring-2 ring-gray-200">
                      <AvatarImage src={post.profile_photo || "/placeholder.svg"} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {post.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{post.username}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-xl hover:bg-gray-100">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={handleLike} className="p-0 hover:bg-transparent">
                      <Heart
                        className={`h-6 w-6 transition-all duration-200 ${
                          post.is_liked ? "fill-red-500 text-red-500 scale-110" : "text-gray-700 hover:text-red-400"
                        }`}
                      />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                      <MessageCircle className="h-6 w-6 text-gray-700 hover:text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                      <Send className="h-6 w-6 text-gray-700 hover:text-green-400" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                    <Bookmark className="h-6 w-6 text-gray-700 hover:text-yellow-400" />
                  </Button>
                </div>

                <div className="font-semibold text-sm mb-2">
                  {post.likes_count.toLocaleString()} {post.likes_count === 1 ? "like" : "likes"}
                </div>

                {post.content && (
                  <div className="text-sm mb-2">
                    <span className="font-semibold mr-2">{post.username}</span>
                    <span className="text-gray-800">{post.content}</span>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="flex-1 max-h-96 overflow-y-auto">
                {comments.length > 0 ? (
                  <div className="p-4 space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8 ring-2 ring-gray-200">
                          <AvatarImage src={comment.profile_photo || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xs">
                            {comment.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-semibold mr-2">{comment.username}</span>
                            <span className="text-gray-800">{comment.comment}</span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                            <button className="text-xs text-gray-500 hover:text-gray-700 font-medium">Reply</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-sm">No comments yet</p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex space-x-3">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleComment()}
                    className="flex-1 border-0 bg-transparent focus:ring-0 text-sm"
                  />
                  <Button
                    onClick={handleComment}
                    disabled={!newComment.trim()}
                    variant="ghost"
                    size="sm"
                    className={`text-sm font-semibold px-0 ${
                      newComment.trim() ? "text-blue-600 hover:text-blue-700" : "text-gray-400"
                    }`}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
