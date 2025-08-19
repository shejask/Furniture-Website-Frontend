'use client'

import React, { useState, useEffect, useCallback } from 'react'
import 'swiper/css/bundle';
import Product from '../Product/Product'
import { ProductType } from '@/type/ProductType'
import { motion } from 'framer-motion'
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'
import { FirebaseProductType, convertFirebaseToUIProduct } from '@/type/FirebaseProductType'

interface Props {
    start: number;
    limit: number;
}

const TabFeatures: React.FC<Props> = ({ start, limit }) => {
    const [activeTab, setActiveTab] = useState<string>('on sale')
    const [products, setProducts] = useState<ProductType[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState<number>(0)

    // Test Firebase connection on component mount
    useEffect(() => {
        const testFirebase = async () => {
            try {
                console.log('🧪 Testing Firebase connection...')
                const testRef = ref(database, '/')
                const snapshot = await get(testRef)
                console.log('✅ Firebase connected! Root data keys:', Object.keys(snapshot.val() || {}))
            } catch (err) {
                console.error('❌ Firebase connection failed:', err)
            }
        }
        testFirebase()
    }, [])

    const fetchProducts = useCallback(async (tab: string, retry: boolean = false) => {
        setLoading(true)
        setError(null)
        
        try {
            // Try Firebase first
            const productsRef = ref(database, '/products')
            const snapshot = await get(productsRef)
            
            if (snapshot.exists()) {
                const data = snapshot.val()
                console.log('🔥 Raw Firebase data received:', Object.keys(data).length, 'products')
                
                const productsList = Object.entries(data)
                    .map(([id, value]): FirebaseProductType => ({
                        id,
                        ...(value as Omit<FirebaseProductType, 'id'>)
                    }))
                    .filter(product => {
                        // More lenient status filtering
                        const status = product.status?.toLowerCase()
                        return !status || status === 'enabled' || status === 'true' || status === 'active'
                    })
                
                console.log('✅ Enabled products after filtering:', productsList.length)
                console.log('✅ Sample product structure:', productsList[0])
                console.log('✅ Sample product keys:', productsList[0] ? Object.keys(productsList[0]) : 'No products')
                console.log('✅ Sample product trending value:', productsList[0]?.trending)
                console.log('✅ Sample product bestSeller value:', productsList[0]?.bestSeller)
                console.log('✅ Sample product onSale value:', productsList[0]?.onSale)
                console.log('✅ Sample product newArrivals value:', productsList[0]?.newArrivals)
                console.log('✅ Sample product salePrice value:', productsList[0]?.salePrice)
                console.log('✅ Sample product price value:', productsList[0]?.price)

                let filteredProducts: FirebaseProductType[] = []

                switch (tab) {
                    case 'best sellers':
                        // Strict condition: only show products with bestSeller: true
                        filteredProducts = productsList.filter(product => product.bestSeller === true)
                        console.log('🔥 Best sellers - bestSeller: true products found:', filteredProducts.length)
                        break
                    case 'new arrivals':
                        // Strict condition: only show products with newArrivals: true
                        filteredProducts = productsList.filter(product => product.newArrivals === true)
                        console.log('🔥 New arrivals - newArrivals: true products found:', filteredProducts.length)
                        break
                    case 'on sale':
                        // Strict condition: only show products with onSale: true
                        filteredProducts = productsList.filter(product => product.onSale === true)
                        console.log('🔥 On sale - onSale: true products found:', filteredProducts.length)
                        break
                    default:
                        // Default: show first 8 products
                        filteredProducts = productsList.slice(0, 8)
                        console.log('🔥 Default - showing first 8 products')
                }

                // Convert to UI format
                const uiProducts = filteredProducts.map(product => convertFirebaseToUIProduct(product))
                setProducts(uiProducts)
                
                console.log('✅ Firebase products loaded:', uiProducts.length)
                console.log('✅ Final filtered products for tab "' + tab + '":', filteredProducts.length)
                console.log('✅ UI products created:', uiProducts.length)
            } else {
                throw new Error('No Firebase data')
            }
        } catch (error) {
            console.log('Firebase failed, using demo products')
            console.error('Firebase error details:', error)
            // Create demo products for each tab
            const demoProducts = [
                {
                    id: 'demo1',
                    name: 'Demo Product 1 - ' + tab,
                    price: 1200,
                    originPrice: 1200,
                    salePrice: tab === 'on sale' ? 900 : 1200,
                    thumbImage: ['/images/product/1000x1000.png'],
                    images: ['/images/product/1000x1000.png'],
                    description: 'Demo product for ' + tab,
                    category: 'furniture',
                    trending: tab === 'best sellers',
                    new: tab === 'new arrivals',
                    sale: tab === 'on sale',
                    stockStatus: 'in_stock',
                    slug: 'demo-product-1',
                    sku: 'DEMO1',
                    quantity: 20,
                    sold: 10,
                    type: 'physical',
                    status: 'enabled',
                    isActive: true,
                    variation: [],
                    sizes: [],
                    rate: 5,
                    review: 0,
                    gender: '',
                    brand: '',
                    action: 'add to cart',
                    quantityPurchase: 1
                },
                {
                    id: 'demo2',
                    name: 'Demo Product 2 - ' + tab,
                    price: 1800,
                    originPrice: 1800,
                    salePrice: tab === 'on sale' ? 1400 : 1800,
                    thumbImage: ['/images/product/1000x1000.png'],
                    images: ['/images/product/1000x1000.png'],
                    description: 'Another demo product for ' + tab,
                    category: 'furniture',
                    trending: tab === 'best sellers',
                    new: tab === 'new arrivals',
                    sale: tab === 'on sale',
                    stockStatus: 'in_stock',
                    slug: 'demo-product-2',
                    sku: 'DEMO2',
                    quantity: 25,
                    sold: 15,
                    type: 'physical',
                    status: 'enabled',
                    isActive: true,
                    variation: [],
                    sizes: [],
                    rate: 4,
                    review: 0,
                    gender: '',
                    brand: '',
                    action: 'add to cart',
                    quantityPurchase: 1
                }
            ]
            setProducts(demoProducts)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        console.log('🚀 TabFeatures useEffect triggered for tab:', activeTab)
        fetchProducts(activeTab)
    }, [activeTab, fetchProducts])

    // Add debugging for component state
    useEffect(() => {
        console.log('📊 Component state:', { 
            loading, 
            error, 
            productsCount: products.length, 
            activeTab 
        })
    }, [loading, error, products.length, activeTab])

    const handleTabClick = (item: string) => {
        setActiveTab(item)
    }

    const handleRetry = () => {
        fetchProducts(activeTab, true)
    }

    const filteredProducts = products.slice(start, start + limit)
    
    // Ensure we always have products to show
    if (filteredProducts.length === 0 && !loading) {
        console.log('⚠️ No products to display, this might indicate an issue')
    }

    if (loading) {
        return (
            <div className="tab-features-block md:pt-20 pt-10">
                <div className="container">
                    <div className="heading flex flex-col items-center text-center">
                        <div className="menu-tab flex items-center gap-2 p-1 bg-surface rounded-2xl">
                            {['best sellers', 'on sale', 'new arrivals'].map((item, index) => (
                                <div
                                    key={index}
                                    className={`tab-item relative text-secondary heading5 py-2 px-5 cursor-pointer duration-500 hover:text-black ${activeTab === item ? 'active' : ''}`}
                                    onClick={() => handleTabClick(item)}
                                >
                                    {activeTab === item && (
                                        <motion.div layoutId='active-pill' className='absolute inset-0 rounded-2xl bg-white'></motion.div>
                                    )}
                                    <span className='relative heading5 z-[1]'>
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center items-center md:mt-10 mt-6 py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-secondary">Loading products...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="tab-features-block md:pt-20 pt-10">
                <div className="container">
                    <div className="heading flex flex-col items-center text-center">
                        <div className="menu-tab flex items-center gap-2 p-1 bg-surface rounded-2xl">
                            {['best sellers', 'on sale', 'new arrivals'].map((item, index) => (
                                <div
                                    key={index}
                                    className={`tab-item relative text-secondary heading5 py-2 px-5 cursor-pointer duration-500 hover:text-black ${activeTab === item ? 'active' : ''}`}
                                    onClick={() => handleTabClick(item)}
                                >
                                    {activeTab === item ? (
                                        <motion.div layoutId='active-pill' className='absolute inset-0 rounded-2xl bg-white'></motion.div>
                                    ) : null}
                                    <span className='relative heading5 z-[1]'>
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center items-center md:mt-10 mt-6 py-20">
                        <div className="text-center">
                            <div className="text-red-500 text-lg mb-4">{error}</div>
                            <button 
                                onClick={handleRetry}
                                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                Retry
                            </button>
                            {retryCount > 0 && (
                                <p className="text-sm text-gray-500 mt-2">Retry attempt: {retryCount}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="tab-features-block md:pt-20 pt-10">
                <div className="container">
                    <div className="heading flex flex-col items-center text-center">
                        <div className="menu-tab flex items-center gap-2 p-1 bg-surface rounded-2xl">
                            {['best sellers', 'on sale', 'new arrivals'].map((item, index) => (
                                <div
                                    key={index}
                                    className={`tab-item relative text-secondary heading5 py-2 px-5 cursor-pointer duration-500 hover:text-black ${activeTab === item ? 'active' : ''}`}
                                    onClick={() => handleTabClick(item)}
                                >
                                    {activeTab === item && (
                                        <motion.div layoutId='active-pill' className='absolute inset-0 rounded-2xl bg-white'></motion.div>
                                    )}
                                    <span className='relative heading5 z-[1]'>
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="list-product grid lg:grid-cols-4 grid-cols-2 md:gap-[30px] gap-5 hide-product-sold section-swiper-navigation  md:mt-10 mt-6">
                            {filteredProducts.map((prd, index) => (
                                <Product key={prd.id || index} data={prd} type='grid' style='style-1' />
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center md:mt-10 mt-6 py-20">
                            <div className="text-center">
                                <p className="text-secondary text-lg">No products found for {activeTab}</p>
                                <p className="text-gray-400 mt-2">Try selecting a different category</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default TabFeatures