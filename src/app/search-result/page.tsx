'use client'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'
import { ProductType } from '@/type/ProductType'
import Product from '@/components/Product/Product'
import HandlePagination from '@/components/Other/HandlePagination'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'
import { FirebaseProductType, convertFirebaseToUIProduct } from '@/type/FirebaseProductType'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import SliderFurniture from '@/components/Slider/SliderFurniture'

const SearchResult = () => {
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(0);
    const productsPerPage = 8;
    const offset = currentPage * productsPerPage;
    const [allProducts, setAllProducts] = useState<ProductType[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()

    const handleSearch = (value: string) => {
        router.push(`/search-result?query=${value}`)
        setSearchKeyword('')
    }

    const searchParams = useSearchParams()
    let query = searchParams.get('query') as string

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                setError(null)
                const productsRef = ref(database, '/products')
                const snapshot = await get(productsRef)
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    const list: ProductType[] = Object.entries(data).map(([id, value]) => {
                        const fb = { id, ...(value as any) } as FirebaseProductType
                        return convertFirebaseToUIProduct(fb)
                    })
                    setAllProducts(list)
                } else {
                    setAllProducts([])
                }
            } catch (e) {
                setError('Failed to load products')
                setAllProducts([])
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [])

    let filteredData: ProductType[] = allProducts
    if (query && query.trim().length > 0) {
        const q = query.toLowerCase()
        filteredData = allProducts.filter((product) => {
            const tagsText = Array.isArray((product as any).tags)
                ? ((product as any).tags as any[]).map(t => (t?.name || '')).join(' ').toLowerCase()
                : ''
            return (
                product.name.toLowerCase().includes(q) ||
                product.type.toLowerCase().includes(q) ||
                (product.brand || '').toLowerCase().includes(q) ||
                (product.slug || '').toLowerCase().includes(q) ||
                tagsText.includes(q)
            )
        })
    }

    if (filteredData.length === 0) {
        filteredData = [{
            id: 'no-data',
            category: 'no-data',
            type: 'no-data',
            name: 'no-data',
            gender: 'no-data',
            new: false,
            sale: false,
            rate: 0,
            price: 0,
            originPrice: 0,
            brand: 'no-data',
            sold: 0,
            quantity: 0,
            quantityPurchase: 0,
            sizes: [],
            variation: [],
            thumbImage: [],
            images: [],
            description: 'no-data',
            action: 'no-data',
            slug: 'no-data'
        }];
    }


    // Find page number base on filteredData
    const pageCount = Math.ceil(filteredData.length / productsPerPage);

    // If page number 0, set current page = 0
    if (pageCount === 0) {
        setCurrentPage(0);
    }

    // Get product data for current page
    let currentProducts: ProductType[];

    if (filteredData.length > 0) {
        currentProducts = filteredData.slice(offset, offset + productsPerPage);
    } else {
        currentProducts = []
    }

    const handlePageChange = (selected: number) => {
        setCurrentPage(selected);
    };


    if (loading) {
        return (
            <>
                 <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
         <MenuFurniture props="bg-white" />
         <MenuCategory />
         <SliderFurniture />
        </div>

                <div className="shop-product breadcrumb1 lg:py-20 md:py-14 py-10">
                    <div className="container">
                        <div className="list-product hide-product-sold grid lg:grid-cols-4 sm:grid-cols-3 grid-cols-2 sm:gap-[30px] gap-[20px] mt-5">
                            {Array.from({ length: productsPerPage }).map((_, idx) => (
                                <div key={`sr-skel-${idx}`} className='animate-pulse bg-gray-200 rounded-2xl aspect-[3/4]' />
                            ))}
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    if (error) {
        return (
            <>
                <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
         <MenuFurniture props="bg-white" />
         <MenuCategory />
         <SliderFurniture />
        </div>

                <div className="shop-product breadcrumb1 lg:py-20 md:py-14 py-10">
                    <div className="container">
                        <div className="text-center text-secondary">{error}</div>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    return (
        <>
             <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
         <MenuFurniture props="bg-white" />
         <MenuCategory />
         <SliderFurniture />
        </div>

            <div className="shop-product breadcrumb1 lg:py-20 md:py-14 py-10">
                <div className="container">
                    <div className="heading flex flex-col items-center">
                        <div className="heading4 text-center">Found {filteredData.length} results for {String.raw`"`}{query}{String.raw`"`}</div>
                        <div className="input-block lg:w-1/2 sm:w-3/5 w-full md:h-[52px] h-[44px] sm:mt-8 mt-5">
                            <div className='w-full h-full relative'>
                                <input
                                    type="text"
                                    placeholder='Search...'
                                    className='caption1 w-full h-full pl-4 md:pr-[150px] pr-32 rounded-xl border border-line'
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchKeyword)}
                                />
                                <button
                                    className='button-main absolute top-1 bottom-1 right-1 flex items-center justify-center'
                                    onClick={() => handleSearch(searchKeyword)}
                                >
                                    search
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="list-product-block relative md:pt-10 pt-6">
                        <div className="heading6">product Search: {query}</div>
                        <div className={`list-product hide-product-sold grid lg:grid-cols-4 sm:grid-cols-3 grid-cols-2 sm:gap-[30px] gap-[20px] mt-5`}>
                            {currentProducts.map((item) => (
                                item.id === 'no-data' ? (
                                    <div key={item.id} className="no-data-product">No products match the selected criteria.</div>
                                ) : (
                                    <Product key={item.id} data={item} type='grid' style='style-1' />
                                )
                            ))}
                        </div>

                        {pageCount > 1 && (
                            <div className="list-pagination flex items-center justify-center md:mt-10 mt-7">
                                <HandlePagination pageCount={pageCount} onPageChange={handlePageChange} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default SearchResult