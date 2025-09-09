'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb'
import Footer from '@/components/Footer/Footer'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { motion } from 'framer-motion'
import { ref, get, set, remove } from 'firebase/database'
import { database } from '@/firebase/config'
import { FirebaseProductType } from '@/type/FirebaseProductType'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import SliderFurniture from '@/components/Slider/SliderFurniture'
import BannerTop from '@/components/Home3/BannerTop'

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
    const [activeTab, setActiveTab] = useState<string | undefined>('dashboard')
    const [activeAddress, setActiveAddress] = useState<string | null>('billing')
    const [activeOrders, setActiveOrders] = useState<string | undefined>('all')
    const [openDetail, setOpenDetail] = useState<boolean | undefined>(false)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [wishlistItems, setWishlistItems] = useState<FirebaseProductType[]>([])
    const [loading, setLoading] = useState(true)
    const [editingWishlist, setEditingWishlist] = useState<string | null>(null)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [editingAddress, setEditingAddress] = useState<string | null>(null)

    const fetchAddresses = async () => {
        try {
            const userStr = localStorage.getItem('user')
            if (!userStr) return

            const localUser = JSON.parse(userStr)
            const addressesRef = ref(database, `/customers/${localUser.uid}/addresses`)
            const snapshot = await get(addressesRef)
            
            if (snapshot.exists()) {
                const addressesData = snapshot.val()
                // Convert object to array if necessary
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
    }

    useEffect(() => {
        fetchUserData()
        fetchWishlist()
        fetchAddresses()
    }, [])

    const fetchUserData = async () => {
        try {
            const userStr = localStorage.getItem('user')
            if (!userStr) {
                console.error('No user found in localStorage')
                setLoading(false)
                return
            }

            const localUser = JSON.parse(userStr)
            
            // Create a user data object with the available information
            // Try to get existing data from Firebase first
            let firebaseData = null;
            try {
                const userRef = ref(database, `/customers/${localUser.uid}`);
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    firebaseData = snapshot.val();
                }
            } catch (error) {
                console.error('Error fetching Firebase data:', error);
            }

            const userData: UserData = {
                uid: localUser.uid,
                fullName: firebaseData?.fullName || localUser.name,
                email: localUser.email,
                phone: firebaseData?.phone || 0,
                country_code: firebaseData?.country_code || '',
                createdAt: firebaseData?.createdAt || new Date().toISOString(),
                updatedAt: firebaseData?.updatedAt || new Date().toISOString(),
                lastLogin: firebaseData?.lastLogin || new Date().toISOString()
            }

            setUserData(userData)
            
            // Optionally fetch additional data from Firebase
            try {
                const userRef = ref(database, `/customers/${localUser.uid}`)
            const snapshot = await get(userRef)
            
            if (snapshot.exists()) {
                    const firebaseData = snapshot.val()
                    setUserData(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            phone: firebaseData.phone || prev.phone,
                            country_code: firebaseData.country_code || prev.country_code,
                            createdAt: firebaseData.createdAt || prev.createdAt,
                            updatedAt: firebaseData.updatedAt || prev.updatedAt,
                            lastLogin: firebaseData.lastLogin || prev.lastLogin
                        }
                    })
                }
            } catch (firebaseError) {
                console.error('Error fetching additional user data from Firebase:', firebaseError)
            }
        } catch (error) {
            console.error('Error processing user data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchWishlist = async () => {
        try {
            const userStr = localStorage.getItem('user')
            if (!userStr) return

            const localUser = JSON.parse(userStr)
            const wishlistRef = ref(database, `/customers/${localUser.uid}/wishlist`)
            const snapshot = await get(wishlistRef)
            
            if (snapshot.exists()) {
                const items = Object.values(snapshot.val()) as FirebaseProductType[]
                setWishlistItems(items)
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error)
        }
    }

    const removeFromWishlist = async (productId: string) => {
        try {
            const userStr = localStorage.getItem('user')
            if (!userStr) return

            const localUser = JSON.parse(userStr)
            const wishlistRef = ref(database, `/customers/${localUser.uid}/wishlist/${productId}`)
            await remove(wishlistRef)
            
            // Update local state
            setWishlistItems(prev => prev.filter(item => item.id !== productId))
        } catch (error) {
            console.error('Error removing from wishlist:', error)
        }
    }

    const handleActiveAddress = (order: string) => {
        setActiveAddress(prevOrder => prevOrder === order ? null : order)
    }

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
                                    <Link href={'#!'} scroll={false} className={`item flex items-center gap-3 w-full px-5 py-4 rounded-lg cursor-pointer duration-300 hover:bg-white ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                                        <Icon.HouseLine size={20} />
                                        <strong className="heading6">Dashboard</strong>
                                    </Link>
                                    <Link href={'#!'} scroll={false} className={`item flex items-center gap-3 w-full px-5 py-4 rounded-lg cursor-pointer duration-300 hover:bg-white mt-1.5 ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                                        <Icon.Package size={20} />
                                        <strong className="heading6">History Orders</strong>
                                    </Link>
                                    <Link href={'#!'} scroll={false} className={`item flex items-center gap-3 w-full px-5 py-4 rounded-lg cursor-pointer duration-300 hover:bg-white mt-1.5 ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>
                                        <Icon.Heart size={20} />
                                        <strong className="heading6">My Wishlist</strong>
                                    </Link>
                                    <Link href={'#!'} scroll={false} className={`item flex items-center gap-3 w-full px-5 py-4 rounded-lg cursor-pointer duration-300 hover:bg-white mt-1.5 ${activeTab === 'address' ? 'active' : ''}`} onClick={() => setActiveTab('address')}>
                                        <Icon.Tag size={20} />
                                        <strong className="heading6">My Address</strong>
                                    </Link>
                                    <Link href={'#!'} scroll={false} className={`item flex items-center gap-3 w-full px-5 py-4 rounded-lg cursor-pointer duration-300 hover:bg-white mt-1.5 ${activeTab === 'setting' ? 'active' : ''}`} onClick={() => setActiveTab('setting')}>
                                        <Icon.GearSix size={20} />
                                        <strong className="heading6">Setting</strong>
                                    </Link>
                                    <Link href={'/login'} className="item flex items-center gap-3 w-full px-5 py-4 rounded-lg cursor-pointer duration-300 hover:bg-white mt-1.5">
                                        <Icon.SignOut size={20} />
                                        <strong className="heading6">Logout</strong>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="right md:w-2/3 w-full pl-2.5">
                            {/* Dashboard Tab */}
                            <div className={`tab text-content w-full ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
                                <div className="overview grid sm:grid-cols-3 gap-5">
                                    <div className="item flex items-center justify-between p-5 border border-line rounded-lg box-shadow-xs">
                                        <div className="counter">
                                            <span className="text-secondary">Awaiting Pickup</span>
                                            <h5 className="heading5 mt-1">4</h5>
                                        </div>
                                        <Icon.HourglassMedium className='text-4xl' />
                                    </div>
                                    <div className="item flex items-center justify-between p-5 border border-line rounded-lg box-shadow-xs">
                                        <div className="counter">
                                            <span className="text-secondary">Cancelled Orders</span>
                                            <h5 className="heading5 mt-1">12</h5>
                                        </div>
                                        <Icon.ReceiptX className='text-4xl' />
                                    </div>
                                    <div className="item flex items-center justify-between p-5 border border-line rounded-lg box-shadow-xs">
                                        <div className="counter">
                                            <span className="text-secondary">Total Number of Orders</span>
                                            <h5 className="heading5 mt-1">200</h5>
                                        </div>
                                        <Icon.Package className='text-4xl' />
                                    </div>
                                </div>
                                <div className="recent_order pt-5 px-5 pb-2 mt-7 border border-line rounded-xl">
                                    <h6 className="heading6">Recent Orders</h6>
                                    <div className="list overflow-x-auto w-full mt-5">
                                        <table className="w-full max-[1400px]:w-[700px] max-md:w-[700px]">
                                            <thead className="border-b border-line">
                                                <tr>
                                                    <th scope="col" className="pb-3 text-left text-sm font-bold uppercase text-secondary whitespace-nowrap">Order</th>
                                                    <th scope="col" className="pb-3 text-left text-sm font-bold uppercase text-secondary whitespace-nowrap">Products</th>
                                                    <th scope="col" className="pb-3 text-left text-sm font-bold uppercase text-secondary whitespace-nowrap">Pricing</th>
                                                    <th scope="col" className="pb-3 text-right text-sm font-bold uppercase text-secondary whitespace-nowrap">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="item duration-300 border-b border-line">
                                                    <th scope="row" className="py-3 text-left">
                                                        <strong className="text-title">54312452</strong>
                                                    </th>
                                                    <td className="py-3">
                                                        <Link href={'/product/default'} className="product flex items-center gap-3">
                                                            <Image src={'/images/product/1000x1000.png'} width={400} height={400} alt='Contrasting sweatshirt' className="flex-shrink-0 w-12 h-12 rounded" />
                                                            <div className="info flex flex-col">
                                                                <strong className="product_name text-button">Contrasting sweatshirt</strong>
                                                                <span className="product_tag caption1 text-secondary">Women, Clothing</span>
                                                            </div>
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 price">$45.00</td>
                                                    <td className="py-3 text-right">
                                                        <span className="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-yellow text-yellow caption1 font-semibold">Pending</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Wishlist Tab */}
                            <div className={`tab text-content w-full ${activeTab === 'wishlist' ? 'block' : 'hidden'}`}>
                                <div className="wishlist-header flex items-center justify-between mb-6">
                                    <h6 className="heading6">My Wishlist ({wishlistItems.length})</h6>
                                    {wishlistItems.length > 0 && (
                                        <button 
                                            className="button-main"
                                            onClick={() => setEditingWishlist(editingWishlist ? null : 'edit')}
                                        >
                                            {editingWishlist ? 'Done Editing' : 'Edit Wishlist'}
                                        </button>
                                    )}
                                </div>
                                
                                {wishlistItems.length === 0 ? (
                                    <div className="empty-wishlist text-center py-12">
                                        <Icon.Heart size={64} className="text-gray-300 mx-auto mb-4" />
                                        <h6 className="heading6 text-gray-500 mb-2">Your wishlist is empty</h6>
                                        <p className="text-secondary mb-6">Start adding products to your wishlist to see them here</p>
                                        <Link href="/shop/default" className="button-main">
                                            Start Shopping
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="wishlist-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {wishlistItems.map((item) => (
                                            <div key={item.id} className="wishlist-item border border-line rounded-lg p-4 relative">
                                                {editingWishlist && (
                                                    <button
                                                        onClick={() => removeFromWishlist(item.id)}
                                                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                                        title="Remove from wishlist"
                                                    >
                                                        <Icon.X size={16} />
                                                    </button>
                                                )}
                                                <div className="product-image mb-4">
                                                    <Image
                                                        src={item.thumbnail}
                                                        alt={item.name}
                                                        width={300}
                                                        height={300}
                                                        className="w-full h-32 object-cover rounded-lg"
                                                        unoptimized={true}
                                                    />
                                                </div>
                                                <div className="product-info">
                                                    <h6 className="product-name text-title mb-2 line-clamp-2">{item.name}</h6>
                                                    <div className="product-price text-lg font-semibold text-green-600">
                                                        ${item.salePrice > 0 ? item.salePrice : item.price}
                                                        {item.salePrice > 0 && (
                                                            <span className="text-sm text-gray-500 line-through ml-2">${item.price}</span>
                                                        )}
                                                    </div>
                                                    <div className="product-status mt-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            item.stockStatus === 'in_stock' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {item.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    <div className="order_item mt-5 border border-line rounded-lg box-shadow-xs">
                                        <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-line">
                                            <div className="flex items-center gap-2">
                                                <strong className="text-title">Order Number:</strong>
                                                <strong className="order_number text-button uppercase">s184989823</strong>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <strong className="text-title">Order status:</strong>
                                                <span className="tag px-4 py-1.5 rounded-full bg-opacity-10 bg-purple text-purple caption1 font-semibold">Delivery</span>
                                            </div>
                                        </div>
                                        <div className="list_prd px-5">
                                            <div className="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                                                <Link href={'/product/default'} className="flex items-center gap-5">
                                                    <div className="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                                                        <Image
                                                            src={'/images/product/1000x1000.png'}
                                                            width={1000}
                                                            height={1000}
                                                            alt={'Contrasting sheepskin sweatshirt'}
                                                            className='w-full h-full object-cover'
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="prd_name text-title">Contrasting sheepskin sweatshirt</div>
                                                        <div className="caption1 text-secondary mt-2">
                                                            <span className="prd_size uppercase">XL</span>
                                                            <span>/</span>
                                                            <span className="prd_color capitalize">Yellow</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                                <div className='text-title'>
                                                    <span className="prd_quantity">1</span>
                                                    <span> X </span>
                                                    <span className="prd_price">$45.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 p-5">
                                            <button className="button-main" onClick={() => setOpenDetail(true)}>Order Details</button>
                                            <button className="button-main bg-surface border border-line hover:bg-black text-black hover:text-white">Cancel Order</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Tab */}
                            <div className={`tab_address text-content w-full p-7 border border-line rounded-xl ${activeTab === 'address' ? 'block' : 'hidden'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h6 className="heading6">My Addresses</h6>
                                    <button
                                        className="button-main bg-black text-white px-6 py-3 rounded-lg hover:bg-black/90 duration-300"
                                        onClick={() => {
                                            setEditingAddress(null);
                                            setActiveAddress('new');
                                        }}
                                    >
                                        Add New Address
                                    </button>
                                            </div>

                                {/* List of saved addresses */}
                                {addresses.length > 0 && !activeAddress && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {addresses.map((address) => (
                                            <div key={address.id} className="border border-line rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h6 className="heading6">{address.addressName}</h6>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            className="text-secondary hover:text-black"
                                                            onClick={() => {
                                                                setEditingAddress(address.id);
                                                                setActiveAddress('edit');
                                                            }}
                                                        >
                                                            <Icon.PencilSimple size={20} />
                                                        </button>
                                    <button
                                                            className="text-red hover:text-red-600"
                                                            onClick={async () => {
                                                                if (!confirm('Are you sure you want to delete this address?')) return;
                                                                
                                                                try {
                                                                    const userStr = localStorage.getItem('user');
                                                                    if (!userStr) return;
                                                                    
                                                                    const localUser = JSON.parse(userStr);
                                                                    const addressRef = ref(database, `/customers/${localUser.uid}/addresses/${address.id}`);
                                                                    await remove(addressRef);
                                                                    
                                                                    // Update local state
                                                                    setAddresses(prev => prev.filter(a => a.id !== address.id));
                                                                    alert('Address deleted successfully!');
                                                                } catch (error) {
                                                                    console.error('Error deleting address:', error);
                                                                    alert('Failed to delete address. Please try again.');
                                                                }
                                                            }}
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
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        
                                        const addressData = {
                                            addressName: formData.get('addressName') as string,
                                            firstName: formData.get('firstName') as string,
                                            lastName: formData.get('lastName') as string,
                                            country: formData.get('country') as string,
                                            streetAddress: formData.get('streetAddress') as string,
                                            city: formData.get('city') as string,
                                            state: formData.get('state') as string,
                                            zip: formData.get('zip') as string,
                                            phone: formData.get('phone') as string,
                                        };

                                        try {
                                            const userStr = localStorage.getItem('user');
                                            if (!userStr) return;
                                            
                                            const localUser = JSON.parse(userStr);
                                            const addressesRef = ref(database, `/customers/${localUser.uid}/addresses`);
                                            
                                            if (activeAddress === 'edit' && editingAddress) {
                                                // Update existing address
                                                const addressRef = ref(database, `/customers/${localUser.uid}/addresses/${editingAddress}`);
                                                await set(addressRef, addressData);
                                                
                                                // Update local state
                                                setAddresses(prev => prev.map(addr => 
                                                    addr.id === editingAddress 
                                                        ? { ...addressData, id: editingAddress }
                                                        : addr
                                                ));
                                            } else {
                                                // Add new address
                                                const newAddressRef = ref(database, `/customers/${localUser.uid}/addresses/${addresses.length}`);
                                                await set(newAddressRef, addressData);
                                                
                                                // Update local state
                                                setAddresses(prev => [...prev, { ...addressData, id: String(addresses.length) }]);
                                            }

                                            alert(`Address ${activeAddress === 'edit' ? 'updated' : 'added'} successfully!`);
                                            setActiveAddress(null);
                                            setEditingAddress(null);
                                        } catch (error) {
                                            console.error('Error saving address:', error);
                                            alert('Failed to save address. Please try again.');
                                        }
                                    }}>
                                        <div className="heading6 mb-4">{activeAddress === 'edit' ? 'Edit Address' : 'Add New Address'}</div>
                                        <div className='grid sm:grid-cols-2 gap-4 gap-y-5'>
                                            <div className="address-name sm:col-span-2">
                                                <label htmlFor="addressName" className='caption1 capitalize'>Address Name <span className='text-red'>*</span></label>
                                                <input 
                                                    className="border-line mt-2 px-4 py-3 w-full rounded-lg" 
                                                    id="addressName" 
                                                    name="addressName"
                                                    type="text" 
                                                    defaultValue={editingAddress ? addresses.find(a => a.id === editingAddress)?.addressName : ''}
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
                                                    defaultValue={editingAddress ? addresses.find(a => a.id === editingAddress)?.firstName : ''}
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
                                                    defaultValue={editingAddress ? addresses.find(a => a.id === editingAddress)?.lastName : ''}
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
                                                    defaultValue={editingAddress ? addresses.find(a => a.id === editingAddress)?.country : ''}
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
                                                    defaultValue={editingAddress ? addresses.find(a => a.id === editingAddress)?.streetAddress : ''}
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
                                                    defaultValue={editingAddress ? addresses.find(a => a.id === editingAddress)?.city : ''}
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
                                                    defaultValue={editingAddress ? addresses.find(a => a.id === editingAddress)?.state : ''}
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
                                                    defaultValue={editingAddress ? addresses.find(a => a.id === editingAddress)?.zip : ''}
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
                                                    defaultValue={editingAddress ? addresses.find(a => a.id === editingAddress)?.phone : ''}
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
                                                onClick={() => {
                                                    setActiveAddress(null);
                                                    setEditingAddress(null);
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Empty state */}
                                {addresses.length === 0 && !activeAddress && (
                                    <div className="text-center py-8">
                                        <Icon.MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p className="text-secondary mb-4">You haven&apos;t added any addresses yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Settings Tab */}
                            <div className={`tab text-content w-full p-7 border border-line rounded-xl ${activeTab === 'setting' ? 'block' : 'hidden'}`}>
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

                                        alert('Profile updated successfully!');
                                    } catch (error) {
                                        console.error('Error updating profile:', error);
                                        alert('Failed to update profile. Please try again.');
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
                        <div className="list_info grid grid-cols-2 gap-10 gap-y-8 mt-5">
                            <div className="info_item">
                                <strong className="text-button-uppercase text-secondary">Contact Information</strong>
                                <h6 className="heading6 order_name mt-2">{userData.fullName}</h6>
                                <h6 className="heading6 order_phone mt-2">+{userData.country_code} {userData.phone}</h6>
                                <h6 className="heading6 normal-case order_email mt-2">{userData.email}</h6>
                            </div>
                            <div className="info_item">
                                <strong className="text-button-uppercase text-secondary">Payment method</strong>
                                <h6 className="heading6 order_payment mt-2">cash delivery</h6>
                            </div>
                            <div className="info_item">
                                <strong className="text-button-uppercase text-secondary">Shipping address</strong>
                                <h6 className="heading6 order_shipping_address mt-2">2163 Phillips Gap Rd, West Jefferson, North Carolina, US</h6>
                            </div>
                            <div className="info_item">
                                <strong className="text-button-uppercase text-secondary">Billing address</strong>
                                <h6 className="heading6 order_billing_address mt-2">2163 Phillips Gap Rd, West Jefferson, North Carolina, US</h6>
                            </div>
                            <div className="info_item">
                                <strong className="text-button-uppercase text-secondary">Company</strong>
                                <h6 className="heading6 order_company mt-2">Avitex Technology</h6>
                            </div>
                        </div>
                    </div>
                    <div className="list p-10">
                        <h5 className="heading5">Items</h5>
                        <div className="list_prd">
                            <div className="prd_item flex flex-wrap items-center justify-between gap-3 py-5 border-b border-line">
                                <Link href={'/product/default'} className="flex items-center gap-5">
                                    <div className="bg-img flex-shrink-0 md:w-[100px] w-20 aspect-square rounded-lg overflow-hidden">
                                        <Image
                                            src={'/images/product/1000x1000.png'}
                                            width={1000}
                                            height={1000}
                                            alt={'Contrasting sheepskin sweatshirt'}
                                            className='w-full h-full object-cover'
                                        />
                                    </div>
                                    <div>
                                        <div className="prd_name text-title">Contrasting sheepskin sweatshirt</div>
                                        <div className="caption1 text-secondary mt-2">
                                            <span className="prd_size uppercase">XL</span>
                                            <span>/</span>
                                            <span className="prd_color capitalize">Yellow</span>
                                        </div>
                                    </div>
                                </Link>
                                <div className='text-title'>
                                    <span className="prd_quantity">1</span>
                                    <span> X </span>
                                    <span className="prd_price">$45.00</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-5">
                            <strong className="text-title">Shipping</strong>
                            <strong className="order_ship text-title">Free</strong>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <strong className="text-title">Discounts</strong>
                            <strong className="order_discounts text-title">-$80.00</strong>
                        </div>
                        <div className="flex items-center justify-between mt-5 pt-5 border-t border-line">
                            <h5 className="heading5">Subtotal</h5>
                            <h5 className="order_total heading5">$105.00</h5>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default MyAccount