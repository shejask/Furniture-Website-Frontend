'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { useCart } from '@/context/CartContext'
import { countdownTime } from '@/store/countdownTime'
import { getCouponByCode, computeCouponDiscount, CouponRecord } from '@/firebase/coupons'
import BannerTop from '@/components/Home3/BannerTop'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/config'


import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import SliderFurniture from '@/components/Slider/SliderFurniture'


const Cart = () => {
    const [timeLeft, setTimeLeft] = useState(countdownTime());
    const router = useRouter()
    const [user, userLoading] = useAuthState(auth);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(countdownTime());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const { cartState, updateCart, removeFromCart } = useCart();

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        // Tìm sản phẩm trong giỏ hàng
        const itemToUpdate = cartState.cartArray.find((item) => item.id === productId);

        // Kiểm tra xem sản phẩm có tồn tại không
        if (itemToUpdate) {
            // Truyền giá trị hiện tại của selectedSize và selectedColor
            updateCart(productId, newQuantity, itemToUpdate.selectedSize, itemToUpdate.selectedColor);
        }
    };

    let [totalCart, setTotalCart] = useState<number>(0)
    let [discountCart, setDiscountCart] = useState<number>(0)
    const [couponCode, setCouponCode] = useState<string>('')
    const [couponError, setCouponError] = useState<string>('')
    const [appliedCoupon, setAppliedCoupon] = useState<CouponRecord | null>(null)
    let [applyCode, setApplyCode] = useState<number>(0)

    cartState.cartArray.map(item => totalCart += ((item as any).salePrice ?? item.price) * item.quantity)

    const handleApplyCoupon = async () => {
        setCouponError('')
        try {
            const record = await getCouponByCode(couponCode.trim());
            if (!record) {
                setCouponError('Invalid coupon code');
                setDiscountCart(0);
                setAppliedCoupon(null);
                return;
            }
            const { valid, reason, discount } = computeCouponDiscount(totalCart, record);
            if (!valid) {
                setCouponError(reason || 'Coupon not applicable');
                setDiscountCart(0);
                setAppliedCoupon(null);
                return;
            }
            setDiscountCart(discount);
            setAppliedCoupon(record);
        } catch (e) {
            setCouponError('Failed to apply coupon');
            setDiscountCart(0);
            setAppliedCoupon(null);
        }
    }

    const handleClearCoupon = () => {
        setAppliedCoupon(null);
        setDiscountCart(0);
        setCouponError('');
    }

    useEffect(() => {
        if (!appliedCoupon) return;
        const { valid, reason, discount } = computeCouponDiscount(totalCart, appliedCoupon);
        if (!valid) {
            setCouponError(reason || 'Coupon not applicable');
            setDiscountCart(0);
            return;
        }
        setCouponError('');
        setDiscountCart(discount);
    }, [totalCart, appliedCoupon]);

    if (totalCart < applyCode) {
        applyCode = 0
        discountCart = 0
    }

    const redirectToCheckout = () => {
        // Check if user is logged in before proceeding to checkout
        if (!user) {
            router.push('/login');
            return;
        }
        router.push('/checkout')
    }

    return (
        <>
            

        <div id="header" className='relative w-full'>
          <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
          <MenuFurniture props="bg-white" />
          <MenuCategory />
          <Breadcrumb heading='Shopping cart' subHeading='Shopping cart' />
        </div>



            <div className="cart-block md:py-20 py-10">
                <div className="container">
                    <div className="content-main flex justify-between max-xl:flex-col gap-y-8">
                        <div className="xl:w-2/3 xl:pr-3 w-full">
                       
                            <div className="list-product w-full sm:mt-7 mt-5">
                                <div className='w-full'>
                                    <div className="heading bg-surface bora-4 pt-4 pb-4">
                                        <div className="flex">
                                            <div className="w-1/2">
                                                <div className="text-button text-center">Products</div>
                                            </div>
                                            <div className="w-1/12">
                                                <div className="text-button text-center">Price</div>
                                            </div>
                                            <div className="w-1/6">
                                                <div className="text-button text-center">Quantity</div>
                                            </div>
                                            <div className="w-1/6">
                                                <div className="text-button text-center">Total Price</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="list-product-main w-full mt-3">
                                        {cartState.cartArray.length < 1 ? (
                                            <p className='text-button pt-3'>No product in cart</p>
                                        ) : (
                                            cartState.cartArray.map((product) => (
                                                <div className="item flex md:mt-7 md:pb-7 mt-5 pb-5 border-b border-line w-full" key={product.id}>
                                                    <div className="w-1/2">
                                                        <div className="flex items-center gap-6">
                                                            <div className="bg-img md:w-[100px] w-20 aspect-[3/4] cursor-pointer" onClick={() => router.push(`/product/default?id=${product.id}`)}>
                                                                <Image
                                                                    src={product.thumbImage[0]}
                                                                    width={1000}
                                                                    height={1000}
                                                                    alt={product.name}
                                                                    className='w-full h-full object-cover rounded-lg'
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="text-title cursor-pointer hover:underline" onClick={() => router.push(`/product/default?id=${product.id}`)}>{product.name}</div>
                                                                <div className="list-select mt-3"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-1/12 price flex items-center justify-center">
                                                <div className="text-title text-center">₹{(product as any).salePrice ?? product.price}.00</div>
                                                    </div>
                                                    <div className="w-1/6 flex items-center justify-center">
                                                        <div className="quantity-block bg-surface md:p-3 p-2 flex items-center justify-between rounded-lg border border-line md:w-[100px] flex-shrink-0 w-20">
                                                            <Icon.Minus
                                                                onClick={() => {
                                                                    if (product.quantity > 1) {
                                                                        handleQuantityChange(product.id, product.quantity - 1)
                                                                    }
                                                                }}
                                                                className={`text-base max-md:text-sm ${product.quantity === 1 ? 'disabled' : ''}`}
                                                            />
                                                            <div className="text-button quantity">{product.quantity}</div>
                                                            <Icon.Plus
                                                                onClick={() => handleQuantityChange(product.id, product.quantity + 1)}
                                                                className='text-base max-md:text-sm'
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="w-1/6 flex total-price items-center justify-center">
                                                        <div className="text-title text-center">₹{product.quantity * (((product as any).salePrice ?? product.price))}.00</div>
                                                    </div>
                                                    <div className="w-1/12 flex items-center justify-center">
                                                        <Icon.XCircle
                                                            className='text-xl max-md:text-base text-red cursor-pointer hover:text-black duration-500'
                                                            onClick={() => {
                                                                removeFromCart(product.id)
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Coupon section hidden */}
                            {/* Predefined vouchers removed; using Firebase coupons via code input */}
                        </div>
                        <div className="xl:w-1/3 xl:pl-12 w-full">
                            <div className="checkout-block bg-surface p-6 rounded-2xl">
                                <div className="heading5">Order Summary</div>
                                <div className="total-block py-5 flex justify-between border-b border-line">
                                    <div className="text-title">Subtotal</div>
                                    <div className="text-title">₹<span className="total-product">{totalCart}</span><span>.00</span></div>
                                </div>
                                {/* Discount row hidden */}
                                <div className="total-cart-block pt-4 pb-4 flex justify-between">
                                    <div className="heading5">Total</div>
                                    <div className="heading5">₹
                                        <span className="total-cart heading5">{totalCart}</span>
                                        <span className='heading5'>.00</span></div>
                                </div>
                                <div className="block-button flex flex-col items-center gap-y-4 mt-5">
                                    <div className="checkout-btn button-main text-center w-full" onClick={redirectToCheckout}>Process To Checkout</div>
                                    <Link className="text-button hover-underline" href={"/shop/breadcrumb1"}>Continue shopping</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
            <Footer />
        </>
    )
}

export default Cart