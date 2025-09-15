'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'
import { resetPassword } from '@/firebase/auth'
import * as Icon from "@phosphor-icons/react/dist/ssr";

const ForgotPassword = () => {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
    const [emailSent, setEmailSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (!email) {
            setMessage({ type: 'error', text: 'Please enter your email address' })
            setLoading(false)
            return
        }

        try {
            await resetPassword(email)
            setMessage({ type: 'success', text: 'Password reset link sent successfully! Please check your email inbox and spam folder for the reset instructions.' })
            setEmailSent(true)
        } catch (error: any) {
            let errorMessage = 'Unable to send password reset link. Please try again.';
            if (error.message.includes('user-not-found')) {
                errorMessage = 'No account found with this email address. Please check your email or create a new account.';
            } else if (error.message.includes('too-many-requests')) {
                errorMessage = 'Too many reset attempts. Please wait a few minutes before trying again.';
            } else if (error.message.includes('invalid-email')) {
                errorMessage = 'Please enter a valid email address.';
            }
            setMessage({ type: 'error', text: errorMessage })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <TopNavOne props="style-one bg-black" slogan="New customers save 10% with the code GET10" />
            <div id="header" className='relative w-full'>
                <MenuOne props="bg-transparent" />
                <Breadcrumb heading='Reset Password' subHeading='Secure password recovery for your account' />
            </div>
            <div className="forgot-pass md:py-20 py-10">
                <div className="container">
                    <div className="content-main flex gap-y-8 max-md:flex-col">
                        <div className="left md:w-1/2 w-full lg:pr-[60px] md:pr-[40px] md:border-r border-line">
                            <div className="heading4">Reset Your Password</div>
                            <div className="body1 mt-2">
                                {emailSent 
                                    ? 'Password reset instructions have been sent to your email address. Please check your inbox and spam folder for the secure reset link.' 
                                    : 'Enter your email address below and we\'ll send you a secure link to reset your password. This ensures only you can access your account.'
                                }
                            </div>
                            
                            {message && (
                                <div className={`p-4 rounded-lg mt-4 ${
                                    message.type === 'success' 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                    {message.text}
                                </div>
                            )}

                            {!emailSent ? (
                                <form onSubmit={handleSubmit} className="md:mt-7 mt-4">
                                    <div className="email">
                                        <input 
                                            className="border-line px-4 pt-3 pb-3 w-full rounded-lg" 
                                            id="email" 
                                            type="email" 
                                            placeholder="Enter your registered email address *" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required  
                                        />
                                    </div>
                                    <div className="block-button md:mt-7 mt-4">
                                        <button 
                                            type="submit"
                                            className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ 
                                                backgroundColor: '#16a34a', 
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                            disabled={loading}
                                        >
                                            {loading ? 'Sending Secure Link...' : 'Send Password Reset Link'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="md:mt-7 mt-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                                        <Icon.CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                        <h6 className="heading6 text-green-800 mb-2">Password Reset Link Sent!</h6>
                                        <p className="text-green-700 mb-4">
                                            A secure password reset link has been sent to your email address. Click the link in your email to create a new password for your account.
                                        </p>

                                        <div className="flex gap-3 justify-center">
                                            <button 
                                                onClick={() => {
                                                    setEmailSent(false)
                                                    setEmail('')
                                                    setMessage(null)
                                                }}
                                                className="py-2 px-4 rounded-lg font-medium transition-all duration-300"
                                                style={{ 
                                                    backgroundColor: '#16a34a', 
                                                    color: 'white',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Send Another Reset Link
                                            </button>
                                            <Link 
                                                href="/login" 
                                                className="py-2 px-4 rounded-lg font-medium transition-all duration-300"
                                                style={{ 
                                                    backgroundColor: '#2563eb', 
                                                    color: 'white',
                                                    textDecoration: 'none',
                                                    display: 'inline-block'
                                                }}
                                            >
                                                Back to Login
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="right md:w-1/2 w-full lg:pl-[60px] md:pl-[40px] flex items-center">
                            <div className="text-content">
                                <div className="heading4">New to Our Store?</div>
                                <div className="mt-2 text-secondary">Join thousands of satisfied customers and discover our premium furniture collection. Create your account today to enjoy exclusive benefits, personalized recommendations, and secure shopping experience.</div>
                                <div className="block-button md:mt-7 mt-4">
                                    <Link href={'/register'} className="button-main">Create Account</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default ForgotPassword