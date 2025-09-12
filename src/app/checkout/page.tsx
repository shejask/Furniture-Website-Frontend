'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import Footer from '@/components/Footer/Footer'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { useCart } from '@/context/CartContext'
import { useSearchParams } from 'next/navigation'
import { useRazorpay } from '@/hooks/useRazorpay'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/config'
import { useAddresses } from '@/hooks/useAddresses'
import { Address, getUserAddresses } from '@/firebase/addresses'
import { saveOrder, Order, OrderItem, OrderAddress } from '@/firebase/orders'
import { ref, set } from 'firebase/database'
import { database } from '@/firebase/config'

const Checkout = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    let discount = searchParams.get('discount')
    let ship = searchParams.get('ship')
    let couponCode = searchParams.get('coupon') || searchParams.get('couponCode')

    const { cartState, clearCart } = useCart();
    const { initiatePayment, isLoading, error } = useRazorpay();
    const [user, userLoading, authError] = useAuthState(auth);
    const { addresses, loading: addressLoading, addAddress, editAddress, makeDefault, getDefaultAddress, refreshAddresses, removeAddress } = useAddresses();
    
    // Debug logging
    React.useEffect(() => {
        console.log('Debug - User loading:', userLoading);
        console.log('Debug - User:', user?.email);
        console.log('Debug - Addresses changed:', addresses.length, addresses);
        console.log('Debug - Address loading:', addressLoading);
        console.log('Debug - Discount:', discount);
        console.log('Debug - Shipping:', ship);
        console.log('Debug - Coupon Code:', couponCode);
    }, [userLoading, user, addresses, addressLoading, discount, ship, couponCode]);

    // Test Firebase connection on component mount
    React.useEffect(() => {
        const testFirebaseConnection = async () => {
            try {
                console.log('Testing Firebase connection...');
                const testRef = ref(database, 'test/connection');
                await set(testRef, { timestamp: new Date().toISOString() });
                console.log('Firebase connection test successful');
            } catch (error) {
                console.error('Firebase connection test failed:', error);
            }
        };
        
        if (user) {
            testFirebaseConnection();
        }
    }, [user]);

    
    const [activePayment, setActivePayment] = useState<string>('razorpay')
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [showAddressForm, setShowAddressForm] = useState<boolean>(false)
    const [saveAddress, setSaveAddress] = useState<boolean>(true)
    const [orderNote, setOrderNote] = useState<string>('')
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        country: 'India',
        city: '',
        streetAddress: '',
        state: '',
        zip: '',
    })

    // Update email when user changes
    React.useEffect(() => {
        if (user?.email) {
            // Email is handled separately, not in formData
            console.log('User email:', user.email)
        }
    }, [user?.email])

    const populateFormWithAddress = React.useCallback((address: Address) => {
        console.log('Populating form with address:', address)
        setFormData({
            firstName: address.firstName || '',
            lastName: address.lastName || '',
            phone: address.phone || '',
            country: address.country || 'India',
            city: address.city || '',
            streetAddress: address.streetAddress || '',
            state: address.state || '',
            zip: address.zip || '',
        })
        console.log('Form populated with address data')
    }, [])

    // Set default address when addresses load (only if not showing form)
    React.useEffect(() => {
        if (addresses.length > 0 && !selectedAddress && !showAddressForm) {
            const defaultAddr = getDefaultAddress()
            if (defaultAddr) {
                setSelectedAddress(defaultAddr)
                populateFormWithAddress(defaultAddr)
            }
        } else if (addresses.length === 0 && !addressLoading && user && !showAddressForm) {
            // If user has no addresses and we're not loading, show the address form
            setShowAddressForm(true)
        }
    }, [addresses, selectedAddress, showAddressForm, addressLoading, user, getDefaultAddress, populateFormWithAddress])

    const handleAddressSelect = (address: Address) => {
        setSelectedAddress(address)
        populateFormWithAddress(address)
        setShowAddressForm(false)
    }

    const handleNewAddress = () => {
        console.log('Creating new address - clearing all data')
        setSelectedAddress(null)
        setFormData({
            firstName: '',
            lastName: '',
            phone: '',
            country: 'India',
            city: '',
            streetAddress: '',
            state: '',
            zip: '',
        })
        setShowAddressForm(true)
        console.log('Form cleared, showing new address form')
    }

    const handleEditAddress = (address: Address) => {
        setSelectedAddress(address)
        populateFormWithAddress(address)
        setShowAddressForm(true)
    }

    const handleSaveAddressOnly = async () => {
        if (!user) {
            alert('Please log in to save addresses')
            return
        }

        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.streetAddress || !formData.city || !formData.state || !formData.zip) {
            alert('Please fill in all required fields')
            return
        }

        try {
            // If we have a selected address, update it
            if (selectedAddress?.id) {
                const success = await editAddress(selectedAddress.id, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    country: formData.country,
                    city: formData.city,
                    streetAddress: formData.streetAddress,
                    state: formData.state,
                    zip: formData.zip,
                    addressName: `${formData.streetAddress}, ${formData.city}`
                });

                if (success) {
                    alert('Address updated successfully!')
                    setShowAddressForm(false)
                    await refreshAddresses() // Refresh the address list
                } else {
                    alert('Failed to update address. Please try again.')
                }
            } else {
                // Create new address
                const newAddressId = await addAddress({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    country: formData.country,
                    city: formData.city,
                    streetAddress: formData.streetAddress,
                    state: formData.state,
                    zip: formData.zip,
                    addressName: `${formData.streetAddress}, ${formData.city}`,
                    isDefault: addresses.length === 0
                });
                
                if (newAddressId) {
                    alert('Address saved successfully!')
                    setShowAddressForm(false)
                    
                    // Create a temporary address object to set as selected
                    const newAddress: Address = {
                        id: newAddressId,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        country: formData.country,
                        city: formData.city,
                        streetAddress: formData.streetAddress,
                        state: formData.state,
                        zip: formData.zip,
                        addressName: `${formData.streetAddress}, ${formData.city}`,
                        isDefault: addresses.length === 0
                    }
                    setSelectedAddress(newAddress)
                    await refreshAddresses() // Refresh the address list
                }
            }
        } catch (error) {
            console.error('Error saving/updating address:', error)
            console.error('Error details:', error)
            alert(`Failed to save/update address. Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    // Calculate total cart amount properly
    const calculatedTotalCart = cartState.cartArray.reduce((total, item) => {
        return total + (((item as any).salePrice ?? item.price) * item.quantity);
    }, 0);
    const finalAmount = calculatedTotalCart - Number(discount) + Number(ship)

    const handlePayment = (item: string) => {
        setActivePayment(item)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        })
    }

    const createOrderData = (paymentMethod: 'razorpay' | 'cash-delivery', razorpayPaymentId?: string, razorpayOrderId?: string): Omit<Order, 'id' | 'createdAt' | 'updatedAt'> => {
        if (!user?.uid) {
            throw new Error('User must be logged in to create an order');
        }

        const orderId = razorpayOrderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Convert cart items to order items
        const orderItems: OrderItem[] = cartState.cartArray.map((item) => {
            const orderItem: any = {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            };

            // Only add optional properties if they have values
            if ((item as any).salePrice !== undefined && (item as any).salePrice !== null) {
                orderItem.salePrice = (item as any).salePrice;
            }
            
            if (item.selectedSize) {
                orderItem.selectedSize = item.selectedSize;
            }
            
            if (item.selectedColor) {
                orderItem.selectedColor = item.selectedColor;
            }
            
            if (item.thumbImage) {
                orderItem.thumbImage = item.thumbImage;
            }

            return orderItem;
        });

        // Create order address from form data
        const orderAddress: OrderAddress = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            country: formData.country,
            city: formData.city,
            streetAddress: formData.streetAddress,
            state: formData.state,
            zip: formData.zip,
            addressName: `${formData.streetAddress}, ${formData.city}`
        };

        // Validate address data
        const requiredAddressFields = ['firstName', 'lastName', 'phone', 'country', 'city', 'streetAddress', 'state', 'zip'];
        const missingAddressFields = requiredAddressFields.filter(field => !orderAddress[field as keyof OrderAddress]);
        if (missingAddressFields.length > 0) {
            throw new Error(`Missing required address fields: ${missingAddressFields.join(', ')}`);
        }

        // Create order object with only defined values
        const orderData: any = {
            orderId,
            userId: user.uid,
            userEmail: user.email || '',
            items: orderItems,
            address: orderAddress,
            paymentMethod,
            paymentStatus: paymentMethod === 'razorpay' ? 'completed' : 'pending',
            orderStatus: 'pending',
            subtotal: calculatedTotalCart,
            discount: Number(discount) || 0,
            shipping: Number(ship) || 0,
            total: finalAmount
        };

        // Only add optional properties if they have values
        if (orderNote && orderNote.trim()) {
            orderData.orderNote = orderNote.trim();
        }
        
        if (couponCode && couponCode.trim()) {
            orderData.couponCode = couponCode.trim();
        }
        
        if (razorpayPaymentId) {
            orderData.razorpayPaymentId = razorpayPaymentId;
        }
        
        if (razorpayOrderId) {
            orderData.razorpayOrderId = razorpayOrderId;
        }

        // Validate that all required fields are present and not undefined
        console.log('Validating order data before save:', orderData);
        
        // Check for any undefined values
        const undefinedKeys = Object.keys(orderData).filter(key => orderData[key] === undefined);
        if (undefinedKeys.length > 0) {
            throw new Error(`Order data contains undefined values: ${undefinedKeys.join(', ')}`);
        }

        return orderData;
    };

    const handleRazorpayPayment = async () => {
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            alert('Please fill in all required address fields')
            return
        }

        const userDetails = {
            name: `${formData.firstName} ${formData.lastName}`,
            email: user?.email || '',
            contact: formData.phone
        }

        await initiatePayment(
            finalAmount,
            userDetails,
            async (response) => {
                console.log('Payment successful:', response)
                
                let orderData: any = null;
                try {
                    // Create and save order
                    console.log('Creating order data...');
                    orderData = createOrderData('razorpay', response.razorpay_payment_id, response.razorpay_order_id);
                    console.log('Order data created:', orderData);
                    
                    console.log('Saving order to Firebase...');
                    const savedOrderId = await saveOrder(orderData);
                    console.log('Order saved successfully with ID:', savedOrderId);
                    
                    // Clear cart and redirect
                    clearCart()
                    router.push(`/payment/success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}&amount=${finalAmount}`)
                } catch (error) {
                    console.error('Error saving order:', error);
                    console.error('Error details:', error);
                    console.error('Order data that failed:', orderData);
                    alert(`Payment successful but failed to save order. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please contact support with order ID: ${response.razorpay_order_id}`);
                    clearCart()
                    router.push(`/payment/success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}&amount=${finalAmount}`)
                }
            },
            (error) => {
                console.error('Payment failed:', error)
                router.push(`/payment/failure?error=${encodeURIComponent(error.error || 'Payment failed')}`)
            }
        )
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validate required fields before proceeding
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.streetAddress || !formData.city || !formData.state || !formData.zip) {
            alert('Please fill in all required address fields')
            return
        }

        // Save or update address if user wants to
        if (user && saveAddress && showAddressForm) {
            try {
                if (selectedAddress?.id) {
                    // Update existing address
                    const success = await editAddress(selectedAddress.id, {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        country: formData.country,
                        city: formData.city,
                        streetAddress: formData.streetAddress,
                        state: formData.state,
                        zip: formData.zip,
                        addressName: `${formData.streetAddress}, ${formData.city}`
                    });

                    if (!success) {
                        alert('Failed to update address. Please try again.')
                        return
                    }
                } else {
                    // Create new address
                    const newAddressId = await addAddress({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        country: formData.country,
                        city: formData.city,
                        streetAddress: formData.streetAddress,
                        state: formData.state,
                        zip: formData.zip,
                        addressName: `${formData.streetAddress}, ${formData.city}`,
                        isDefault: addresses.length === 0
                    });
                    
                    if (!newAddressId) {
                        alert('Failed to save address. Please try again.')
                        return
                    }

                    // Create a temporary address object to set as selected
                    const newAddress: Address = {
                        id: newAddressId,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        country: formData.country,
                        city: formData.city,
                        streetAddress: formData.streetAddress,
                        state: formData.state,
                        zip: formData.zip,
                        addressName: `${formData.streetAddress}, ${formData.city}`,
                        isDefault: addresses.length === 0
                    }
                    setSelectedAddress(newAddress)
                }

                // Refresh addresses and hide form
                await refreshAddresses()
                setShowAddressForm(false)
            } catch (error) {
                console.error('Error saving/updating address:', error)
                console.error('Error details:', error)
                alert(`Failed to save/update address. Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                return
            }
        }
        
        if (activePayment === 'razorpay') {
            await handleRazorpayPayment()
        } else if (activePayment === 'cash-delivery') {
            // Handle COD
            let orderData: any = null;
            try {
                console.log('Creating COD order data...');
                orderData = createOrderData('cash-delivery');
                console.log('COD order data created:', orderData);
                
                console.log('Saving COD order to Firebase...');
                const savedOrderId = await saveOrder(orderData);
                console.log('COD order saved successfully with ID:', savedOrderId);
                
                alert('COD order placed successfully!')
                clearCart()
                router.push(`/order-tracking?order_id=${orderData.orderId}`)
            } catch (error) {
                console.error('Error saving COD order:', error);
                console.error('Error details:', error);
                console.error('Order data that failed:', orderData);
                alert(`Failed to save COD order. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
            }
        } else {
            alert('This payment method is not yet implemented')
        }
    }

    if (userLoading) {
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
                    <div className="content-main flex justify-between max-xl:flex-col gap-y-8">
                        <div className="xl:w-2/3 xl:pr-3 w-full">
                            
                            
                            {/* Address Section */}
                            <div className="address-section mt-5">
                                <div className="heading5">Choose Address</div>
                                
                                
                                
                                {/* Loading State */}
                                {userLoading ? (
                                    <div className="loading-addresses mt-4">
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                                <p className="text-secondary text-sm">Loading...</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : user && addressLoading ? (
                                    <div className="loading-addresses mt-4">
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                                <p className="text-secondary text-sm">Loading your addresses...</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : user && !addressLoading && addresses.length > 0 && !showAddressForm ? (
                                    /* Saved Addresses List */
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
                                                                <div>{address.streetAddress}, {address.city}, {address.state} {address.zip}</div>
                                                                <div className="mt-1">Phone: {address.phone}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Prevent address selection
                                                                        e.preventDefault(); // Prevent any form submission
                                                                        handleEditAddress(address);
                                                                    }}
                                                                    className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1"
                                                                    disabled={addressLoading}
                                                                >
                                                                    <Icon.PencilSimple size={14} />
                                                                    Edit
                                                                </button>
                                                                {!address.isDefault && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation(); // Prevent address selection
                                                                            try {
                                                                                const success = await makeDefault(address.id!);
                                                                                if (success) {
                                                                                    alert('Address set as default');
                                                                                } else {
                                                                                    alert('Failed to set as default. Please try again.');
                                                                                }
                                                                            } catch (error) {
                                                                                console.error('Error setting default address:', error);
                                                                                alert('Failed to set as default. Please try again.');
                                                                            }
                                                                        }}
                                                                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                                                                        disabled={addressLoading}
                                                                    >
                                                                        Set as Default
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Add New Address Button */}
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={handleNewAddress}
                                                className="w-full bg-green text-white py-3 px-4 rounded-lg font-medium hover:bg-green/90 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Icon.Plus size={20} />
                                                Add New Address
                                            </button>
                                        </div>
                                    </div>
                                ) : user && !addressLoading ? (
                                    /* Address Form - shown when no addresses or when creating new address */
                                    <div className="new-address mt-4">
                                        {addresses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAddressForm(false)}
                                                className="mb-4 text-green hover:underline text-sm"
                                            >
                                                ← Back to saved addresses
                                            </button>
                                        )}
                                        
                                        {addresses.length === 0 && (
                                            <p className="text-secondary text-sm mb-4">No saved addresses found. Please add your address below.</p>
                                        )}
                                        
                                        {/* Address Form */}
                                        <div className="address-form">
                                            <div className="grid sm:grid-cols-2 gap-4 gap-y-5 flex-wrap">
                                                <div className="">
                                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                                        First Name *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="firstName" 
                                                        type="text" 
                                                        placeholder="Enter your first name" 
                                                        value={formData.firstName}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                <div className="">
                                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Last Name *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="lastName" 
                                                        type="text" 
                                                        placeholder="Enter your last name" 
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                <div className="">
                                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Phone Number *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="phone" 
                                                        type="tel" 
                                                        placeholder="Enter your phone number" 
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                <div className="col-span-full">
                                                    <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Full Address *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="streetAddress" 
                                                        type="text" 
                                                        placeholder="Street, Area, Landmark" 
                                                        value={formData.streetAddress}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                <div className="">
                                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                                        City *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="city" 
                                                        type="text" 
                                                        placeholder="Enter your city" 
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                <div className="select-block">
                                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                                        State *
                                                    </label>
                                                    <select 
                                                        className="border border-line px-4 py-3 w-full rounded-lg" 
                                                        id="state" 
                                                        name="state" 
                                                        value={formData.state}
                                                        onChange={handleInputChange}
                                                        required
                                                    >
                                                        <option value="" disabled>Choose State</option>
                                                        <option value="Kerala">Kerala</option>
                                                        <option value="Tamil Nadu">Tamil Nadu</option>
                                                        <option value="Karnataka">Karnataka</option>
                                                    </select>
                                                    <Icon.CaretDown className='arrow-down' />
                                                </div>
                                                <div className="">
                                                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                                                        PIN Code *
                                                    </label>
                                                    <input 
                                                        className="border-line px-4 py-3 w-full rounded-lg" 
                                                        id="zip" 
                                                        type="text" 
                                                        placeholder="Enter PIN code" 
                                                        value={formData.zip}
                                                        onChange={handleInputChange}
                                                        required 
                                                    />
                                                </div>
                                                
                                                {/* Save Address Checkbox and Button */}
                                                {user && (
                                                    <div className="col-span-full space-y-3">
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
                                                        {saveAddress && (
                                                            <button
                                                                type="button"
                                                                onClick={handleSaveAddressOnly}
                                                                className="button-main bg-white text-black border border-black w-full text-center"
                                                                disabled={addressLoading}
                                                            >
                                                                {addressLoading ? 'Saving...' : 'Save Address'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                                                            </div>
                            
                            {/* Order Notes Section */}
                            <div className="order-notes mt-6">
                                <div className="heading5">Order Notes (Optional)</div>
                                <div className="mt-4">
                                    <textarea 
                                        className="border border-line px-4 py-3 w-full rounded-lg" 
                                        placeholder="Any special instructions for your order..."
                                        value={orderNote}
                                        onChange={(e) => setOrderNote(e.target.value)}
                                        rows={3}
                                    ></textarea>
                                                            </div>
                                                        </div>
                            
                            {/* Payment Section */}
                            <form onSubmit={handleFormSubmit}>
                                <div className="payment-block mt-8">
                                    <div className="heading5">Choose Payment Option:</div>
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
                                        type="submit" 
                                        className="w-full bg-green text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Processing...' : activePayment === 'razorpay' ? 'Proceed to Pay' : 'Place Order'}
                                    </button>
                                        </div>
                                    </form>

                            </div>

                        {/* Order Summary */}
                        <div className="xl:w-1/3 xl:pl-12 w-full">
                            <div className="checkout-block bg-surface p-6 rounded-2xl">
                                <div className="heading5 pb-3">Your Order</div>
                                <div className="list-product-checkout">
                                    {cartState.cartArray.length < 1 ? (
                                        <p className='text-button pt-3'>No product in cart</p>
                                    ) : (
                                        cartState.cartArray.map((product) => (
                                            <div key={product.id} className="item flex items-center justify-between w-full pb-5 border-b border-line gap-6 mt-5">
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
                                    <div className="text-title">
                                        Discounts
                                        {couponCode && (
                                            <div className="text-xs text-green mt-1">Code: {couponCode}</div>
                                        )}
                                    </div>
                                    <div className="text-title">-₹<span className="discount">{discount}</span><span>.00</span></div>
                                </div>
                                <div className="ship-block py-5 flex justify-between border-b border-line">
                                    <div className="text-title">Shipping</div>
                                    <div className="text-title">{Number(ship) === 0 ? 'Free' : `₹${ship}.00`}</div>
                                </div>
                                <div className="total-cart-block pt-5 flex justify-between">
                                    <div className="heading5">Total</div>
                                    <div className="heading5 total-cart">₹{finalAmount}.00</div>
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
