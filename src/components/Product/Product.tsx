'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductType } from '@/type/ProductType'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { useCart } from '@/context/CartContext'
import { useModalCartContext } from '@/context/ModalCartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useModalWishlistContext } from '@/context/ModalWishlistContext'
import { addToFirebaseWishlist, removeFromFirebaseWishlist } from '@/firebase/wishlist'
import { FirebaseProductType } from '@/type/FirebaseProductType'

import { useModalQuickviewContext } from '@/context/ModalQuickviewContext'
import { useRouter } from 'next/navigation'
import Marquee from 'react-fast-marquee'
import Rate from '../Other/Rate'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/config'


interface ProductProps {
    data: ProductType
    type: string
    style: string
}

const Product: React.FC<ProductProps> = ({ data, type, style }) => {
    const [user, loading] = useAuthState(auth);
    const [activeColor, setActiveColor] = useState<string>('')
    const [activeSize, setActiveSize] = useState<string>('')
    const [openQuickShop, setOpenQuickShop] = useState<boolean>(false)
    const { addToCart, updateCart, cartState } = useCart();
    const { openModalCart } = useModalCartContext()
    const { addToWishlist, removeFromWishlist, wishlistState } = useWishlist();
    const { openModalWishlist } = useModalWishlistContext()
    const { openQuickview } = useModalQuickviewContext()
    const router = useRouter()
    const handleActiveColor = (item: string) => {
        setActiveColor(item)
    }

    const handleActiveSize = (item: string) => {
        setActiveSize(item)
    }

    const handleAddToCart = () => {
        addToCart({ 
            ...data, 
            selectedSize: activeSize, 
            selectedColor: activeColor 
        });
        openModalCart()
    };

    const handleAddToWishlist = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            console.log('Current product data:', data);
            console.log('Current wishlist state:', wishlistState);
            console.log('Current user:', user.uid);

            if (wishlistState.wishlistArray.some(item => item.id === data.id)) {
                console.log('Removing from wishlist:', data.id);
                // Remove from Firebase and local state
                await removeFromFirebaseWishlist(user.uid, data.id);
                removeFromWishlist(data.id); // Remove from local state
                console.log('Successfully removed from wishlist');
            } else {
                console.log('Adding to wishlist');
                // Add to Firebase and local state
                const firebaseProduct: FirebaseProductType = {
                    id: data.id,
                    name: data.name,
                    price: data.price,
                    salePrice: data.price,
                    thumbnail: data.thumbImage[0],
                    productType: 'physical' as const,
                    vendor: 'admin',
                    inventoryType: 'simple',
                    status: 'enabled',
                    stockStatus: 'in_stock',
                    stockQuantity: data.quantity,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    sku: data.id,
                    slug: data.name.toLowerCase().replace(/\s+/g, '-'),
                    new: false,
                    bestSeller: false,
                    onSale: false,
                    newArrivals: false,
                    trending: false,
                    featured: false
                };
                console.log('Firebase product to save:', firebaseProduct);
                
                await addToFirebaseWishlist(user.uid, firebaseProduct);
                console.log('Successfully saved to Firebase');
                
                addToWishlist(data); // Add to local state
                console.log('Successfully added to local state');
            }
            // no modal on wishlist click
        } catch (error) {
            console.error('Detailed error information:', {
                error,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined,
                productData: data,
                wishlistState,
                userId: user.uid
            });
            alert('Failed to update wishlist. Please try again.');
        }
    };

    const handleQuickviewOpen = () => {
        openQuickview(data)
    }

    const handleDetailProduct = (productId: string) => {
        // redirect to shop with category selected
        router.push(`/product/default?id=${productId}`);
    };

    const displayPrice = (data as any).salePrice ?? data.price;
    const originalPrice = data.originPrice || data.price;
    let percentSale = originalPrice > displayPrice ? Math.floor(100 - ((displayPrice / originalPrice) * 100)) : 0;
    let percentSold = data.quantity > 0 ? Math.floor((data.sold / data.quantity) * 100) : 0;
    const effectiveDiscount = (data.discount ?? percentSale);

    return (
        <>
            {type === "grid" ? (
                <div className={`product-item grid-type ${style}`}>
                        <div onClick={() => handleDetailProduct(data.id)} className="product-main cursor-pointer block">
                            <div className="product-thumb bg-white relative overflow-hidden rounded-2xl">
                                {/* Product Tags */}

                                {(data.new || (data as any).newArrivals) && (
                                    <div className="product-tag text-button-uppercase text-white bg-green px-3 py-0.5 inline-block rounded-full absolute top-3 right-3 z-[1]">
                                        New
                                    </div>
                                )}

                                {/* Fixed Wishlist Icon */}
                                <div
                                    className={`absolute top-3 left-3 z-[2]`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToWishlist();
                                    }}
                                >
                                    <div
                                        className={`add-wishlist-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 ${wishlistState.wishlistArray.some(item => item.id === data.id) ? 'active' : ''}`}
                                    >
                                        {wishlistState.wishlistArray.some(item => item.id === data.id) ? (
                                            <Icon.Heart size={18} weight='fill' className='text-white' />
                                        ) : (
                                            <Icon.Heart size={18} />
                                        )}
                                    </div>
                                </div>

                                {/* Discount Badge */}
                                {effectiveDiscount > 0 ? (
                                    <div className="product-tag text-button-uppercase text-white bg-green px-3 py-0.5 inline-block rounded-full absolute top-12 left-3 z-[1]">
                                        -{effectiveDiscount}%
                                    </div>
                                ) : <></>}


                                {style === 'style-1' || style === 'style-3' || style === 'style-4' ? (
                                <div className="list-action-right absolute top-3 right-3 max-lg:hidden">
                                    {style === 'style-4' && (
                                        <div
                                            className="add-cart-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative mb-2"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleAddToCart()
                                            }}
                                        >
                                            <div className="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Add To Cart</div>
                                            <Icon.ShoppingBagOpen size={20} />
                                        </div>
                                    )}
                                    

                                    {style === 'style-3' || style === 'style-4' ? (
                                        <div
                                            className="quick-view-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative mt-2"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleQuickviewOpen()
                                            }}
                                        >
                                            <div className="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Quick View</div>
                                            <Icon.Eye size={20} />
                                        </div>
                                    ) : <></>}
                                </div>
                            ) : <></>}
                            <div className="product-img w-full h-full aspect-[3/4]">
                                {activeColor ? (
                                    <>
                                        {
                                            <Image
                                                src={data.variation.find(item => item.color === activeColor)?.image ?? ''}
                                                width={500}
                                                height={500}
                                                alt={data.name}
                                                priority={true}
                                                className='w-full h-full object-cover duration-700'
                                            />
                                        }
                                    </>
                                ) : (
                                    <>
                                        {
                                            (data.thumbImage || [data.images?.[0]]).map((img, index) => (
                                                <Image
                                                    key={index}
                                                    src={img}
                                                    width={500}
                                                    height={500}
                                                    priority={true}
                                                    alt={data.name}
                                                    className='w-full h-full object-cover duration-700'
                                                    unoptimized={true}
                                                />
                                            ))
                                        }
                                    </>
                                )}
                            </div>
                            {style === 'style-2' || style === 'style-4' ? (
                                <div className="list-size-block flex items-center justify-center gap-4 absolute bottom-0 left-0 w-full h-8">
                                    {data.sizes.map((item, index) => (
                                        <strong key={index} className="size-item text-xs font-bold uppercase">{item}</strong>
                                    ))}
                                </div>
                            ) : <></>}
                            {style === 'style-1' || style === 'style-3' ?
                                <div className={`list-action ${style === 'style-1' ? 'grid grid-cols-2 gap-3' : ''} px-5 absolute w-full bottom-5 max-lg:hidden`}>
                                    {style === 'style-1' && (
                                        <div
                                            className="quick-view-btn w-full text-button-uppercase py-2 text-center rounded-full duration-300 bg-white hover:bg-black hover:text-white"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleQuickviewOpen()
                                            }}
                                        >
                                            Quick View
                                        </div>
                                    )}
                                    {data.action === 'add to cart' ? (
                                        <div
                                            className="add-cart-btn w-full text-button-uppercase py-2 text-center rounded-full duration-500 bg-white hover:bg-black hover:text-white"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleAddToCart()
                                            }}
                                        >
                                            Add To Cart
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className="quick-shop-btn text-button-uppercase py-2 text-center rounded-full duration-500 bg-white hover:bg-black hover:text-white"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setOpenQuickShop(!openQuickShop)
                                                }}
                                            >
                                                Quick Shop
                                            </div>
                                            <div
                                                className={`quick-shop-block absolute left-5 right-5 bg-white p-5 rounded-[20px] ${openQuickShop ? 'open' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                }}
                                            >
                                                <div className="list-size flex items-center justify-center flex-wrap gap-2">
                                                    {data.sizes.map((item, index) => (
                                                        <div
                                                            className={`size-item w-10 h-10 rounded-full flex items-center justify-center text-button bg-white border border-line ${activeSize === item ? 'active' : ''}`}
                                                            key={index}
                                                            onClick={() => handleActiveSize(item)}
                                                        >
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div
                                                    className="button-main w-full text-center rounded-full py-3 mt-4"
                                                    onClick={() => {
                                                        handleAddToCart()
                                                        setOpenQuickShop(false)
                                                    }}
                                                >
                                                    Add To cart
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                : <></>
                            }
                            {style === 'style-2' || style === 'style-5' ?
                                <>
                                    <div className={`list-action flex items-center justify-center gap-3 px-5 absolute w-full ${style === 'style-2' ? 'bottom-12' : 'bottom-5'} max-lg:hidden`}>
                                        {style === 'style-2' && (
                                            <div
                                                className="add-cart-btn w-9 h-9 flex items-center justify-center rounded-full bg-white duration-300 relative"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleAddToCart()
                                                }}
                                            >
                                                <div className="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Add To Cart</div>
                                                <Icon.ShoppingBagOpen size={20} />
                                            </div>
                                        )}
                                        
                                        <div
                                            className="quick-view-btn w-9 h-9 flex items-center justify-center rounded-full bg-white duration-300 relative"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleQuickviewOpen()
                                            }}
                                        >
                                            <div className="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Compare Product</div>
                                            <Icon.Repeat size={18} className='compare-icon' />
                                            <Icon.CheckCircle size={20} className='checked-icon' />
                                        </div>
                                        <div
                                            className="quick-view-btn w-9 h-9 flex items-center justify-center rounded-full bg-white duration-300 relative"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleQuickviewOpen()
                                            }}
                                        >
                                            <div className="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Quick View</div>
                                            <Icon.Eye size={20} />
                                        </div>
                                        {style === 'style-5' && data.action !== 'add to cart' && (
                                            <div
                                                className={`quick-shop-block absolute left-5 right-5 bg-white p-5 rounded-[20px] ${openQuickShop ? 'open' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                }}
                                            >
                                                <div className="list-size flex items-center justify-center flex-wrap gap-2">
                                                    {data.sizes.map((item, index) => (
                                                        <div
                                                            className={`size-item w-10 h-10 rounded-full flex items-center justify-center text-button bg-white border border-line ${activeSize === item ? 'active' : ''}`}
                                                            key={index}
                                                            onClick={() => handleActiveSize(item)}
                                                        >
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div
                                                    className="button-main w-full text-center rounded-full py-3 mt-4"
                                                    onClick={() => {
                                                        handleAddToCart()
                                                        setOpenQuickShop(false)
                                                    }}
                                                >
                                                    Add To cart
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </> :
                                <></>
                            }
                            <div className="list-action-icon flex items-center justify-center gap-2 absolute w-full bottom-3 z-[1] lg:hidden">
                                <div
                                    className="quick-view-btn w-9 h-9 flex items-center justify-center rounded-lg duration-300 bg-white hover:bg-black hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleQuickviewOpen()
                                    }}
                                >
                                    <Icon.Eye className='text-lg' />
                                </div>
                                <div
                                    className="add-cart-btn w-9 h-9 flex items-center justify-center rounded-lg duration-300 bg-white hover:bg-black hover:text-white"
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleAddToCart()
                                    }}
                                >
                                    <Icon.ShoppingBagOpen className='text-lg' />
                                </div>
                            </div>
                        </div>
                        <div className="product-infor mt-4 lg:mb-7">
                            <div className="product-sold sm:pb-4 pb-2">
                                <div className="progress bg-line h-1.5 w-full rounded-full overflow-hidden relative">
                                    <div
                                        className={`progress-sold bg-red absolute left-0 top-0 h-full`}
                                        style={{ width: `${percentSold}%` }}
                                    >
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 gap-y-1 flex-wrap mt-2">
                                    <div className="text-button-uppercase">
                                        <span className='text-secondary2 max-sm:text-xs'>Sold: </span>
                                        <span className='max-sm:text-xs'>{data.sold}</span>
                                    </div>
                                    <div className="text-button-uppercase">
                                        <span className='text-secondary2 max-sm:text-xs'>Available: </span>
                                        <span className='max-sm:text-xs'>{data.quantity - data.sold}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="product-name text-title duration-300">{data.name}</div>
                            {data.variation.length > 0 && data.action === 'add to cart' && (
                                <div className="list-color py-2 max-md:hidden flex items-center gap-2 flex-wrap duration-500">
                                    {data.variation.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`color-item px-3 py-1 rounded-full duration-300 relative border border-gray-300 hover:border-black cursor-pointer ${activeColor === item.color ? 'active bg-black text-white' : 'bg-white text-black'}`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleActiveColor(item.color)
                                            }}>
                                            <span className="text-sm font-medium capitalize">{item.color}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {data.variation.length > 0 && data.action === 'quick shop' && (
                                <div className="list-color-image max-md:hidden flex items-center gap-2 flex-wrap duration-500">
                                    {data.variation.map((item, index) => (
                                        <div
                                            className={`color-item px-3 py-1 rounded-lg duration-300 relative border border-gray-300 hover:border-black cursor-pointer ${activeColor === item.color ? 'active bg-black text-white' : 'bg-white text-black'}`}
                                            key={index}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleActiveColor(item.color)
                                            }}
                                        >
                                            <span className="text-sm font-medium capitalize">{item.color}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="product-price-block flex items-center gap-2 flex-wrap mt-1 duration-300 relative z-[1]">
                                <div className="product-price text-title">₹{displayPrice}.00</div>

                            </div>

                            {style === 'style-5' &&
                                <>
                                    {data.action === 'add to cart' ? (
                                        <div
                                            className="add-cart-btn w-full text-button-uppercase py-2.5 text-center mt-2 rounded-full duration-300 bg-white border border-black hover:bg-black hover:text-white max-lg:hidden"
                                            onClick={e => {
                                                e.stopPropagation()
                                                handleAddToCart()
                                            }}
                                        >
                                            Add To Cart
                                        </div>
                                    ) : (
                                        <div
                                            className="quick-shop-btn text-button-uppercase py-2.5 text-center mt-2 rounded-full duration-300 bg-white border border-black hover:bg-black hover:text-white max-lg:hidden"
                                            onClick={e => {
                                                e.stopPropagation()
                                                setOpenQuickShop(!openQuickShop)
                                            }}
                                        >
                                            Quick Shop
                                        </div>
                                    )}
                                </>
                            }
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {type === "list" ? (
                        <>
                            <div className="product-item list-type">
                                <div className="product-main cursor-pointer flex lg:items-center sm:justify-between gap-7 max-lg:gap-5">
                                    <div onClick={() => handleDetailProduct(data.id)} className="product-thumb bg-white relative overflow-hidden rounded-2xl block max-sm:w-1/2">

                                        
                                        {(data.new || (data as any).newArrivals) && (
                                            <div className="product-tag text-button-uppercase text-white bg-green px-3 py-0.5 inline-block rounded-full absolute top-3 right-3 z-[1]">
                                                New
                                            </div>
                                        )}
                                        
                                        <div className="product-img w-full aspect-[3/4] rounded-2xl overflow-hidden">
                                             {(data.thumbImage || [data.images?.[0]]).map((img, index) => (
                                                <Image
                                                    key={index}
                                                    src={img}
                                                    width={500}
                                                    height={500}
                                                    priority={true}
                                                    alt={data.name}
                                                    className='w-full h-full object-cover duration-700'
                                                    unoptimized={true}
                                                />
                                            ))}
                                        </div>
                                        <div className="list-action px-5 absolute w-full bottom-5 max-lg:hidden">
                                            <div
                                                className={`quick-shop-block absolute left-5 right-5 bg-white p-5 rounded-[20px] ${openQuickShop ? 'open' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                }}
                                            >
                                                <div className="list-size flex items-center justify-center flex-wrap gap-2">
                                                    {data.sizes.map((item, index) => (
                                                        <div
                                                            className={`size-item ${item !== 'freesize' ? 'w-10 h-10' : 'h-10 px-4'} flex items-center justify-center text-button bg-white rounded-full border border-line ${activeSize === item ? 'active' : ''}`}
                                                            key={index}
                                                            onClick={() => handleActiveSize(item)}
                                                        >
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div
                                                    className="button-main w-full text-center rounded-full py-3 mt-4"
                                                    onClick={() => {
                                                        handleAddToCart()
                                                        setOpenQuickShop(false)
                                                    }}
                                                >
                                                    Add To cart
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='flex sm:items-center gap-7 max-lg:gap-4 max-lg:flex-wrap max-lg:w-full max-sm:flex-col max-sm:w-1/2'>
                                        <div className="product-infor max-sm:w-full">
                                            <div onClick={() => handleDetailProduct(data.id)} className="product-name heading6 inline-block duration-300">{data.name}</div>
                                            <div className="product-price-block flex items-center gap-2 flex-wrap mt-2 duration-300 relative z-[1]">
                                                <div className="product-price text-title">₹{displayPrice}.00</div>
                                                <div className="product-origin-price caption1 text-secondary2"><del>₹{data.originPrice}.00</del></div>
                                                {data.originPrice && (
                                                    <div className="product-sale caption1 font-medium bg-green px-3 py-0.5 inline-block rounded-full">
                                                        -{percentSale}%
                                                    </div>
                                                )}
                                            </div>
                                            {data.variation.length > 0 && data.action === 'add to cart' ? (
                                                <div className="list-color max-md:hidden py-2 mt-5 mb-1 flex items-center gap-3 flex-wrap duration-300">
                                                    {data.variation.map((item, index) => (
                                                        <div
                                                            key={index}
                                                                                                                                                    className={`color-item px-3 py-1 rounded-full duration-300 relative border border-gray-300 hover:border-black cursor-pointer`}
                                        >
                                            <span className="text-sm font-medium capitalize">{item.color}</span>
                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <>
                                                    {data.variation.length > 0 && data.action === 'quick shop' ? (
                                                        <>
                                                            <div className="list-color flex items-center gap-2 flex-wrap mt-5">
                                                                {data.variation.map((item, index) => (
                                                                    <div
                                                                        className={`color-item px-3 py-1 rounded-xl duration-300 relative border border-gray-300 hover:border-black cursor-pointer ${activeColor === item.color ? 'active bg-black text-white' : 'bg-white text-black'}`}
                                                                        key={index}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleActiveColor(item.color)
                                                                        }}
                                                                    >
                                                                        <Image
                                                                            src={item.colorImage}
                                                                            width={100}
                                                                            height={100}
                                                                            alt='color'
                                                                            priority={true}
                                                                            className='rounded-xl'
                                                                            unoptimized={true}
                                                                        />
                                                                        <div className="tag-action bg-black text-white caption2 capitalize px-1.5 py-0.5 rounded-sm">
                                                                            {item.color}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </>
                                            )}
                                            <div className='text-secondary desc mt-5 max-sm:hidden'>{data.description}</div>
                                        </div>
                                        <div className="action w-fit flex flex-col items-center justify-center">
                                            <div
                                                className="quick-shop-btn button-main whitespace-nowrap py-2 px-9 max-lg:px-5 rounded-full bg-white text-black border border-black hover:bg-black hover:text-white"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setOpenQuickShop(!openQuickShop)
                                                }}
                                            >
                                                Quick Shop
                                            </div>
                                            <div className="list-action-right flex items-center justify-center gap-3 mt-4">
                                                <div
                                                    className={`add-wishlist-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative ${wishlistState.wishlistArray.some(item => item.id === data.id) ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleAddToWishlist()
                                                    }}
                                                >
                                                    <div className="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Add To Wishlist</div>
                                                    {wishlistState.wishlistArray.some(item => item.id === data.id) ? (
                                                        <>
                                                            <Icon.Heart size={18} weight='fill' className='text-white' />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Icon.Heart size={18} />
                                                        </>
                                                    )}
                                                </div>

                                                <div
                                                    className="quick-view-btn-list w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleQuickviewOpen()
                                                    }}
                                                >
                                                    <div className="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Quick View</div>
                                                    <Icon.Eye size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <></>
                    )}
                </>
            )
            }

            {type === 'marketplace' ? (
                <div className="product-item style-marketplace p-4 border border-line rounded-2xl" onClick={() => handleDetailProduct(data.id)}>
                    <div className="bg-img relative w-full">
                        <Image 
                            className='w-full aspect-square' 
                            width={5000} 
                            height={5000} 
                            src={data.thumbImage[0]} 
                            alt="img"
                            unoptimized={true}
                        />
                        <div className="list-action flex flex-col gap-1 absolute top-0 right-0">
                            <span
                                className="quick-view-btn w-8 h-8 bg-white flex items-center justify-center rounded-full box-shadow-sm duration-300"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleQuickviewOpen()
                                }}
                            >
                                <Icon.Eye />
                            </span>
                            <span
                                className="add-cart-btn w-8 h-8 bg-white flex items-center justify-center rounded-full box-shadow-sm duration-300"
                                onClick={e => {
                                    e.stopPropagation();
                                    handleAddToCart()
                                }}
                            >
                                <Icon.ShoppingBagOpen />
                            </span>
                        </div>
                    </div>
                    <div className="product-infor mt-4">
                        <span className="text-title">{data.name}</span>
                        <div className="flex gap-0.5 mt-1">
                            <Rate currentRate={data.rate} size={16} />
                        </div>
                        <span className="text-title inline-block mt-1">₹{displayPrice}.00</span>
                    </div>
                </div>
            ) : (
                <></>
            )}
        </>
    )
}

export default Product