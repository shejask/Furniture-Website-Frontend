'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import BlogItem from '@/components/Blog/BlogItem';
import Footer from '@/components/Footer/Footer'
import HandlePagination from '@/components/Other/HandlePagination'
import { useRouter } from 'next/navigation'
import { fetchBlogs } from '@/firebase/blogs'
import { BlogType } from '@/type/BlogType'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import SliderFurniture from '@/components/Slider/SliderFurniture'

const BlogGrid = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [blogs, setBlogs] = useState<BlogType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const productsPerPage = 9;
    const offset = currentPage * productsPerPage;
    const router = useRouter()

    // Fetch blogs from Firebase on component mount
    useEffect(() => {
        const loadBlogs = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedBlogs = await fetchBlogs();
                setBlogs(fetchedBlogs);
            } catch (err) {
                console.error('Error loading blogs:', err);
                setError('Failed to load blogs. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadBlogs();
    }, []);

    const handleBlogClick = (blogId: string) => {
        // Go to blog detail with blogId selected
        router.push(`/blog/detail1?id=${blogId}`);
    };

    // Filter blogs (excluding underwear category as in original code)
    let filteredData = blogs.filter(blog => {
        let isCategoryMatched = true;
        isCategoryMatched = blog.category !== 'underwear';
        return isCategoryMatched;
    });

    // Handle empty state
    if (filteredData.length === 0 && !loading && !error) {
        filteredData = [{
            id: "no-data",
            category: "no-data",
            tag: "no-data",
            title: "No blogs found",
            date: "no-data",
            author: "",
            avatar: "",
            thumbImg: "",
            coverImg: "",
            subImg: ["", ""],
            shortDesc: "No blogs available at the moment.",
            description: "no-data",
            slug: "no-data"
        }];
    }

    const pageCount = Math.ceil(filteredData.length / productsPerPage);

    // Reset to first page if current page is out of bounds
    useEffect(() => {
        if (pageCount > 0 && currentPage >= pageCount) {
            setCurrentPage(0);
        }
    }, [pageCount, currentPage]);

    const currentProducts = filteredData.slice(offset, offset + productsPerPage);

    const handlePageChange = (selected: number) => {
        setCurrentPage(selected);
    };

    // Loading state with skeleton cards
    if (loading) {
        return (
            <>
                 <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />

            <MenuFurniture props="bg-white" />
            <MenuCategory />
         </div>  
                <div className='blog grid md:py-20 py-10'>
                    <div className="container">
                        <div className="list-blog grid lg:grid-cols-3 sm:grid-cols-2 md:gap-[42px] gap-8">
                            {Array.from({ length: productsPerPage }).map((_, idx) => (
                                <div key={`skeleton-${idx}`} className="animate-pulse">
                                    <div className="rounded-2xl overflow-hidden bg-white">
                                        <div className="w-full h-48 bg-gray-200" />
                                        <div className="p-4">
                                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2 mt-3" />
                                            <div className="h-3 bg-gray-200 rounded w-full mt-4" />
                                            <div className="h-3 bg-gray-200 rounded w-5/6 mt-2" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // Error state
    if (error) {
        return (
            <>
                    <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />

            <MenuFurniture props="bg-white" />
            <MenuCategory />
         </div>
        <Breadcrumb heading='Blogs' subHeading='Blogs' />

                <div className='blog grid md:py-20 py-10'>
                    <div className="container">
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                                <h3 className="text-xl font-semibold mb-2">Error Loading Blogs</h3>
                                <p className="text-gray-600 mb-4">{error}</p>
                                <button 
                                    onClick={() => window.location.reload()} 
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            
            <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />

            <MenuFurniture props="bg-white" />
            <MenuCategory />
            <Breadcrumb heading='Blogs' subHeading='Blogs' />
            </div>

             



            <div className='blog grid md:py-20 py-10'>
                <div className="container">
                    <div className="list-blog grid lg:grid-cols-3 sm:grid-cols-2 md:gap-[42px] gap-8">
                        {currentProducts.map(item => (
                            <BlogItem key={item.id} data={item} type='style-one' />
                        ))}
                    </div>
                    {pageCount > 1 && (
                        <div className="list-pagination w-full flex items-center justify-center md:mt-10 mt-6">
                            <HandlePagination pageCount={pageCount} onPageChange={handlePageChange} />
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    )
}

export default BlogGrid