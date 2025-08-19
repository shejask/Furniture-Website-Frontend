'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'
import { BannerType } from '@/type/ProductType'

const FlashSale = () => {
    const [flashSaleData, setFlashSaleData] = useState<BannerType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFlashSaleData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch banner with type: "home-advertisement"
            const bannersRef = ref(database, '/media');
            const snapshot = await get(bannersRef);
            
            if (snapshot.exists()) {
                let foundBanner: BannerType | null = null;
                snapshot.forEach((childSnapshot) => {
                    const banner = childSnapshot.val();
                    // Check if banner type matches "home-advertisement"
                    if (banner.type === 'home-advertisement') {
                        // Check if end date is valid and not expired (if provided)
                        if (banner.endDate) {
                            const now = new Date();
                            const endDate = new Date(banner.endDate);
                            if (endDate >= now) {
                                foundBanner = {
                                    id: childSnapshot.key!,
                                    ...banner
                                };
                            }
                        } else {
                            // No end date provided, assume banner is always valid
                            foundBanner = {
                                id: childSnapshot.key!,
                                ...banner
                            };
                        }
                    }
                });
                
                setFlashSaleData(foundBanner);
            }
        } catch (err) {
            console.error('Error fetching flash sale data:', err);
            setError('Failed to load flash sale data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlashSaleData();
    }, []);

    if (loading) {
        return (
            <div className="container md:pt-20 pt-10">
                <div className="flash-sale-block bg-surface flex items-center max-sm:justify-center relative overflow-hidden rounded-[32px] w-full h-full">
                    <div className="text-content basis-1/2 flex flex-col items-center text-center px-8 lg:py-24 md:py-14 py-10">
                        <div className="text-secondary">Loading flash sale...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container md:pt-20 pt-10">
                <div className="flash-sale-block bg-surface flex items-center max-sm:justify-center relative overflow-hidden rounded-[32px] w-full h-full">
                    <div className="text-content basis-1/2 flex flex-col items-center text-center px-8 lg:py-24 md:py-14 py-10">
                        <div className="text-red-500">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!flashSaleData) {
        return (
            <div className="container md:pt-20 pt-10">
                <div className="flash-sale-block bg-surface flex items-center max-sm:justify-center relative overflow-hidden rounded-[32px] w-full h-full">
                    <div className="text-content basis-1/2 flex flex-col items-center text-center px-8 lg:py-24 md:py-14 py-10">
                        <div className="text-secondary">No flash sale available</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="container md:pt-20 pt-10">
                <div className="flash-sale-block bg-surface flex items-center max-sm:justify-center relative overflow-hidden rounded-[32px] w-full h-full">
                    <div className="text-content basis-1/2 flex flex-col items-center text-center px-8 lg:py-24 md:py-14 py-10">
                        <div className="heading2">{flashSaleData.title}</div>
                        <div className="body1 mt-3">{flashSaleData.description}</div>
                        <Link href={flashSaleData.linkUrl || '/shop/breadcrumb-img'} className='button-main lg:mt-9 md:mt-6 mt-4'>Get it now</Link>
                    </div>
                    <div className="bg-img absolute right-0 top-0 bottom-0 pl-6 w-1/2 h-full max-sm:hidden">
                        <Image
                            src={flashSaleData.imageUrl}
                            width={1000}
                            height={1000}
                            alt={flashSaleData.altText || 'Flash sale background'}
                            priority={true}
                            className='w-full h-full object-cover'
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default FlashSale