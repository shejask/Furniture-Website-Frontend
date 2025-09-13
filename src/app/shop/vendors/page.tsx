'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';
import TopNavOne from '@/components/Header/TopNav/TopNavOne'
import MenuOne from '@/components/Header/Menu/MenuOne'
import ShopBreadCrumb1 from '@/components/Shop/ShopBreadCrumb1'
import Footer from '@/components/Footer/Footer'
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'
import { FirebaseProductType, convertFirebaseToUIProduct } from '@/type/FirebaseProductType'
import { ProductType } from '@/type/ProductType'
import BannerTop from '@/components/Home3/BannerTop'
import MenuFurniture from '@/components/Header/Menu/MenuFurniture'
import MenuCategory from '@/components/Furniture/MenuCategory'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/config'

export default function BreadCrumb1() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [user, userLoading, authError] = useAuthState(auth)
    let [type,setType] = useState<string | null | undefined>()
    let datatype = searchParams.get('type')
    let gender = searchParams.get('gender')
    let category = searchParams.get('category')
    let categoryId = searchParams.get('categoryId')
    let vendorId = searchParams.get('vendorId')
    const [products, setProducts] = useState<ProductType[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [vendorName, setVendorName] = useState<string>('Vendor')
    const [userData, setUserData] = useState<any>(null)

    useEffect(() => {
        setType(datatype);
    }, [datatype]);

    // Fetch user data and check if user is a vendor
    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const userRef = ref(database, `customers/${user.uid}`)
                    const snapshot = await get(userRef)
                    if (snapshot.exists()) {
                        const data = snapshot.val()
                        setUserData(data)
                        
                        // Check if user is a vendor and redirect to admin
                        if (data.role === 'vendor' || data.userType === 'vendor' || data.isVendor === true) {
                            router.push('/admin')
                            return
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error)
                }
            }
        }
        
        fetchUserData()
    }, [user, router])

    const fetchVendorData = async (vendorId: string) => {
        try {
            const vendorRef = ref(database, `vendors/${vendorId}`)
            const snapshot = await get(vendorRef)
            if (snapshot.exists()) {
                const vendorData = snapshot.val()
                setVendorName(vendorData.storeName || vendorData.name || 'Vendor')
            } else {
                setVendorName('Vendor')
            }
        } catch (error) {
            console.error('Error fetching vendor:', error)
            setVendorName('Vendor')
        }
    }
    
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                setError(null)
                const productsRef = ref(database, '/products')
                const snapshot = await get(productsRef)
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    console.log('Raw Firebase data - total products:', Object.keys(data).length);
                    const list: ProductType[] = Object.entries(data).map(([id, value]) => {
                        const fb = { id, ...(value as any) } as any;
                        const ui = convertFirebaseToUIProduct(fb as FirebaseProductType)
                        // Prefer Firebase category id stored on product (categories[0]) and retain both id and name for filtering
                        const catId = Array.isArray(fb.categories) && fb.categories.length > 0 ? fb.categories[0] : undefined
                        const catName = ui.category
                        return { 
                            ...ui, 
                            category: catId || catName,
                            subCategories: fb.subCategories || [], // Add subcategories array from Firebase
                            subCategory: fb.subCategory || fb.subcategory || undefined, // Keep for backward compatibility
                            brands: fb.brands || [], // Add brands array from Firebase
                            style: fb.style || [], // Add style array from Firebase
                            primaryMaterial: fb.primaryMaterial || [] // Add primary material array from Firebase
                        } as ProductType
                    })
                    console.log('Converted products - total:', list.length);
                    
                    // Filter by vendorId if provided, otherwise filter by categoryId
                    const filtered = vendorId
                        ? list.filter(p => {
                            const matches = (p as any).vendor === vendorId;
                            console.log(`Product "${p.name}" vendor check:`, { vendor: (p as any).vendor, vendorId, matches });
                            return matches;
                        })
                        : categoryId
                        ? list.filter(p => {
                            const fbCatId = (p as any).category;
                            const matches = fbCatId === categoryId;
                            console.log(`Product "${p.name}" category check:`, { fbCatId, categoryId, matches });
                            return matches;
                        })
                        : list
                    
                    console.log('Filtered products - total:', filtered.length);
                    console.log('Filtered product names:', filtered.map(p => p.name));
                    setProducts(filtered)
                } else {
                    setProducts([])
                }
            } catch (e) {
                setError('Failed to load products')
                setProducts([])
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
        
        // Fetch vendor data if vendorId is provided
        if (vendorId) {
            fetchVendorData(vendorId)
        }
    }, [categoryId, vendorId])

    return (
        <>
           <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
         <MenuFurniture props="bg-white" />
         <MenuCategory />
         </div>
            <ShopBreadCrumb1 data={products} productPerPage={9} dataType={type} gender={gender} category={category} categoryId={categoryId} vendorId={vendorId} vendorName={vendorName} />
            <Footer />      
        </>
    )
}
