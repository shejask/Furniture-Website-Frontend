'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'

interface Category {
    id: string
    name: string
    description?: string
    metaTitle?: string
    metaDescription?: string
    icon?: string
    image?: string
    showInMainMenu?: boolean
    createdAt: string
    updatedAt: string
}

const MenuCategory = () => {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categoriesRef = ref(database, '/categories')
                const snapshot = await get(categoriesRef)
                
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    const categoriesList = Object.entries(data)
                        .map(([id, value]) => {
                            const category = value as Partial<Category>
                            return {
                                id,
                                name: category.name || '',
                                description: category.description,
                                metaTitle: category.metaTitle,
                                metaDescription: category.metaDescription,
                                icon: category.icon,
                                image: category.image,
                                showInMainMenu: category.showInMainMenu || false,
                                createdAt: category.createdAt || new Date().toISOString(),
                                updatedAt: category.updatedAt || new Date().toISOString()
                            } as Category
                        })
                        .filter((item) => {
                            return item.name && item.showInMainMenu === true
                        })
                        .sort((a, b) => a.name.localeCompare(b.name))
                    
                    setCategories(categoriesList)
                } else {
                    setCategories([])
                }
                setLoading(false)
            } catch (err) {
                console.error('Error fetching categories:', err)
                setLoading(false)
            }
        }

        fetchCategories()

        // Refresh categories every 5 minutes
        const refreshInterval = setInterval(fetchCategories, 300000)

        return () => {
            clearInterval(refreshInterval)
        }
    }, [])

    if (loading) {
        return (
            <div className="menu-category-block bg-black py-3 max-md:hidden">
                <div className="container flex items-center justify-center overflow-x-auto">
                    <ul className='flex items-center lg:gap-6 gap-4 flex-nowrap min-w-0 w-full'>
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <li key={`cat-skel-${idx}`}>
                                <div className='h-4 w-24 bg-gray-600/40 rounded animate-pulse'></div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )
    }
    if (categories.length === 0) {
        return null
    }

    return (
        <div className="menu-category-block bg-black py-3 max-md:hidden">
            <div className="container flex items-center justify-center overflow-x-auto">
                <ul className='flex items-center lg:gap-6 gap-4 flex-nowrap min-w-0'>
                    {categories.map((category) => (
                        <li key={category.id}>
                            <Link 
                                href={`/shop/breadcrumb1?categoryId=${encodeURIComponent(category.id)}`} 
                                className='text-button-uppercase text-white has-line-before before-white whitespace-nowrap'
                            >
                                {category.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default MenuCategory