'use client'
import React, { useState } from 'react'
import Image from 'next/image';
import Link from 'next/link';
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import Footer from '@/components/Footer/Footer'
import { createData } from '@/firebase/database'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'


const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const contactData = {
                ...formData,
                timestamp: new Date().toISOString(),
                status: 'new'
            };

            await createData('Contacts/0', contactData);
            setSubmitStatus('success');
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            console.error('Error submitting contact form:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
        



            <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
         <MenuFurniture props="bg-white" />
         <MenuCategory />
         <Breadcrumb heading='Contact us' subHeading='Contact us' />
         </div>



            <div className='contact-us md:py-20 py-10'>
                <div className="container">
                    <div className="flex justify-between max-lg:flex-col gap-y-10">
                        <div className="left lg:w-2/3 lg:pr-4">
                            <div className="heading3">Drop Us A Line</div>
                            <div className="body1 text-secondary2 mt-3">Use the form below to get in touch with the sales team</div>
                            
                            {submitStatus === 'success' && (
                                <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                    Thank you! Your message has been sent successfully.
                                </div>
                            )}
                            
                            {submitStatus === 'error' && (
                                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                    Sorry! There was an error sending your message. Please try again.
                                </div>
                            )}

                            <form className="md:mt-6 mt-4" onSubmit={handleSubmit}>
                                <div className='grid sm:grid-cols-2 grid-cols-1 gap-4 gap-y-5'>
                                    <div className="name ">
                                        <input 
                                            className="border-line px-4 py-3 w-full rounded-lg" 
                                            id="name" 
                                            type="text" 
                                            placeholder="Your Name *" 
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required 
                                        />
                                    </div>
                                    <div className="email">
                                        <input 
                                            className="border-line px-4 pt-3 pb-3 w-full rounded-lg" 
                                            id="email" 
                                            type="email" 
                                            placeholder="Your Email *" 
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required 
                                        />
                                    </div>
                                    <div className="message sm:col-span-2">
                                        <textarea 
                                            className="border-line px-4 pt-3 pb-3 w-full rounded-lg" 
                                            id="message" 
                                            rows={3} 
                                            placeholder="Your Message *" 
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="block-button md:mt-6 mt-4">
                                    <button 
                                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send message'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className="right lg:w-1/4 lg:pl-4">
                            <div className="item">
                                <div className="heading4">Our Store</div>
                                <p className="mt-3">9F ,sunpaul blueberry dezeria,Kakkanad,Ernakulam</p>
                                <p className="mt-3">Phone: <span className='whitespace-nowrap'>+91 8590318931</span></p>
                                <p className="mt-1">Email: <span className='whitespace-nowrap'>smeraasinnovate@gmail.com</span></p>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default ContactUs