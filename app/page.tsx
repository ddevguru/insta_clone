"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Navbar from "@/components/navbar"
import Stories from "@/components/stories"

const BASE_PROFILE_URL = "https://devloperwala.in/uploads/profiles/"
const BASE_REEL_URL = "https://devloperwala.in/uploads/reels/"

interface Post {
  id: number
  user_id: number
  username: string
  profile_photo: string | null
  content: string
  image_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  is_liked: boolean
  type: "post"
}

interface Reel {
  id: number
  user_id: number
  username: string
  profile_photo: string | null
  content: string
  video_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  is_liked: boolean
  type: "reel"
}

interface Comment {
  id: number
  user_id: number
  username: string
  comment: string
  created_at: string
}

type Content = Post | Reel

export default function Home() {
  const [content, setContent] = useState<Content[]>([])
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({})
  const [loading, setLoading] = useState(true)
  const [playingVideo, setPlayingVideo] = useState<number | null>(null)
  const [videoErrors, setVideoErrors] = useState<{ [key: number]: string }>({})
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({})
  const [activeCommentInput, setActiveCommentInput] = useState<number | null>(null)
  const [mutedVideos, setMutedVideos] = useState<{ [key: number]: boolean }>({})
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchContent()
  }, [router])

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem("token")
      const [postsResponse, reelsResponse] = await Promise.all([
        fetch("https://devloperwala.in/backend/api/posts/feed.php", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://devloperwala.in/backend/api/reels/list.php", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const postsData = await postsResponse.json()
      const reelsData = await reelsResponse.json()

      const posts: Post[] = postsData.success
        ? postsData.posts.map((post: any) => ({ ...post, type: "post" as const }))
        : []

      const reels: Reel[] = reelsData.success
        ? reelsData.reels.map((reel: any) => ({ ...reel, type: "reel" as const }))
        : []

      const combinedContent = [...posts, ...reels].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )

      setContent(combinedContent)

      // Initialize muted state for all reels
      const mutedState = reels.reduce((acc, reel) => ({ ...acc, [reel.id]: true }), {})
      setMutedVideos(mutedState)

      // Fetch comments for each content item
      const commentPromises = combinedContent.map((item) =>
        fetch(
          item.type === "post"
            ? `https://devloperwala.in/backend/api/posts/comments.php?post_id=${item.id}`
            : `https://devloperwala.in/backend/api/reels/comments.php?reel_id=${item.id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ).then((res) => res.json().then((data) => ({ key: `${item.type}-${item.id}`, comments: data.comments || [] }))),
      )

      const commentResults = await Promise.all(commentPromises)
      const commentsMap = commentResults.reduce((acc, { key, comments }) => ({ ...acc, [key]: comments }), {})
      setComments(commentsMap)
    } catch (error) {
      console.error("Error fetching content:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (id: number, type: "post" | "reel") => {
    try {
      const token = localStorage.getItem("token")
      const endpoint =
        type === "post"
          ? "https://devloperwala.in/backend/api/posts/like.php"
          : "https://devloperwala.in/backend/api/reels/like.php"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [`${type}_id`]: id }),
      })

      const data = await response.json()
      if (data.success) {
        fetchContent()
      }
    } catch (error) {
      console.error(`Error liking ${type}:`, error)
    }
  }

  const handleComment = async (id: number, type: "post" | "reel") => {
    const comment = commentInputs[id]
    if (!comment) return

    try {
      const token = localStorage.getItem("token")
      const endpoint =
        type === "post"
          ? "https://devloperwala.in/backend/api/posts/comment.php"
          : "https://devloperwala.in/backend/api/reels/comment.php"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [`${type}_id`]: id, comment }),
      })

      const data = await response.json()
      if (data.success) {
        setCommentInputs((prev) => ({ ...prev, [id]: "" }))
        setActiveCommentInput(null)
        fetchContent()
      }
    } catch (error) {
      console.error(`Error commenting on ${type}:`, error)
    }
  }

  const toggleVideo = (reelId: number) => {
    const video = document.getElementById(`video-${reelId}`) as HTMLVideoElement
    if (video) {
      if (playingVideo === reelId) {
        video.pause()
        setPlayingVideo(null)
      } else {
        content.forEach((item) => {
          if (item.type === "reel" && item.id !== reelId) {
            const otherVideo = document.getElementById(`video-${item.id}`) as HTMLVideoElement
            if (otherVideo) otherVideo.pause()
          }
        })
        video.play().catch((error) => {
          console.error(`Failed to play video for reel ${reelId}:`, error)
          setVideoErrors((prev) => ({
            ...prev,
            [reelId]: "Failed to play video. Please try again.",
          }))
        })
        setPlayingVideo(reelId)
      }
    }
  }

  const toggleMute = (reelId: number) => {
    const video = document.getElementById(`video-${reelId}`) as HTMLVideoElement
    if (video) {
      const newMutedState = !mutedVideos[reelId]
      video.muted = newMutedState
      setMutedVideos((prev) => ({ ...prev, [reelId]: newMutedState }))
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
        <div className="max-w-md mx-auto pt-20 px-4">
          {/* Loading Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-0 shadow-sm rounded-2xl">
                <CardContent className="p-0">
                  <div className="flex items-center space-x-3 p-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="aspect-square bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="flex space-x-4">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-md mx-auto pt-16 px-2 sm:px-4 pb-20">
        <div className="mb-6">
          <Stories />
        </div>

        <div className="space-y-6">
          {content.map((item) => (
            <Card
              key={`${item.type}-${item.id}`}
              className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden rounded-2xl ${
                item.type === "reel" ? "bg-gray-900" : "bg-white"
              }`}
            >
              <CardContent className="p-0">
                {/* Header */}
                <div className={`flex items-center justify-between p-4 ${item.type === "reel" ? "bg-black/20" : ""}`}>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10 ring-2 ring-gray-200 hover:ring-blue-300 transition-all duration-200">
                        <AvatarImage
                          src={
                            item.profile_photo && !item.profile_photo.startsWith("http")
                              ? `${BASE_PROFILE_URL}${item.profile_photo.replace(/^\/*uploads\/profiles\//, "")}`
                              : item.profile_photo || "/placeholder.svg"
                          }
                          onError={(e) => {
                            console.error(`Failed to load profile photo: ${item.profile_photo}`)
                            e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                          }}
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                          {item.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${item.type === "reel" ? "text-white" : "text-gray-900"}`}>
                        {item.username}
                      </p>
                      <p className={`text-xs ${item.type === "reel" ? "text-gray-300" : "text-gray-500"}`}>
                        {formatTimeAgo(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200 ${
                      item.type === "reel" ? "text-white hover:bg-white/10" : ""
                    }`}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>

                {/* Media */}
                {item.type === "post" && item.image_url && (
                  <div className="aspect-square relative group">
                    <img
                      src={
                        item.image_url.startsWith("http")
                          ? item.image_url
                          : `https://devloperwala.in/backend/${item.image_url}`
                      }
                      alt="Post"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        console.error(`Failed to load image: ${item.image_url}`)
                        e.currentTarget.src = "/placeholder.svg?height=400&width=400"
                      }}
                    />
                  </div>
                )}

                {item.type === "reel" && (
                  <div className="relative aspect-square bg-black group">
                    {videoErrors[item.id] ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white text-sm p-4 text-center">
                        <div>
                          <div className="text-2xl mb-2">⚠️</div>
                          {videoErrors[item.id]}
                        </div>
                      </div>
                    ) : (
                      <>
                        <video
                          id={`video-${item.id}`}
                          className="w-full h-full object-cover cursor-pointer"
                          loop
                          muted={mutedVideos[item.id]}
                          playsInline
                          onClick={() => toggleVideo(item.id)}
                          onError={(e) => {
                            console.error(`Failed to load video: ${item.video_url}`, e)
                            setVideoErrors((prev) => ({
                              ...prev,
                              [item.id]: "Failed to load video. Please try again.",
                            }))
                          }}
                        >
                          <source
                            src={
                              item.video_url && !item.video_url.startsWith("http")
                                ? `${BASE_REEL_URL}${item.video_url.replace(/^\/*uploads\/reels\//, "")}`
                                : item.video_url || "/placeholder-video.mp4"
                            }
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>

                        {/* Video Controls */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="lg"
                            className="text-white bg-black/30 hover:bg-black/50 rounded-full w-16 h-16 backdrop-blur-sm"
                            onClick={() => toggleVideo(item.id)}
                          >
                            {playingVideo === item.id ? (
                              <Pause className="h-8 w-8" />
                            ) : (
                              <Play className="h-8 w-8 ml-1" />
                            )}
                          </Button>
                        </div>

                        {/* Mute Button */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white bg-black/30 hover:bg-black/50 rounded-full w-10 h-10 backdrop-blur-sm"
                            onClick={() => toggleMute(item.id)}
                          >
                            {mutedVideos[item.id] ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Actions and Content */}
                <div className={`p-4 space-y-3 ${item.type === "reel" ? "bg-black/80 text-white" : ""}`}>
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(item.id, item.type)}
                        className="p-0 hover:bg-transparent group"
                      >
                        <Heart
                          className={`h-6 w-6 transition-all duration-200 ${
                            item.is_liked
                              ? "fill-red-500 text-red-500 scale-110"
                              : item.type === "reel"
                                ? "text-white group-hover:text-red-400"
                                : "text-gray-700 group-hover:text-red-400"
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveCommentInput(activeCommentInput === item.id ? null : item.id)}
                        className="p-0 hover:bg-transparent group"
                      >
                        <MessageCircle
                          className={`h-6 w-6 transition-colors duration-200 ${
                            item.type === "reel"
                              ? "text-white group-hover:text-blue-400"
                              : "text-gray-700 group-hover:text-blue-400"
                          }`}
                        />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent group">
                        <Send
                          className={`h-6 w-6 transition-colors duration-200 ${
                            item.type === "reel"
                              ? "text-white group-hover:text-green-400"
                              : "text-gray-700 group-hover:text-green-400"
                          }`}
                        />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent group">
                      <Bookmark
                        className={`h-6 w-6 transition-colors duration-200 ${
                          item.type === "reel"
                            ? "text-white group-hover:text-yellow-400"
                            : "text-gray-700 group-hover:text-yellow-400"
                        }`}
                      />
                    </Button>
                  </div>

                  {/* Likes Count */}
                  <div className="font-semibold text-sm">
                    {item.likes_count.toLocaleString()} {item.likes_count === 1 ? "like" : "likes"}
                  </div>

                  {/* Caption */}
                  {item.content && (
                    <div className="text-sm">
                      <span className="font-semibold mr-2">{item.username}</span>
                      <span className={item.type === "reel" ? "text-gray-200" : "text-gray-800"}>{item.content}</span>
                    </div>
                  )}

                  {/* Comments Preview */}
                  {comments[`${item.type}-${item.id}`]?.length > 0 && (
                    <div className="space-y-1">
                      {item.comments_count > 2 && (
                        <button
                          className={`text-sm ${
                            item.type === "reel" ? "text-gray-300" : "text-gray-500"
                          } hover:underline font-medium`}
                        >
                          View all {item.comments_count} comments
                        </button>
                      )}
                      {comments[`${item.type}-${item.id}`].slice(0, 2).map((comment) => (
                        <div key={comment.id} className="text-sm">
                          <span className="font-semibold mr-2">{comment.username}</span>
                          <span className={item.type === "reel" ? "text-gray-200" : "text-gray-800"}>
                            {comment.comment}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Input */}
                  {activeCommentInput === item.id && (
                    <>
                      <Separator className={item.type === "reel" ? "bg-gray-600" : "bg-gray-200"} />
                      <div className="flex items-center space-x-3">
                        <Input
                          placeholder="Add a comment..."
                          value={commentInputs[item.id] || ""}
                          onChange={(e) => setCommentInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          className={`flex-1 text-sm border-0 bg-transparent focus:ring-0 rounded-lg ${
                            item.type === "reel"
                              ? "text-white placeholder-gray-400 focus:bg-white/10"
                              : "focus:bg-gray-50"
                          }`}
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleComment(item.id, item.type)}
                          disabled={!commentInputs[item.id]?.trim()}
                          className={`text-sm font-semibold px-3 py-1 rounded-lg transition-colors duration-200 ${
                            commentInputs[item.id]?.trim()
                              ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              : item.type === "reel"
                                ? "text-gray-500"
                                : "text-gray-400"
                          }`}
                        >
                          Post
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Placeholder */}
        {content.length > 0 && (
          <div className="text-center py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-gray-500 text-sm font-medium">You're all caught up! 🎉</p>
              <p className="text-gray-400 text-xs mt-1">Check back later for more updates</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
