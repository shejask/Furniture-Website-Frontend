'use client'
import React, { useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import SliderFurniture from '@/components/Slider/SliderFurniture'
import * as Icon from "@phosphor-icons/react/dist/ssr"

const PaymentSuccess = () => {
    const searchParams = useSearchParams()
    const paymentId = searchParams.get('payment_id')
    const orderId = searchParams.get('order_id')
    const amount = searchParams.get('amount')
    const paymentMethod = searchParams.get('payment_method')

    // Determine if this is a COD order
    const isCOD = paymentMethod === 'cod'

    useEffect(() => {
        // You can add analytics tracking here
        if (typeof window !== 'undefined') {
            // Track successful payment
            console.log('Order placed successfully:', { paymentId, orderId, amount, paymentMethod })
        }
    }, [paymentId, orderId, amount, paymentMethod])

    return (
        <>
            <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
         <MenuFurniture props="bg-white" />
         <MenuCategory />
         </div>
            
            <div className="payment-success md:py-20 py-10">
                <div className="container">
                    <div className="content-main flex flex-col items-center text-center">
                        <div className="icon-success w-20 h-20 bg-green rounded-full flex items-center justify-center mb-8">
                            <Icon.CheckCircle className="text-white text-4xl" />
                        </div>
                        
                        <h1 className="heading3 mb-4">
                            {isCOD ? 'Order Placed Successfully!' : 'Payment Successful!'}
                        </h1>
                        <p className="text-secondary text-lg mb-8 max-w-md">
                            {isCOD 
                                ? 'Thank you for your order! Your order has been successfully placed and will be processed shortly. Payment will be collected upon delivery.'
                                : 'Thank you for your purchase. Your order has been successfully placed and will be processed shortly.'
                            }
                        </p>
                        
                        {(orderId || paymentId || amount) && (
                            <div className="order-details bg-surface p-6 rounded-lg mb-8 max-w-md w-full">
                                <h3 className="heading6 mb-4">
                                    {isCOD ? 'Order Details' : 'Payment Details'}
                                </h3>
                                <div className="details-list space-y-2 text-sm">
                                    {orderId && (
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Order ID:</span>
                                            <span className="font-medium">{orderId}</span>
                                        </div>
                                    )}
                                    {paymentId && (
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Payment ID:</span>
                                            <span className="font-medium">{paymentId}</span>
                                        </div>
                                    )}
                                    {amount && (
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Amount:</span>
                                            <span className="font-medium">₹{amount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-secondary">Payment Method:</span>
                                        <span className="font-medium">
                                            {isCOD ? 'Cash on Delivery' : 'Online Payment'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="actions flex justify-center">
                            <Link href="/shop/breadcrumb1" className="button-main">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </>
    )
}

export default PaymentSuccess
