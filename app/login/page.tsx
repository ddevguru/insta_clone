"use client"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Camera, Eye, EyeOff, Mail, Lock, Heart, MessageCircle } from 'lucide-react'

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await fetch("https://devloperwala.in/backend/api/auth/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        router.push("/")
      } else {
        setError(data.message || "Login failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100 rounded-full opacity-60"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-purple-100 rounded-full opacity-40"></div>
        <div className="absolute bottom-32 left-40 w-40 h-40 bg-pink-100 rounded-full opacity-50"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-indigo-100 rounded-full opacity-30"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Login Card */}
        <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-8 pt-12 bg-white">
            {/* Logo section */}
            <div className="flex items-center justify-center mb-8 relative">
              <div className="bg-blue-600 p-5 rounded-2xl shadow-lg relative">
                <Camera className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-pink-500 p-1.5 rounded-full">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 bg-green-500 p-1.5 rounded-full">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Mysgram
            </h1>
            <p className="text-gray-600 text-lg font-medium">Welcome back! Sign in to continue</p>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-gray-800 font-semibold text-sm">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-14 pl-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl text-gray-900 placeholder:text-gray-500 transition-all duration-200 hover:border-gray-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-gray-800 font-semibold text-sm">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-14 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl text-gray-900 placeholder:text-gray-500 transition-all duration-200 hover:border-gray-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                    Forgot password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Signing you in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>
            </div>

           

            <div className="text-center mt-8">
              <p className="text-gray-600 text-sm">
                {"New to Mysgram? "}
                <Link
                  href="/register"
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm font-medium">© 2024 Mysgram • Connect, Share, Inspire ✨</p>
        </div>
      </div>
    </div>
  )
}
