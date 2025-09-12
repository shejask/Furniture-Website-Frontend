'use client'
import React, { useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'
import * as Icon from "@phosphor-icons/react/dist/ssr"

const PaymentFailure = () => {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const orderId = searchParams.get('order_id')

    useEffect(() => {
        // You can add analytics tracking here
        if (typeof window !== 'undefined') {
            // Track failed payment
            console.log('Payment failed:', { error, orderId })
        }
    }, [error, orderId])

    return (
        <>
            <TopNavOne props="style-one bg-black" slogan="New customers save 10% with the code GET10" />
            <div id="header" className='relative w-full'>
                <MenuOne props="bg-transparent" />
                <Breadcrumb heading='Payment Failed' subHeading='Payment Failed' />
            </div>
            
            <div className="payment-failure md:py-20 py-10">
                <div className="container">
                    <div className="content-main flex flex-col items-center text-center">
                        <div className="icon-failure w-20 h-20 bg-red rounded-full flex items-center justify-center mb-8">
                            <Icon.XCircle className="text-white text-4xl" />
                        </div>
                        
                        <h1 className="heading3 mb-4">Payment Failed</h1>
                        <p className="text-secondary text-lg mb-8 max-w-md">
                            We're sorry, but your payment could not be processed. Please try again or use a different payment method.
                        </p>
                        
                        {error && (
                            <div className="error-details bg-surface p-6 rounded-lg mb-8 max-w-md w-full">
                                <h3 className="heading6 mb-4 text-red">Error Details</h3>
                                <p className="text-sm text-secondary">{error}</p>
                            </div>
                        )}
                        
                        <div className="actions flex flex-col sm:flex-row gap-4">
                            <Link href="/checkout" className="button-main">
                                Try Again
                            </Link>
                            <Link href="/cart" className="button-main bg-white text-black border border-line hover:bg-black hover:text-white">
                                Back to Cart
                            </Link>
                        </div>
                        
                        <div className="help-section mt-12 text-center">
                            <p className="text-secondary mb-4">Need help? Contact our support team:</p>
                            <div className="contact-info flex flex-col sm:flex-row gap-4 justify-center">
                                <a href="mailto:support@furniture-store.com" className="text-button hover:underline">
                                    support@furniture-store.com
                                </a>
                                <span className="hidden sm:block text-secondary">|</span>
                                <a href="tel:+1234567890" className="text-button hover:underline">
                                    +1 (234) 567-890
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </>
    )
}

export default PaymentFailure
