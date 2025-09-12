'use client'

import React, { useRef, useState, useEffect } from 'react'
import { ref, get, set, remove, child } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { database, storage } from '@/firebase/config'
import { fetchVendors, Vendor } from '@/firebase/vendors'
import Image from 'next/image'
import Link from 'next/link'
import { ProductType, ReviewType } from '@/type/ProductType'
import Product from '../Product'
import Rate from '@/components/Other/Rate'
import InteractiveRate from '@/components/Other/InteractiveRate'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, Scrollbar } from 'swiper/modules';
import 'swiper/css/bundle';
import * as Icon from "@phosphor-icons/react/dist/ssr";
import SwiperCore from 'swiper/core';
import { useCart } from '@/context/CartContext'
import { useModalCartContext } from '@/context/ModalCartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useModalWishlistContext } from '@/context/ModalWishlistContext'
import { useCompare } from '@/context/CompareContext'
import { useModalCompareContext } from '@/context/ModalCompareContext'
import ModalSizeguide from '@/components/Modal/ModalSizeguide'

SwiperCore.use([Navigation, Thumbs]);

interface CategoryType {
    id: string;
    name: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    image: string;
    showInMainMenu: boolean;
    createdAt: string;
    updatedAt: string;
}

interface BrandType {
    id: string;
    name: string;
    description?: string;
    image?: string;
    createdAt: string;
    updatedAt: string;
}

interface AttributeType {
    id: string;
    name: string;
    description: string;
    slug: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface Props {
    data: Array<ProductType>
    productId: string | number | null
}

const Default: React.FC<Props> = ({ data, productId }) => {
    const swiperRef: any = useRef();
    const [categoryData, setCategoryData] = useState<CategoryType | null>(null);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [brandData, setBrandData] = useState<BrandType | null>(null);
    const [brandError, setBrandError] = useState<string | null>(null);
    const [vendorData, setVendorData] = useState<Vendor | null>(null);
    const [vendorError, setVendorError] = useState<string | null>(null);
    const [attributesData, setAttributesData] = useState<AttributeType[]>([]);
    const [attributesError, setAttributesError] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState<number>(0);
    const [reviewsData, setReviewsData] = useState<ReviewType[]>([]);
    const [reviewsError, setReviewsError] = useState<string | null>(null);
    const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [totalReviews, setTotalReviews] = useState<number>(0);
    const [ratingDistribution, setRatingDistribution] = useState<{ [key: number]: number }>({});
    const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
    const [relatedProductsLoading, setRelatedProductsLoading] = useState<boolean>(false);
    const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);
    const [reviewErrorMessage, setReviewErrorMessage] = useState<string | null>(null);
    const [showAllReviews, setShowAllReviews] = useState<boolean>(false);

    const fetchCategoryData = async (categoryId: string, retryCount = 0) => {
        try {
            console.log('🔍 Fetching category data for ID:', categoryId);
            const categoryRef = ref(database, `categories/${categoryId}`);
            console.log('🔍 Category ref path:', `categories/${categoryId}`);
            
            const snapshot = await get(categoryRef);
            console.log('🔍 Category snapshot exists:', snapshot.exists());
            
            if (snapshot.exists()) {
                const categoryData = snapshot.val();
                console.log('🔍 Category data received:', categoryData);
                setCategoryData({
                    id: categoryId,
                    ...categoryData
                });
                setCategoryError(null);
                console.log('✅ Category data set successfully');
            } else {
                console.log('❌ Category not found in Firebase');
                if (retryCount < 2) {
                    // Retry after 1 second
                    setTimeout(() => {
                        fetchCategoryData(categoryId, retryCount + 1);
                    }, 1000);
                } else {
                    setCategoryError('Category information not available');
                    setCategoryData(null);
                }
            }
        } catch (error) {
            console.error('Error fetching category:', error);
            if (retryCount < 2) {
                // Retry after 1 second
                setTimeout(() => {
                    fetchCategoryData(categoryId, retryCount + 1);
                }, 1000);
            } else {
                setCategoryError('Unable to load category information. Please try again later.');
                setCategoryData(null);
            }
        }
    };

    const fetchBrandData = async (brandId: string, retryCount = 0) => {
        try {
            console.log('🔍 Fetching brand data for ID:', brandId);
            const brandRef = ref(database, `brands/${brandId}`);
            console.log('🔍 Brand ref path:', `brands/${brandId}`);
            
            const snapshot = await get(brandRef);
            console.log('🔍 Brand snapshot exists:', snapshot.exists());
            
            if (snapshot.exists()) {
                const brandData = snapshot.val();
                console.log('🔍 Brand data received:', brandData);
                setBrandData({
                    id: brandId,
                    ...brandData
                });
                setBrandError(null);
                console.log('✅ Brand data set successfully');
            } else {
                console.log('❌ Brand not found in Firebase');
                if (retryCount < 2) {
                    // Retry after 1 second
                    setTimeout(() => {
                        fetchBrandData(brandId, retryCount + 1);
                    }, 1000);
                } else {
                    setBrandError('Brand information not available');
                    setBrandData(null);
                }
            }
        } catch (error) {
            console.error('Error fetching brand:', error);
            if (retryCount < 2) {
                // Retry after 1 second
                setTimeout(() => {
                    fetchBrandData(brandId, retryCount + 1);
                }, 1000);
            } else {
                setBrandError('Unable to load brand information. Please try again later.');
                setBrandData(null);
            }
        }
    };

