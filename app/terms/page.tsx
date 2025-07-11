"use client"
import Navbar from "@/components/navbar"
import Footer from "@/components/Footer"

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-16 px-4 sm:px-6 pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Terms & Conditions</h1>
        <div className="bg-white shadow-sm rounded-2xl p-6 space-y-4 text-gray-700">
          <p className="text-sm font-semibold">Last updated on Jul 5th 2025</p>
          <p className="text-sm">
            For the purpose of these Terms and Conditions, The term "we", "us", "our" used anywhere on this page shall mean MYSGRAM, whose registered/operational office is Behind BSNL Office Mal Bhag kurundwad Kolhapur MAHARASHTRA 416106 . "you", “your”, "user", “visitor” shall mean any natural or legal person who is visiting our website and/or agreed to purchase from us.
          </p>
          <section>
            <h2 className="text-lg font-semibold">Your use of the website and/or purchase from us are governed by following Terms and Conditions:</h2>
            <ul className="list-disc list-inside text-sm space-y-2 mt-2">
              <li>The content of the pages of this website is subject to change without notice.</li>
              <li>Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.</li>
              <li>Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through our website and/or product pages meet your specific requirements.</li>
              <li>Our website contains material which is owned by or licensed to us. This material includes, but are not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.</li>
              <li>All trademarks reproduced in our website which are not the property of, or licensed to, the operator are acknowledged on the website.</li>
              <li>Unauthorized use of information provided by us shall give rise to a claim for damages and/or be a criminal offense.</li>
              <li>From time to time our website may also include links to other websites. These links are provided for your convenience to provide further information.</li>
              <li>You may not create a link to our website from another website or document without MYSGRAM’s prior written consent.</li>
              <li>Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India .</li>
              <li>We, shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold">Contact Us</h2>
            <p className="text-sm mt-2">
              For questions about these terms, please contact us at:
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