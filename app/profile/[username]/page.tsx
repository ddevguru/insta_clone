"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, MessageCircle } from "lucide-react";
import Navbar from "@/components/navbar";

interface ProfileUser {
  id: number;
  username: string;
  full_name: string;
  profile_photo: string;
  is_private: boolean;
  follow_status: "following" | "requested" | "not_following";
  is_online: boolean;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

export default function ProfilePage() {
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  useEffect(() => {
    if (!username) {
      setError("Invalid username");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchProfile();
  }, [username, router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://devloperwala.in/backend/api/user/profile.php?username=${encodeURIComponent(username)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in again");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log("Raw response from profile.php:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        throw new Error("Invalid JSON response from server");
      }

      if (data.success && data.user) {
        setProfileUser(data.user);
        setError(null);
      } else {
        throw new Error(data.message || "User not found");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
      if (err instanceof Error && err.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollowRequest = async (e: React.MouseEvent) => {
    if (!profileUser) return;
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(
        "https://devloperwala.in/backend/api/user/follow.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: profileUser.id }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in again");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setProfileUser((prev) =>
          prev
            ? {
                ...prev,
                follow_status:
                  data.action === "followed" || data.action === "requested"
                    ? data.action
                    : "not_following",
              }
            : prev
        );
      } else {
        setError(data.message || "Failed to process follow request");
      }
    } catch (err) {
      console.error("Error sending follow request:", err);
      setError(
        err instanceof Error ? err.message : "Failed to send follow request"
      );
      if (err instanceof Error && err.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    }
  };

  const handleMessageUser = (e: React.MouseEvent) => {
    if (!profileUser) return;
    e.stopPropagation();
    router.push(`/chat/${profileUser.id}`);
  };

  const getFollowButtonText = () => {
    if (!profileUser) return "Follow";
    switch (profileUser.follow_status) {
      case "following":
        return "Unfollow";
      case "requested":
        return "Requested";
      default:
        return profileUser.is_private ? "Request" : "Follow";
    }
  };

  const getFollowButtonVariant = () => {
    if (!profileUser) return "default";
    return profileUser.follow_status === "following" || profileUser.follow_status === "requested"
      ? "outline"
      : "default";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-20 px-4 animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser || error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-20 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🙁</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "The user could not be found."}</p>
            <Button
              onClick={() => router.push("/search")}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Back to Search
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-20 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-2 ring-gray-200">
                <AvatarImage src={profileUser.profile_photo || "/placeholder.png"} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                  {profileUser.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              {profileUser.is_online && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{profileUser.username}</h1>
                  <p className="text-gray-600">{profileUser.full_name}</p>
                  {profileUser.is_private && (
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Lock className="h-4 w-4 mr-1" />
                      Private Account
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMessageUser}
                    className="h-10 w-10 p-0 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600"
                    title="Send Message"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <Button
                    variant={getFollowButtonVariant()}
                    size="sm"
                    onClick={handleFollowRequest}
                    className={`rounded-lg transition-all duration-200 ${
                      getFollowButtonVariant() === "default"
                        ? "bg-blue-600 hover:bg-blue-800 text-white"
                        : "border-2 border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                    disabled={profileUser.follow_status === "requested"}
                  >
                    {getFollowButtonText()}
                  </Button>
                </div>
              </div>
              <div className="flex space-x-6 mt-4">
                <div>
                  <span className="font-bold">{profileUser.posts_count}</span> posts
                </div>
                <div>
                  <span className="font-bold">{profileUser.followers_count}</span> followers
                </div>
                <div>
                  <span className="font-bold">{profileUser.following_count}</span> following
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-gray-600 text-center">No posts available</p>
          </div>
        </div>
      </div>
    </div>
  );
}
