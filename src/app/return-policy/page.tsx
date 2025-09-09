import React from 'react'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'

const ReturnPolicyPage = () => {
    return (
        <>
            <div id="header" className='relative w-full'>
                <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                <MenuFurniture props="bg-white" />
                <MenuCategory />
                <Breadcrumb heading='Return & Refund Policy' subHeading='Return Policy' />
            </div>
            <div className="container md:py-16 py-10">
            <h1 className="text-heading-2 font-semibold text-center">Return & Refund Policy</h1>
            <div className="prose max-w-none mt-8">
                <p><strong>Effective Date:</strong> 04-07-2025</p>
                <p>We want you to be fully satisfied with your purchase on Shopping LaLa. This Return & Refund Policy outlines the conditions under which returns, exchanges, and refunds are allowed.</p>

                <h3>1. Eligibility Window</h3>
                <ul>
                    <li>Returns must be requested within 7 days of delivery.</li>
                    <li>The product must be unused, with original tags and packaging.</li>
                </ul>

                <h3>2. Non-returnable Items</h3>
                <ul>
                    <li>Perishable goods, personal hygiene items, or customized products cannot be returned unless defective.</li>
                </ul>

                <h3>3. Return Process</h3>
                <ul>
                    <li>Go to “My Orders” → Click “Request Return”.</li>
                    <li>Choose reason and upload images.</li>
                    <li>Product will be picked up from your address.</li>
                </ul>

                <h3>4. Refund Method</h3>
                <ul>
                    <li>Refunds are processed to the original payment method within 7–10 business days after product inspection.</li>
                    <li>Refunded to original payment method.</li>
                </ul>

                <h3>5. Vendor-Specific Policies</h3>
                <p>Some sellers may have specific return windows; these are listed on the product detail page.</p>

                <h3>6. Need Help?</h3>
                <p>Email: <a href="mailto:shoppinglalaa@gmail.com">shoppinglalaa@gmail.com</a> • Phone: +91-6282145302</p>
            </div>
        </div>
        <Footer />
        </>
    )
}

export default ReturnPolicyPage


