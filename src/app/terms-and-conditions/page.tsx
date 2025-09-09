import React from 'react'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'

const TermsAndConditionsPage = () => {
    return (
        <>
            <div id="header" className='relative w-full'>
                <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                <MenuFurniture props="bg-white" />
                <MenuCategory />
                <Breadcrumb heading='Terms & Conditions' subHeading='Terms & Conditions' />
            </div>
            <div className="container md:py-16 py-10">
            <h1 className="text-heading-2 font-semibold text-center">Terms & Conditions</h1>
            <div className="prose max-w-none mt-8">
                <p><strong>Effective Date:</strong> 04-07-2025</p>
                <p>Welcome to Shopping LaLa, operated by SMERAAS INNOVATE PVT LTD. By accessing our website, you agree to comply with the following terms and conditions.</p>

                <h3>1. Account Use</h3>
                <ul>
                    <li>You must provide accurate information during registration.</li>
                    <li>You’re responsible for maintaining the confidentiality of your login credentials.</li>
                </ul>

                <h3>2. Product Listings & Orders</h3>
                <ul>
                    <li>We offer products sold by multiple vendors.</li>
                    <li>Product descriptions, pricing, and stock availability are subject to change.</li>
                </ul>

                <h3>3. Payments</h3>
                <ul>
                    <li>We use trusted third-party providers (e.g., Razorpay, Stripe, Paypal) for secure payment processing.</li>
                    <li>All payment-related information is encrypted and securely handled.</li>
                </ul>

                <h3>4. Shipping & Delivery</h3>
                <ul>
                    <li>Delivery timelines may vary depending on the seller and location.</li>
                    <li>Shipping policies are detailed on our Shipping & Delivery page.</li>
                </ul>

                <h3>5. Returns & Refunds</h3>
                <ul>
                    <li>Customers may initiate returns as per our Return Policy.</li>
                    <li>Refunds are processed after product inspection and approval.</li>
                </ul>

                <h3>6. Seller Responsibilities</h3>
                <ul>
                    <li>Sellers must ensure accurate product listings and timely dispatch.</li>
                    <li>Disputes may be resolved via internal moderation.</li>
                </ul>

                <h3>7. Limitation of Liability</h3>
                <p>We are not liable for delays caused by shipping providers or product quality issues (responsibility lies with individual sellers).</p>

                <h3>8. Governing Law</h3>
                <p>All disputes, claims, or proceedings arising out of or in connection with this website shall be subject to the exclusive jurisdiction of the courts in the Ernakulam District, including Kakkanad, Kochi, Kerala, India.</p>
            </div>
        </div>
        <Footer />
        </>
    )
}

export default TermsAndConditionsPage


