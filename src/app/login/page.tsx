'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { signIn } from '@/firebase/auth'
import { readData } from '@/firebase/database';
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import BannerTop from '@/components/Home3/BannerTop'


const Login = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validate form
            if (!formData.email || !formData.password) {
                throw new Error('Please fill in all required fields');
            }

            // Sign in user
            const userCredential = await signIn(formData.email, formData.password);
            const uid = userCredential.uid;

            // Get user data from database
            const userData = await readData(`customers/${uid}`);

            // Save essential data to localStorage
            const localStorageData = {
                uid,
                name: userData.fullName,
                email: userData.email
            };
            localStorage.setItem('user', JSON.stringify(localStorageData));

            // Redirect to home page
            router.push('/');
        } catch (err: any) {
            let errorMessage = 'Unable to sign in. Please try again.';
            
            if (err.message.includes('user-not-found')) {
                errorMessage = 'No account found with this email address. Please check your email or create a new account.';
            } else if (err.message.includes('wrong-password')) {
                errorMessage = 'Incorrect password. Please try again or reset your password.';
            } else if (err.message.includes('invalid-email')) {
                errorMessage = 'Please enter a valid email address.';
            } else if (err.message.includes('user-disabled')) {
                errorMessage = 'This account has been disabled. Please contact support.';
            } else if (err.message.includes('too-many-requests')) {
                errorMessage = 'Too many failed attempts. Please wait a few minutes before trying again.';
            } else if (err.message.includes('network-request-failed')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (err.message.includes('invalid-credential')) {
                errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
    

<div id="header" className='relative w-full'>
<BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
 <MenuFurniture props="bg-white" />
 <MenuCategory />
 <Breadcrumb heading='Login' subHeading='Login' />
 </div>


            <div className="login-block md:py-20 py-10">
                <div className="container">
                    <div className="content-main flex gap-y-8 max-md:flex-col">
                        <div className="left md:w-1/2 w-full lg:pr-[60px] md:pr-[40px] md:border-r border-line">
                            <div className="heading4">Login</div>
                            <form className="md:mt-7 mt-4" onSubmit={handleSubmit}>
                                <div className="email">
                                    <input 
                                        className="border-line px-4 pt-3 pb-3 w-full rounded-lg" 
                                        id="email" 
                                        type="email" 
                                        placeholder="Email address *" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>
                                <div className="pass mt-5">
                                    <input 
                                        className="border-line px-4 pt-3 pb-3 w-full rounded-lg" 
                                        id="password" 
                                        type="password" 
                                        placeholder="Password *" 
                                        value={formData.password}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-5">
                                    <div className='flex items-center'>
                                        <div className="block-input">
                                            <input
                                                type="checkbox"
                                                id="remember"
                                                checked={formData.remember}
                                                onChange={handleChange}
                                            />
                                            <Icon.CheckSquare size={20} weight='fill' className='icon-checkbox' />
                                        </div>
                                        <label htmlFor='remember' className="pl-2 cursor-pointer">Remember me</label>
                                    </div>
                                    <Link href={'/forgot-password'} className='font-semibold text-blue-600 hover:text-blue-800 hover:underline'>Forgot Your Password?</Link>
                                </div>
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                                        <div className="flex items-center">
                                            <Icon.WarningCircle size={20} className="text-red-500 mr-2" />
                                            <span className="text-red-800 font-medium">{error}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="block-button md:mt-7 mt-4">
                                    <button 
                                        type="submit" 
                                        className="button-main w-full bg-black text-white py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300"
                                        disabled={loading}
                                    >
                                        {loading ? 'Logging in...' : 'Login'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className="right md:w-1/2 w-full lg:pl-[60px] md:pl-[40px] flex items-center">
                            <div className="text-content">
                                <div className="heading4">New Customer</div>
                                <div className="mt-2 text-secondary">Be part of our growing family of new customers! Join us today and unlock a world of exclusive benefits, offers, and personalized experiences.</div>
                                <div className="block-button md:mt-7 mt-4">
                                    <Link href={'/register'} className="button-main">Register</Link>
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

export default Login