'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createDataWithAutoId } from '@/firebase/database'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'
import { fetchCategories } from '@/firebase/categories'
import { CategoryType } from '@/type/CategoryType'

const BecomeSellerPage = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        pan: '',
        gst: '',
        email: '',
        mobile: '',
        categoryId: ''
    })
    const [categories, setCategories] = useState<CategoryType[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const run = async () => {
            const cats = await fetchCategories()
            setCategories(cats)
        }
        run()
    }, [])

    const selectedCategory = useMemo(() => categories.find(c => c.id === formData.categoryId), [categories, formData.categoryId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitStatus('idle')
        setError(null)

        try {
            if (!formData.businessName || !formData.pan) {
                setError('Business name and PAN are required.')
                setIsSubmitting(false)
                return
            }
            if (!formData.email && !formData.mobile) {
                setError('Please provide at least one contact: email or mobile.')
                setIsSubmitting(false)
                return
            }

            const payload = {
                businessName: formData.businessName,
                pan: formData.pan,
                gst: formData.gst || undefined,
                email: formData.email || undefined,
                mobile: formData.mobile || undefined,
                categoryId: formData.categoryId || undefined,
                categoryName: selectedCategory?.name,
                source: 'become-a-seller',
                timestamp: new Date().toISOString(),
                status: 'new'
            }
            await createDataWithAutoId('vendors_signups', payload)
            setSubmitStatus('success')
            setFormData({ businessName: '', pan: '', gst: '', email: '', mobile: '', categoryId: '' })
        } catch (err) {
            setSubmitStatus('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
        <div id="header" className='relative w-full'>
            <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
            <MenuFurniture props="bg-white" />
            <MenuCategory />
            <Breadcrumb heading='Become a Seller' subHeading='Become a Seller' />
        </div>
        <div className="container md:py-16 py-10">
            

            <div className='contact-us md:py-10 py-6'>
                <div className="container px-0">
                    <div className="flex justify-between max-lg:flex-col gap-y-10">
                        <div className="left lg:w-2/3 lg:pr-4">
                            <div className="heading3">Vendor Registration</div>
                            <div className="body1 text-secondary2 mt-3">We{String.raw`'`}ll get back to you shortly after you submit your details.</div>

                            {submitStatus === 'success' && (
                                <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                    Thank you! Your request has been submitted successfully.
                                </div>
                            )}

                            {submitStatus === 'error' && (
                                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                    Sorry! There was an error. Please try again.
                                </div>
                            )}

                            <form className="md:mt-6 mt-4" onSubmit={handleSubmit}>
                                <div className='grid sm:grid-cols-2 grid-cols-1 gap-4 gap-y-5'>
                                    <div>
                                        <input
                                            className="border-line px-4 py-3 w-full rounded-lg"
                                            id="businessName"
                                            type="text"
                                            placeholder="Business name *"
                                            value={formData.businessName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <input
                                            className="border-line px-4 py-3 w-full rounded-lg"
                                            id="pan"
                                            type="text"
                                            placeholder="PAN *"
                                            value={formData.pan}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <input
                                            className="border-line px-4 py-3 w-full rounded-lg"
                                            id="gst"
                                            type="text"
                                            placeholder="GST (optional)"
                                            value={formData.gst}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            className="border-line px-4 py-3 w-full rounded-lg"
                                            id="mobile"
                                            type="text"
                                            placeholder="Mobile"
                                            value={formData.mobile}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            className="border-line px-4 py-3 w-full rounded-lg"
                                            id="email"
                                            type="email"
                                            placeholder="Email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <select
                                            id="categoryId"
                                            className="border-line px-4 py-3 w-full rounded-lg"
                                            value={formData.categoryId}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
                                <div className="block-button md:mt-6 mt-4">
                                    <button
                                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Register as Vendor'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className="right lg:w-1/4 lg:pl-4">
                            <aside className="p-6 rounded-xl border border-line h-fit">
                                <div className="heading4">FAQs</div>
                                <div className="mt-4 space-y-3 text-sm">
                                    <div>
                                        <div className="font-medium">What commission is charged?</div>
                                        <p>Commission depends on the category and will be shared post approval.</p>
                                    </div>
                                    <div>
                                        <div className="font-medium">How is delivery handled?</div>
                                        <p>We integrate with logistics partners. You pack; we pick and ship.</p>
                                    </div>
                                    <div>
                                        <div className="font-medium">Is there seller support?</div>
                                        <p>Yes, dedicated onboarding and catalog support is available.</p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <Footer />
        </>
    )
}

export default BecomeSellerPage


