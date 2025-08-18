'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css/bundle';
import { TestimonialType } from '@/type/TestimonialType'
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'

interface Props {
    limit?: number;
}

const Testimonial: React.FC<Props> = ({ limit = 10 }) => {
    const [testimonials, setTestimonials] = useState<TestimonialType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch testimonials from Firebase
            const testimonialsRef = ref(database, '/testimonials');
            const snapshot = await get(testimonialsRef);
            
            if (snapshot.exists()) {
                const testimonialsData: TestimonialType[] = [];
                snapshot.forEach((childSnapshot) => {
                    testimonialsData.push({
                        id: childSnapshot.key!,
                        ...childSnapshot.val()
                    });
                });
                
                // Sort by createdAt date (newest first) with safe fallbacks
                testimonialsData.sort((a, b) => {
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    return timeB - timeA;
                });
                setTestimonials(testimonialsData);
            }
        } catch (err) {
            console.error('Error fetching testimonials:', err);
            setError('Failed to load testimonials');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    if (loading) {
        return (
            <div className="testimonial-block mt-20">
                <div className="container">
                    <div className="content bg-surface overflow-hidden xl:-mx-5 rounded-3xl md:py-[60px] py-8">
                        <div className="heading3 text-center">Happy Clients</div>
                        <div className="text-center py-8">
                            <div className="text-secondary">Loading testimonials...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="testimonial-block mt-20">
                <div className="container">
                    <div className="content bg-surface overflow-hidden xl:-mx-5 rounded-3xl md:py-[60px] py-8">
                        <div className="heading3 text-center">Happy Clients</div>
                        <div className="text-center py-8">
                            <div className="text-red-500">{error}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (testimonials.length === 0) {
        return (
            <div className="testimonial-block mt-20">
                <div className="container">
                    <div className="content bg-surface overflow-hidden xl:-mx-5 rounded-3xl md:py-[60px] py-8">
                        <div className="heading3 text-center">Happy Clients</div>
                        <div className="text-center py-8">
                            <div className="text-secondary">No testimonials available</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="testimonial-block mt-20">
                <div className="container">
                    <div className="content bg-surface overflow-hidden xl:-mx-5 rounded-3xl md:py-[60px] py-8">
                        <div className="heading3 text-center">Happy Clients</div>
                        <div className="list-testi w-full section-swiper-navigation style-center style-small-border mt-5">
                            <Swiper
                                slidesPerView={1}
                                loop={true}
                                navigation
                                modules={[Navigation]}
                                className='h-full'
                            >
                                {testimonials.slice(0, limit).map((testimonial, index) => (
                                    <SwiperSlide key={testimonial.id}>
                                        <div className="testi-item flex flex-col items-center justify-center xl:px-[120px] md:px-[60px] px-8">
                                            <div className="desc heading4 font-medium text-center">{testimonial.description}</div>
                                            <div className="infor flex flex-col items-center justify-center mt-10">
                                                <div className="avatar w-20 h-20 rounded-full overflow-hidden">
                                                    <Image
                                                        src={testimonial.imageUrl || '/images/avatar/1.png'}
                                                        width={80}
                                                        height={80}
                                                        alt={testimonial.altText || testimonial.name || 'Testimonial avatar'}
                                                        className='w-full h-full object-cover'
                                                    />
                                                </div>
                                                <div className="name body1 font-semibold uppercase mt-5">{testimonial.name}</div>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Testimonial