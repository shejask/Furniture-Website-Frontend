import React from 'react'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuYoga from '@/components/Header/Menu/MenuYoga'
import SliderYoga from '@/components/Slider/SliderYoga'
import productData from '@/data/Product.json'
import BestSeller from '@/components/Home1/WhatNewOne'
import Banner from '@/components/Home1/Banner'
import TabFeatures from '@/components/Home1/TabFeatures'
import WhyChooseUs from '@/components/Home1/Benefit'
import FlashSale from '@/components/Home3/FlashSale'
import blogData from '@/data/Blog.json'
import NewsInsight from '@/components/Home3/NewsInsight'
import Benefit from '@/components/Jewelry/Benefit'
import dataTestimonial from '@/data/Testimonial.json'
import Testimonial from '@/components/Home1/Testimonial'
import Instagram from '@/components/Home1/Instagram'
import Brand from '@/components/Home6/Brand'
import Footer from '@/components/Footer/Footer'
import ModalNewsletter from '@/components/Modal/ModalNewsletter'

export default function HomeYoga() {
    return (
        <>
            <TopNavOne props="style-one bg-black" slogan='New customers save 10% with the code GET10' />
            <div id="header" className='relative w-full'>
                <MenuYoga />
                <SliderYoga />
            </div>
            <BestSeller data={productData} start={0} limit={6} />
            <Banner />
            <TabFeatures data={productData} start={0} limit={4} />
            <Benefit props="py-10 bg-surface md:mt-20 mt-10" />
            <WhyChooseUs props="py-10" />
            <FlashSale />
            <NewsInsight data={blogData} start={12} limit={15} />
            <Testimonial data={dataTestimonial} limit={6} />
            <Instagram />
            <Brand />
            <Footer />
            <ModalNewsletter />
        </>
    )
}
