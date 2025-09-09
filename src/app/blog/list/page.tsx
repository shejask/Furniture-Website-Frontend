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
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { fetchBlogs } from '@/firebase/blogs'
import { BlogType } from '@/type/BlogType'

const BlogList = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [blogs, setBlogs] = useState<BlogType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const productsPerPage = 6;
    const offset = currentPage * productsPerPage;
    const router = useRouter()

    useEffect(() => {
        const loadBlogs = async () => {
            try {
                setLoading(true);
                const fetchedBlogs = await fetchBlogs();
                setBlogs(fetchedBlogs);
                setError(null);
            } catch (err) {
                setError('Failed to load blogs');
                console.error('Error loading blogs:', err);
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

    let filteredData = blogs.filter(blog => {
        let isCategoryMatched = true
        isCategoryMatched = blog.category !== 'underwear'

        return isCategoryMatched
    })

    if (filteredData.length === 0 && !loading) {
        filteredData = [{
            id: "no-data",
            category: "no-data",
            tag: "no-data",
            title: "No blogs available",
            date: "no-data",
            author: "",
            avatar: "",
            thumbImg: "",
            coverImg: "",
            subImg: [
                "",
                ""
            ],
            shortDesc: "No blogs are currently available. Please check back later.",
            description: "no-data",
            slug: "no-data"
        }];
    }

    const pageCount = Math.ceil(filteredData.length / productsPerPage);

    // Reset current page if it's out of bounds
    useEffect(() => {
        if (pageCount > 0 && currentPage >= pageCount) {
            setCurrentPage(0);
        }
    }, [pageCount, currentPage]);

    const currentProducts = filteredData.slice(offset, offset + productsPerPage);

    const handlePageChange = (selected: number) => {
        setCurrentPage(selected);
    };

    if (loading) {
        return (
            <>
                <TopNavOne props="style-one bg-black" slogan="New customers save 10% with the code GET10" />
                <div id="header" className='relative w-full'>
                    <MenuOne props="bg-transparent" />
                    <Breadcrumb heading='Blog List' subHeading='Blog List' />
                </div>
                <div className='blog list md:py-20 py-10'>
                    <div className="container">
                        <div className="flex justify-between max-md:flex-col gap-y-12">
                            <div className="left xl:w-3/4 md:w-2/3 pr-2">
                                <div className="list-blog flex flex-col md:gap-10 gap-8">
                                    {Array.from({ length: productsPerPage }).map((_, idx) => (
                                        <div key={`blog-skeleton-${idx}`} className='animate-pulse'>
                                            <div className='flex gap-4'>
                                                <div className='w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0' />
                                                <div className='flex-1'>
                                                    <div className='h-4 bg-gray-200 rounded w-2/3' />
                                                    <div className='h-3 bg-gray-200 rounded w-1/3 mt-3' />
                                                    <div className='h-3 bg-gray-200 rounded w-5/6 mt-4' />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="right xl:w-1/4 md:w-1/3 xl:pl-[52px] md:pl-8">
                                <div className='h-12 bg-gray-200 rounded-lg' />
                                <div className='mt-8'>
                                    <div className='h-4 bg-gray-200 rounded w-1/3' />
                                    <div className='mt-4 space-y-3'>
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <div key={`cat-skel-${i}`} className='h-3 bg-gray-200 rounded w-full' />
                                        ))}
                                    </div>
                                </div>
                                <div className='mt-8'>
                                    <div className='h-4 bg-gray-200 rounded w-1/3' />
                                    <div className='mt-4 space-y-4'>
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={`recent-skel-${i}`} className='flex gap-3'>
                                                <div className='w-20 h-20 bg-gray-200 rounded-lg' />
                                                <div className='flex-1'>
                                                    <div className='h-3 bg-gray-200 rounded w-2/3' />
                                                    <div className='h-3 bg-gray-200 rounded w-1/3 mt-2' />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className='mt-8'>
                                    <div className='h-4 bg-gray-200 rounded w-1/6' />
                                    <div className='mt-3 flex flex-wrap gap-2'>
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={`tag-skel-${i}`} className='h-6 w-16 bg-gray-200 rounded-full' />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <TopNavOne props="style-one bg-black" slogan="New customers save 10% with the code GET10" />
                <div id="header" className='relative w-full'>
                    <MenuOne props="bg-transparent" />
                    <Breadcrumb heading='Blog List' subHeading='Blog List' />
                </div>
                <div className='blog list md:py-20 py-10'>
                    <div className="container">
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <p className="text-red-600 mb-4">{error}</p>
                                <button 
                                    onClick={() => window.location.reload()} 
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
            <TopNavOne props="style-one bg-black" slogan="New customers save 10% with the code GET10" />
            <div id="header" className='relative w-full'>
                <MenuOne props="bg-transparent" />
                <Breadcrumb heading='Blog List' subHeading='Blog List' />
            </div>
            <div className='blog list md:py-20 py-10'>
                <div className="container">
                    <div className="flex justify-between max-md:flex-col gap-y-12">
                        <div className="left xl:w-3/4 md:w-2/3 pr-2">
                            <div className="list-blog flex flex-col md:gap-10 gap-8">
                                {currentProducts.map(item => (
                                    <BlogItem key={item.id} data={item} type='style-list' />
                                ))}
                            </div>
                            {pageCount > 1 && (
                                <div className="list-pagination w-full flex items-center justify-center md:mt-10 mt-6">
                                    <HandlePagination pageCount={pageCount} onPageChange={handlePageChange} />
                                </div>
                            )}
                        </div>
                        <div className="right xl:w-1/4 md:w-1/3 xl:pl-[52px] md:pl-8">
                            <form className='form-search relative w-full h-12'>
                                <input className='py-2 px-4 w-full h-full border border-line rounded-lg' type="text" placeholder='Search' />
                                <button className='absolute right-3 top-1/2 -translate-y-1/2'>
                                    <Icon.MagnifyingGlass size={20} />
                                </button>
                            </form>
                            <div className="categories mt-8">
                                <div className="heading6">Categories</div>
                                <div className="list-categories pt-1">
                                    <div className="item flex items-center justify-between py-2 cursor-pointer hover:text-black text-secondary">
                                        <div className='capitalize has-line-before hover:text-black text-secondary'>Fashion</div>
                                        <div className="text-secondary2">
                                            ({blogs.filter(dataItem => dataItem.category === 'fashion').length})
                                        </div>
                                    </div>
                                    <div className="item flex items-center justify-between py-2 cursor-pointer hover:text-black text-secondary">
                                        <div className='capitalize has-line-before hover:text-black text-secondary'>cosmetic</div>
                                        <div className="text-secondary2">
                                            ({blogs.filter(dataItem => dataItem.category === 'cosmetic').length})
                                        </div>
                                    </div>
                                    <div className="item flex items-center justify-between py-2 cursor-pointer hover:text-black text-secondary">
                                        <div className='capitalize has-line-before hover:text-black text-secondary'>toys kid</div>
                                        <div className="text-secondary2">
                                            ({blogs.filter(dataItem => dataItem.category === 'toys-kid').length})
                                        </div>
                                    </div>
                                    <div className="item flex items-center justify-between py-2 cursor-pointer hover:text-black text-secondary">
                                        <div className='capitalize has-line-before hover:text-black text-secondary'>yoga</div>
                                        <div className="text-secondary2">
                                            ({blogs.filter(dataItem => dataItem.category === 'yoga').length})
                                        </div>
                                    </div>
                                    <div className="item flex items-center justify-between py-2 cursor-pointer hover:text-black text-secondary">
                                        <div className='capitalize has-line-before hover:text-black text-secondary'>organic</div>
                                        <div className="text-secondary2">
                                            ({blogs.filter(dataItem => dataItem.category === 'organic').length})
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="recent-posts mt-8">
                                <div className="heading6">Recent Posts</div>
                                <div className="list-recent pt-1">
                                    {blogs.slice(12, 15).map(item => (
                                        <div className="item flex gap-4 mt-5 cursor-pointer" key={item.id} onClick={() => handleBlogClick(item.id)}>
                                            <Image
                                                src={item.thumbImg}
                                                width={80}
                                                height={80}
                                                alt='blog-img'
                                                className='w-20 h-20 rounded-lg object-cover flex-shrink-0'
                                            />
                                            <div className="content">
                                                <div className="text-button-uppercase">{item.title}</div>
                                                <div className="caption1 text-secondary mt-1">{item.date}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="tags mt-8">
                                <div className="heading6">Tags</div>
                                <div className="list-tags pt-1 flex flex-wrap gap-2">
                                    <div className="tag bg-surface py-1 px-3 rounded-full text-button-uppercase cursor-pointer duration-300 hover:bg-black hover:text-white">fashion</div>
                                    <div className="tag bg-surface py-1 px-3 rounded-full text-button-uppercase cursor-pointer duration-300 hover:bg-black hover:text-white">cosmetic</div>
                                    <div className="tag bg-surface py-1 px-3 rounded-full text-button-uppercase cursor-pointer duration-300 hover:bg-black hover:text-white">toys</div>
                                    <div className="tag bg-surface py-1 px-3 rounded-full text-button-uppercase cursor-pointer duration-300 hover:bg-black hover:text-white">yoga</div>
                                    <div className="tag bg-surface py-1 px-3 rounded-full text-button-uppercase cursor-pointer duration-300 hover:bg-black hover:text-white">organic</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default BlogList