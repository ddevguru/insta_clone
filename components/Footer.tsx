"use client"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 px-4 mt-8">
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-8 sm:gap-12">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Policies</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>
                <Link href="/cancellation-refunded" className="hover:text-blue-600 transition-colors duration-200">
                  Cancellation & Refund
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors duration-200">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/shipping-delivery" className="hover:text-blue-600 transition-colors duration-200">
                  Shipping & Delivery
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>Email: savagaveaprant673@gmail.com</li>
              <li>Phone: +91-7058594194</li>
            </ul>
          </div>
        </div>
        <Separator className="my-6 bg-gray-200" />
        <div className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Devloperwala. All rights reserved.
        </div>
      </div>
    </footer>
  )
}