'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import NewsInsight from '@/components/Home3/NewsInsight';
import Footer from '@/components/Footer/Footer'
import { useRouter } from 'next/navigation'
import { fetchBlogById, fetchBlogs } from '@/firebase/blogs'
import { BlogType } from '@/type/BlogType'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'

const BlogDetailOne = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [blogMain, setBlogMain] = useState<BlogType | null>(null);
    const [allBlogs, setAllBlogs] = useState<BlogType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const blogId: string = searchParams.get('id') ?? '1'

    useEffect(() => {
        const loadBlogData = async () => {
            try {
                setLoading(true);
                // Fetch the specific blog
                const blog = await fetchBlogById(blogId);
                if (blog) {
                    setBlogMain(blog);
                } else {
                    setError('Blog not found');
                }
                
                // Fetch all blogs for navigation and related content
                const blogs = await fetchBlogs();
                setAllBlogs(blogs);
            } catch (err) {
                setError('Failed to load blog');
                console.error('Error loading blog:', err);
            } finally {
                setLoading(false);
            }
        };

        loadBlogData();
    }, [blogId]);

    const handleBlogClick = (category: string) => {
        // Go to blog detail with category selected
        router.push(`/blog/default?category=${category}`);
    };

    const handleBlogDetail = (id: string) => {
        // Go to blog detail with id selected
        router.push(`/blog/detail1?id=${id}`);
    };

    if (loading) {
        return (
            <>
                <TopNavOne props="style-one bg-black" slogan="New customers save 10% with the code GET10" />
                <div id="header" className='relative w-full'>
                    <MenuOne props="bg-white" />
                </div>
                <div className='blog detail1'>
                    <div className="container md:pt-20 pt-10">
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading blog...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !blogMain) {
        return (
            <>
               
               <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />

            <MenuFurniture props="bg-white" />
            <MenuCategory />
             </div>


                <div className='blog detail1'>
                    <div className="container md:pt-20 pt-10">
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <p className="text-red-600 mb-4">{error || 'Blog not found'}</p>
                                <button 
                                    onClick={() => router.push('/blog/grid')} 
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Back to Blogs
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
             </div>

             
            <div className='blog detail1'>
                <div className="container md:pt-20 pt-10">
                    <div className="blog-content flex items-center justify-center">
                        <div className="main md:w-5/6 w-full">
                            <div className="heading3">{blogMain.title}</div>
                            <div className="author flex items-center gap-4 mt-4">
                                <div className='flex items-center gap-2'>
                                    <div className="caption1 text-secondary">{blogMain.date}</div>
                                </div>
                            </div>
                            <div className="content md:mt-8 mt-5">
                                <div className="body1">{blogMain.description}</div>
                                {blogMain.content && (
                                    <div className="body1 mt-3">{blogMain.content}</div>
                                )}
                                {blogMain.subImg && blogMain.subImg.length > 0 && (
                                    <div className="grid sm:grid-cols-2 gap-[30px] md:mt-8 mt-5">
                                        {blogMain.subImg.map((item, index) => (
                                            <Image
                                                key={index}
                                                src={item}
                                                width={3000}
                                                height={2000}
                                                alt={item}
                                                className='w-full rounded-3xl'
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="action flex items-center justify-end flex-wrap gap-5 md:mt-8 mt-5">
                                <div className="right flex items-center gap-3 flex-wrap">
                                    <p>Share:</p>
                                    <div className="list flex items-center gap-3 flex-wrap">
                                        <Link href={'https://www.facebook.com/'} target='_blank' className='bg-surface w-10 h-10 flex items-center justify-center rounded-full duration-300 hover:bg-black hover:text-white'>
                                            <div className="icon-facebook duration-100"></div>
                                        </Link>
                                        <Link href={'https://www.instagram.com/'} target='_blank' className='bg-surface w-10 h-10 flex items-center justify-center rounded-full duration-300 hover:bg-black hover:text-white'>
                                            <div className="icon-instagram duration-100"></div>
                                        </Link>
                                        <Link href={'https://www.twitter.com/'} target='_blank' className='bg-surface w-10 h-10 flex items-center justify-center rounded-full duration-300 hover:bg-black hover:text-white'>
                                            <div className="icon-twitter duration-100"></div>
                                        </Link>
                                        <Link href={'https://www.youtube.com/'} target='_blank' className='bg-surface w-10 h-10 flex items-center justify-center rounded-full duration-300 hover:bg-black hover:text-white'>
                                            <div className="icon-youtube duration-100"></div>
                                        </Link>
                                        <Link href={'https://www.pinterest.com/'} target='_blank' className='bg-surface w-10 h-10 flex items-center justify-center rounded-full duration-300 hover:bg-black hover:text-white'>
                                            <div className="icon-pinterest duration-100"></div>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <div className='md:pb-20 pb-10'>
                    <NewsInsight data={allBlogs} start={0} limit={3} />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default BlogDetailOne