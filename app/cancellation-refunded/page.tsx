"use client"
import Navbar from "@/components/navbar"
import Footer from "@/components/Footer"

export default function CancellationRefundPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-16 px-4 sm:px-6 pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cancellation & Refund Policy</h1>
        <div className="bg-white shadow-sm rounded-2xl p-6 space-y-4 text-gray-700">
          <p className="text-sm font-semibold">Last updated on Jul 5th 2025</p>
          <p className="text-sm">
            No cancellations & Refunds are entertained
          </p>
          <section>
            <h2 className="text-lg font-semibold">Contact Us</h2>
            <p className="text-sm mt-2">
              For any questions or concerns regarding cancellations or refunds, please reach out to us at:
              <br />
              Email: savagaveaprant673@gmail.com
              <br />
              Phone: +91-7058594194
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}