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

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const productsRef = ref(database, '/products')
                // Fetch all products and filter in memory to avoid index requirement
                const snapshot = await get(productsRef)
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    const productsList = Object.entries(data)
                        .map(([id, value]): FirebaseProductType => ({
                            id,
                            ...(value as Omit<FirebaseProductType, 'id'>)
                        }))
                        .filter(product => 
                            product.status === 'enabled' && 
                            product.stockStatus === 'in_stock' &&
                            product.trending === true
                        )
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    
                    setProducts(productsList as FirebaseProductType[])
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
                        <div className="heading3">Featured Products</div>
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
                            No featured products available at the moment.
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const displayProducts = products
        .slice(start, start + limit)
        .map(product => convertFirebaseToUIProduct(product))

    return (
        <>
            <div className="whate-new-block md:pt-20 pt-10">
                <div className="container">
                    <div className="heading flex flex-col items-center text-center">
                        <div className="heading3">Featured Products</div>
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