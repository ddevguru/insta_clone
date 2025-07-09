"use client";
import { useState, useEffect } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageCircle, Lock } from "lucide-react";
import Navbar from "@/components/navbar";

interface SearchUser {
  id: number;
  username: string;
  full_name: string;
  profile_photo: string;
  is_private: boolean;
  follow_status: "following" | "requested" | "not_following";
  is_online: boolean;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchUser[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Load recent searches from localStorage
    try {
      const recent = localStorage.getItem("recentSearches");
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (err) {
      console.error("Error parsing recent searches:", err);
      setRecentSearches([]);
      localStorage.removeItem("recentSearches");
    }
  }, []);

  useEffect(() => {
    // Auto-search when query changes
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
        setError(null);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(
        `https://devloperwala.in/backend/api/user/search.php?q=${encodeURIComponent(searchQuery)}`,
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

      // Log raw response for debugging
      const text = await response.text();
      console.log("Raw response from search.php:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        throw new Error(`Invalid JSON response: ${err.message}`);
      }

      if (data.success) {
        setSearchResults(data.users || []);
      } else {
        setError(data.message || "Search failed");
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching users:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      setSearchResults([]);
      if (errorMessage.includes("Unauthorized")) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollowRequest = async (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch("https://devloperwala.in/backend/api/user/follow.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in again");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  follow_status: data.action === "followed" || data.action === "requested" ? data.action : "not_following",
                }
              : user
          )
        );
        setRecentSearches((prev) =>
          prev.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  follow_status: data.action === "followed" || data.action === "requested" ? data.action : "not_following",
                }
              : user
          )
        );
      } else {
        setError(data.message || "Failed to send follow request");
      }
    } catch (err) {
      console.error("Error sending follow request:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send follow request";
      setError(errorMessage);
      if (errorMessage.includes("Unauthorized")) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    }
  };

  const handleUserClick = (user: SearchUser) => {
    const updatedRecent = [user, ...recentSearches.filter((u) => u.id !== user.id)].slice(0, 10);
    setRecentSearches(updatedRecent);
    localStorage.setItem("recentSearches", JSON.stringify(updatedRecent));
    router.push(`/profile/${user.username}`);
  };

  const handleMessageUser = (user: SearchUser, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Navigating to chat with user ID:", user.id, "Username:", user.username);
    const updatedRecent = [user, ...recentSearches.filter((u) => u.id !== user.id)].slice(0, 10);
    setRecentSearches(updatedRecent);
    localStorage.setItem("recentSearches", JSON.stringify(updatedRecent));
    router.push(`/chat/${user.id}`);
  };

  const getFollowButtonText = (user: SearchUser) => {
    switch (user.follow_status) {
      case "following":
        return "Unfollow";
      case "requested":
        return "Requested";
      default:
        return user.is_private ? "Request" : "Follow";
    }
  };

  const getFollowButtonVariant = (user: SearchUser) => {
    return user.follow_status === "following" || user.follow_status === "requested" ? "outline" : "default";
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-20 px-4">
        {/* Search Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-600 focus:bg-white rounded-xl text-gray-900 placeholder:text-gray-500 transition-all duration-200"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
          )}
        </div>

        {/* Recent Searches */}
        {!searchQuery && recentSearches.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Searches</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-3">
              {recentSearches.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12 ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all duration-200">
                        <AvatarImage src={user.profile_photo || "/placeholder.png"} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                          {user.username?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {user.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                        {user.username}
                      </div>
                      <div className="text-gray-600 text-sm">{user.full_name}</div>
                      {user.is_private && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Lock className="h-3 w-3 mr-1" />
                          Private Account
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMessageUser(user, e)}
                      className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600"
                      title="Send Message"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={getFollowButtonVariant(user)}
                      size="sm"
                      onClick={(e) => handleFollowRequest(user.id, e)}
                      className={`rounded-lg transition-all duration-200 ${
                        getFollowButtonVariant(user) === "default"
                          ? "bg-blue-600 hover:bg-blue-800 text-white"
                          : "border-2 border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                      disabled={user.follow_status === "requested"}
                    >
                      {getFollowButtonText(user)}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {searchResults.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all duration-200">
                          <AvatarImage src={user.profile_photo || "/placeholder.png"} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                            {user.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {user.is_online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {user.username}
                        </div>
                        <div className="text-gray-600 text-sm">{user.full_name}</div>
                        {user.is_private && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Lock className="h-3 w-3 mr-1" />
                            Private Account
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleMessageUser(user, e)}
                        className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600"
                        title="Send Message"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={getFollowButtonVariant(user)}
                        size="sm"
                        onClick={(e) => handleFollowRequest(user.id, e)}
                        className={`rounded-lg transition-all duration-200 ${
                          getFollowButtonVariant(user) === "default"
                            ? "bg-blue-600 hover:bg-blue-800 text-white"
                            : "border-2 border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                        disabled={user.follow_status === "requested"}
                      >
                        {getFollowButtonText(user)}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 font-medium">No users found</p>
                <p className="text-gray-500 text-sm mt-1">Try searching with a different keyword</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && recentSearches.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Discover People</h2>
            <p className="text-gray-600 mb-6">Search for friends and discover new connections</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                💡 <strong>Tip:</strong> Start typing to search for users by username or full name
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}