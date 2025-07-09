"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Grid, Settings, Plus, Heart, MessageCircle, MoreHorizontal, Camera } from 'lucide-react'
import Navbar from "@/components/navbar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface User {
  id: number
  username: string
  full_name: string
  email: string
  profile_photo: string
  bio: string
  is_private: boolean
  posts_count: number
  followers_count: number
  following_count: number
  streak_count: number
}

interface Post {
  id: number
  image_url: string
  likes_count: number
  comments_count: number
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchProfile()
    fetchUserPosts()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/user/profile.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/posts/user-posts.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    }
  }

  const handleProfilePhotoUpload = async () => {
    if (!profilePhoto) return
    
    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append("profile_photo", profilePhoto)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/user/update-profile-photo.php", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      const data = await response.json()
      if (data.success) {
        fetchProfile()
        setProfilePhoto(null)
      }
    } catch (error) {
      console.error("Error uploading profile photo:", error)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-md mx-auto pt-16">
          <div className="animate-pulse">
            {/* Profile Header Skeleton */}
            <div className="p-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="flex justify-around mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center">
                    <div className="h-6 bg-gray-200 rounded w-8 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Posts Grid Skeleton */}
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-md mx-auto pt-16 pb-20">
        {/* Profile Header */}
        <div className="p-4">
          <div className="flex items-center space-x-4 mb-6">
            {/* Profile Picture */}
            <div className="relative">
              <Avatar className="w-20 h-20 ring-2 ring-gray-200">
                <AvatarImage
                  src={user.profile_photo ? `${user.profile_photo}` : "/placeholder.svg"}
                  alt={user.username}
                />
                <AvatarFallback className="text-xl font-semibold bg-gray-100">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-1 -right-1 rounded-full w-7 h-7 p-0 bg-blue-500 hover:bg-blue-600 shadow-lg"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Change profile photo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="profile_photo" className="text-sm font-medium">
                        Choose Photo
                      </Label>
                      <Input
                        id="profile_photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleProfilePhotoUpload} 
                      disabled={!profilePhoto || uploadingPhoto}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h1 className="text-xl font-semibold text-black">{user.username}</h1>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-300 text-black hover:bg-gray-50 h-8 px-3"
                >
                  Edit profile
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-8 w-8"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              {user.full_name && (
                <p className="text-sm font-medium text-black mb-1">{user.full_name}</p>
              )}
              
              {user.bio && (
                <p className="text-sm text-gray-600 mb-3">{user.bio}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-around py-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-black">{formatNumber(user.posts_count)}</div>
              <div className="text-xs text-gray-500">posts</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-black">{formatNumber(user.followers_count)}</div>
              <div className="text-xs text-gray-500">followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-black">{formatNumber(user.following_count)}</div>
              <div className="text-xs text-gray-500">following</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-500">{user.streak_count}</div>
              <div className="text-xs text-gray-500">streak 🔥</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-300 text-black hover:bg-gray-50 h-8"
            >
              Share profile
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-gray-300 text-black hover:bg-gray-50 h-8"
            >
              Contact
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 flex items-center justify-center py-3 text-xs font-semibold uppercase tracking-wide border-t-2 ${
                activeTab === "posts"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500"
              }`}
            >
              <Grid className="h-4 w-4 mr-1" />
              Posts
            </button>
            <button
              onClick={() => setActiveTab("reels")}
              className={`flex-1 flex items-center justify-center py-3 text-xs font-semibold uppercase tracking-wide border-t-2 ${
                activeTab === "reels"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500"
              }`}
            >
              <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Reels
            </button>
            <button
              onClick={() => setActiveTab("tagged")}
              className={`flex-1 flex items-center justify-center py-3 text-xs font-semibold uppercase tracking-wide border-t-2 ${
                activeTab === "tagged"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500"
              }`}
            >
              <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Tagged
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "posts" && (
          <div className="grid grid-cols-3 gap-1">
            {posts.length === 0 ? (
              <div className="col-span-3 text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-sm text-gray-500">Start sharing photos and videos</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="aspect-square relative group cursor-pointer">
                  <img
                    src={
                      post.image_url
                        ? `https://devloperwala.in/backend${post.image_url}`
                        : "/placeholder.svg?height=300&width=300"
                    }
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center space-x-4 text-white">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-5 w-5 fill-white" />
                        <span className="font-semibold">{formatNumber(post.likes_count)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-5 w-5 fill-white" />
                        <span className="font-semibold">{formatNumber(post.comments_count)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "reels" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reels yet</h3>
            <p className="text-sm text-gray-500">Start creating reels to see them here</p>
          </div>
        )}

        {activeTab === "tagged" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tagged posts</h3>
            <p className="text-sm text-gray-500">Posts you're tagged in will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
