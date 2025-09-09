import React from 'react'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'

const ShippingInfoPage = () => {
    return (
        <>
            <div id="header" className='relative w-full'>
                <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                <MenuFurniture props="bg-white" />
                <MenuCategory />
                <Breadcrumb heading='Shipping & Delivery' subHeading='Shipping Info' />
            </div>
            <div className="container md:py-16 py-10">
            <h1 className="text-heading-2 font-semibold text-center">Shipping & Delivery Policy</h1>
            <div className="prose max-w-none mt-8">
                <p>We are committed to delivering your orders quickly and safely.</p>
                <h3>Shipping Timelines</h3>
                <ul>
                    <li>Orders are typically processed in 24–48 hours.</li>
                    <li>Delivery time varies between 3–7 business days depending on location.</li>
                </ul>

                <h3>Delivery Partners</h3>
                <p>We work with leading logistics providers (e.g., Delhivery, Blue Dart, etc.)</p>

                <h3>Tracking</h3>
                <p>Once shipped, tracking info is available in your account and via SMS/email.</p>

                <h3>Shipping Charges</h3>
                <ul>
                    <li>Free shipping for select products.</li>
                    <li>Shipping fee (if applicable) is displayed during checkout.</li>
                </ul>

                <h3>Automation-Ready Notes</h3>
                <ul>
                    <li>Auto-update timelines based on vendor stock and pincode.</li>
                    <li>Show delivery ETA dynamically on product and checkout pages.</li>
                </ul>
            </div>
        </div>
        <Footer />
        </>
    )
}

export default ShippingInfoPage


