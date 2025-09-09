import React from 'react'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'

const PrivacyPolicyPage = () => {
    return (
        <>
            <div id="header" className='relative w-full'>
                <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                <MenuFurniture props="bg-white" />
                <MenuCategory />
                <Breadcrumb heading='Privacy Policy' subHeading='Privacy Policy' />
            </div>
            <div className="container md:py-16 py-10">
            <h1 className="text-heading-2 font-semibold text-center">Privacy Policy</h1>
            <div className="prose max-w-none mt-8">
                <p><strong>Effective Date:</strong> 04-07-2025</p>
                <p>At Shopping LaLa, your privacy is a priority. This Privacy Policy outlines how we collect, use, store, and protect your personal data when you access our platform or make purchases through www.shoppinglala.in.</p>

                <h3>Information We Collect</h3>
                <ul>
                    <li><strong>Personal Information:</strong> Name, email address, phone number, billing and shipping address</li>
                    <li><strong>Account Information:</strong> Username, password, and login credentials</li>
                    <li><strong>Order & Payment Data:</strong> Order history and transaction data. All payments are securely processed through Razorpay or Stripe. We do not store any card or sensitive payment details on our servers.</li>
                    <li><strong>Technical Data:</strong> IP address, browser type, device identifiers, operating system, and time zone via cookies or analytics scripts</li>
                </ul>

                <h3>How We Use Your Information</h3>
                <ul>
                    <li>Processing your orders and arranging shipping</li>
                    <li>Secure payment handling through Razorpay/Stripe</li>
                    <li>Sending order confirmations, delivery updates, and return instructions</li>
                    <li>Providing support and resolving disputes</li>
                    <li>Optional email marketing and promotional offers (you can unsubscribe anytime)</li>
                </ul>

                <h3>Information Sharing</h3>
                <p>We do not sell, rent, or trade your personal data. Data is shared only with trusted third parties necessary to run our platform:</p>
                <ul>
                    <li>Payment Gateways: Razorpay, Stripe</li>
                    <li>Courier & Logistics Providers for delivery purposes</li>
                    <li>Analytics & Marketing Services: Google Analytics, Facebook/Meta Pixel (for performance insights)</li>
                </ul>
                <p>All third-party services are contractually obligated to keep your information secure and confidential.</p>

                <h3>Data Security</h3>
                <ul>
                    <li>SSL encryption for all transactions</li>
                    <li>Secure hosting infrastructure</li>
                    <li>Role-based access control and data minimization</li>
                    <li>Regular vulnerability checks and compliance measures</li>
                </ul>

                <h3>Your Data Rights</h3>
                <ul>
                    <li><strong>Access:</strong> Request a copy of your stored data</li>
                    <li><strong>Correction:</strong> Update or correct any inaccurate information</li>
                    <li><strong>Deletion:</strong> Request removal of your account or personal data</li>
                    <li><strong>Withdraw Consent:</strong> Unsubscribe from promotional communication anytime</li>
                </ul>
                <p>To exercise your rights, email us at <a href="mailto:shoppinglalaa@gmail.com">shoppinglalaa@gmail.com</a></p>

                <h3>Contact Us</h3>
                <ul>
                    <li>Email: shoppinglalaa@gmail.com</li>
                    <li>Phone/WhatsApp: +91-6282145302</li>
                    <li>Business Entity: SMERAAS INNOVATE PVT LTD</li>
                    <li>Website: www.shoppinglala.in</li>
                </ul>

                <h3>Compliance</h3>
                <p>We follow the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (India) and align with GDPR principles for international users.</p>
            </div>
        </div>
        <Footer />
        </>
    )
}

export default PrivacyPolicyPage


