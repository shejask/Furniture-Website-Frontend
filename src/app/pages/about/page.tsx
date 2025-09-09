'use client'
import React from 'react'
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import Benefit from '@/components/Home1/Benefit'
import Newsletter from '@/components/Home4/Newsletter'
import Instagram from '@/components/Home6/Instagram'
import Brand from '@/components/Home1/Brand'
import Footer from '@/components/Footer/Footer'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import BannerTop from '@/components/Home3/BannerTop'
import Testimonial from '@/components/Furniture/Testimonial'


const AboutUs = () => {
    return (
        <>
          
            <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
         <MenuFurniture props="bg-white" />
         <MenuCategory />
         {/* <Breadcrumb heading='About Us' subHeading='About Us' /> */}
         </div>


            <div className='about md:pt-20 pt-10'>
                <div className="about-us-block">
                    <div className="container">
                        <div className="text flex items-center justify-center">
                            <div className="content md:w-5/6 w-full">
                                <div className="heading3 text-center">Welcome to Shopping LaLa — India’s vibrant and fast-growing online multi-vendor marketplace.</div>
                                <div className="body1 text-center md:mt-7 mt-5">Shopping LaLa is operated by SMERAAS INNOVATE PVT LTD, a registered private limited company. We empower sellers across India to showcase their products and connect with customers through a seamless and trusted shopping experience.</div>
                            </div>
                        </div>
                        <div className="list-img grid sm:grid-cols-3 gap-[30px] md:pt-20 pt-10">
                            <div className="bg-img">
                                <Image
                                    src={'https://img.freepik.com/free-photo/picture-frame-by-velvet-armchair_53876-132788.jpg?t=st=1757420047~exp=1757423647~hmac=cf62eec93559bd0ef30dc7d078df06e100cb217b40b628e24543cd971af37de6&w=1480'}
                                    width={2000}
                                    height={3000}
                                    alt='bg-img'
                                    className='w-full rounded-[30px]'
                                />
                            </div>
                            <div className="bg-img">
                                <Image
                                    src={'https://img.freepik.com/free-photo/wooden-sideboard-table-with-books-vase_53876-144976.jpg?t=st=1757419828~exp=1757423428~hmac=4f98af3d695bb3a964ed798659775720a62d116ddaa6e65c14ff396e96ee33c4&w=1480'}
                                    width={2000}
                                    height={3000}
                                    alt='bg-img'
                                    className='w-full rounded-[30px]'
                                />
                            </div>
                            <div className="bg-img">
                                <Image
                                    src={'https://img.freepik.com/free-photo/grey-comfortable-armchair-isolated-white-background_181624-25295.jpg?t=st=1757420009~exp=1757423609~hmac=0ae0bd7bed6ecc1a444da54de19ae4989c522dbba935dc4ea76d3344faa6a42a&w=1060'}
                                    width={2000}
                                    height={3000}
                                    alt='bg-img'
                                    className='w-full rounded-[30px]'
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Benefit props="md:pt-20 pt-10" />
            <Newsletter props="bg-green md:mt-20 mt-10" />
            
            <Testimonial   limit={4} />
            <Instagram />

             <Footer />
        </>
    )
}

export default AboutUs