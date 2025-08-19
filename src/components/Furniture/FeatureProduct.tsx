'use client'

import React, { useState, useEffect } from 'react'
import Product from '../Product/Product'
import { ref, get, query, orderByChild, equalTo } from 'firebase/database'
import { database } from '@/firebase/config'
import { FirebaseProductType, convertFirebaseToUIProduct } from '@/type/FirebaseProductType'
import { motion } from 'framer-motion'

interface Props {
    start?: number;
    limit?: number;
}

const FeatureProduct: React.FC<Props> = ({ start = 0, limit = 8 }) => {
    const [products, setProducts] = useState<FirebaseProductType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<string>('all')
    const [isShowingTrending, setIsShowingTrending] = useState(false)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const productsRef = ref(database, '/products')
                // Fetch all products and filter in memory to avoid index requirement
                const snapshot = await get(productsRef)
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    console.log('🔥 Raw Firebase data:', data)
                    
                    const productsList = Object.entries(data)
                        .map(([id, value]): FirebaseProductType => ({
                            id,
                            ...(value as Omit<FirebaseProductType, 'id'>)
                        }))
                    
                    console.log('📦 All products mapped:', productsList.length)
                    console.log('📦 First product structure:', productsList[0])
                    
                    // More flexible filtering - check if fields exist and have reasonable defaults
                    const enabledProducts = productsList.filter(product => {
                        console.log('🔍 Checking product:', { 
                            id: product.id, 
                            status: product.status, 
                            stockStatus: product.stockStatus,
                            featured: product.featured,
                            trending: product.trending
                        })
                        
                        // Check for different possible field names
                        const hasStatus = product.status !== undefined
                        const hasStockStatus = product.stockStatus !== undefined
                        const hasFeatured = product.featured !== undefined
                        const hasTrending = product.trending !== undefined
                        
                        console.log('🔍 Field existence check:', {
                            hasStatus,
                            hasStockStatus,
                            hasFeatured,
                            hasTrending,
                            allFields: Object.keys(product)
                        })
                        
                        // More flexible filtering - if fields don't exist, assume they're enabled
                        const isEnabled = !hasStatus || product.status === 'enabled'
                        const isInStock = !hasStockStatus || product.stockStatus === 'in_stock'
                        
                        return isEnabled && isInStock
                    })
                    console.log('✅ Enabled & in-stock products:', enabledProducts.length)
                    
                    // Try to find featured products first
                    let featuredProducts = enabledProducts.filter(product => 
                        product.featured === true
                    )
                    
                    // If no featured products, try to find any products with featured-like fields
                    if (featuredProducts.length === 0) {
                        featuredProducts = enabledProducts.filter(product => 
                            (product as any).isFeatured === true || 
                            (product as any).featured === true ||
                            (product as any).is_featured === true
                        )
                    }
                    
                    console.log('⭐ Featured products found:', featuredProducts.length)
                    console.log('⭐ Featured products details:', featuredProducts.map(p => ({ id: p.id, name: p.name, featured: p.featured })))
                    
                    // If no featured products, fall back to trending products
                    let finalProducts = featuredProducts
                    if (featuredProducts.length === 0) {
                        let trendingProducts = enabledProducts.filter(product => 
                            product.trending === true
                        )
                        
                        // If no trending products, try alternative field names
                        if (trendingProducts.length === 0) {
                            trendingProducts = enabledProducts.filter(product => 
                                (product as any).isTrending === true || 
                                (product as any).trending === true ||
                                (product as any).is_trending === true
                            )
                        }
                        
                        // If still no products, just show all enabled products
                        if (trendingProducts.length === 0) {
                            console.log('🔥 No featured or trending products, showing all enabled products')
                            finalProducts = enabledProducts
                            setIsShowingTrending(false)
                        } else {
                            console.log('🔥 No featured products, using trending products:', trendingProducts.length)
                            console.log('🔥 Trending products details:', trendingProducts.map(p => ({ id: p.id, name: p.name, trending: p.trending })))
                            finalProducts = trendingProducts
                            setIsShowingTrending(true)
                        }
                    } else {
                        setIsShowingTrending(false)
                    }
                    
                    console.log('🎯 Final products to display:', finalProducts.length)
                    console.log('🎯 Final products details:', finalProducts.map(p => ({ id: p.id, name: p.name, featured: p.featured, trending: p.trending })))
                    setProducts(finalProducts as FirebaseProductType[])
                }
                setLoading(false)
            } catch (err) {
                console.error('Error fetching products:', err)
                if (err instanceof Error) {
                    console.log('Error details:', {
                        message: err.message,
                        stack: err.stack,
                        name: err.name
                    })
                }
                setError('Unable to load products. Please check your internet connection and try again.')
                setLoading(false)
            }

            // Set up auto-retry on error
            return () => {
                if (error) {
                    const retryTimeout = setTimeout(fetchProducts, 5000) // Retry after 5 seconds
                    return () => clearTimeout(retryTimeout)
                }
            }
        }

        fetchProducts()
    }, [error])

    if (loading) {
        return (
            <div className="whate-new-block md:pt-20 pt-10">
                <div className="container">
                    <div className="heading flex flex-col items-center text-center">
                        <div className="heading3">
                            {isShowingTrending ? 'Trending Products' : 'Featured Products'}
                        </div>
                        {isShowingTrending && (
                            <div className="text-secondary mt-2">
                                Showing trending products (no featured products available)
                            </div>
                        )}
                    </div>
                    <div className="list-product hide-product-sold grid lg:grid-cols-4 grid-cols-2 sm:gap-[30px] gap-[20px] md:mt-10 mt-6">
                        {[1, 2, 3, 4].map((_, index) => (
                            <div key={index} className="animate-pulse bg-gray-200 rounded-2xl aspect-[3/4]"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="whate-new-block md:pt-20 pt-10">
                <div className="container">
                    <div className="heading flex flex-col items-center text-center">
                        <div className="heading3">Featured Products</div>
                        <div className="text-secondary mt-4">
                            Unable to load products. Please try again later.
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <div className="whate-new-block md:pt-20 pt-10">
                <div className="container">
                    <div className="heading flex flex-col items-center text-center">
                        <div className="heading3">Featured Products</div>
                        <div className="text-secondary mt-4">
                            No featured or trending products available at the moment.
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    console.log('🔄 Render - Current products state:', products.length)
    console.log('🔄 Render - Products state details:', products.map(p => ({ id: p.id, name: p.name, featured: p.featured, trending: p.trending })))
    
    const displayProducts = products
        .slice(start, start + limit)
        .map(product => convertFirebaseToUIProduct(product))
    
    console.log('🔄 Render - Display products after conversion:', displayProducts.length)

    return (
        <>
            <div className="whate-new-block md:pt-20 pt-10">
                <div className="container">
                    <div className="heading flex flex-col items-center text-center">
                        <div className="heading3">
                            {isShowingTrending ? 'Trending Products' : 'Featured Products'}
                        </div>
                        {isShowingTrending && (
                            <div className="text-secondary mt-2">
                                Showing trending products (no featured products available)
                            </div>
                        )}
                    </div>

                    <div className="list-product hide-product-sold grid lg:grid-cols-4 grid-cols-2 sm:gap-[30px] gap-[20px] md:mt-10 mt-6">
                        {displayProducts.map((prd, index) => (
                            <Product data={prd} type='grid' key={prd.id} style='style-1' />
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default FeatureProduct