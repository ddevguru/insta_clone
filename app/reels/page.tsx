"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Volume2, VolumeX } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import Navbar from "@/components/navbar"

const BASE_PROFILE_URL = "https://devloperwala.in/uploads/profiles/"
const BASE_REEL_URL = "https://devloperwala.in/uploads/reels/"

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
}

export default function Reels() {
  const [reels, setReels] = useState<Reel[]>([])
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
    fetchReels()
  }, [router])

  const fetchReels = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/reels/list.php", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        console.log("Fetched reels:", data.reels)
        setReels(data.reels)
        // Initialize muted state for all reels
        const mutedState = data.reels.reduce((acc: any, reel: Reel) => ({ ...acc, [reel.id]: true }), {})
        setMutedVideos(mutedState)
      } else {
        console.error("Fetch reels failed:", data.message)
      }
    } catch (error) {
      console.error("Error fetching reels:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (reelId: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/reels/like.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reel_id: reelId }),
      })
      const data = await response.json()
      if (data.success) {
        fetchReels()
      }
    } catch (error) {
      console.error("Error liking reel:", error)
    }
  }

  const handleComment = async (reelId: number) => {
    const comment = commentInputs[reelId]
    if (!comment) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/reels/comment.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reel_id: reelId, comment }),
      })
      const data = await response.json()
      if (data.success) {
        setCommentInputs((prev) => ({ ...prev, [reelId]: "" }))
        setActiveCommentInput(null)
        fetchReels()
      }
    } catch (error) {
      console.error("Error commenting on reel:", error)
    }
  }

  const toggleVideo = (reelId: number) => {
    const video = document.getElementById(`video-${reelId}`) as HTMLVideoElement
    if (video) {
      if (playingVideo === reelId) {
        video.pause()
        setPlayingVideo(null)
      } else {
        reels.forEach((reel) => {
          if (reel.id !== reelId) {
            const otherVideo = document.getElementById(`video-${reel.id}`) as HTMLVideoElement
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
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-md mx-auto pt-16">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[9/16] bg-gray-800 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-md mx-auto pt-16 pb-20">
        <div className="space-y-1">
          {reels.map((reel) => (
            <div key={reel.id} className="relative">
              <div className="relative aspect-[9/16] bg-black overflow-hidden">
                {videoErrors[reel.id] ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white text-sm p-4 text-center">
                    <div>
                      <div className="text-2xl mb-2">⚠️</div>
                      {videoErrors[reel.id]}
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      id={`video-${reel.id}`}
                      className="w-full h-full object-cover cursor-pointer"
                      loop
                      muted={mutedVideos[reel.id]}
                      playsInline
                      onClick={() => toggleVideo(reel.id)}
                      onError={(e) => {
                        console.error(`Failed to load video: ${reel.video_url}`, e)
                        setVideoErrors((prev) => ({
                          ...prev,
                          [reel.id]: "Failed to load video. Please try again.",
                        }))
                      }}
                    >
                      <source
                        src={
                          reel.video_url && !reel.video_url.startsWith("http")
                            ? `${BASE_REEL_URL}${reel.video_url.replace(/^\/*uploads\/reels\//, "")}`
                            : reel.video_url || "/placeholder-video.mp4"
                        }
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>

                    {/* Play Button Overlay */}
                    {playingVideo !== reel.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="lg"
                          className="text-white bg-black/30 hover:bg-black/50 rounded-full w-16 h-16 backdrop-blur-sm"
                          onClick={() => toggleVideo(reel.id)}
                        >
                          <Play className="h-8 w-8 ml-1" />
                        </Button>
                      </div>
                    )}

                    {/* User Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-16 p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="w-10 h-10 ring-2 ring-white ring-offset-2 ring-offset-black">
                          <AvatarImage
                            src={
                              reel.profile_photo && !reel.profile_photo.startsWith("http")
                                ? `${BASE_PROFILE_URL}${reel.profile_photo.replace(/^\/*uploads\/profiles\//, "")}`
                                : reel.profile_photo || "/placeholder.svg"
                            }
                            onError={(e) => {
                              console.error(`Failed to load profile photo: ${reel.profile_photo}`)
                              e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                            }}
                          />
                          <AvatarFallback className="bg-white text-black font-semibold">
                            {reel.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-white text-sm">{reel.username}</p>
                          <p className="text-gray-300 text-xs">{formatTimeAgo(reel.created_at)}</p>
                        </div>
                      </div>
                      {reel.content && <p className="text-white text-sm leading-relaxed mb-2">{reel.content}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute bottom-4 right-4 flex flex-col space-y-6">
                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(reel.id)}
                          className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0 mb-1"
                        >
                          <Heart className={`h-7 w-7 ${reel.is_liked ? "fill-red-500 text-red-500" : "text-white"}`} />
                        </Button>
                        <span className="text-white text-xs font-medium">
                          {reel.likes_count > 0 ? reel.likes_count : ""}
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveCommentInput(activeCommentInput === reel.id ? null : reel.id)}
                          className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0 mb-1"
                        >
                          <MessageCircle className="h-7 w-7" />
                        </Button>
                        <span className="text-white text-xs font-medium">
                          {reel.comments_count > 0 ? reel.comments_count : ""}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
                      >
                        <Send className="h-7 w-7" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
                      >
                        <Bookmark className="h-7 w-7" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMute(reel.id)}
                        className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
                      >
                        {mutedVideos[reel.id] ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
                      >
                        <MoreHorizontal className="h-7 w-7" />
                      </Button>
                    </div>

                    {/* Comment Input */}
                    {activeCommentInput === reel.id && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
                        <div className="flex items-center space-x-3">
                          <Input
                            placeholder="Add a comment..."
                            value={commentInputs[reel.id] || ""}
                            onChange={(e) => setCommentInputs((prev) => ({ ...prev, [reel.id]: e.target.value }))}
                            className="flex-1 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-white"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComment(reel.id)}
                            disabled={!commentInputs[reel.id]?.trim()}
                            className={`text-sm font-semibold ${
                              commentInputs[reel.id]?.trim()
                                ? "text-blue-400 hover:text-blue-300"
                                : "text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            Post
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {reels.length === 0 && (
          <div className="text-center py-20">
            <div className="text-white text-lg mb-2">No reels yet</div>
            <div className="text-gray-400 text-sm">Start creating reels to see them here</div>
          </div>
        )}
      </div>
    </div>
  )
}
