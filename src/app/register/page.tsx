'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { signUp } from '@/firebase/auth'
import { createData } from '@/firebase/database';
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import BannerTop from '@/components/Home3/BannerTop'

const Register = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        country_code: '91',
        agreeToTerms: false
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
            if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName || !formData.phone) {
                throw new Error('Please fill in all required fields');
            }
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Passwords do not match');
            }
            if (!formData.agreeToTerms) {
                throw new Error('Please agree to the Terms of Use');
            }

            // Create user with email and password
            const userCredential = await signUp(formData.email, formData.password);
            const uid = userCredential.uid;

            // Prepare user data
            const userData = {
                uid,
                email: formData.email,
                fullName: formData.fullName,
                phone: parseInt(formData.phone),
                country_code: formData.country_code,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save user data to Realtime Database
            await createData(`customers/${uid}`, userData);

            // Save essential data to localStorage
            const localStorageData = {
                uid,
                name: formData.fullName,
                email: formData.email
            };
            localStorage.setItem('user', JSON.stringify(localStorageData));

            // Redirect to home page after successful registration
            router.push('/');
        } catch (err: any) {
            let errorMessage = 'Unable to create your account. Please try again.';
            
            if (err.message.includes('email-already-in-use')) {
                errorMessage = 'An account with this email address already exists. Please try logging in instead.';
            } else if (err.message.includes('weak-password')) {
                errorMessage = 'Password is too weak. Please choose a stronger password with at least 6 characters.';
            } else if (err.message.includes('invalid-email')) {
                errorMessage = 'Please enter a valid email address.';
            } else if (err.message.includes('operation-not-allowed')) {
                errorMessage = 'Account creation is temporarily disabled. Please try again later.';
            } else if (err.message.includes('network-request-failed')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (err.message.includes('too-many-requests')) {
                errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
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
         <Breadcrumb heading='Create An Account' subHeading='Create An Account' />
        </div>




            <div className="register-block md:py-20 py-10">
                <div className="container">
                    <div className="content-main flex gap-y-8 max-md:flex-col">
                        <div className="left md:w-1/2 w-full lg:pr-[60px] md:pr-[40px] md:border-r border-line">
                            <div className="heading4">Register</div>
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
                                <div className="fullname mt-5">
                                    <input 
                                        className="border-line px-4 pt-3 pb-3 w-full rounded-lg" 
                                        id="fullName" 
                                        type="text" 
                                        placeholder="Full Name *" 
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>

                                <div className="phone mt-5 flex gap-2">
                                    <input 
                                        className="border-line px-4 pt-3 pb-3 w-[80px] rounded-lg" 
                                        id="country_code" 
                                        type="text" 
                                        placeholder="+91" 
                                        value={formData.country_code}
                                        onChange={handleChange}
                                        required 
                                    />
                                    <input 
                                        className="border-line px-4 pt-3 pb-3 w-full rounded-lg" 
                                        id="phone" 
                                        type="tel" 
                                        placeholder="Phone Number *" 
                                        value={formData.phone}
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
                                <div className="confirm-pass mt-5">
                                    <input 
                                        className="border-line px-4 pt-3 pb-3 w-full rounded-lg" 
                                        id="confirmPassword" 
                                        type="password" 
                                        placeholder="Confirm Password *" 
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>
                                <div className='flex items-center mt-5'>
                                    <div className="block-input">
                                        <input
                                            type="checkbox"
                                            id="agreeToTerms"
                                            checked={formData.agreeToTerms}
                                            onChange={handleChange}
                                        />
                                        <Icon.CheckSquare size={20} weight='fill' className='icon-checkbox' />
                                    </div>
                                    <label htmlFor='agreeToTerms' className="pl-2 cursor-pointer text-secondary2">I agree to the
                                        <Link href={'/terms-and-conditions'} className='text-black hover:underline pl-1'>Terms of User</Link>
                                    </label>
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
                                        {loading ? 'Registering...' : 'Register'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className="right md:w-1/2 w-full lg:pl-[60px] md:pl-[40px] flex items-center">
                            <div className="text-content">
                                <div className="heading4">Already have an account?</div>
                                <div className="mt-2 text-secondary">Welcome back. Sign in to access your personalized experience, saved preferences, and more. We{String.raw`'re`} thrilled to have you with us again!</div>
                                <div className="block-button md:mt-7 mt-4">
                                    <Link href={'/login'} className="button-main">Login</Link>
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

export default Register