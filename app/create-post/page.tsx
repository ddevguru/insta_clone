"use client"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, X, ImageIcon } from "lucide-react"
import Navbar from "@/components/navbar"

export default function CreatePost() {
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image) {
      alert("Please select an image")
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append("content", content)
    formData.append("image", image)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/posts/create.php", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        alert("Post created successfully! Your streak has been updated! 🔥")
        router.push("/")
      } else {
        alert(data.message || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-lg font-semibold text-black">New post</h1>
          <Button
            onClick={handleSubmit}
            disabled={!image || loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1 h-auto disabled:bg-blue-300"
          >
            {loading ? "Sharing..." : "Share"}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Select photos and videos</p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                    <Button type="button" className="bg-blue-500 hover:bg-blue-600 text-white">
                      Select from computer
                    </Button>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <Button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white text-sm px-3 py-1 h-auto"
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Change
                </Button>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
              </div>
            )}
          </div>

          {/* Caption Section */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-gray-900">
              Write a caption
            </Label>
            <Textarea
              id="content"
              placeholder="Write a caption..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none border-gray-200 focus:border-gray-400 focus:ring-0"
            />
            <div className="text-right">
              <span className="text-xs text-gray-500">{content.length}/2,200</span>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Add location</span>
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Add music</span>
              <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50">
                Add
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
