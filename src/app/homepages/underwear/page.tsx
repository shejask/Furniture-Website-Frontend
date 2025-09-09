import React from 'react'
import TopNavThree from '@/components/Header/TopNav/TopNavThree'
import MenuFour from '@/components/Header/Menu/MenuFour'
import SliderUnderwear from '@/components/Slider/SliderUnderwear'
import BannerTop from '@/components/Home3/BannerTop'
import Collection from '@/components/Home1/Collection'
import productData from '@/data/Product.json'
import TabFeatures from '@/components/Home1/TabFeatures'
import FeaturedProduct from '@/components/Home1/WhatNewOne'
import LookBook from '@/components/Home1/Banner'
import TrendingProduct from '@/components/Home3/TrendingProduct'
import testimonialData from '@/data/Testimonial.json'
import Testimonial from '@/components/Home1/Testimonial'
import blogData from '@/data/Blog.json'
import OurBlog from '@/components/Home3/NewsInsight'
import Instagram from '@/components/Home1/Instagram'
import Brand from '@/components/Home1/Brand'
import Benefit from '@/components/Home1/Benefit'
import Footer from '@/components/Footer/Footer'
import ModalNewsletter from '@/components/Modal/ModalNewsletter'

export default function HomeUnderwear() {
    return (
        <>
            <TopNavThree props="style-three bg-white" />
            <div id="header" className='relative w-full'>
                <MenuFour props="bg-white" />
                <BannerTop props="bg-black py-3" textColor='text-white' bgLine='bg-white' />
                <SliderUnderwear />
            </div>
            <Collection />
            <TabFeatures data={productData} start={0} limit={4} />
            <FeaturedProduct data={productData} start={0} limit={4} />
            <LookBook />
            <TrendingProduct data={productData} start={0} limit={8} />
            <Testimonial data={testimonialData} limit={6} />
            <OurBlog data={blogData} start={3} limit={6} />
            <Brand />
            <Instagram />
            <Benefit props="py-[60px]" />
            <Footer />
            <ModalNewsletter />
        </>
    )
}
