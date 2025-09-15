'use client'
import React, { useEffect, useState } from 'react'
import Footer from '@/components/Footer/Footer'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import BannerTop from '@/components/Home3/BannerTop'

interface FaqItem {
    id: string
    question: string
    answer: string
    createdAt?: string
    updatedAt?: string
}

const Faqs = () => {
    const [activeQuestion, setActiveQuestion] = useState<string | undefined>('')
    const [faqs, setFaqs] = useState<FaqItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const handleActiveQuestion = (question: string) => {
        setActiveQuestion(prevQuestion => prevQuestion === question ? undefined : question)
    }

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                setLoading(true)
                setError(null)
                const faqsRef = ref(database, '/faqs')
                const snapshot = await get(faqsRef)
                if (snapshot.exists()) {
                    const data = snapshot.val() as Record<string, any>
                    const list: FaqItem[] = Object.entries(data).map(([id, value]) => ({
                        id,
                        question: value?.question || '',
                        answer: value?.answer || '',
                        createdAt: value?.createdAt,
                        updatedAt: value?.updatedAt
                    }))
                    // Sort newest first (most recent createdAt appears first)
                    list.sort((a, b) => {
                        const dateA = new Date(a.createdAt || 0).getTime()
                        const dateB = new Date(b.createdAt || 0).getTime()
                        return dateB - dateA // Descending order (newest first)
                    })
                    
                    // Debug: Log the sorted FAQs to see the order
                    console.log('Sorted FAQs:', list.map(f => ({ id: f.id, createdAt: f.createdAt, question: f.question.substring(0, 50) + '...' })))
                    
                    setFaqs(list)
                } else {
                    setFaqs([])
                }
            } catch (e) {
                setError('Failed to load FAQs')
            } finally {
                setLoading(false)
            }
        }
        fetchFaqs()
    }, [])

    if (loading) {
        return (
            <>
                <div id="header" className='relative w-full'>
                    <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                    <MenuFurniture props="bg-white" />
                    <MenuCategory />
                </div>

                <div className='faqs-block md:py-20 py-10'>
                    <div className="container">
                        <div className="flex justify-between">
                            <div className="left w-1/4">
                                <div className="menu-tab flex flex-col gap-5">
                                    {Array.from({ length: 6 }).map((_, idx) => (
                                        <div key={`tab-skel-${idx}`} className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                    ))}
                                </div>
                            </div>
                            <div className="right w-2/3 space-y-4">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <div key={`q-skel-${idx}`} className='px-7 py-5 rounded-[20px] border border-line'>
                                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-3 w-full bg-gray-200 rounded animate-pulse mt-3"></div>
                                        <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse mt-2"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    if (error) {
        return (
            <>
                <div id="header" className='relative w-full'>
                    <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                    <MenuFurniture props="bg-white" />
                    <MenuCategory />
                </div>
                <div className='faqs-block md:py-20 py-10'>
                    <div className="container">
                        <div className="text-center text-secondary">{error}</div>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    if (faqs.length > 0) {
        return (
            <>
                <div id="header" className='relative w-full'>
                    <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                    <MenuFurniture props="bg-white" />
                    <MenuCategory />
                </div>
                <div className='faqs-block md:py-20 py-10'>
                    <div className="container">
                        <div className="flex justify-between">
                            <div className="left w-1/4">
                                <div className="menu-tab flex flex-col gap-5">
                                    <div className="tab-item inline-block w-fit heading6 has-line-before text-secondary2 hover:text-black duration-300 active">All FAQs</div>
                                </div>
                            </div>
                            <div className="right w-2/3">
                                <div className={`tab-question flex flex-col gap-5 active`}>
                                    {faqs.map((f, idx) => (
                                        <div
                                            key={f.id}
                                            className={`question-item px-7 py-5 rounded-[20px] overflow-hidden border border-line cursor-pointer ${activeQuestion === f.id ? 'open' : ''}`}
                                            onClick={() => handleActiveQuestion(f.id)}
                                        >
                                            <div className="heading flex items-center justify-between gap-6">
                                                <div className="heading6">{f.question}</div>
                                                <Icon.CaretRight size={24} />
                                            </div>
                                            <div className="content body1 text-secondary">{f.answer}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    return (
        <>
            <div id="header" className='relative w-full'>
                <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                <MenuFurniture props="bg-white" />
                <MenuCategory />
            </div>
            <div className='faqs-block md:py-20 py-10'>
                <div className="container">
                    <div className="text-center text-secondary">No FAQs available. Please add some FAQs to Firebase.</div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Faqs