'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database'
import { database } from '@/firebase/config'
import { BannerType } from '@/type/ProductType'

const Banner = () => {
    const router = useRouter()
    const [banners, setBanners] = useState<BannerType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch banners with types: banner-category-1, banner-category-2, banner-category-3
            const bannersRef = ref(database, '/media');
            const snapshot = await get(bannersRef);
            
            if (snapshot.exists()) {
                const bannersData: BannerType[] = [];
                snapshot.forEach((childSnapshot) => {
                    const banner = childSnapshot.val();
                    // Check if banner type matches our criteria
                    if (banner.type && 
                        (banner.type === 'banner-category-1' || 
                         banner.type === 'banner-category-2' || 
                         banner.type === 'banner-category-3')) {
                        bannersData.push({
                            id: childSnapshot.key!,
                            ...banner
                        });
                    }
                });
                
                // Sort by displayOrder
                bannersData.sort((a, b) => a.displayOrder - b.displayOrder);
                setBanners(bannersData);
            }
        } catch (err) {
            console.error('Error fetching banners:', err);
            setError('Failed to load banners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleTypeClick = (type: string) => {
        router.push(`/shop/breadcrumb1?type=${type}`);
    };

    if (loading) {
        return (
            <div className="banner-block md:pt-20 pt-10">
                <div className="container">
                    <div className="list-banner grid md:grid-cols-3 lg:gap-[30px] gap-[20px]">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={`banner-skeleton-${idx}`} className="banner-item animate-pulse">
                                <div className="banner-img w-full rounded-2xl overflow-hidden">
                                    <div className="w-full h-[220px] bg-gray-200" />
                                </div>
                                <div className="banner-content mt-3">
                                    <div className="h-5 w-2/3 bg-gray-200 rounded" />
                                    <div className="h-4 w-1/3 bg-gray-200 rounded mt-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="banner-block md:pt-20 pt-10">
                <div className="container">
                    <div className="text-center py-8">
                        <div className="text-red-500">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (banners.length === 0) {
        return null;
    }

    return (
        <>
            <div className="banner-block md:pt-20 pt-10">
                <div className="container">
                    <div className="list-banner grid md:grid-cols-3 lg:gap-[30px] gap-[20px]">
                        {banners.map((banner, index) => (
                            <div key={banner.id} className="banner-item relative block duration-500 cursor-pointer" onClick={() => handleTypeClick(banner.type)}>
                                <div className="banner-img w-full rounded-2xl overflow-hidden">
                                    <Image
                                        src={banner.imageUrl}
                                        width={600}
                                        height={400}
                                        alt={banner.altText || 'Banner image'}
                                        className='w-full duration-500'
                                    />
                                </div>
                                <div className="banner-content absolute left-[30px] bottom-[30px]">
                                    <div className="heading4">{banner.title}</div>
                                    <div className="text-button text-black relative inline-block pb-1 border-b-2 border-black duration-500 mt-2">Shop Now</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Banner