"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, MessageSquare, Coins } from "lucide-react"

interface Stats {
  total_users: number
  total_posts: number
  total_messages: number
  total_revenue: number
}

interface User {
  id: number
  username: string
  email: string
  full_name: string
  created_at: string
  is_active: boolean
}

interface Post {
  id: number
  username: string
  content: string
  likes_count: number
  created_at: string
}

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_posts: 0,
    total_messages: 0,
    total_revenue: 0,
  })
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: "",
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("http://localhost:8000/api/admin/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminCredentials),
      })
      const data = await response.json()

      if (data.success) {
        setIsAuthenticated(true)
        localStorage.setItem("admin_token", data.token)
        fetchStats()
        fetchUsers()
        fetchPosts()
      } else {
        alert("Invalid admin credentials")
      }
    } catch (error) {
      console.error("Admin login error:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("http://localhost:8000/api/admin/stats.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("http://localhost:8000/api/admin/users.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("http://localhost:8000/api/admin/posts.php", {
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

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("http://localhost:8000/api/admin/toggle-user.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, is_active: !isActive }),
      })
      const data = await response.json()
      if (data.success) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Error toggling user status:", error)
    }
  }

  const deletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch("http://localhost:8000/api/admin/delete-post.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ post_id: postId }),
      })
      const data = await response.json()
      if (data.success) {
        fetchPosts()
      }
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token")
    if (adminToken) {
      setIsAuthenticated(true)
      fetchStats()
      fetchUsers()
      fetchPosts()
    }
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Admin Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login as Admin
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button
            onClick={() => {
              localStorage.removeItem("admin_token")
              setIsAuthenticated(false)
            }}
            variant="outline"
          >
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total_users}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold">{stats.total_posts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold">{stats.total_messages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Coins className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{stats.total_revenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">ID</th>
                        <th className="border border-gray-300 p-2 text-left">Username</th>
                        <th className="border border-gray-300 p-2 text-left">Email</th>
                        <th className="border border-gray-300 p-2 text-left">Full Name</th>
                        <th className="border border-gray-300 p-2 text-left">Created At</th>
                        <th className="border border-gray-300 p-2 text-left">Status</th>
                        <th className="border border-gray-300 p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="border border-gray-300 p-2">{user.id}</td>
                          <td className="border border-gray-300 p-2">{user.username}</td>
                          <td className="border border-gray-300 p-2">{user.email}</td>
                          <td className="border border-gray-300 p-2">{user.full_name}</td>
                          <td className="border border-gray-300 p-2">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-300 p-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2">
                            <Button
                              size="sm"
                              variant={user.is_active ? "destructive" : "default"}
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                            >
                              {user.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Post Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">ID</th>
                        <th className="border border-gray-300 p-2 text-left">Username</th>
                        <th className="border border-gray-300 p-2 text-left">Content</th>
                        <th className="border border-gray-300 p-2 text-left">Likes</th>
                        <th className="border border-gray-300 p-2 text-left">Created At</th>
                        <th className="border border-gray-300 p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post) => (
                        <tr key={post.id}>
                          <td className="border border-gray-300 p-2">{post.id}</td>
                          <td className="border border-gray-300 p-2">{post.username}</td>
                          <td className="border border-gray-300 p-2 max-w-xs truncate">{post.content}</td>
                          <td className="border border-gray-300 p-2">{post.likes_count}</td>
                          <td className="border border-gray-300 p-2">
                            {new Date(post.created_at).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-300 p-2">
                            <Button size="sm" variant="destructive" onClick={() => deletePost(post.id)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
