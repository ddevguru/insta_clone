"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  Search,
  PlusSquare,
  MessageCircle,
  User,
  Wallet,
  LogOut,
  Compass,
  Heart,
  Video,
  Camera,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-blue-600 p-2 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-200">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 hidden sm:block">Mysgram</span>
          </Link>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <Home className="h-5 w-5 text-gray-700" />
              </Button>
            </Link>

            <Link href="/search">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <Search className="h-5 w-5 text-gray-700" />
              </Button>
            </Link>

            <Link href="/explore">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <Compass className="h-5 w-5 text-gray-700" />
              </Button>
            </Link>

            <Link href="/reels">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <Video className="h-5 w-5 text-gray-700" />
              </Button>
            </Link>

            {/* Create Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                >
                  <PlusSquare className="h-5 w-5 text-gray-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-48 bg-white border border-gray-200 shadow-lg rounded-xl p-2"
              >
                <DropdownMenuItem asChild className="rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <Link href="/create-post" className="flex items-center px-3 py-2">
                    <PlusSquare className="h-4 w-4 mr-3 text-gray-600" />
                    <span className="font-medium text-gray-700">Create Post</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <Link href="/create-reel" className="flex items-center px-3 py-2">
                    <Video className="h-4 w-4 mr-3 text-gray-600" />
                    <span className="font-medium text-gray-700">Create Reel</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/notifications">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <Heart className="h-5 w-5 text-gray-700" />
              </Button>
            </Link>

            <Link href="/chat">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <MessageCircle className="h-5 w-5 text-gray-700" />
              </Button>
            </Link>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-gray-200 hover:ring-blue-300 transition-all duration-200">
                    <AvatarImage
                      src={
                        user?.profile_photo
                          ? `https://devloperwala.in/backend/${user.profile_photo}`
                          : "/placeholder.svg"
                      }
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-sm">
                      {user?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white border border-gray-200 shadow-lg rounded-xl p-2"
              >
                <DropdownMenuItem asChild className="rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <Link href="/profile" className="flex items-center px-3 py-2">
                    <User className="h-4 w-4 mr-3 text-gray-600" />
                    <span className="font-medium text-gray-700">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <Link href="/wallet" className="flex items-center px-3 py-2">
                    <Wallet className="h-4 w-4 mr-3 text-gray-600" />
                    <span className="font-medium text-gray-700">Wallet</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg hover:bg-red-50 transition-colors duration-200 text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
