"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coins, CreditCard, Gift, Star, Zap, Crown, ArrowRight, Shield } from "lucide-react"
import Navbar from "@/components/navbar"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function Wallet() {
  const [coins, setCoins] = useState(0)
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)
  const router = useRouter()

  const coinPackages = [
    { amount: 10, coins: 100, bonus: 0, popular: false },
    { amount: 50, coins: 550, bonus: 50, popular: false },
    { amount: 100, coins: 1200, bonus: 200, popular: true },
    { amount: 500, coins: 6500, bonus: 1500, popular: false },
  ]

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchCoins()
    loadRazorpayScript()
  }, [])

  const loadRazorpayScript = () => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    document.body.appendChild(script)
  }

  const fetchCoins = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/user/coins.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setCoins(data.coins)
      }
    } catch (error) {
      console.error("Error fetching coins:", error)
    }
  }

  const handlePurchase = async (packageAmount?: number) => {
    const purchaseAmount = packageAmount || Number.parseFloat(amount)
    if (!purchaseAmount || purchaseAmount < 1) {
      alert("Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/payment/create-order.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: purchaseAmount }),
      })

      const data = await response.json()
      if (data.success) {
        const options = {
          key: "rzp_test_your_key_here", // Replace with your Razorpay key
          amount: data.order.amount,
          currency: "INR",
          name: "Mysgram",
          description: "Purchase Coins",
          order_id: data.order.id,
          handler: async (response: any) => {
            await verifyPayment(response, data.order.id)
          },
          prefill: {
            name: JSON.parse(localStorage.getItem("user") || "{}").full_name,
            email: JSON.parse(localStorage.getItem("user") || "{}").email,
          },
          theme: {
            color: "#3b82f6",
          },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (error) {
      console.error("Error creating order:", error)
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (paymentResponse: any, orderId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("https://devloperwala.in/backend/api/payment/verify.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert("Payment successful! Coins added to your wallet.")
        fetchCoins()
        setAmount("")
        setSelectedPackage(null)
      } else {
        alert("Payment verification failed")
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-md mx-auto pt-16 pb-20">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-black">Wallet</h1>
        </div>

        {/* Current Balance */}
        <div className="p-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm">Available Balance</p>
                <div className="flex items-center space-x-2">
                  <Coins className="h-8 w-8 text-yellow-300" />
                  <span className="text-3xl font-bold">{coins.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Crown className="h-8 w-8 text-yellow-300" />
              </div>
            </div>
            <p className="text-blue-100 text-sm">Use coins to send gifts and unlock premium features</p>
          </div>

          {/* Quick Purchase Packages */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-black mb-4">Quick Purchase</h2>
            <div className="grid grid-cols-2 gap-3">
              {coinPackages.map((pkg, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedPackage(index)}
                  className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedPackage === index ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  } ${pkg.popular ? "ring-2 ring-blue-500 ring-opacity-50" : ""}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Most Popular</span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Coins className="h-6 w-6 text-yellow-500 mr-1" />
                      <span className="text-xl font-bold text-black">{pkg.coins}</span>
                    </div>

                    {pkg.bonus > 0 && (
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-2">
                        +{pkg.bonus} Bonus
                      </div>
                    )}

                    <div className="text-lg font-semibold text-black">₹{pkg.amount}</div>
                    <div className="text-xs text-gray-500">₹{(pkg.amount / pkg.coins).toFixed(2)} per coin</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedPackage !== null && (
              <Button
                onClick={() => handlePurchase(coinPackages[selectedPackage].amount)}
                disabled={loading}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white h-12 text-lg font-semibold"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Buy {coinPackages[selectedPackage].coins} Coins for ₹{coinPackages[selectedPackage].amount}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                )}
              </Button>
            )}
          </div>

          {/* Custom Amount */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-black mb-4">Custom Amount</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Enter Amount (₹)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter custom amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  className="mt-1 h-12 text-lg"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>₹1 = 10 coins</span>
                  {amount && <span>You'll get {Number.parseFloat(amount) * 10} coins</span>}
                </div>
              </div>

              <Button
                onClick={() => handlePurchase()}
                disabled={loading || !amount || selectedPackage !== null}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12"
              >
                {loading ? "Processing..." : `Purchase ${amount ? Number.parseFloat(amount) * 10 : 0} Coins`}
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-black mb-3 flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              What you can do with coins
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Gift className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">Send Gifts</p>
                  <p className="text-xs text-gray-500">Send virtual gifts to your favorite creators</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">Premium Features</p>
                  <p className="text-xs text-gray-500">Unlock exclusive features and content</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Crown className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">VIP Status</p>
                  <p className="text-xs text-gray-500">Get priority support and special badges</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 flex items-start space-x-3 p-4 bg-green-50 rounded-xl">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Secure Payment</p>
              <p className="text-xs text-green-600">
                All transactions are secured with 256-bit SSL encryption and processed by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
