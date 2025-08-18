'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { cleanImageUrl } from '@/utils/imageUrl'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import Footer from '@/components/Footer/Footer'
import HandlePagination from '@/components/Other/HandlePagination'
import { useRouter } from 'next/navigation'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'
import { BlogType } from '@/type/BlogType'

const BlogDynamic = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [blogs, setBlogs] = useState<BlogType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const productsPerPage = 6;
    const offset = currentPage * productsPerPage;
    const router = useRouter()
    const searchParams = useSearchParams()
    let dataCategory = searchParams.get('category')
    const [category, setCategory] = useState<string | null>(dataCategory);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch blogs from Firebase
            const blogsRef = ref(database, 'blogs');
            const snapshot = await get(blogsRef);
            
            if (snapshot.exists()) {
                const blogsData: BlogType[] = [];
                snapshot.forEach((childSnapshot) => {
                    const blog = childSnapshot.val();
                    // Check if blog is active (if isActive property exists)
                    if (!blog.isActive || blog.isActive === true) {
                        blogsData.push({
                            id: childSnapshot.key!,
                            ...blog
                        });
                    }
                });
                
                // Sort by createdAt date (newest first)
                blogsData.sort((a, b) => {
                    if (a.createdAt && b.createdAt) {
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    }
                    return 0;
                });
                setBlogs(blogsData);
            }
        } catch (err) {
            console.error('Error fetching blogs:', err);
            setError('Failed to load blogs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
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
            isCategoryMatched = blog.category === category
        }
        return isCategoryMatched
    })

    if (filteredData.length === 0 && !loading) {
        filteredData = [{
            id: "no-data",
            title: "No blogs found",
            category: "no-data",
            tag: "no-data",
            date: "",
            author: "Admin",
            avatar: "/images/avatar/1.png",
            thumbImg: "",
            coverImg: "",
            subImg: [""],
            shortDesc: "No blogs available in this category",
            description: "No blogs available in this category",
            slug: "no-data",
            imageUrl: "",
            createdAt: "",
            updatedAt: ""
        }];
    }

    const pageCount = Math.ceil(filteredData.length / productsPerPage);

    // If page number 0, set current page = 0
    if (pageCount === 0) {
        setCurrentPage(0);
    }

    const currentProducts = filteredData.slice(offset, offset + productsPerPage);

    const handlePageChange = (selected: number) => {
        setCurrentPage(selected);
    };

    // Get unique categories for filtering
    const uniqueCategories = Array.from(new Set(blogs.map(blog => blog.category)));

    if (loading) {
        return (
            <>
                <TopNavOne props="style-one bg-black" slogan="New customers save 10% with the code GET10" />
                <div id="header" className='relative w-full'>
                    <MenuOne props="bg-transparent" />
                    <Breadcrumb heading='Blog' subHeading='Dynamic Blog' />
                </div>
                <div className='blog dynamic md:py-20 py-10'>
                    <div className="container">
                        <div className="text-center py-20">
                            <div className="text-secondary text-lg">Loading blogs...</div>
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
                    <Breadcrumb heading='Blog' subHeading='Dynamic Blog' />
                </div>
                <div className='blog dynamic md:py-20 py-10'>
                    <div className="container">
                        <div className="text-center py-20">
                            <div className="text-red-500 text-lg">{error}</div>
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
                <Breadcrumb heading='Blog' subHeading='Dynamic Blog' />
            </div>
            <div className='blog dynamic md:py-20 py-10'>
                <div className="container">
                    <div className="flex justify-between max-md:flex-col gap-y-12">
                        <div className="left xl:w-3/4 md:w-2/3 pr-2">
                            <div className="list-blog grid md:grid-cols-2 gap-8">
                                {currentProducts.map(item => (
                                    <div key={item.id} className="blog-item style-card h-full cursor-pointer" onClick={() => handleBlogClick(item.id)}>
                                        <div className="blog-main h-full block bg-white rounded-[20px] overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                                            <div className="blog-thumb h-48 overflow-hidden">
                                                <Image
                                                    src={cleanImageUrl(item.imageUrl || '/images/blog/1.png')}
                                                    width={400}
                                                    height={300}
                                                    alt={item.altText || item.title}
                                                    className='w-full h-full object-cover duration-500 hover:scale-105'
                                                />
                                            </div>
                                            <div className="blog-infor p-6">
                                                <div className="blog-tag bg-green py-1 px-2.5 rounded-full text-button-uppercase inline-block text-xs">{item.category}</div>
                                                <div className="heading6 blog-title mt-3 duration-300 line-clamp-2">{item.title}</div>
                                                <div className="body1 text-secondary mt-4 line-clamp-3">{item.description}</div>
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="blog-date caption1 text-secondary">
                                                        {(item.createdAt ? new Date(item.createdAt) : new Date()).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                    <div className="text-button underline text-green">Read More</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                                    {blogs.slice(0, 3).map(item => (
                                        <div className="item flex gap-4 mt-5 cursor-pointer" key={item.id} onClick={() => handleBlogClick(item.id)}>
                                            <Image
                                                src={cleanImageUrl(item.imageUrl || '/images/blog/1.png')}
                                                width={80}
                                                height={80}
                                                alt={item.altText || item.title}
                                                className='w-20 h-20 object-cover rounded-lg flex-shrink-0'
                                            />
                                            <div>
                                                <div className="blog-tag whitespace-nowrap bg-green py-0.5 px-2 rounded-full text-button-uppercase text-xs inline-block">{item.category}</div>
                                                <div className="text-title mt-1 line-clamp-2">{item.title}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-category md:mt-10 mt-6 pb-8 border-b border-line">
                                <div className="heading6">Categories</div>
                                <div className="list-cate pt-1">
                                    {uniqueCategories.map(cat => (
                                        <div
                                            key={cat}
                                            className={`cate-item flex items-center justify-between cursor-pointer mt-3 ${category === cat ? 'active' : ''}`}
                                            onClick={() => handleCategory(cat)}
                                        >
                                            <div className='capitalize has-line-before hover:text-black text-secondary'>{cat}</div>
                                            <div className="text-secondary2">
                                                ({blogs.filter(dataItem => dataItem.category === cat).length})
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-tags md:mt-10 mt-6">
                                <div className="heading6">Tags Cloud</div>
                                <div className="list-tags flex items-center flex-wrap gap-3 mt-4">
                                    {uniqueCategories.map(cat => (
                                        <div
                                            key={cat}
                                            className={`tags bg-white border border-line py-1.5 px-4 rounded-full text-button-uppercase text-secondary cursor-pointer duration-300 hover:bg-black hover:text-white ${category === cat ? 'active' : ''}`}
                                            onClick={() => handleCategory(cat)}
                                        >
                                            {cat}
                                        </div>
                                    ))}
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

export default BlogDynamic
