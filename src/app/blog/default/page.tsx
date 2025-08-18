'use client'
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation';
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

const BlogDefault = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [blogs, setBlogs] = useState<BlogType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const productsPerPage = 3;
    const offset = currentPage * productsPerPage;
    const router = useRouter()
    const searchParams = useSearchParams()
    let dataCategory = searchParams.get('category')
    const [category, setCategory] = useState<string | null>(dataCategory);

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

    const handleCategory = (category: string) => {
        setCategory(prevCategory => prevCategory === category ? null : category)
    }

    const handleBlogClick = (blogId: string) => {
        // Go to blog detail with blogId selected
        router.push(`/blog/detail1?id=${blogId}`);
    };

    let filteredData = blogs.filter(blog => {
        let isCategoryMatched = true
        if (category) {
            isCategoryMatched = blog.category === category && blog.category !== 'underwear'
        }

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
            shortDesc: "No blogs are currently available for this category. Please check back later.",
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
                    <Breadcrumb heading='Blog Default' subHeading='Blog Default' />
                </div>
                <div className='blog default md:py-20 py-10'>
                    <div className="container">
                        <div className="flex justify-between max-md:flex-col gap-y-12">
                            <div className="left xl:w-3/4 md:w-2/3 pr-2">
                                <div className="list-blog flex flex-col md:gap-10 gap-8">
                                    {Array.from({ length: productsPerPage }).map((_, idx) => (
                                        <div key={`default-skeleton-${idx}`} className='animate-pulse'>
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
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={`rc-skel-${i}`} className='h-3 bg-gray-200 rounded w-full' />
                                        ))}
                                    </div>
                                </div>
                                <div className='mt-8'>
                                    <div className='h-4 bg-gray-200 rounded w-1/3' />
                                    <div className='mt-3 space-y-3'>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={`cat-skel-${i}`} className='h-3 bg-gray-200 rounded w-full' />
                                        ))}
                                    </div>
                                </div>
                                <div className='mt-8'>
                                    <div className='h-4 bg-gray-200 rounded w-1/4' />
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
                    <Breadcrumb heading='Blog Default' subHeading='Blog Default' />
                </div>
                <div className='blog default md:py-20 py-10'>
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
                <Breadcrumb heading='Blog Default' subHeading='Blog Default' />
            </div>
            <div className='blog default md:py-20 py-10'>
                <div className="container">
                    <div className="flex justify-between max-md:flex-col gap-y-12">
                        <div className="left xl:w-3/4 md:w-2/3 pr-2">
                            <div className="list-blog flex flex-col md:gap-10 gap-8">
                                {currentProducts.map(item => (
                                    <BlogItem key={item.id} data={item} type='style-default' />
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
                                <button>
                                    <Icon.MagnifyingGlass className='heading6 text-secondary hover:text-black duration-300 absolute top-1/2 -translate-y-1/2 right-4 cursor-pointer' />
                                </button>
                            </form>
                            <div className="recent md:mt-10 mt-6 pb-8 border-b border-line">
                                <div className="heading6">Recent Posts</div>
                                <div className="list-recent pt-1">
                                    {blogs.slice(12, 15).map(item => (
                                        <div className="item flex gap-4 mt-5 cursor-pointer" key={item.id} onClick={() => handleBlogClick(item.id)}>
                                            <Image
                                                src={item.thumbImg}
                                                width={500}
                                                height={400}
                                                alt={item.thumbImg}
                                                className='w-20 h-20 object-cover rounded-lg flex-shrink-0'
                                            />
                                            <div>
                                                <div className="blog-tag whitespace-nowrap bg-green py-0.5 px-2 rounded-full text-button-uppercase text-xs inline-block">{item.tag}</div>
                                                <div className="text-title mt-1">{item.title}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-category md:mt-10 mt-6 pb-8 border-b border-line">
                                <div className="heading6">Categories</div>
                                <div className="list-cate pt-1">
                                    <div
                                        className={`cate-item flex items-center justify-between cursor-pointer mt-3 ${category === 'fashion' ? 'active' : ''}`}
                                        onClick={() => handleCategory('fashion')}
                                    >
                                        <div className='capitalize has-line-before hover:text-black text-secondary'>Fashion</div>
                                        <div className="text-secondary2">
                                            ({blogs.filter(dataItem => dataItem.category === 'fashion').length})
                                        </div>
                                    </div>
                                    <div
                                        className={`cate-item flex items-center justify-between cursor-pointer mt-3 ${category === 'cosmetic' ? 'active' : ''}`}
                                        onClick={() => handleCategory('cosmetic')}
                                    >
                                        <div className='capitalize has-line-before hover:text-black text-secondary'>cosmetic</div>
                                        <div className="text-secondary2">
                                            ({blogs.filter(dataItem => dataItem.category === 'cosmetic').length})
                                        </div>
                                    </div>
                                    <div
                                        className={`cate-item flex items-center justify-between cursor-pointer mt-3 ${category === 'toys-kid' ? 'active' : ''}`}
                                        onClick={() => handleCategory('toys-kid')}
                                    >
                                        <div className='capitalize has-line-before hover:text-black text-secondary'>toys kid</div>
                                        <div className="text-secondary2">
                                            ({blogs.filter(dataItem => dataItem.category === 'toys-kid').length})
                                        </div>
                                    </div>
                                    <div
                                        className={`cate-item flex items-center justify-between cursor-pointer mt-3 ${category === 'yoga' ? 'active' : ''}`}
                                        onClick={() => handleCategory('yoga')}
                                    >
                                        <div className='capitalize has-line-before hover:text-black text-secondary'>yoga</div>
                                        <div className="text-secondary2">
                                            ({blogs.filter(dataItem => dataItem.category === 'yoga').length})
                                        </div>
                                    </div>
                                    <div
                                        className={`cate-item flex items-center justify-between cursor-pointer mt-3 ${category === 'organic' ? 'active' : ''}`}
                                        onClick={() => handleCategory('organic')}
                                    >
                                        <div className='capitalize has-line-before hover:text-black text-secondary'>organic</div>
                                        <div className="text-secondary2">
                                            ({blogs.filter(dataItem => dataItem.category === 'organic').length})
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="filter-tags md:mt-10 mt-6">
                                <div className="heading6">Tags Cloud</div>
                                <div className="list-tags flex items-center flex-wrap gap-3 mt-4">
                                    <div
                                        className={`tags bg-white border border-line py-1.5 px-4 rounded-full text-button-uppercase text-secondary cursor-pointer duration-300 hover:bg-black hover:text-white ${category === 'fashion' ? 'active' : ''}`}
                                        onClick={() => handleCategory('fashion')}
                                    >
                                        fashion
                                    </div>
                                    <div
                                        className={`tags bg-white border border-line py-1.5 px-4 rounded-full text-button-uppercase text-secondary cursor-pointer duration-300 hover:bg-black hover:text-white ${category === 'cosmetic' ? 'active' : ''}`}
                                        onClick={() => handleCategory('cosmetic')}
                                    >
                                        cosmetic
                                    </div>
                                    <div
                                        className={`tags bg-white border border-line py-1.5 px-4 rounded-full text-button-uppercase text-secondary cursor-pointer duration-300 hover:bg-black hover:text-white ${category === 'toy-kid' ? 'active' : ''}`}
                                        onClick={() => handleCategory('toys-kid')}
                                    >
                                        toys kid
                                    </div>
                                    <div
                                        className={`tags bg-white border border-line py-1.5 px-4 rounded-full text-button-uppercase text-secondary cursor-pointer duration-300 hover:bg-black hover:text-white ${category === 'yoga' ? 'active' : ''}`}
                                        onClick={() => handleCategory('yoga')}
                                    >
                                        yoga
                                    </div>
                                    <div
                                        className={`tags bg-white border border-line py-1.5 px-4 rounded-full text-button-uppercase text-secondary cursor-pointer duration-300 hover:bg-black hover:text-white ${category === 'organic' ? 'active' : ''}`}
                                        onClick={() => handleCategory('organic')}
                                    >
                                        organic
                                    </div>
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

export default BlogDefault