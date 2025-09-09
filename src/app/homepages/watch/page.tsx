import React from 'react'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuWatch from '@/components/Header/Menu/MenuWatch'
import SliderWatch from '@/components/Slider/SliderWatch'
import Category from '@/components/Home1/Collection'
import TabFeature from '@/components/Home1/TabFeatures'
import Banner from '@/components/Home1/Banner'
import Benefit from '@/components/Home1/Benefit'
import productData from '@/data/Product.json'
import FeaturedProduct from '@/components/Home1/WhatNewOne'
import TrendingProduct from '@/components/Home3/TrendingProduct'
import PopularProduct from '@/components/Home1/WhatNewOne'
import Instagram from '@/components/Home1/Instagram'
import Brand from '@/components/Home6/Brand'
import Footer from '@/components/Footer/Footer'
import ModalNewsletter from '@/components/Modal/ModalNewsletter'

export default function HomeWatch() {
    return (
        <>
            <div className="bg-black style-watch">
                <TopNavOne props="style-one bg-black" slogan='New customers save 10% with the code GET10' />
                <div id="header" className='relative w-full'>
                    <MenuWatch props="bg-green" />
                    <SliderWatch />
                </div>
                <Category />
                <TabFeature data={productData} start={0} limit={5} />
                <Banner />
                <FeaturedProduct data={productData} start={0} limit={4} />
                <TrendingProduct data={productData} start={0} limit={8} />
                <PopularProduct data={productData} start={0} limit={8} />
                <Benefit props="md:py-[60px] py-8 style-watch md:mt-20 mt-10" />
                <Instagram />
                <Brand />
                <div className="style-watch">
                    <Footer />
                </div>
            </div>
            <ModalNewsletter />
        </>
    )
}
