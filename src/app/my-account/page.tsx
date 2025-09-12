'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer/Footer'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { ref, get, set, remove } from 'firebase/database'
import { database } from '@/firebase/config'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import BannerTop from '@/components/Home3/BannerTop'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/config'
import { getCustomerOrders, Order, updateOrderStatus } from '@/firebase/orders'

interface Address {
    id: string
    addressName: string
    firstName: string
    lastName: string
    country: string
    streetAddress: string
    city: string
    state: string
    zip: string
    phone: string
}

interface UserData {
    uid: string
    fullName: string
    email: string
    phone: number
    country_code: string
    createdAt: string
    updatedAt: string
    lastLogin: string
    addresses?: Address[]
}

const MyAccount = () => {
    const [user, loading, error] = useAuthState(auth)
    const [activeTab, setActiveTab] = useState<string | undefined>('orders')
    const [activeAddress, setActiveAddress] = useState<string | null>(null)
    const [activeOrders, setActiveOrders] = useState<string | undefined>('all')
    const [openDetail, setOpenDetail] = useState<boolean | undefined>(false)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [editingAddress, setEditingAddress] = useState<Address | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [ordersLoading, setOrdersLoading] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [cancellingOrder, setCancellingOrder] = useState(false)
    const [showCancelPopup, setShowCancelPopup] = useState(false)
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null)
    
    // Form state for address
    const [formData, setFormData] = useState({
        addressName: '',
        firstName: '',
        lastName: '',
        country: '',
        streetAddress: '',
        city: '',
        state: '',
        zip: '',
        phone: ''
    })

    const handleCancelOrder = (orderId: string) => {
        setOrderToCancel(orderId)
        setShowCancelPopup(true)
    }

    const confirmCancelOrder = async () => {
        if (!orderToCancel) return

        setCancellingOrder(true)
        setShowCancelPopup(false)
        
        try {
            // Update order status to cancelled
            await updateOrderStatus(orderToCancel, 'cancelled')
            
            // Update local orders state
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.orderId === orderToCancel 
                        ? { ...order, orderStatus: 'cancelled' as const }
                        : order
                )
            )
            
            // Update selected order if it's the one being cancelled
            if (selectedOrder && selectedOrder.orderId === orderToCancel) {
                setSelectedOrder(prev => prev ? { ...prev, orderStatus: 'cancelled' as const } : null)
            }
            
            // Order cancelled successfully
        } catch (error) {
            console.error('Error cancelling order:', error)
            // Failed to cancel order
        } finally {
            setCancellingOrder(false)
            setOrderToCancel(null)
        }
    }

    const cancelCancelOrder = () => {
        setShowCancelPopup(false)
        setOrderToCancel(null)
    }

    const fetchAddresses = useCallback(async () => {
        if (!user) return
        
        try {
            const addressesRef = ref(database, `/customers/${user.uid}/addresses`)
            const snapshot = await get(addressesRef)
            
            if (snapshot.exists()) {
                const addressesData = snapshot.val()
                const addressesArray = Array.isArray(addressesData) 
                    ? addressesData 
                    : Object.entries(addressesData).map(([key, value]) => ({
                        id: key,
                        ...(value as Omit<Address, 'id'>)
                    }))
                setAddresses(addressesArray)
            }
        } catch (error) {
            console.error('Error fetching addresses:', error)
        }
    }, [user])

    const fetchOrders = useCallback(async () => {
        if (!user) return
        
        try {
            setOrdersLoading(true)
            const userOrders = await getCustomerOrders(user.uid)
            setOrders(userOrders)
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setOrdersLoading(false)
        }
    }, [user])

    const resetForm = () => {
        setFormData({
            addressName: '',
            firstName: '',
            lastName: '',
            country: '',
            streetAddress: '',
            city: '',
            state: '',
            zip: '',
            phone: ''
        })
    }

    const openAddForm = () => {
        resetForm()
        setEditingAddress(null)
        setActiveAddress('new')
    }

    const openEditForm = (address: Address) => {
        setFormData({
            addressName: address.addressName,
            firstName: address.firstName,
            lastName: address.lastName,
            country: address.country,
            streetAddress: address.streetAddress,
            city: address.city,
            state: address.state,
            zip: address.zip,
            phone: address.phone
        })
        setEditingAddress(address)
        setActiveAddress('edit')
    }

    const closeForm = () => {
        resetForm()
        setEditingAddress(null)
        setActiveAddress(null)
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) return

        try {

            if (activeAddress === 'edit' && editingAddress) {
                // Update existing address
                const addressRef = ref(database, `/customers/${user.uid}/addresses/${editingAddress.id}`)
                await set(addressRef, formData)
                
                // Update local state
                setAddresses(prev => prev.map(addr => 
                    addr.id === editingAddress.id 
                        ? { ...formData, id: editingAddress.id }
                        : addr
                ))
                // Address updated successfully
            } else {
                // Add new address
                const newAddressId = Date.now().toString()
                const newAddressRef = ref(database, `/customers/${user.uid}/addresses/${newAddressId}`)
                await set(newAddressRef, formData)
                
                // Update local state
                setAddresses(prev => [...prev, { ...formData, id: newAddressId }])
            }

            closeForm()
        } catch (error) {
            console.error('Error saving address:', error)
            // Failed to save address
        }
    }

    const deleteAddress = async (addressId: string) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return

        try {
            if (!user) return
            
            const addressRef = ref(database, `/customers/${user.uid}/addresses/${addressId}`)
            await remove(addressRef)
            
            // Update local state
            setAddresses(prev => prev.filter(a => a.id !== addressId))
            // Address deleted successfully
        } catch (error) {
            console.error('Error deleting address:', error)
            // Failed to delete address
        }
    }

    const fetchUserData = useCallback(async () => {
        if (!user) return
        
        try {
            
            let firebaseData = null;
            try {
                const userRef = ref(database, `/customers/${user.uid}`);
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    firebaseData = snapshot.val();
                }
            } catch (error) {
                console.error('Error fetching Firebase data:', error);
            }

            const userData: UserData = {
                uid: user.uid,
                fullName: firebaseData?.fullName || user.displayName || 'User',
                email: user.email || '',
                phone: firebaseData?.phone || 0,
                country_code: firebaseData?.country_code || '',
                createdAt: firebaseData?.createdAt || new Date().toISOString(),
                updatedAt: firebaseData?.updatedAt || new Date().toISOString(),
                lastLogin: firebaseData?.lastLogin || new Date().toISOString()
            }

            setUserData(userData)
        } catch (error) {
            console.error('Error processing user data:', error)
        }
    }, [user])

    useEffect(() => {
        if (user) {
            fetchUserData()
            fetchAddresses()
            fetchOrders()
        }
    }, [user, fetchUserData, fetchAddresses, fetchOrders])

    const handleActiveOrders = (order: string) => {
        setActiveOrders(order)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-lg mb-4">Please log in to access your account</div>
                    <Link href="/login" className="bg-green text-white px-6 py-2 rounded-lg">
                        Login
                    </Link>
                </div>
            </div>
        )
    }

    if (!userData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">User not found. Please login again.</div>
            </div>
        )
    }

    return (
        <>
             <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
         <MenuFurniture props="bg-white" />
         <MenuCategory />
         </div>
            <div className="profile-block md:py-20 py-10">
                <div className="container">
                    <div className="content-main flex gap-y-8 max-md:flex-col w-full">
                        <div className="left md:w-1/3 w-full xl:pr-[3.125rem] lg:pr-[28px] md:pr-[16px]">
                            <div className="user-infor bg-surface lg:px-7 px-4 lg:py-10 py-5 md:rounded-[20px] rounded-xl">
                                <div className="heading flex flex-col items-center justify-center">
                                    <div className="avatar">
                                        <div className="md:w-[140px] w-[120px] md:h-[140px] h-[120px] rounded-full bg-gray-200 flex items-center justify-center">
                                            <Icon.User size={60} className="text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="name heading6 mt-4 text-center">{userData.fullName}</div>
                                    <div className="mail heading6 font-normal normal-case text-secondary text-center mt-1">{userData.email}</div>
                                </div>
                                <div className="menu-tab w-full max-w-none lg:mt-10 mt-6">
                                    <Link href={'#!'} scroll={false} className={`item flex items-center gap-3 w-full px-5 py-4 rounded-lg cursor-pointer duration-300 hover:bg-white ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                                        <Icon.Package size={20} />
                                        <strong className="heading6">Orders</strong>
                                    </Link>
                                    <Link href={'#!'} scroll={false} className={`item flex items-center gap-3 w-full px-5 py-4 rounded-lg cursor-pointer duration-300 hover:bg-white mt-1.5 ${activeTab === 'address' ? 'active' : ''}`} onClick={() => setActiveTab('address')}>
                                        <Icon.Tag size={20} />
                                        <strong className="heading6">My Address</strong>
                                    </Link>
                                    <Link href={'#!'} scroll={false} className={`item flex items-center gap-3 w-full px-5 py-4 rounded-lg cursor-pointer duration-300 hover:bg-white mt-1.5 ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                                        <Icon.GearSix size={20} />
                                        <strong className="heading6">Profile</strong>
                                    </Link>
                                    <Link href={'/login'} className="item flex items-center gap-3 w-full px-5 py-4 rounded-lg cursor-pointer duration-300 hover:bg-white mt-1.5">
                                        <Icon.SignOut size={20} />
                                        <strong className="heading6">Logout</strong>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="right md:w-2/3 w-full pl-2.5">
                            {/* Orders Tab with Dynamic Stats */}
                            <div className={`tab text-content w-full ${activeTab === 'orders' ? 'block' : 'hidden'}`}>
                                {/* Dynamic Order Statistics */}
                                <div className="overview grid sm:grid-cols-3 gap-5 mb-7">
                                    <div className="item flex items-center justify-between p-5 border border-line rounded-lg box-shadow-xs">
                                        <div className="counter">
                                            <span className="text-secondary">Pending Orders</span>
                                            <h5 className="heading5 mt-1">{orders.filter(order => order.orderStatus === 'pending').length}</h5>
                                        </div>
                                        <Icon.HourglassMedium className='text-4xl' />
                                    </div>
                                    <div className="item flex items-center justify-between p-5 border border-line rounded-lg box-shadow-xs">
                                        <div className="counter">
                                            <span className="text-secondary">Cancelled Orders</span>
                                            <h5 className="heading5 mt-1">{orders.filter(order => order.orderStatus === 'cancelled').length}</h5>
                                        </div>
                                        <Icon.ReceiptX className='text-4xl' />
                                    </div>
                                    <div className="item flex items-center justify-between p-5 border border-line rounded-lg box-shadow-xs">
                                        <div className="counter">
                                            <span className="text-secondary">Total Orders</span>
                                            <h5 className="heading5 mt-1">{orders.length}</h5>
                                        </div>
                                        <Icon.Package className='text-4xl' />
                                    </div>
                                </div>
                            </div>

                            {/* Orders Tab */}
                            <div className={`tab text-content overflow-hidden w-full p-7 border border-line rounded-xl ${activeTab === 'orders' ? 'block' : 'hidden'}`}>
                                <h6 className="heading6">Your Orders</h6>
                                <div className="w-full overflow-x-auto">
                                    <div className="menu-tab grid grid-cols-5 max-lg:w-[500px] border-b border-line mt-3">
                                        {['all', 'pending', 'delivery', 'completed', 'canceled'].map((item, index) => (
                                            <button
                                                key={index}
                                                className={`item relative px-3 py-2.5 text-secondary text-center duration-300 hover:text-black border-b-2 ${activeOrders === item ? 'active border-black' : 'border-transparent'}`}
                                                onClick={() => handleActiveOrders(item)}
                                            >
                                                <span className='relative text-button z-[1]'>
                                                    {item}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="list_order">
                                    {ordersLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                                <p className="text-secondary text-sm">Loading orders...</p>
                                            </div>
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-secondary mb-4">No orders found</div>
                                            <Link href="/shop" className="button-main">
                                                Start Shopping
                                            </Link>
                                        </div>
                                    ) : (
                                        orders
                                            .filter(order => {
                                                if (activeOrders === 'all') return true;
                                                if (activeOrders === 'pending') return order.orderStatus === 'pending';
                                                if (activeOrders === 'delivery') return order.orderStatus === 'shipped';
                                                if (activeOrders === 'completed') return order.orderStatus === 'delivered';
                                                if (activeOrders === 'canceled') return order.orderStatus === 'cancelled';
                                                return true;
                                            })
                                            .map((order) => (
                                                <div key={order.orderId} className="order_item mt-5 border border-line rounded-lg box-shadow-xs">
                                        <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-line">
                                            <div className="flex items-center gap-2">
                                                <strong className="text-title">Order Number:</strong>
                                                            <strong className="order_number text-button uppercase">{order.orderId}</strong>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <strong className="text-title">Order status:</strong>
                                                            <span className={`tag px-4 py-1.5 rounded-full caption1 font-semibold ${
                                                                order.orderStatus === 'pending' ? 'bg-yellow/10 text-yellow' :
                                                                order.orderStatus === 'shipped' ? 'bg-blue/10 text-blue' :
                                                                order.orderStatus === 'delivered' ? 'bg-green/10 text-green' :
                                                                order.orderStatus === 'cancelled' ? 'bg-red/10 text-red' :
                                                                'bg-gray/10 text-gray'
                                                            }`}>
                                                                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                                            </span>
                                            </div>
                                        </div>
                                        <div className="list_prd px-5">
                                                        {order.items.map((item, index) => (
                                                            <div key={index} className="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                                                                <div className="flex items-center gap-5">
                                                    <div className="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                                                        <Image
                                                                            src={item.thumbImage?.[0] || '/images/product/default.png'}
                                                            width={1000}
                                                            height={1000}
                                                                            alt={item.name}
                                                            className='w-full h-full object-cover'
                                                        />
                                                    </div>
                                                    <div>
                                                                        <div className="prd_name text-title">{item.name}</div>
                                                        {(item.selectedSize || item.selectedColor) && (
                                                            <div className="caption1 text-secondary mt-2">
                                                                {item.selectedSize && <span className="prd_size uppercase">{item.selectedSize}</span>}
                                                                {item.selectedSize && item.selectedColor && <span>/</span>}
                                                                {item.selectedColor && <span className="prd_color capitalize">{item.selectedColor}</span>}
                                                            </div>
                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className='text-title'>
                                                                    <span className="prd_quantity">{item.quantity}</span>
                                                                    <span> X </span>
                                                                    <span className="prd_price">₹{item.salePrice || item.price}.00</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 p-5">
                                                        <div className="flex-1">
                                                            <div className="text-sm text-secondary mb-2">
                                                                <strong>Order Date: {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}</strong>
                                                            </div>
                                                            <div className="text-xs text-secondary">
                                                                Time: {new Date(order.createdAt).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button className="button-main" onClick={() => {
                                                                setSelectedOrder(order);
                                                                setOpenDetail(true);
                                                            }}>
                                                                Order Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>

                            {/* Address Tab */}
                            <div className={`tab_address text-content w-full p-7 border border-line rounded-xl ${activeTab === 'address' ? 'block' : 'hidden'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h6 className="heading6">My Addresses</h6>
                                    <button
                                        className="button-main bg-black text-white px-6 py-3 rounded-lg hover:bg-black/90 duration-300"
                                        onClick={openAddForm}
                                    >
                                        Add New Address
                                    </button>
                                            </div>

                                {/* List of saved addresses */}
                                {addresses.length > 0 && activeAddress !== 'new' && activeAddress !== 'edit' && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {addresses.map((address) => (
                                            <div key={address.id} className="border border-line rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h6 className="heading6">{address.addressName}</h6>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            className="text-secondary hover:text-black"
                                                            onClick={() => openEditForm(address)}
                                                        >
                                                            <Icon.PencilSimple size={20} />
                                                        </button>
                                    <button
                                                            className="text-red hover:text-red-600"
                                                            onClick={() => deleteAddress(address.id)}
                                                        >
                                                            <Icon.Trash size={20} />
                                    </button>
                                            </div>
                                            </div>
                                                <div className="text-secondary">
                                                    <p>{address.firstName} {address.lastName}</p>
                                                    <p>{address.streetAddress}</p>
                                                    <p>{address.city}, {address.state} {address.zip}</p>
                                                    <p>{address.country}</p>
                                                    <p className="mt-2">Phone: {address.phone}</p>
                                            </div>
                                        </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add/Edit Address Form */}
                                {(activeAddress === 'new' || activeAddress === 'edit') && (
                                    <form onSubmit={handleAddressSubmit}>
                                        <div className="heading6 mb-4">{activeAddress === 'edit' ? 'Edit Address' : 'Add New Address'}</div>
                                        <div className='grid sm:grid-cols-2 gap-4 gap-y-5'>
                                            <div className="address-name sm:col-span-2">
                                                <label htmlFor="addressName" className='caption1 capitalize'>Address Name <span className='text-red'>*</span></label>
                                                <input 
                                                    className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                    id="addressName" 
                                                    name="addressName"
                                                    type="text" 
                                                    value={formData.addressName}
                                                    onChange={handleFormChange}
                                                    placeholder="Home, Office, etc." 
                                                    required 
                                                />
                            </div>
                                        <div className="first-name">
                                            <label htmlFor="firstName" className='caption1 capitalize'>First Name <span className='text-red'>*</span></label>
                                            <input 
                                                className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                id="firstName" 
                                                    name="firstName"
                                                type="text" 
                                                    value={formData.firstName}
                                                    onChange={handleFormChange}
                                                required 
                                            />
                                        </div>
                                        <div className="last-name">
                                            <label htmlFor="lastName" className='caption1 capitalize'>Last Name <span className='text-red'>*</span></label>
                                            <input 
                                                className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                id="lastName" 
                                                    name="lastName"
                                                    type="text" 
                                                    value={formData.lastName}
                                                    onChange={handleFormChange}
                                                    required 
                                                />
                                            </div>
                                            <div className="country">
                                                <label htmlFor="country" className='caption1 capitalize'>Country / Region <span className='text-red'>*</span></label>
                                                <input 
                                                    className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                    id="country" 
                                                    name="country"
                                                    type="text" 
                                                    value={formData.country}
                                                    onChange={handleFormChange}
                                                    required 
                                                />
                                            </div>
                                            <div className="street sm:col-span-2">
                                                <label htmlFor="streetAddress" className='caption1 capitalize'>Street Address <span className='text-red'>*</span></label>
                                                <input 
                                                    className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                    id="streetAddress" 
                                                    name="streetAddress"
                                                    type="text" 
                                                    value={formData.streetAddress}
                                                    onChange={handleFormChange}
                                                    required 
                                                />
                                            </div>
                                            <div className="city">
                                                <label htmlFor="city" className='caption1 capitalize'>Town / City <span className='text-red'>*</span></label>
                                                <input 
                                                    className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                    id="city" 
                                                    name="city"
                                                    type="text" 
                                                    value={formData.city}
                                                    onChange={handleFormChange}
                                                    required 
                                                />
                                            </div>
                                            <div className="state">
                                                <label htmlFor="state" className='caption1 capitalize'>State <span className='text-red'>*</span></label>
                                                <input 
                                                    className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                    id="state" 
                                                    name="state"
                                                    type="text" 
                                                    value={formData.state}
                                                    onChange={handleFormChange}
                                                    required 
                                                />
                                            </div>
                                            <div className="zip">
                                                <label htmlFor="zip" className='caption1 capitalize'>ZIP <span className='text-red'>*</span></label>
                                                <input 
                                                    className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                    id="zip" 
                                                    name="zip"
                                                    type="text" 
                                                    value={formData.zip}
                                                    onChange={handleFormChange}
                                                    required 
                                                />
                                            </div>
                                            <div className="phone">
                                                <label htmlFor="phone" className='caption1 capitalize'>Phone <span className='text-red'>*</span></label>
                                                <input 
                                                    className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                    id="phone" 
                                                    name="phone"
                                                    type="text" 
                                                    value={formData.phone}
                                                    onChange={handleFormChange}
                                                    required 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-4 lg:mt-10 mt-6">
                                            <button 
                                                type="submit" 
                                                className="button-main bg-black text-white px-10 py-3 rounded-lg hover:bg-black/90 duration-300"
                                            >
                                                {activeAddress === 'edit' ? 'Update Address' : 'Save Address'}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="button-main bg-white border border-black text-black px-10 py-3 rounded-lg hover:bg-black hover:text-white duration-300"
                                                onClick={closeForm}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Empty state */}
                                {addresses.length === 0 && activeAddress !== 'new' && activeAddress !== 'edit' && (
                                    <div className="text-center py-8">
                                        <Icon.MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p className="text-secondary mb-4">You haven&apos;t added any addresses yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Profile Tab */}
                            <div className={`tab text-content w-full p-7 border border-line rounded-xl ${activeTab === 'profile' ? 'block' : 'hidden'}`}>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const updatedData = {
                                        fullName: formData.get('fullName'),
                                        phone: formData.get('phoneNumber'),
                                        email: formData.get('email'),
                                    };

                                    try {
                                        const userStr = localStorage.getItem('user');
                                        if (!userStr) return;

                                        const localUser = JSON.parse(userStr);
                                        
                                        // Get current Firebase data
                                        const userRef = ref(database, `/customers/${localUser.uid}`);
                                        const snapshot = await get(userRef);
                                        const currentData = snapshot.exists() ? snapshot.val() : {};

                                        // Update in Firebase
                                        await set(userRef, {
                                            ...currentData,
                                            fullName: updatedData.fullName,
                                            phone: updatedData.phone,
                                            email: updatedData.email,
                                            updatedAt: new Date().toISOString()
                                        });

                                        // Update in localStorage
                                        localStorage.setItem('user', JSON.stringify({
                                            ...localUser,
                                            name: updatedData.fullName, // Keep as 'name' in localStorage
                                            email: updatedData.email
                                        }));

                                        // Update state
                                        setUserData(prev => {
                                            if (!prev) return prev;
                                            return {
                                                ...prev,
                                                fullName: updatedData.fullName as string,
                                                phone: Number(updatedData.phone) || 0,
                                                email: updatedData.email as string,
                                                updatedAt: new Date().toISOString()
                                            };
                                        });

                                        // Profile updated successfully
                                    } catch (error) {
                                        console.error('Error updating profile:', error);
                                        // Failed to update profile
                                    }
                                }}>
                                    <div className="heading5 pb-4">Information</div>
                                    <div className='grid sm:grid-cols-2 gap-4 gap-y-5 mt-5'>
                                        <div className="full-name sm:col-span-2">
                                            <label htmlFor="fullName" className='caption1 capitalize'>Full Name <span className='text-red'>*</span></label>
                                            <input 
                                                className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                id="fullName" 
                                                name="fullName"
                                                type="text" 
                                                defaultValue={userData.fullName} 
                                                placeholder='Full name' 
                                                required 
                                            />
                                        </div>
                                        <div className="phone-number">
                                            <label htmlFor="phoneNumber" className='caption1 capitalize'>Phone Number <span className='text-red'>*</span></label>
                                            <input 
                                                className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                id="phoneNumber" 
                                                name="phoneNumber"
                                                type="text" 
                                                defaultValue={userData.phone || ''} 
                                                placeholder="Phone number" 
                                                required 
                                            />
                                        </div>
                                        <div className="email">
                                            <label htmlFor="email" className='caption1 capitalize'>Email Address <span className='text-red'>*</span></label>
                                            <input 
                                                className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                id="email" 
                                                name="email"
                                                type="email" 
                                                defaultValue={userData.email} 
                                                placeholder="Email address" 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="block-button lg:mt-10 mt-6">
                                        <button type="submit" className="button-main">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            <div className={`modal-order-detail-block flex items-center justify-center`} onClick={() => setOpenDetail(false)}>
                <div className={`modal-order-detail-main grid grid-cols-2 w-[1160px] bg-white rounded-2xl ${openDetail ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="info p-10 border-r border-line">
                        <h5 className="heading5">Order Details</h5>
                        {selectedOrder && (
                            <div className="list_info grid grid-cols-2 gap-10 gap-y-8 mt-5">
                                <div className="info_item">
                                    <strong className="text-button-uppercase text-secondary">Contact Information</strong>
                                    <h6 className="heading6 order_name mt-2">{selectedOrder.address.firstName} {selectedOrder.address.lastName}</h6>
                                    <h6 className="heading6 order_phone mt-2">{selectedOrder.address.phone}</h6>
                                    <h6 className="heading6 normal-case order_email mt-2">{selectedOrder.userEmail}</h6>
                                </div>
                                <div className="info_item">
                                    <strong className="text-button-uppercase text-secondary">Payment method</strong>
                                    <h6 className="heading6 order_payment mt-2">{selectedOrder.paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery'}</h6>
                                </div>
                                <div className="info_item">
                                    <strong className="text-button-uppercase text-secondary">Shipping address</strong>
                                    <h6 className="heading6 order_shipping_address mt-2">
                                        {selectedOrder.address.streetAddress}, {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zip}, {selectedOrder.address.country}
                                    </h6>
                                </div>
                                <div className="info_item">
                                    <strong className="text-button-uppercase text-secondary">Order Status</strong>
                                    <div className="flex items-center justify-between mt-2">
                                        <h6 className="heading6 order_status capitalize">{selectedOrder.orderStatus}</h6>
                                        {selectedOrder.orderStatus === 'pending' && (
                                            <button 
                                                className="button-main bg-red text-white hover:bg-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => handleCancelOrder(selectedOrder.orderId)}
                                                disabled={cancellingOrder}
                                            >
                                                {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {selectedOrder.couponCode && (
                                    <div className="info_item">
                                        <strong className="text-button-uppercase text-secondary">Coupon Code</strong>
                                        <h6 className="heading6 order_coupon mt-2">{selectedOrder.couponCode}</h6>
                                    </div>
                                )}
                                {selectedOrder.orderStatus === 'confirmed' && selectedOrder.shiprocketOrderId && (
                                    <div className="info_item">
                                        <strong className="text-button-uppercase text-secondary">Shiprocket Tracking</strong>
                                        <h6 className="heading6 shiprocket_order mt-2">Order ID: {selectedOrder.shiprocketOrderId}</h6>
                                        {selectedOrder.shiprocketShipmentId && (
                                            <h6 className="heading6 shiprocket_shipment mt-1">Shipment ID: {selectedOrder.shiprocketShipmentId}</h6>
                                        )}
                                        <div className="mt-3">
                                            <a 
                                                href="https://www.shiprocket.in/shipment-tracking/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-black hover:underline text-xs font-medium border border-gray-300 px-2 py-1 rounded"
                                            >
                                                <Icon.Truck size={12} />
                                                Track Package →
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="list p-10">
                        <h5 className="heading5">Items</h5>
                        <div className="list_prd">
                            {selectedOrder?.items.map((item, index) => (
                                <div key={index} className="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                                    <div className="flex items-center gap-5">
                                        <div className="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                                            <Image
                                                src={item.thumbImage?.[0] || '/images/product/default.png'}
                                                width={1000}
                                                height={1000}
                                                alt={item.name}
                                                className='w-full h-full object-cover'
                                            />
                                        </div>
                                        <div>
                                            <div className="prd_name text-title">{item.name}</div>
                                            {(item.selectedSize || item.selectedColor) && (
                                                <div className="caption1 text-secondary mt-2">
                                                    {item.selectedSize && <span className="prd_size uppercase">{item.selectedSize}</span>}
                                                    {item.selectedSize && item.selectedColor && <span>/</span>}
                                                    {item.selectedColor && <span className="prd_color capitalize">{item.selectedColor}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className='text-title'>
                                        <span className="prd_quantity">{item.quantity}</span>
                                        <span> X </span>
                                        <span className="prd_price">₹{item.salePrice || item.price}.00</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {selectedOrder && (
                            <>
                                <div className="flex items-center justify-between mt-5">
                                    <strong className="text-title">Subtotal</strong>
                                    <strong className="order_subtotal text-title">₹{selectedOrder.subtotal}.00</strong>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <strong className="text-title">Shipping</strong>
                                    <strong className="order_ship text-title">{selectedOrder.shipping === 0 ? 'Free' : `₹${selectedOrder.shipping}.00`}</strong>
                                </div>
                                {selectedOrder.discount > 0 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <strong className="text-title">Discount</strong>
                                        <strong className="order_discounts text-title">-₹{selectedOrder.discount}.00</strong>
                                    </div>
                                )}
                                <div className="flex items-center justify-between mt-5 pt-5 border-t border-line">
                                    <h5 className="heading5">Total</h5>
                                    <h5 className="order_total heading5">₹{selectedOrder.total}.00</h5>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Cancel Order Confirmation Popup */}
            {showCancelPopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-red/10 rounded-full flex items-center justify-center mr-3">
                                <Icon.Warning className="text-red text-xl" />
                            </div>
                            <h3 className="heading6 text-title">Cancel Order</h3>
                        </div>
                        
                        <p className="text-secondary mb-6">
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </p>
                        
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelCancelOrder}
                                className="button-main bg-white border border-line text-black hover:bg-gray-100"
                                disabled={cancellingOrder}
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={confirmCancelOrder}
                                className="button-main bg-red text-white hover:bg-red/90"
                                disabled={cancellingOrder}
                            >
                                {cancellingOrder ? 'Cancelling...' : 'Yes, Cancel Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default MyAccount