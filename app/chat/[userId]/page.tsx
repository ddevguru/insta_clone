"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, MoreVertical, Phone, Video } from "lucide-react";
import Navbar from "@/components/navbar";

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
  is_own_message: boolean;
}

interface ChatUser {
  id: number;
  username: string;
  full_name: string;
  profile_photo: string;
  is_online: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  useEffect(() => {
    console.log("Chat page mounted with userId:", userId);

    if (!userId || userId === "undefined" || isNaN(Number(userId))) {
      console.error("Invalid userId:", userId);
      setError("Invalid user ID");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchChatData();

    // Set up polling for new messages every 5 seconds
    const interval = setInterval(fetchChatData, 5000);
    return () => clearInterval(interval);
  }, [userId, router]);

  const fetchChatData = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching chat data for user:", userId);

      const response = await fetch(
        `https://devloperwala.in/backend/api/chat/messages.php?user_id=${userId}`,
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
        if (response.status === 404) {
          throw new Error("User not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log("Raw response from messages.php:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        throw new Error("Invalid JSON response from server");
      }

      if (data.success) {
        setMessages(data.messages || []);
        setChatUser(data.user || null);
        setError(null);
      } else {
        throw new Error(data.message || "Failed to fetch chat data");
      }
    } catch (error) {
      console.error("Error in fetchChatData:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
      await fetchUserFromSearch(); // Fallback to fetch user info
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFromSearch = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://devloperwala.in/backend/api/user/profile.php?user_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.user) {
        setChatUser({
          id: data.user.id,
          username: data.user.username,
          full_name: data.user.full_name,
          profile_photo: data.user.profile_photo,
          is_online: data.user.is_online || false,
        });
        setError(null);
      } else {
        setError(data.message || "User not found");
      }
    } catch (error) {
      console.error("Error fetching user from search:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch user information");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !chatUser) return;

    setSending(true);
    const messageText = newMessage;
    setNewMessage("");

    try {
      const token = localStorage.getItem("token");
      console.log("Sending message:", messageText, "to user:", userId);

      const response = await fetch(
        "https://devloperwala.in/backend/api/chat/send.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiver_id: Number(userId),
            message: messageText,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in again");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Send message response:", data);

      if (data.success && data.data) {
        setMessages((prev) => [...prev, data.data]);
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageText);
      setError(error instanceof Error ? error.message : "Failed to send message");
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-16">
          <div className="bg-white border-b border-gray-100 p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!chatUser || error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-20 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Start Conversation</h2>
            <p className="text-gray-600 mb-6">{error || "User not found."}</p>
            <Button
              onClick={() => router.push("/chat")}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Back to Messages
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-16 flex flex-col h-screen">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/chat")}
              className="rounded-xl hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <Avatar className="w-10 h-10 ring-2 ring-gray-200">
                <AvatarImage src={chatUser.profile_photo || "/placeholder.svg"} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                  {chatUser.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {chatUser.is_online && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{chatUser.username}</div>
              <div className="text-xs text-gray-500">{chatUser.is_online ? "Active now" : "Offline"}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="rounded-xl hover:bg-gray-100">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl hover:bg-gray-100">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl hover:bg-gray-100">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length > 0 ? (
            messages.map((message, index) => {
              const showDate =
                index === 0 || formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${message.is_own_message ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        message.is_own_message
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${message.is_own_message ? "text-blue-100" : "text-gray-500"}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👋</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start the conversation</h3>
              <p className="text-gray-600">Send a message to {chatUser.username}</p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
          <div className="flex space-x-3">
            <Input
              placeholder={`Message ${chatUser.username}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              className="flex-1 rounded-xl border-2 border-gray-200 focus:border-blue-500 resize-none"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}