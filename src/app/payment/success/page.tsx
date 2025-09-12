'use client'
import React, { useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'
import * as Icon from "@phosphor-icons/react/dist/ssr"

const PaymentSuccess = () => {
    const searchParams = useSearchParams()
    const paymentId = searchParams.get('payment_id')
    const orderId = searchParams.get('order_id')
    const amount = searchParams.get('amount')

    useEffect(() => {
        // You can add analytics tracking here
        if (typeof window !== 'undefined') {
            // Track successful payment
            console.log('Payment successful:', { paymentId, orderId, amount })
        }
    }, [paymentId, orderId, amount])

    return (
        <>
            <TopNavOne props="style-one bg-black" slogan="New customers save 10% with the code GET10" />
            <div id="header" className='relative w-full'>
                <MenuOne props="bg-transparent" />
                <Breadcrumb heading='Payment Success' subHeading='Payment Success' />
            </div>
            
            <div className="payment-success md:py-20 py-10">
                <div className="container">
                    <div className="content-main flex flex-col items-center text-center">
                        <div className="icon-success w-20 h-20 bg-green rounded-full flex items-center justify-center mb-8">
                            <Icon.CheckCircle className="text-white text-4xl" />
                        </div>
                        
                        <h1 className="heading3 mb-4">Payment Successful!</h1>
                        <p className="text-secondary text-lg mb-8 max-w-md">
                            Thank you for your purchase. Your order has been successfully placed and will be processed shortly.
                        </p>
                        
                        {paymentId && (
                            <div className="payment-details bg-surface p-6 rounded-lg mb-8 max-w-md w-full">
                                <h3 className="heading6 mb-4">Payment Details</h3>
                                <div className="details-list space-y-2 text-sm">
                                    {paymentId && (
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Payment ID:</span>
                                            <span className="font-medium">{paymentId}</span>
                                        </div>
                                    )}
                                    {orderId && (
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Order ID:</span>
                                            <span className="font-medium">{orderId}</span>
                                        </div>
                                    )}
                                    {amount && (
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Amount:</span>
                                            <span className="font-medium">₹{amount}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="actions flex flex-col sm:flex-row gap-4">
                            <Link href="/order-tracking" className="button-main">
                                Track Your Order
                            </Link>
                            <Link href="/shop/breadcrumb1" className="button-main bg-white text-black border border-line hover:bg-black hover:text-white">
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
