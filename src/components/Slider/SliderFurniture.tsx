'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css/bundle';
import 'swiper/css/effect-fade';
import { ref, get } from 'firebase/database';
import { database } from '@/firebase/config';

interface BannerData {
    id: string;
    altText: string;
    createdAt: string;
    description: string;
    displayOrder: number;
    endDate?: string; // Made optional
    imageUrl: string;
    isActive?: boolean; // Made optional
    linkUrl: string;
    startDate?: string; // Made optional
    title: string;
    type: string;
    updatedAt: string;
}


const SliderFurniture = () => {
    const [banners, setBanners] = useState<BannerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                // Get all banners from media node
                const mediaRef = ref(database, '/media');
                const snapshot = await get(mediaRef);
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    // Convert the data object to an array of entries with their IDs
                    const bannerEntries = Object.entries(data).map(([id, value]) => ({
                        id,
                        ...(value as object)
                    }));
                    
                    const activeBanners = bannerEntries
                        .filter((item): item is BannerData => {
                            const banner = item as BannerData;
                            if (!banner || typeof banner !== 'object') return false;

                            // Only include banner-type media
                            if (banner.type !== 'banner') return false;
                            // If isActive is explicitly false, exclude; otherwise treat as active
                            if (banner.isActive === false) return false;

                            // Exclude expired banners (when endDate provided)
                            if (banner.endDate) {
                                const now = new Date();
                                const endDate = new Date(banner.endDate);
                                if (endDate < now) return false;
                            }

                            // Optional: respect startDate if present
                            if (banner.startDate) {
                                const now = new Date();
                                const startDate = new Date(banner.startDate);
                                if (startDate > now) return false;
                            }

                            return true;
                        })
                        // Sort by displayOrder (asc), then createdAt (desc)
                        .sort((a, b) => {
                            const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : Number.MAX_SAFE_INTEGER;
                            const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : Number.MAX_SAFE_INTEGER;
                            if (orderA !== orderB) return orderA - orderB;
                            const dateA = new Date(a.createdAt || 0).getTime();
                            const dateB = new Date(b.createdAt || 0).getTime();
                            return dateB - dateA;
                        });
                    setBanners(activeBanners as BannerData[]);
                }
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch banner data');
                setLoading(false);
                console.error('Error fetching banners:', err);
            }
        };

        fetchBanners();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-[320px]">Loading...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-[320px] text-red-500">{error}</div>;
    }

    if (banners.length === 0) {
        return <div className="flex items-center justify-center h-[320px]">No active banners found</div>;
    }

    return (
        <>
            <div className="slider-block style-two bg-linear 2xl:h-[520px] xl:h-[480px] lg:h-[440px] md:h-[400px] sm:h-[360px] h-[320px] w-full">
                <div className="slider-main h-full w-full">
                    <Swiper
                        spaceBetween={0}
                        slidesPerView={1}
                        loop={banners.length > 1}
                        pagination={{ clickable: true }}
                        modules={[Pagination, Autoplay]}
                        className='h-full relative'
                        autoplay={banners.length > 1 ? {
                            delay: 4000,
                            disableOnInteraction: false
                        } : false}
                    >
                        {banners.map((banner, index) => (
                            <SwiperSlide key={index}>
                                <div className="slider-item h-full w-full relative">
                                    <div className="container w-full h-full flex flex-col text-center items-center justify-center">
                                        <div className="text-content sm:w-[55%] w-2/3">
                                            <div className="text-display text-center md:mt-5 mt-2">{banner.title}</div>
                                            <div className="body1 mt-4 text-center">{banner.description}</div>
                                            <Link href={banner.linkUrl} className="button-main bg-green text-black md:mt-4 mt-3">Shop Now</Link>
                                        </div>
                                        <div className="sub-img absolute left-0 top-0 w-full h-full z-[-1]">
                                            <Image
                                                src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `/${banner.imageUrl}`}
                                                width={2560}
                                                height={1080}
                                                alt={banner.altText}
                                                priority={true}
                                                className='w-full h-full object-cover'
                                                unoptimized={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </>
    )
}

export default SliderFurniture