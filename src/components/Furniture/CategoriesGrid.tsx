'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CategoryType } from '@/type/CategoryType'
import { fetchCategories } from '@/firebase/categories'

const CategoriesGrid = () => {
    const [categories, setCategories] = useState<CategoryType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const run = async () => {
            const result = await fetchCategories()
            // Keep only categories intended for main menu if present
            const filtered = result
                .filter((c) => c.showInMainMenu === true || c.showInMainMenu === undefined)
                .slice(0, 12)
            setCategories(filtered)
            setLoading(false)
        }
        run()
    }, [])

    return (
        <section className="container md:pt-14 pt-10">
            <h2 className="text-heading-3 md:text-heading-2 font-semibold text-center mb-6">
                Shop All Things Home
            </h2>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                    {Array.from({ length: 12 }).map((_, idx) => (
                        <div key={`cat-skeleton-${idx}`} className="flex flex-col items-center">
                            <div className="w-full aspect-square rounded-xl bg-gray-100 animate-pulse" />
                            <div className="h-4 w-24 bg-gray-200 mt-3 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/shop/breadcrumb1?categoryId=${encodeURIComponent(cat.id)}`}
                            className="group"
                        >
                            <div className="w-full aspect-square rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center">
                                {cat.image ? (
                                    <Image
                                        src={cat.image}
                                        alt={cat.name}
                                        width={300}
                                        height={300}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gray-100" />
                                )}
                            </div>
                            <p className="text-center mt-3 font-medium">{cat.name}</p>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    )
}

export default CategoriesGrid