    const fetchVendorData = async (vendorId: string, retryCount = 0) => {
        try {
            console.log('🔍 Fetching vendor data for ID:', vendorId);
            const vendorRef = ref(database, `vendors/${vendorId}`);
            console.log('🔍 Vendor ref path:', `vendors/${vendorId}`);
            
            const snapshot = await get(vendorRef);
            console.log('🔍 Vendor snapshot exists:', snapshot.exists());
            
            if (snapshot.exists()) {
                const vendorData = snapshot.val();
                console.log('🔍 Vendor data received:', vendorData);
                setVendorData({
                    id: vendorId,
                    ...vendorData
                });
                setVendorError(null);
                console.log('✅ Vendor data set successfully');
            } else {
                console.log('❌ Vendor not found in Firebase');
                if (retryCount < 2) {
                    // Retry after 1 second
                    setTimeout(() => {
                        fetchVendorData(vendorId, retryCount + 1);
                    }, 1000);
                } else {
                    setVendorError('Vendor information not available');
                    setVendorData(null);
                }
            }
        } catch (error) {
            console.error('Error fetching vendor:', error);
            if (retryCount < 2) {
                // Retry after 1 second
                setTimeout(() => {
                    fetchVendorData(vendorId, retryCount + 1);
                }, 1000);
            } else {
                setVendorError('Unable to load vendor information. Please try again later.');
                setVendorData(null);
            }
        }
    };

    const fetchAttributesData = async (productId: string, retryCount = 0) => {
        try {
            if (!productMain?.id) {
                setAttributesError('Product ID not available');
                setAttributesData([]);
                return;
            }

            // Fetch tags directly from the product
            const productTagsRef = ref(database, `products/${productMain.id}/tags`);
            const tagsSnapshot = await get(productTagsRef);
            
            if (tagsSnapshot.exists()) {
                const tagData = tagsSnapshot.val();
                
                if (!tagData) {
                    setAttributesData([]);
                    setAttributesError(null);
                    return;
                }

                // Get all tag IDs
                const tagIds = Object.keys(tagData);

                // Fetch complete details for each tag
                const attributesArray: AttributeType[] = [];
                
                for (const tagId of tagIds) {
                    try {
                        const tagRef = ref(database, `tags/${tagId}`);
                        const tagSnapshot = await get(tagRef);
                        
                        if (tagSnapshot.exists()) {
                            const tagDetails = tagSnapshot.val();
                            attributesArray.push({
                                id: tagId,
                                name: tagDetails.name,
                                description: tagDetails.description,
                                slug: tagDetails.slug,
                                status: tagDetails.status,
                                createdAt: tagDetails.createdAt,
                                updatedAt: tagDetails.updatedAt
                            });
                        }
                    } catch (tagError) {
                        console.error(`Error fetching tag ${tagId}:`, tagError);
                        // Continue with other tags even if one fails
                    }
                }
                
                setAttributesData(attributesArray);
                setAttributesError(null);
            } else {
                if (retryCount < 2) {
                    setTimeout(() => {
                        fetchAttributesData(productId, retryCount + 1);
                    }, 1000);
                } else {
                    setAttributesError('No tags found for this product');
                    setAttributesData([]);
                }
            }
        } catch (error) {
            console.error('Error fetching product tags:', error);
            if (retryCount < 2) {
                setTimeout(() => {
                    fetchAttributesData(productId, retryCount + 1);
                }, 1000);
            } else {
                setAttributesError('Unable to load product tags. Please try again later.');
                setAttributesData([]);
            }
        }
    };

