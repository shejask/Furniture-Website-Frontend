'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import Footer from '@/components/Footer/Footer'
import { ProductType } from '@/type/ProductType'
import productData from '@/data/Product.json'
import Product from '@/components/Product/Product'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { useCart } from '@/context/CartContext'
import { useSearchParams } from 'next/navigation'
import { useRazorpay } from '@/hooks/useRazorpay'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/config'
import { useAddresses } from '@/hooks/useAddresses'
import { Address } from '@/firebase/addresses'

const Checkout = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const discount = searchParams.get('discount') || '0'
    const ship = searchParams.get('ship') || '0'

    const { cartState, clearCart } = useCart();
    const { initiatePayment, isLoading, error } = useRazorpay();
    const [user, loading, authError] = useAuthState(auth);
    const { addresses, loading: addressLoading, addAddress, makeDefault, getDefaultAddress } = useAddresses();
    
    const [totalCart, setTotalCart] = useState<number>(0)
    const [activePayment, setActivePayment] = useState<string>('razorpay')
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [showAddressForm, setShowAddressForm] = useState<boolean>(false)
    const [saveAddress, setSaveAddress] = useState<boolean>(true)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        streetAddress: '',
        state: '',
        zip: '',
        note: ''
    })

    // Calculate total cart value
    useEffect(() => {
        let total = 0;
        cartState.cartArray.forEach(item => {
            const price = (item as any).salePrice ?? item.price;
            total += price * item.quantity;
        });
        setTotalCart(total);
    }, [cartState.cartArray]);

    // Update email when user changes
    useEffect(() => {
        if (user?.email && !formData.email) {
            setFormData(prev => ({
                ...prev,
                email: user.email || ''
            }))
        }
    }, [user?.email, formData.email])

    const populateFormWithAddress = useCallback((address: Address) => {
        setFormData(prev => ({
            firstName: address.firstName,
            lastName: address.lastName,
            email: user?.email || prev.email,
            phone: address.phone,
            country: address.country,
            city: address.city,
            streetAddress: address.streetAddress,
            state: address.state,
            zip: address.zip,
            note: prev.note // Keep existing note
        }))
    }, [user?.email])

    // Set default address when addresses load
    useEffect(() => {
        if (addresses.length > 0 && !selectedAddress) {
            const defaultAddr = getDefaultAddress()
            if (defaultAddr) {
                setSelectedAddress(defaultAddr)
                populateFormWithAddress(defaultAddr)
            }
        }
    }, [addresses, selectedAddress, getDefaultAddress, populateFormWithAddress])

    const handleAddressSelect = (address: Address) => {
        setSelectedAddress(address)
        populateFormWithAddress(address)
        setShowAddressForm(false)
    }

    const handleNewAddress = () => {
        setSelectedAddress(null)
        setFormData({
            firstName: '',
            lastName: '',
            email: user?.email || '',
            phone: '',
            country: '',
            city: '',
            streetAddress: '',
            state: '',
            zip: '',
            note: ''
        })
        setShowAddressForm(true)
    }

    const finalAmount = totalCart - Number(discount) + Number(ship)

    const handlePayment = (item: string) => {
        setActivePayment(item)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        })
    }

    const handleRazorpayPayment = async () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            alert('Please fill in all required fields')
            return
        }

        const userDetails = {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone
        }

        await initiatePayment(
            finalAmount,
            userDetails,
            (response) => {
                // Payment success
                console.log('Payment successful:', response)
                clearCart()
                router.push(`/payment/success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}&amount=${finalAmount}`)
            },
            (error) => {
                // Payment failure
                console.error('Payment failed:', error)
                router.push(`/payment/failure?error=${encodeURIComponent(error.error || 'Payment failed')}`)
            }
        )
    }

    const handleFormSubmit = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault()
        }
        
        // Save address if user wants to and it's a new address
        if (user && saveAddress && !selectedAddress && showAddressForm) {
            try {
                await addAddress({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    country: formData.country,
                    city: formData.city,
                    streetAddress: formData.streetAddress,
                    state: formData.state,
                    zip: formData.zip,
                    isDefault: addresses.length === 0 // Make first address default
                })
            } catch (error) {
                console.error('Error saving address:', error)
                // Continue with payment even if address save fails
            }
        }
        
        if (activePayment === 'razorpay') {
            await handleRazorpayPayment()
        } else {
            // Handle other payment methods
            alert('This payment method is not yet implemented')
        }
    }

    // Show loading state while checking authentication
    if (loading) {
        return (
            <>
                <div id="header" className='relative w-full'>
                    <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
                    <MenuFurniture props="bg-white" />
                    <MenuCategory />
                    <Breadcrumb heading='Checkout' subHeading='Checkout' />
                </div>
                <div className="cart-block md:py-20 py-10">
                    <div className="container">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                                <p className="text-secondary">Loading...</p>
                            </div>
                        </div>
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
                <Breadcrumb heading='Checkout' subHeading='Checkout' />
            </div>
            <div className="cart-block md:py-20 py-10">
                <div className="container">
                    <div className="content-main flex justify-between">
                        <div className="left w-1/2">
                            {!user && (
                                <>
                                    <div className="login bg-surface py-3 px-4 flex justify-between rounded-lg">
                                        <div className="left flex items-center"><span className="text-on-surface-variant1 pr-4">Already have an account? </span><Link href="/login" className="text-button text-on-surface hover-underline cursor-pointer">Login</Link></div>
                                        <div className="right"><Icon.CaretDown className="text-xl block cursor-pointer" /></div>
                                    </div>
                                    <div className="form-login-block mt-3">
                                        <form className="p-5 border border-line rounded-lg">
                                            <div className="grid sm:grid-cols-2 gap-5">
                                                <div className="email ">
                                                    <input className="border-line px-4 pt-3 pb-3 w-full rounded-lg" id="username" type="email" placeholder="Username or email" required />
                                                </div>
                                                <div className="pass ">
                                                    <input className="border-line px-4 pt-3 pb-3 w-full rounded-lg" id="password" type="password" placeholder="Password" required />
                                                </div>
                                            </div>
                                            <div className="block-button mt-3">
                                                <button className="button-main button-blue-hover">Login</button>
                                            </div>
                                        </form>
                                    </div>
                                </>
                            )}
                            {user && (
                                <div className="user-info bg-surface py-4 px-6 rounded-lg mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="user-avatar w-12 h-12 bg-green rounded-full flex items-center justify-center">
                                            <Icon.User className="text-white text-xl" />
                                        </div>
                                        <div>
                                            <div className="text-title">Welcome back!</div>
                                            <div className="text-secondary text-sm">{user.email}</div>
                                        </div>
                                        <div className="ml-auto">
                                            <button 
                                                onClick={() => auth.signOut()}
                                                className="text-button text-red hover:underline"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Address Section */}
                            <div className="address-section mt-5">
                                <div className="heading5">Address</div>
                                {user && addresses.length > 0 && !showAddressForm ? (
                                    <div className="saved-addresses mt-4">
                                        <div className="addresses-list space-y-3">
                                            {addresses.map((address) => (
                                                <div 
                                                    key={address.id} 
                                                    className={`address-card p-4 border rounded-lg cursor-pointer transition-colors ${
                                                        selectedAddress?.id === address.id 
                                                            ? 'border-green bg-green/5' 
                                                            : 'border-line hover:border-green/50'
                                                    }`}
                                                    onClick={() => handleAddressSelect(address)}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <input
                                                                    type="radio"
                                                                    checked={selectedAddress?.id === address.id}
                                                                    onChange={() => handleAddressSelect(address)}
                                                                    className="text-green"
                                                                />
                                                                <span className="font-medium">{address.firstName} {address.lastName}</span>
                                                                {address.isDefault && (
                                                                    <span className="text-xs bg-green text-white px-2 py-1 rounded">Default</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-secondary">
                                                                <div>{address.streetAddress}, {address.city}, {address.state} {address.zip}, {address.country}</div>
                                                                <div className="mt-1">Phone: {address.phone}</div>
                                                                <div>Email: {user?.email || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleNewAddress}
                                            className="mt-4 text-green hover:underline text-sm font-medium"
                                        >
                                            + Add New Address
                                        </button>
                                    </div>
                                ) : (
                                    <div className="new-address mt-4">
                                        {user && addresses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAddressForm(false)}
                                                className="mb-4 text-green hover:underline text-sm"
                                            >
                                                ← Back to saved addresses
                                            </button>
                                        )}
                                        {user && addresses.length === 0 && (
                                            <p className="text-secondary text-sm mb-4">No saved addresses found. Please add your address below.</p>
                                        )}
                                        
                                        {/* New Address Form */}
                                        <div className="address-form mt-4">
                                            <form onSubmit={handleFormSubmit}>
                                                <div className="grid sm:grid-cols-2 gap-4 gap-y-5 flex-wrap">
                                                    <div className="">
                                                        <input 
                                                            className="border-line px-4 py-3 w-full rounded-lg" 
                                                            id="firstName" 
                                                            type="text" 
                                                            placeholder="First Name *" 
                                                            value={formData.firstName}
                                                            onChange={handleInputChange}
                                                            required 
                                                        />
                                                    </div>
                                                    <div className="">
                                                        <input 
                                                            className="border-line px-4 py-3 w-full rounded-lg" 
                                                            id="lastName" 
                                                            type="text" 
                                                            placeholder="Last Name *" 
                                                            value={formData.lastName}
                                                            onChange={handleInputChange}
                                                            required 
                                                        />
                                                    </div>
                                                    <div className="">
                                                        <input 
                                                            className="border-line px-4 py-3 w-full rounded-lg" 
                                                            id="email" 
                                                            type="email" 
                                                            placeholder="Email Address *" 
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            required 
                                                        />
                                                    </div>
                                                    <div className="">
                                                        <input 
                                                            className="border-line px-4 py-3 w-full rounded-lg" 
                                                            id="phone" 
                                                            type="tel" 
                                                            placeholder="Phone Number *" 
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                            required 
                                                        />
                                                    </div>
                                                    <div className="col-span-full">
                                                        <input 
                                                            className="border-line px-4 py-3 w-full rounded-lg" 
                                                            id="streetAddress" 
                                                            type="text" 
                                                            placeholder="Full Address (Street, Area, Landmark) *" 
                                                            value={formData.streetAddress}
                                                            onChange={handleInputChange}
                                                            required 
                                                        />
                                                    </div>
                                                    <div className="">
                                                        <input 
                                                            className="border-line px-4 py-3 w-full rounded-lg" 
                                                            id="city" 
                                                            type="text" 
                                                            placeholder="City *" 
                                                            value={formData.city}
                                                            onChange={handleInputChange}
                                                            required 
                                                        />
                                                    </div>
                                                    <div className="select-block">
                                                        <select 
                                                            className="border border-line px-4 py-3 w-full rounded-lg" 
                                                            id="state" 
                                                            name="state" 
                                                            value={formData.state}
                                                            onChange={handleInputChange}
                                                            required
                                                        >
                                                            <option value="" disabled>Choose State *</option>
                                                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                                                            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                                            <option value="Assam">Assam</option>
                                                            <option value="Bihar">Bihar</option>
                                                            <option value="Chhattisgarh">Chhattisgarh</option>
                                                            <option value="Goa">Goa</option>
                                                            <option value="Gujarat">Gujarat</option>
                                                            <option value="Haryana">Haryana</option>
                                                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                                                            <option value="Jharkhand">Jharkhand</option>
                                                            <option value="Karnataka">Karnataka</option>
                                                            <option value="Kerala">Kerala</option>
                                                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                                                            <option value="Maharashtra">Maharashtra</option>
                                                            <option value="Manipur">Manipur</option>
                                                            <option value="Meghalaya">Meghalaya</option>
                                                            <option value="Mizoram">Mizoram</option>
                                                            <option value="Nagaland">Nagaland</option>
                                                            <option value="Odisha">Odisha</option>
                                                            <option value="Punjab">Punjab</option>
                                                            <option value="Rajasthan">Rajasthan</option>
                                                            <option value="Sikkim">Sikkim</option>
                                                            <option value="Tamil Nadu">Tamil Nadu</option>
                                                            <option value="Telangana">Telangana</option>
                                                            <option value="Tripura">Tripura</option>
                                                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                                                            <option value="Uttarakhand">Uttarakhand</option>
                                                            <option value="West Bengal">West Bengal</option>
                                                            <option value="Delhi">Delhi</option>
                                                        </select>
                                                        <Icon.CaretDown className='arrow-down' />
                                                    </div>
                                                    <div className="">
                                                        <input 
                                                            className="border-line px-4 py-3 w-full rounded-lg" 
                                                            id="zip" 
                                                            type="text" 
                                                            placeholder="PIN Code *" 
                                                            value={formData.zip}
                                                            onChange={handleInputChange}
                                                            required 
                                                        />
                                                    </div>
                                                    <div className="select-block">
                                                        <select 
                                                            className="border border-line px-4 py-3 w-full rounded-lg" 
                                                            id="country" 
                                                            name="country" 
                                                            value={formData.country}
                                                            onChange={handleInputChange}
                                                            required
                                                        >
                                                            <option value="" disabled>Choose Country *</option>
                                                            <option value="India">India</option>
                                                        </select>
                                                        <Icon.CaretDown className='arrow-down' />
                                                    </div>
                                                    
                                                    {/* Save Address Checkbox */}
                                                    {user && (
                                                        <div className="col-span-full">
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    type="checkbox" 
                                                                    id="saveAddress" 
                                                                    checked={saveAddress}
                                                                    onChange={(e) => setSaveAddress(e.target.checked)}
                                                                />
                                                                <label htmlFor="saveAddress" className="text-sm text-secondary">
                                                                    Save this address for future orders
                                                                </label>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Order Notes Section */}
                                                <div className="order-notes-section mt-6">
                                                    <div className="heading6">Order Notes (Optional)</div>
                                                    <div className="mt-3">
                                                        <textarea 
                                                            className="border border-line px-4 py-3 w-full rounded-lg" 
                                                            id="note" 
                                                            name="note" 
                                                            placeholder="Any special instructions for your order..."
                                                            value={formData.note}
                                                            onChange={handleInputChange}
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="payment-block md:mt-10 mt-6">
                                <div className="heading5">Choose payment Option:</div>
                                <div className="list-payment mt-5">
                                    <div className={`type bg-surface p-5 border border-line rounded-lg ${activePayment === 'razorpay' ? 'open' : ''}`}>
                                        <input className="cursor-pointer" type="radio" id="razorpay" name="payment" checked={activePayment === 'razorpay'} onChange={() => handlePayment('razorpay')} />
                                        <label className="text-button pl-2 cursor-pointer" htmlFor="razorpay">Razorpay (UPI, Cards, Wallets, NetBanking)</label>
                                        <div className="infor">
                                            <div className="text-on-surface-variant1 pt-4">Pay securely using Razorpay. Supports UPI, Credit/Debit Cards, Net Banking, and Digital Wallets. Your payment is processed securely.</div>
                                            {error && (
                                                <div className="text-red mt-2 text-sm">{error}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`type bg-surface p-5 border border-line rounded-lg mt-5 ${activePayment === 'cash-delivery' ? 'open' : ''}`}>
                                        <input className="cursor-pointer" type="radio" id="delivery" name="payment" checked={activePayment === 'cash-delivery'} onChange={() => handlePayment('cash-delivery')} />
                                        <label className="text-button pl-2 cursor-pointer" htmlFor="delivery">Cash on Delivery (COD)</label>
                                        <div className="infor">
                                            <div className="text-on-surface-variant1 pt-4">Pay with cash when your order is delivered to your doorstep. No advance payment required.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="block-button md:mt-10 mt-6">
                                <button 
                                    type="button" 
                                    className="button-main w-full"
                                    disabled={isLoading}
                                    onClick={() => handleFormSubmit()}
                                >
                                    {isLoading ? 'Processing...' : activePayment === 'razorpay' ? 'Proceed to Pay' : 'Pay Now'}
                                </button>
                            </div>
                        </div>
                        <div className="right w-5/12">
                            <div className="checkout-block">
                                <div className="heading5 pb-3">Your Order</div>
                                <div className="list-product-checkout">
                                    {cartState.cartArray.length < 1 ? (
                                        <p className='text-button pt-3'>No product in cart</p>
                                    ) : (
                                        cartState.cartArray.map((product, index) => (
                                            <div key={product.id || index} className="item flex items-center justify-between w-full pb-5 border-b border-line gap-6 mt-5">
                                                <div className="bg-img w-[100px] aspect-square flex-shrink-0 rounded-lg overflow-hidden">
                                                    <Image
                                                        src={product.thumbImage && product.thumbImage[0] || '/images/product/default.png'}
                                                        width={500}
                                                        height={500}
                                                        alt='img'
                                                        className='w-full h-full'
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between w-full">
                                                    <div>
                                                        <div className="name text-title">{product.name}</div>
                                                        <div className="caption1 text-secondary mt-2">
                                                            <span className='size capitalize'>{product.selectedSize || (product.sizes && product.sizes[0]) || 'N/A'}</span>
                                                            <span>/</span>
                                                            <span className='color capitalize'>{product.selectedColor || (product.variation && product.variation[0] && product.variation[0].color) || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-title">
                                                        <span className='quantity'>{product.quantity}</span>
                                                        <span className='px-1'>x</span>
                                                        <span>
                                                            ₹{((product as any).salePrice ?? product.price)}.00
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="discount-block py-5 flex justify-between border-b border-line">
                                    <div className="text-title">Discounts</div>
                                    <div className="text-title">-₹<span className="discount">{discount}</span><span>.00</span></div>
                                </div>
                                <div className="ship-block py-5 flex justify-between border-b border-line">
                                    <div className="text-title">Shipping</div>
                                    <div className="text-title">{Number(ship) === 0 ? 'Free' : `₹${ship}.00`}</div>
                                </div>
                                <div className="total-cart-block pt-5 flex justify-between">
                                    <div className="heading5">Total</div>
                                    <div className="heading5 total-cart">₹{totalCart - Number(discount) + Number(ship)}.00</div>
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

export default Checkout