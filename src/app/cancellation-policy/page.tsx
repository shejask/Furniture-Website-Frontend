import React from 'react'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'

const CancellationPolicyPage = () => {
    return (
        <>
            <div id="header" className='relative w-full'>
                <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                <MenuFurniture props="bg-white" />
                <MenuCategory />
                <Breadcrumb heading='Cancellation Policy' subHeading='Cancellation Policy' />
            </div>
            <div className="container md:py-16 py-10">
            <h1 className="text-heading-2 font-semibold text-center">Cancellation Policy</h1>
            <div className="prose max-w-none mt-8">
                <p>You can cancel an order before it is shipped:</p>

                <h3>Cancellation Rules</h3>
                <ul>
                    <li>No cancellation once the product is dispatched.</li>
                    <li>Prepaid order cancellation will result in a full refund.</li>
                    <li>Order status can be tracked in your account dashboard.</li>
                </ul>

                <h3>Need help?</h3>
                <p>Reach us at +91-6282145302 or <a href="mailto:shoppinglalaa@gmail.com">shoppinglalaa@gmail.com</a></p>
            </div>
        </div>
        <Footer />
        </>
    )
}

export default CancellationPolicyPage


