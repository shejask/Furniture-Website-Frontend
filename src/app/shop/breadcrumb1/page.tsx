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

export default function BreadCrumb1() {
    const searchParams = useSearchParams()
    let [type,setType] = useState<string | null | undefined>()
    let datatype = searchParams.get('type')
    let gender = searchParams.get('gender')
    let category = searchParams.get('category')
    let categoryId = searchParams.get('categoryId')
    const [products, setProducts] = useState<ProductType[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setType(datatype);
    }, [datatype]);
    
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                setError(null)
                const productsRef = ref(database, '/products')
                const snapshot = await get(productsRef)
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    const list: ProductType[] = Object.entries(data).map(([id, value]) => {
                        const fb = { id, ...(value as any) } as any;
                        const ui = convertFirebaseToUIProduct(fb as FirebaseProductType)
                        // Prefer Firebase category id stored on product (categories[0]) and retain both id and name for filtering
                        const catId = Array.isArray(fb.categories) && fb.categories.length > 0 ? fb.categories[0] : undefined
                        const catName = ui.category
                        return { ...ui, category: catId || catName } as ProductType
                    })
                    // Filter by categoryId if provided
                    const filtered = categoryId
                        ? list.filter(p => {
                            const fbCatId = (p as any).category;
                            return fbCatId === categoryId;
                        })
                        : list
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
    }, [categoryId])

    return (
        <>
           <div id="header" className='relative w-full'>
        <BannerTop props="bg-green py-3" textColor='text-black' bgLine='bg-black' />
         <MenuFurniture props="bg-white" />
         <MenuCategory />
         </div>
            <ShopBreadCrumb1 data={products} productPerPage={9} dataType={type} gender={gender} category={category} categoryId={categoryId} />
            <Footer />      
        </>
    )
}
