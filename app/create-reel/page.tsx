"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Video, X, Upload } from "lucide-react"
import Navbar from "@/components/navbar"

const BASE_PROFILE_URL = "https://devloperwala.in/uploads/profiles/"

interface User {
  id: number
  username: string
  profile_photo: string | null
}

export default function CreateReel() {
  const [user, setUser] = useState<User | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await fetch("https://devloperwala.in/backend/api/auth/me.php", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          console.log("Fetched user:", data.user)
          setUser(data.user)
        } else {
          setError("Failed to fetch user data")
          router.push("/login")
        }
      } catch (err) {
        setError("Error fetching user data")
        console.error(err)
      }
    }

    fetchUser()
  }, [router])

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideo(file)
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
    }
  }

  const removeVideo = () => {
    setVideo(null)
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
      setVideoPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!video) {
      setError("Please select a video")
      return
    }

    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("video", video)
    formData.append("caption", caption)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/reels/create.php", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        router.push("/")
      } else {
        setError(data.message || "Failed to upload reel")
      }
    } catch (err) {
      setError("Error uploading reel")
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-md mx-auto pt-16">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Button variant="ghost" onClick={() => router.back()} className="text-black hover:bg-gray-100">
            Cancel
          </Button>
          <h1 className="text-lg font-semibold text-black">New reel</h1>
          <Button
            onClick={handleSubmit}
            disabled={!video || uploading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1 h-auto disabled:bg-blue-300"
          >
            {uploading ? "Sharing..." : "Share"}
          </Button>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={
                user.profile_photo && !user.profile_photo.startsWith("http")
                  ? `${BASE_PROFILE_URL}${user.profile_photo.replace(/^\/*uploads\/profiles\//, "")}`
                  : user.profile_photo || "/placeholder.svg"
              }
              onError={(e) => {
                console.error(`Failed to load profile photo: ${user.profile_photo}`)
                e.currentTarget.src = "/placeholder.svg?height=40&width=40"
              }}
            />
            <AvatarFallback className="bg-gray-200 text-black font-semibold">
              {user.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-black">{user.username}</span>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Video Upload Section */}
          <div className="space-y-4">
            {!videoPreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" id="video-upload" />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Video className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Select video</p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                    <Button type="button" className="bg-blue-500 hover:bg-blue-600 text-white">
                      <Upload className="h-4 w-4 mr-2" />
                      Select from computer
                    </Button>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative">
                <div className="aspect-[9/16] rounded-lg overflow-hidden bg-black">
                  <video src={videoPreview} className="w-full h-full object-cover" controls muted loop />
                </div>
                <Button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={() => document.getElementById("video-upload")?.click()}
                  className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white text-sm px-3 py-1 h-auto"
                >
                  <Video className="h-4 w-4 mr-1" />
                  Change
                </Button>
                <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" id="video-upload" />
              </div>
            )}
          </div>

          {/* Caption Section */}
          <div className="space-y-2">
            <Label htmlFor="caption" className="text-sm font-medium text-gray-900">
              Write a caption
            </Label>
            <Input
              id="caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="border-gray-200 focus:border-gray-400 focus:ring-0"
            />
            <div className="text-right">
              <span className="text-xs text-gray-500">{caption.length}/2,200</span>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Add music</span>
              <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50">
                Add
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Add effects</span>
              <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50">
                Add
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Tag people</span>
              <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50">
                Tag
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
