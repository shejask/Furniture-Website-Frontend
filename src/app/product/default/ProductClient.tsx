'use client'

import React, { useState, useEffect } from 'react'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import BreadcrumbProduct from '@/components/Breadcrumb/BreadcrumbProduct'
import Default from '@/components/Product/Detail/Default';
import Footer from '@/components/Footer/Footer'
import { ProductType } from '@/type/ProductType'
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'


interface FirebaseProductType {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    price: number;
    salePrice: number;
    discount: number;
    thumbnail: string;
    images: string[];
    brands: string[];
    categories: string[];
    attributes: Record<string, string>;
    stockStatus: 'in_stock' | 'out_of_stock';
    stockQuantity: number;
    createdAt: string;
    updatedAt: string;
    encourageOrder: boolean;
    metaTitle: string;
    metaDescription: string;
    metaImage: string;
    sizeChart: string;
    sku: string;
    slug: string;
    socialShare: boolean;
    status: 'enabled' | 'disabled';
    tags: string[];
    trending: boolean;
    unit: string;
    // New Firebase fields for specifications
    variableOptions?: Array<{
        name: string;
        values: string[];
    }>;
    weight?: number;
    estimatedDeliveryText?: string;
    dimensions?: string;
    roomType?: string;
    warrantyTime?: string;
    bestSeller?: boolean;
    onSale?: boolean;
    newArrivals?: boolean;
    featured?: boolean;
}

const ProductClient = ({ productId }: { productId: string | null }) => {
    const [product, setProduct] = useState<FirebaseProductType | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) {
                setError('Product ID is required');
                setLoading(false);
                return;
            }

            try {
                const productRef = ref(database, `/products/${productId}`);
                const snapshot = await get(productRef);

                if (snapshot.exists()) {
                    const productData = snapshot.val();
                    console.log('🔥 Raw Firebase product data:', productData);
                    console.log('🔥 Variable options:', productData.variableOptions);
                    console.log('🔥 Weight:', productData.weight);
                    console.log('🔥 Dimensions:', productData.dimensions);
                    setProduct({
                        ...productData,
                        id: productId
                    });
                } else {
                    setError('Product not found');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                setError('Failed to fetch product');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-red-500">{error || 'Product not found'}</div>
            </div>
        );
    }

            // Convert Firebase product data to match the expected ProductType format
        const convertedProduct: ProductType = {
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description || '',
            shortDescription: product.shortDescription,
            rate: 5, // Default value
            images: product.images || [product.thumbnail],
            slug: product.slug,
            category: product.categories?.[0] || '',
            categories: product.categories, // Include the full categories array
            type: 'fashion',
            quantity: product.stockQuantity,
            sale: product.discount > 0,
            new: false,
            brand: product.brands?.[0] || '',
            brands: product.brands, // Include the full brands array
            sold: 0,
            sizes: Array.isArray(product.attributes?.sizes) ? product.attributes.sizes : ['S', 'M', 'L', 'XL'],
            variation: Array.isArray(product.attributes?.variations) ? product.attributes.variations : [],
            thumbImage: [product.thumbnail],
            quantityPurchase: 1,
            originPrice: product.price,
            salePrice: product.salePrice || product.price,
            gender: product.attributes?.gender || 'unisex',
            action: 'add-to-cart',
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            // New Firebase fields for specifications
            variableOptions: product.variableOptions,
            weight: product.weight,
            estimatedDeliveryText: product.estimatedDeliveryText,
            dimensions: product.dimensions,
            roomType: product.roomType,
            warrantyTime: product.warrantyTime,
            bestSeller: product.bestSeller,
            onSale: product.onSale,
            newArrivals: product.newArrivals,
            trending: product.trending,
            featured: product.featured
        };

    return (
        <>
              <div id="header" className='relative w-full'>
          <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
          <MenuFurniture props="bg-white" />
          <MenuCategory />
          <Breadcrumb heading='Shopping cart' subHeading='Shopping cart' />
        </div>
            <Default data={[convertedProduct]} productId={product.id} />
            <Footer />
        </>
    )
}

export default ProductClient