    const fetchReviewsData = async (productId: string, retryCount = 0) => {
        try {
            setReviewsLoading(true);
            setReviewsError(null);
            
            const reviewsRef = ref(database, `/products/${productId}/reviews`);
            const snapshot = await get(reviewsRef);
            
            if (snapshot.exists()) {
                const reviews: ReviewType[] = [];
                snapshot.forEach((childSnapshot) => {
                    reviews.push({
                        id: childSnapshot.key!,
                        ...childSnapshot.val()
                    });
                });
                
                // Sort reviews by creation date (newest first)
                reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                setReviewsData(reviews);
                
                // Calculate average rating and total reviews
                if (reviews.length > 0) {
                    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
                    const avgRating = totalRating / reviews.length;
                    setAverageRating(Math.round(avgRating * 10) / 10); // Round to 1 decimal place
                    setTotalReviews(reviews.length);
                    
                    // Calculate rating distribution
                    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    reviews.forEach(review => {
                        distribution[review.rating] = (distribution[review.rating] || 0) + 1;
                    });
                    setRatingDistribution(distribution);
                } else {
                    setAverageRating(0);
                    setTotalReviews(0);
                    setRatingDistribution({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
                }
            } else {
                setReviewsData([]);
                setAverageRating(0);
                setTotalReviews(0);
                setRatingDistribution({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            if (retryCount < 3) {
                setTimeout(() => fetchReviewsData(productId, retryCount + 1), 1000);
            } else {
                setReviewsError('Failed to load reviews. Please try again later.');
            }
        } finally {
            setReviewsLoading(false);
        }
    };

    const fetchRelatedProducts = async (categoryId: string, currentProductId: string) => {
        try {
            setRelatedProductsLoading(true);
            
            console.log('🔍 Fetching related products for category:', categoryId);
            console.log('🔍 Current product ID:', currentProductId);
            
            // Fetch all products from the same category
            const productsRef = ref(database, 'products');
            const snapshot = await get(productsRef);
            
            if (snapshot.exists()) {
                const allProducts: ProductType[] = [];
                snapshot.forEach((childSnapshot) => {
                    const productData = childSnapshot.val();
                    const product: ProductType = {
                        id: childSnapshot.key!,
                        name: productData.name,
                        price: productData.price,
                        description: productData.description || '',
                        shortDescription: productData.shortDescription,
                        rate: 5, // Default value
                        images: productData.images || [productData.thumbnail],
                        slug: productData.slug,
                        category: productData.categories?.[0] || '',
                        categories: productData.categories, // Include the full categories array
                        type: 'fashion',
                        quantity: productData.stockQuantity,
                        sale: productData.discount > 0,
                        new: false,
                        brand: productData.brands?.[0] || '',
                        sold: 0,
                        sizes: Array.isArray(productData.attributes?.sizes) ? productData.attributes.sizes : ['S', 'M', 'L', 'XL'],
                        variation: Array.isArray(productData.attributes?.variations) ? productData.attributes.variations : [],
                        thumbImage: [productData.thumbnail],
                        quantityPurchase: 1,
                        originPrice: productData.price,
                        salePrice: productData.salePrice || productData.price,
                        gender: productData.attributes?.gender || 'unisex',
                        action: 'add-to-cart',
                        createdAt: productData.createdAt,
                        updatedAt: productData.updatedAt,
                        variableOptions: productData.variableOptions,
                        weight: productData.weight,
                        estimatedDeliveryText: productData.estimatedDeliveryText,
                        dimensions: productData.dimensions,
                        roomType: productData.roomType,
                        warrantyTime: productData.warrantyTime,
                        bestSeller: productData.bestSeller,
                        onSale: productData.onSale,
                        newArrivals: productData.newArrivals,
                        trending: productData.trending,
                        featured: productData.featured,
                        status: productData.status || 'enabled' // Add status field for filtering
                    };
                    allProducts.push(product);
                });
                
                console.log('📦 Total products fetched:', allProducts.length);
                console.log('🔍 Sample product categories:', allProducts.slice(0, 3).map(p => ({ id: p.id, name: p.name, categories: p.categories })));
                
                // Filter products by category and exclude current product
                const related = allProducts.filter(product => {
                    // Check if the product has categories and if any of them match the current product's category
                    const hasMatchingCategory = product.categories && 
                        Array.isArray(product.categories) && 
                        product.categories.includes(categoryId);
                    
                    const isNotCurrent = product.id !== currentProductId;
                    const isEnabled = product.status !== 'disabled' && product.status !== 'false';
                    
                    console.log(`🔍 Product ${product.id} (${product.name}):`, {
                        categories: product.categories,
                        hasMatchingCategory,
                        isNotCurrent,
                        isEnabled,
                        categoryId,
                        status: product.status
                    });
                    
                    return hasMatchingCategory && isNotCurrent && isEnabled;
                }).slice(0, 4); // Limit to 4 products
                
                console.log('✅ Related products found:', related.length);
                console.log('✅ Related products:', related.map(p => ({ id: p.id, name: p.name, categories: p.categories })));
                
                setRelatedProducts(related);
            } else {
                console.log('❌ No products found in Firebase');
                setRelatedProducts([]);
            }
        } catch (error) {
            console.error('Error fetching related products:', error);
            setRelatedProducts([]);
        } finally {
            setRelatedProductsLoading(false);
        }
    };



    const [photoIndex, setPhotoIndex] = useState(0)
    const [openPopupImg, setOpenPopupImg] = useState(false)
    const [openSizeGuide, setOpenSizeGuide] = useState<boolean>(false)
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);
    const [activeColor, setActiveColor] = useState<string>('')
    const [activeSize, setActiveSize] = useState<string>('')
    const [activeTab, setActiveTab] = useState<string | undefined>('description')
    const { addToCart, updateCart, cartState } = useCart()
    const { openModalCart } = useModalCartContext()
    const { addToWishlist, removeFromWishlist, wishlistState } = useWishlist()
    const { openModalWishlist } = useModalWishlistContext()
    const { addToCompare, removeFromCompare, compareState } = useCompare();
    const { openModalCompare } = useModalCompareContext()
    const productMain: ProductType = data.find(product => product.id === productId) as ProductType || data[0] as ProductType

    const unitPrice = (productMain as any).salePrice ?? productMain?.price;
    const percentSale = Math.floor(100 - ((unitPrice / productMain?.originPrice) * 100))

    const handleOpenSizeGuide = () => {
        setOpenSizeGuide(true);
    };

    const handleCloseSizeGuide = () => {
        setOpenSizeGuide(false);
    };

    const handleSwiper = (swiper: SwiperCore) => {
        // Do something with the thumbsSwiper instance
        setThumbsSwiper(swiper);
    };

    useEffect(() => {
        console.log('🔍 productMain object:', productMain);
        console.log('🔍 productMain.categories:', productMain?.categories);
        console.log('🔍 productMain.category:', productMain?.category);
        
        // Fetch category data
        if (productMain?.categories && productMain.categories.length > 0) {
            console.log('✅ Found categories, fetching category:', productMain.categories[0]);
            console.log('🔍 All categories in productMain:', productMain.categories);
            fetchCategoryData(productMain.categories[0]);
            // Fetch related products from the same category
            fetchRelatedProducts(productMain.categories[0], productMain.id);
        } else {
            console.log('❌ No categories found in productMain');
            console.log('🔍 productMain object keys:', Object.keys(productMain));
            console.log('🔍 productMain.categories value:', productMain.categories);
        }
        
        // Fetch brand data
        if (productMain?.brands && productMain.brands.length > 0) {
            console.log('✅ Found brands, fetching brand:', productMain.brands[0]);
            fetchBrandData(productMain.brands[0]);
        } else {
            console.log('❌ No brands found in productMain');
        }
        
        // Fetch vendor data
        if ((productMain as any)?.vendor) {
            console.log('✅ Found vendor, fetching vendor:', (productMain as any).vendor);
            fetchVendorData((productMain as any).vendor);
        } else {
            console.log('❌ No vendor found in productMain');
        }
        
        // Fetch product-specific tags
        if (productMain?.id) {
            fetchAttributesData(productMain.id);
            fetchReviewsData(productMain.id);
        }
    }, [productMain?.categories, productMain?.brands, productMain?.id]);

    const handleActiveColor = (item: string) => {
        setActiveColor(item)

        // // Find variation with selected color
        // const foundColor = productMain.variation.find((variation) => variation.color === item);
        // // If found, slide next to img
        // if (foundColor) {
        //     const index = productMain.images.indexOf(foundColor.image);

        //     if (index !== -1) {
        //         swiperRef.current?.slideTo(index);
        //     }
        // }
    }

    const handleActiveSize = (item: string) => {
        setActiveSize(item)
    }

    const handleIncreaseQuantity = () => {
        productMain.quantityPurchase += 1
        updateCart(productMain.id, productMain.quantityPurchase + 1, activeSize, activeColor);
    };

    const handleDecreaseQuantity = () => {
        if (productMain.quantityPurchase > 1) {
            productMain.quantityPurchase -= 1
            updateCart(productMain.id, productMain.quantityPurchase - 1, activeSize, activeColor);
        }
    };

    const handleAddToCart = () => {
        if (!cartState.cartArray.find(item => item.id === productMain.id)) {
            addToCart({ ...productMain });
            updateCart(productMain.id, productMain.quantityPurchase, activeSize, activeColor)
        } else {
            updateCart(productMain.id, productMain.quantityPurchase, activeSize, activeColor)
        }
        openModalCart()
    };

    const handleAddToWishlist = () => {
        // if product existed in wishlit, remove from wishlist and set state to false
        if (wishlistState.wishlistArray.some(item => item.id === productMain.id)) {
            removeFromWishlist(productMain.id);
        } else {
            // else, add to wishlist and set state to true
            addToWishlist(productMain);
        }
        // no modal on wishlist click
    };

    const handleAddToCompare = () => {
        // if product existed in wishlit, remove from wishlist and set state to false
        if (compareState.compareArray.length < 3) {
            if (compareState.compareArray.some(item => item.id === productMain.id)) {
                removeFromCompare(productMain.id);
            } else {
                // else, add to wishlist and set state to true
                addToCompare(productMain);
            }
        } else {
            alert('Compare up to 3 products')
        }

        openModalCompare();
    };

    const handleActiveTab = (tab: string) => {
        setActiveTab(tab)
    }


    return (
        <>
            <div className="product-detail default">
                <div className="featured-product underwear md:py-20 py-10">
                    <div className="container flex justify-between gap-y-6 flex-wrap">
                        <div className="list-img md:w-1/2 md:pr-[45px] w-full">
                            <Swiper
                                slidesPerView={1}
                                spaceBetween={0}
                                thumbs={{ swiper: thumbsSwiper }}
                                modules={[Thumbs]}
                                className="mySwiper2 rounded-2xl overflow-hidden"
                            >
                                {productMain.images.map((item, index) => (
                                    <SwiperSlide
                                        key={index}
                                        onClick={() => {
                                            swiperRef.current?.slideTo(index);
                                            setOpenPopupImg(true)
                                        }}
                                    >
                                        <Image
                                            src={item}
                                            width={1000}
                                            height={1000}
                                            alt='prd-img'
                                            className='w-full aspect-[3/4] object-cover'
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                            <Swiper
                                onSwiper={(swiper) => {
                                    handleSwiper(swiper)
                                }}
                                spaceBetween={0}
                                slidesPerView={4}
                                freeMode={true}
                                watchSlidesProgress={true}
                                modules={[Navigation, Thumbs]}
                                className="mySwiper"
                            >
                                {productMain.images.map((item, index) => (
                                    <SwiperSlide
                                        key={index}
                                    >
                                        <Image
                                            src={item}
                                            width={1000}
                                            height={1000}
                                            alt='prd-img'
                                            className='w-full aspect-[3/4] object-cover rounded-xl'
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                            <div className={`popup-img ${openPopupImg ? 'open' : ''}`}>
                                <span
                                    className="close-popup-btn absolute top-4 right-4 z-[2] cursor-pointer"
                                    onClick={() => {
                                        setOpenPopupImg(false)
                                    }}
                                >
                                    <Icon.X className="text-3xl text-white" />
                                </span>
                                <Swiper
                                    spaceBetween={0}
                                    slidesPerView={1}
                                    modules={[Navigation, Thumbs]}
                                    navigation={true}
                                    loop={true}
                                    className="popupSwiper"
                                    onSwiper={(swiper) => {
                                        swiperRef.current = swiper
                                    }}
                                >
                                    {productMain.images.map((item, index) => (
                                        <SwiperSlide
                                            key={index}
                                            onClick={() => {
                                                setOpenPopupImg(false)
                                            }}
                                        >
                                            <Image
                                                src={item}
                                                width={1000}
                                                height={1000}
                                                alt='prd-img'
                                                className='w-full aspect-[3/4] object-cover rounded-xl'
                                                onClick={(e) => {
                                                    e.stopPropagation(); // prevent
                                                }}
                                            />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </div>
                        <div className="product-infor md:w-1/2 w-full lg:pl-[15px] md:pl-2">
                            <div className="flex justify-between">
                                <div>
                                <div className="caption2 text-secondary font-semibold uppercase">
                                            {categoryError ? (
                                                <span className="text-red-500">{categoryError}</span>
                                            ) : categoryData ? (
                                                categoryData.name
                                            ) : (
                                                'Loading...'
                                            )}
                                         </div>
                                    <div className="heading4 mt-1">{productMain.name}</div>
                                </div>
                                <div
                                    className={`add-wishlist-btn w-12 h-12 flex items-center justify-center border border-line cursor-pointer rounded-xl duration-300 hover:bg-black hover:text-white ${wishlistState.wishlistArray.some(item => item.id === productMain.id) ? 'active' : ''}`}
                                    onClick={handleAddToWishlist}
                                >
                                    {wishlistState.wishlistArray.some(item => item.id === productMain.id) ? (
                                        <>
                                            <Icon.Heart size={24} weight='fill' className='text-white' />
                                        </>
                                    ) : (
                                        <>
                                            <Icon.Heart size={24} />
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center mt-3">
                                <Rate currentRate={Math.round(averageRating)} size={14} />
                                <span className='caption1 text-secondary'>({totalReviews} reviews)</span>
                            </div>
                                                            <div className="flex flex-col pb-6 border-b border-line">
                                                                    <div className="flex items-center gap-3 flex-wrap mt-5">
                                    <div className="product-price heading5">₹{unitPrice}.00</div>
                                    <div className='w-px h-4 bg-line'></div>
                                    <div className="product-origin-price font-normal text-secondary2"><del>₹{productMain.originPrice}.00</del></div>
                                    {(productMain.discount && productMain.discount > 0) ? (
                                        <div className="product-sale caption2 font-semibold bg-green px-3 py-0.5 inline-block rounded-full">
                                            -{productMain.discount}%
                                        </div>
                                    ) : productMain.originPrice && (
                                        <div className="product-sale caption2 font-semibold bg-green px-3 py-0.5 inline-block rounded-full">
                                            -{percentSale}%
                                        </div>
                                    )}
                                </div>
                                    <div className='desc text-secondary mt-3'>{productMain.shortDescription || productMain.description}</div>
                            </div>
                            <div className="list-action mt-6">
                                {/* Colors section hidden */}
                                {/* <div className="choose-color">
                                    <div className="text-title">Colors: <span className='text-title color'>{activeColor}</span></div>
                                    <div className="list-color flex items-center gap-2 flex-wrap mt-3">
                                        {productMain.variation.map((item, index) => (
                                            <div
                                                className={`color-item w-12 h-12 rounded-xl duration-300 relative ${activeColor === item.color ? 'active' : ''}`}
                                                key={index}
                                                data-image={item.image}
                                                onClick={() => {
                                                    handleActiveColor(item.color || '')
                                                }}
                                            >
                                                <Image
                                                    src={item.colorImage || ''}
                                                    width={100}
                                                    height={100}
                                                    alt={`${item.color} color`}
                                                    className='rounded-xl'
                                                />
                                                <div className="tag-action bg-black text-white caption2 capitalize px-1.5 py-0.5 rounded-sm">
                                                    {item.color}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div> */}
                                
                                {/* Sizes section hidden */}
                                {/* <div className="choose-size mt-5">
                                    <div className="heading flex items-center justify-between">
                                        <div className="text-title">Size: <span className='text-title size'>{activeSize}</span></div>
                                    </div>
                                    <div className="list-size flex items-center gap-2 flex-wrap mt-3">
                                        {(productMain.sizes || []).map((item, index) => (
                                            <div
                                                className={`size-item ${item === 'freesize' ? 'px-3 py-2' : 'w-12 h-12'} flex items-center justify-center text-button rounded-full bg-white border border-line ${activeSize === item ? 'active' : ''}`}
                                                key={index}
                                                onClick={() => handleActiveSize(item)}
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div> */}
                                <div className="text-title mt-5">Quantity:</div>
                                <div className="choose-quantity flex items-center lg:justify-between gap-5 gap-y-3 mt-3">
                                    <div className="quantity-block md:p-3 max-md:py-1.5 max-md:px-3 flex items-center justify-between rounded-lg border border-line sm:w-[180px] w-[120px] flex-shrink-0">
                                        <Icon.Minus
                                            size={20}
                                            onClick={handleDecreaseQuantity}
                                            className={`${productMain.quantityPurchase === 1 ? 'disabled' : ''} cursor-pointer`}
                                        />
                                        <div className="body1 font-semibold">{productMain.quantityPurchase}</div>
                                        <Icon.Plus
                                            size={20}
                                            onClick={handleIncreaseQuantity}
                                            className='cursor-pointer'
                                        />
                                    </div>
                                    <div onClick={handleAddToCart} className="button-main w-full text-center bg-white text-black border border-black">Add To Cart</div>
                                </div>
                                <div className="button-block mt-5">
                                    <div className="button-main w-full text-center">Buy It Now</div>
                                </div>
                                <div className="flex items-center lg:gap-20 gap-8 mt-5 pb-6 border-b border-line">
                                    <div className="share flex items-center gap-3 cursor-pointer">
                                        <div 
                                            className="share-btn md:w-12 md:h-12 w-10 h-10 flex items-center justify-center border border-line cursor-pointer rounded-xl duration-300 hover:bg-black hover:text-white"
                                            onClick={() => {
                                                if (navigator.share) {
                                                    navigator.share({
                                                        title: productMain.name,
                                                        text: productMain.description,
                                                        url: window.location.href
                                                    })
                                                    .catch((error) => console.log('Error sharing:', error));
                                                } else {
                                                    // Fallback for browsers that don't support Web Share API
                                                    navigator.clipboard.writeText(window.location.href);
                                                    alert('Link copied to clipboard!');
                                                }
                                            }}
                                        >
                                            <Icon.ShareNetwork weight='fill' className='heading6' />
                                        </div>
                                        <span>Share Products</span>
                                    </div>
                                </div>
                                <div className="more-infor mt-6">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-1">
                                            <Icon.ArrowClockwise className='body1' />
                                            <div className="text-title">Delivery & Return</div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Icon.Question className='body1' />
                                            <div className="text-title">Ask A Question</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-3">
                                        <Icon.Timer className='body1' />
                                        <div className="text-title">Estimated Delivery:</div>
                                        <div className="text-secondary">
                                            {productMain.estimatedDeliveryText || '14 January - 18 January'}
                                        </div>
                                    </div>
                                    {/* People viewing section hidden */}
                                    {/* <div className="flex items-center gap-1 mt-3">
                                        <Icon.Eye className='body1' />
                                        <div className="text-title">
                                            {productMain.encourageView ? '38' : '0'}
                                        </div>
                                        <div className="text-secondary">people viewing this product right now!</div>
                                    </div> */}
                                                                        <div className="flex items-center gap-1 mt-3">
                                        <div className="text-title">SKU:</div>
                                        <div className="text-secondary">53453412</div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 mt-3">
                                        <div className="text-title">Vendor:</div>
                                        <div className="text-secondary">
                                            {(productMain as any)?.vendor === 'admin' ? (
                                                'Admin'
                                            ) : vendorError ? (
                                                <span className="text-red-500">{vendorError}</span>
                                            ) : vendorData ? (
                                                <Link 
                                                    href={`/shop/vendors?vendorId=${(productMain as any)?.vendor}`}
                                                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                                >
                                                    {vendorData.storeName || vendorData.name || (productMain as any)?.vendor}
                                                </Link>
                                            ) : (productMain as any)?.vendor ? (
                                                <Link 
                                                    href={`/shop/vendors?vendorId=${(productMain as any)?.vendor}`}
                                                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                                >
                                                    Loading...
                                                </Link>
                                            ) : (
                                                'N/A'
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* <div className="flex items-center gap-1 mt-3">
                                        <div className="text-title">Tags:</div>
                                        <div className="text-secondary">
                                            {attributesError ? (
                                                <span className="text-red-500">{attributesError}</span>
                                            ) : attributesData.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {attributesData.map((attr, index) => (
                                                        <span 
                                                            key={attr.id}
                                                            className="inline-block px-2 py-1 bg-gray-100 text-sm rounded-full"
                                                        >
                                                            {attr.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span>Loading tags...</span>
                                            )}
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                            {/* You'll love this too section removed */}
                        </div>
                    </div>
                </div>
                <div className="desc-tab md:pb-20 pb-10">
                    <div className="container">
                        <div className="flex items-center justify-center w-full">
                            <div className="menu-tab flex items-center md:gap-[60px] gap-8">
                                <div
                                    className={`tab-item heading5 has-line-before text-secondary2 hover:text-black duration-300 ${activeTab === 'description' ? 'active' : ''}`}
                                    onClick={() => handleActiveTab('description')}
                                >
                                    Description
                                </div>
                                <div
                                    className={`tab-item heading5 has-line-before text-secondary2 hover:text-black duration-300 ${activeTab === 'specifications' ? 'active' : ''}`}
                                    onClick={() => handleActiveTab('specifications')}
                                >
                                    Specifications
                                </div>
                            </div>
                        </div>
                        <div className="desc-block mt-8">
                            <div className={`desc-item description ${activeTab === 'description' ? 'open' : ''}`}>
                                <div className='w-full max-w-4xl mx-auto'>
                                    <div className="heading6 mb-6">Product Description</div>
                                    <div 
                                        className="text-secondary leading-relaxed text-base px-4 py-6 bg-gray-50 rounded-lg"
                                        style={{ 
                                            whiteSpace: 'pre-line',
                                            lineHeight: '1.8'
                                        }}
                                    >
                                        {productMain.description}
                                    </div>
                                            </div>

                            </div>
                            <div className={`desc-item specifications flex items-center justify-center ${activeTab === 'specifications' ? 'open' : ''}`}>
                                <div className='lg:w-1/2 sm:w-3/4 w-full'>
                                    {/* Variable Options */}
                                    {data[0]?.variableOptions && data[0].variableOptions.length > 0 && (
                                        <>
                                            {data[0].variableOptions.map((option, index) => (
                                                <div key={index} className={`item ${index % 2 === 0 ? 'bg-surface' : ''} flex items-center gap-8 py-3 px-10`}>
                                                    <div className="text-title sm:w-1/4 w-1/3">{option.name}</div>
                                                    <p>{Array.isArray(option.values) ? option.values.join(', ') : 'N/A'}</p>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    
                                    {/* Weight */}
                                    {data[0]?.weight && (
                                        <div className="item bg-surface flex items-center gap-8 py-3 px-10">
                                            <div className="text-title sm:w-1/4 w-1/3">Weight</div>
                                            <p>{data[0].weight} kg</p>
                                        </div>
                                    )}
                                    
                                    {/* Estimated Delivery */}
                                    {data[0]?.estimatedDeliveryText && (
                                        <div className="item flex items-center gap-8 py-3 px-10">
                                            <div className="text-title sm:w-1/4 w-1/3">Delivery</div>
                                            <p>{data[0].estimatedDeliveryText}</p>
                                        </div>
                                    )}
                                    
                                    {/* Dimensions */}
                                    {data[0]?.dimensions && (
                                        <div className="item bg-surface flex items-center gap-8 py-3 px-10">
                                            <div className="text-title sm:w-1/4 w-1/3">Dimensions</div>
                                            <p>{data[0].dimensions}</p>
                                        </div>
                                    )}
                                    
                                    {/* Room Type */}
                                    {data[0]?.roomType && (
                                        <div className="item flex items-center gap-8 py-3 px-10">
                                            <div className="text-title sm:w-1/4 w-1/3">Room Type</div>
                                            <p className="capitalize">{data[0].roomType}</p>
                                        </div>
                                    )}
                                    
                                    {/* Warranty */}
                                    {data[0]?.warrantyTime && (
                                        <div className="item bg-surface flex items-center gap-8 py-3 px-10">
                                            <div className="text-title sm:w-1/4 w-1/3">Warranty</div>
                                            <p>{data[0].warrantyTime}</p>
                                        </div>
                                    )}
                                    
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="review-block md:py-20 py-10 bg-surface">
                    <div className="container">
                        <div className="heading flex items-center justify-between flex-wrap gap-4">
                            <div className="heading4">Customer Review</div>
                            <Link href={'#form-review'} className='button-main bg-white text-black border border-black'>Write Reviews</Link>
                        </div>
                        <div className="top-overview flex justify-between py-6 max-md:flex-col gap-y-6">
                            {reviewsLoading ? (
                                <div className="w-full text-center py-8">
                                    <div className="text-secondary">Loading review statistics...</div>
                                </div>
                            ) : (
                                <>
                                    <div className="rating lg:w-1/4 md:w-[30%] lg:pr-[75px] md:pr-[35px]">
                                        <div className="heading flex items-center justify-center flex-wrap gap-3 gap-y-4">
                                            <div className="text-display">{averageRating || '0.0'}</div>
                                            <div className='flex flex-col items-center'>
                                                <Rate currentRate={Math.round(averageRating)} size={18} />
                                                <div className='text-secondary text-center mt-1'>({totalReviews} Ratings)</div>
                                            </div>
                                        </div>
                                        <div className="list-rating mt-3">
                                            <div className="item flex items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1">
                                                    <div className="caption1">5</div>
                                                    <Icon.Star size={14} weight='fill' />
                                                </div>
                                                <div className="progress bg-line relative w-3/4 h-2">
                                                    <div className="progress-percent absolute bg-yellow h-full left-0 top-0" style={{ width: totalReviews > 0 ? `${(ratingDistribution[5] / totalReviews) * 100}%` : '0%' }}></div>
                                                </div>
                                                <div className="caption1">{totalReviews > 0 ? Math.round((ratingDistribution[5] / totalReviews) * 100) : 0}%</div>
                                            </div>
                                            <div className="item flex items-center justify-between gap-1.5 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <div className="caption1">4</div>
                                                    <Icon.Star size={14} weight='fill' />
                                                </div>
                                                <div className="progress bg-line relative w-3/4 h-2">
                                                    <div className="progress-percent absolute bg-yellow h-full left-0 top-0" style={{ width: totalReviews > 0 ? `${(ratingDistribution[4] / totalReviews) * 100}%` : '0%' }}></div>
                                                </div>
                                                <div className="caption1">{totalReviews > 0 ? Math.round((ratingDistribution[4] / totalReviews) * 100) : 0}%</div>
                                            </div>
                                            <div className="item flex items-center justify-between gap-1.5 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <div className="caption1">3</div>
                                                    <Icon.Star size={14} weight='fill' />
                                                </div>
                                                <div className="progress bg-line relative w-3/4 h-2">
                                                    <div className="progress-percent absolute bg-yellow h-full left-0 top-0" style={{ width: totalReviews > 0 ? `${(ratingDistribution[3] / totalReviews) * 100}%` : '0%' }}></div>
                                                </div>
                                                <div className="caption1">{totalReviews > 0 ? Math.round((ratingDistribution[3] / totalReviews) * 100) : 0}%</div>
                                            </div>
                                            <div className="item flex items-center justify-between gap-1.5 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <div className="caption1">2</div>
                                                    <Icon.Star size={14} weight='fill' />
                                                </div>
                                                <div className="progress bg-line relative w-3/4 h-2">
                                                    <div className="progress-percent absolute bg-yellow h-full left-0 top-0" style={{ width: totalReviews > 0 ? `${(ratingDistribution[2] / totalReviews) * 100}%` : '0%' }}></div>
                                                </div>
                                                <div className="caption1">{totalReviews > 0 ? Math.round((ratingDistribution[2] / totalReviews) * 100) : 0}%</div>
                                            </div>
                                            <div className="item flex items-center justify-between gap-1.5 mt-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="caption1">1</div>
                                                    <Icon.Star size={14} weight='fill' />
                                                </div>
                                                <div className="progress bg-line relative w-3/4 h-2">
                                                    <div className="progress-percent absolute bg-yellow h-full left-0 top-0" style={{ width: totalReviews > 0 ? `${(ratingDistribution[1] / totalReviews) * 100}%` : '0%' }}></div>
                                                </div>
                                                <div className="caption1">{totalReviews > 0 ? Math.round((ratingDistribution[1] / totalReviews) * 100) : 0}%</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="list-img lg:w-3/4 md:w-[70%] lg:pl-[15px] md:pl-[15px]">
                                        <div className="heading5">All Image ({reviewsData.reduce((total, review) => total + (review.images?.length || 0), 0)})</div>
                                        <div className="list md:mt-6 mt-3">
                                            {reviewsData.length > 0 && reviewsData.some(review => review.images && review.images.length > 0) ? (
                                                <Swiper
                                                    spaceBetween={16}
                                                    slidesPerView={3}
                                                    modules={[Navigation]}
                                                    breakpoints={{
                                                        576: {
                                                            slidesPerView: 4,
                                                            spaceBetween: 16,
                                                        },
                                                        640: {
                                                            slidesPerView: 5,
                                                            spaceBetween: 16,
                                                        },
                                                        768: {
                                                            slidesPerView: 4,
                                                            spaceBetween: 16,
                                                        },
                                                        992: {
                                                            slidesPerView: 5,
                                                            spaceBetween: 20,
                                                        },
                                                        1100: {
                                                            slidesPerView: 5,
                                                            spaceBetween: 20,
                                                        },
                                                        1290: {
                                                            slidesPerView: 7,
                                                            spaceBetween: 20,
                                                        },
                                                    }}
                                                >
                                                    {reviewsData
                                                        .filter(review => review.images && review.images.length > 0)
                                                        .flatMap(review => review.images!)
                                                        .map((imageUrl, index) => (
                                                            <SwiperSlide key={index}>
                                                                <Image
                                                                    src={imageUrl}
                                                                    width={400}
                                                                    height={400}
                                                                    alt='Review image'
                                                                    className='w-[120px] aspect-square object-cover rounded-lg'
                                                                />
                                                            </SwiperSlide>
                                                        ))}
                                                </Swiper>
                                            ) : (
                                                <div className="text-center text-secondary py-8">No review images yet</div>
                                            )}
                                        </div>

                                    </div>
                                </>
                            )}
                        </div>
                                                 <div className="list-review">
                             {reviewsLoading ? (
                                 <div className="text-center py-8">
                                     <div className="text-secondary">Loading reviews...</div>
                                 </div>
                             ) : reviewsError ? (
                                 <div className="text-center py-8">
                                     <div className="text-red-500">{reviewsError}</div>
                                 </div>
                             ) : reviewsData.length > 0 ? (
                                 <>
                                     {(showAllReviews ? reviewsData : reviewsData.slice(0, 5)).map((review, index) => (
                                         <div key={review.id} className="item flex max-lg:flex-col gap-y-4 w-full py-6 border-t border-line">
                                             <div className="left lg:w-1/4 w-full lg:pr-[15px]">
                                                 <div className="list-img-review flex gap-2">
                                                     {review.images && review.images.length > 0 ? (
                                                         review.images.slice(0, 3).map((imageUrl, imgIndex) => (
                                                             <Image
                                                                 key={imgIndex}
                                                                 src={imageUrl}
                                                                 width={200}
                                                                 height={200}
                                                                 alt='Review image'
                                                                 className='w-[60px] aspect-square rounded-lg object-cover'
                                                             />
                                                         ))
                                                     ) : (
                                                         <div className="w-[60px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center">
                                                             <Icon.User size={24} className="text-gray-400" />
                                                         </div>
                                                     )}
                                                 </div>
                                                 <div className="user mt-3">
                                                     <div className="text-title">{review.userName}</div>
                                                     <div className="text-secondary2">
                                                         {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                             year: 'numeric',
                                                             month: 'long',
                                                             day: 'numeric'
                                                         })}
                                                     </div>
                                                 </div>
                                             </div>
                                             <div className="right lg:w-3/4 w-full lg:pl-[15px]">
                                                 <div className="flex items-center gap-2">
                                                     <Rate currentRate={review.rating} size={16} />
                                                     <span className="text-sm text-secondary">{review.rating}.0</span>
                                                 </div>
                                                                                                      <div className="heading5 mt-3">{review.title}</div>
                                                     <div className="body1 mt-3">{review.message}</div>
                                             </div>
                                         </div>
                                     ))}
                                     {reviewsData.length > 5 && (
                                         <div 
                                             className="text-button more-review-btn text-center mt-2 underline cursor-pointer hover:text-black transition-colors"
                                             onClick={() => setShowAllReviews(!showAllReviews)}
                                         >
                                             {showAllReviews ? 'Show Less Comments' : `View More Comments (${reviewsData.length - 5} more)`}
                                         </div>
                                     )}
                                 </>
                             ) : (
                                 <div className="text-center py-8">
                                     <div className="text-secondary">No reviews yet. Be the first to review this product!</div>
                                 </div>
                             )}
                         </div>
                        <div id="form-review" className='form-review pt-6'>
                            {/* Success and Error Messages */}
                            {reviewSuccessMessage && (
                                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                    {reviewSuccessMessage}
                                </div>
                            )}
                            {reviewErrorMessage && (
                                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                    {reviewErrorMessage}
                                </div>
                            )}
                            <div className="heading4">Write a Review</div>
                            <form className="grid sm:grid-cols-2 gap-4 gap-y-5 mt-6" onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const formData = new FormData(form);

                                // Get the files from the input
                                const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
                                const files = fileInput?.files;
                                const imageUrls: string[] = [];

                                try {
                                    // Get current user
                                    const userStr = localStorage.getItem('user');
                                    if (!userStr) {
                                        setReviewErrorMessage('Please login to submit a review');
                                        return;
                                    }
                                    const user = JSON.parse(userStr);

                                    // Upload images if any
                                    if (files && files.length > 0) {
                                        for (let i = 0; i < files.length; i++) {
                                            const file = files[i];
                                            const fileRef = storageRef(storage, `reviews/${productMain.id}/${Date.now()}_${file.name}`);
                                            await uploadBytes(fileRef, file);
                                            const url = await getDownloadURL(fileRef);
                                            imageUrls.push(url);
                                        }
                                    }

                                    // Validate rating
                                    if (reviewRating === 0) {
                                        setReviewErrorMessage('Please select a rating before submitting your review');
                                        return;
                                    }

                                    // Create review object
                                    const review = {
                                        title: formData.get('title'),
                                        message: formData.get('message'),
                                        rating: reviewRating,
                                        images: imageUrls,
                                        userId: user.uid,
                                        userName: user.name,
                                        userEmail: user.email,
                                        createdAt: new Date().toISOString(),
                                        productId: productMain.id
                                    };

                                    // Save to Firebase
                                    const reviewsRef = ref(database, `/products/${productMain.id}/reviews/${Date.now()}`);
                                    await set(reviewsRef, review);

                                    setReviewSuccessMessage('Review submitted successfully!');
                                    setReviewErrorMessage(null);
                                    form.reset();
                                    setReviewRating(0);
                                    
                                    // Refresh reviews data
                                    fetchReviewsData(productMain.id);
                                    
                                    // Clear success message after 5 seconds
                                    setTimeout(() => {
                                        setReviewSuccessMessage(null);
                                    }, 5000);
                                } catch (error) {
                                    console.error('Error submitting review:', error);
                                    setReviewErrorMessage('Failed to submit review. Please try again.');
                                    setReviewSuccessMessage(null);
                                }
                            }}>
                                <div className="title col-span-full">
                                    <input 
                                        className="border-line px-4 pt-3 pb-3 w-full rounded-lg" 
                                        id="title" 
                                        name="title"
                                        type="text" 
                                        placeholder="Review Title *" 
                                        required 
                                        onChange={() => setReviewErrorMessage(null)}
                                    />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rating *
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <InteractiveRate
                                            rating={reviewRating}
                                            onRatingChange={(rating) => {
                                                setReviewRating(rating);
                                                setReviewErrorMessage(null);
                                            }}
                                            size={24}
                                        />
                                        <span className="text-sm text-gray-500">
                                            {reviewRating > 0 ? `${reviewRating} star${reviewRating > 1 ? 's' : ''}` : 'Click to rate'}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-span-full message">
                                    <textarea 
                                        className="border border-line px-4 py-3 w-full rounded-lg" 
                                        id="message" 
                                        name="message" 
                                        placeholder="Your Review *" 
                                        required
                                        onChange={() => setReviewErrorMessage(null)}
                                    ></textarea>
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload Images (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-600 file:text-white
                                        hover:file:bg-blue-700
                                        file:cursor-pointer
                                        file:transition-colors
                                        file:duration-200"
                                    />
                                </div>
                                <div className="col-span-full sm:pt-3">
                                    <button type="submit" className='button-main bg-white text-black border border-black'>
                                        Submit Review
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                                 <div className="related-product md:py-20 py-10">
                     <div className="container">
                         <div className="heading3 text-center">Related Products</div>
                         {relatedProductsLoading ? (
                             <div className="text-center py-8">
                                 <div className="text-secondary">Loading related products...</div>
                             </div>
                         ) : relatedProducts.length > 0 ? (
                             <div className="list-product hide-product-sold  grid lg:grid-cols-4 grid-cols-2 md:gap-[30px] gap-5 md:mt-10 mt-6">
                                 {relatedProducts.map((item, index) => (
                                     <Product key={index} data={item} type='grid' style='style-1' />
                                 ))}
                             </div>
                         ) : (
                             <div className="text-center py-8">
                                 <div className="text-secondary">No related products found in this category.</div>
                             </div>
                         )}
                     </div>
                 </div>
            </div>
        </>
    )
}

export default Default