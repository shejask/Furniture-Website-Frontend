'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { usePathname } from 'next/navigation';
import Product from '@/components/Product/Product';
import productData from '@/data/Product.json'
import useLoginPopup from '@/store/useLoginPopup';
import useMenuMobile from '@/store/useMenuMobile';
import { useModalCartContext } from '@/context/ModalCartContext';
import { useModalWishlistContext } from '@/context/ModalWishlistContext';
import { useModalSearchContext } from '@/context/ModalSearchContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation'
import { ref, get } from 'firebase/database'
import { database, auth } from '@/firebase/config'
import { FirebaseProductType, convertFirebaseToUIProduct } from '@/type/FirebaseProductType'
import { ProductType } from '@/type/ProductType'
import { useAuthState } from 'react-firebase-hooks/auth'

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

interface Props {
    props: string
}

const MenuFurniture: React.FC<Props> = ({ props }) => {
    const pathname = usePathname()
    const { openLoginPopup, handleLoginPopup } = useLoginPopup()
    const { openMenuMobile, handleMenuMobile } = useMenuMobile()
    const [openSubNavMobile, setOpenSubNavMobile] = useState<number | null>(null)
    const { openModalCart } = useModalCartContext()
    const { cartState } = useCart()
    const { openModalWishlist } = useModalWishlistContext()
    const { openModalSearch } = useModalSearchContext()
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searching, setSearching] = useState<boolean>(false)
    const [searchResults, setSearchResults] = useState<ProductType[]>([])
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const router = useRouter()
    
    // Firebase Authentication state
    const [user, loading, authError] = useAuthState(auth)
    const isLoggedIn = !!user

    const handleSearch = (value: string) => {
        const query = (value || '').trim()
        if (!query) return
        const next = [query, ...recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase())].slice(0, 5)
        setRecentSearches(next)
        try { localStorage.setItem('recentSearches', JSON.stringify(next)) } catch {}
        router.push(`/search-result?query=${query}`)
        setSearchKeyword('')
    }

    useEffect(() => {
        try {
            const stored = localStorage.getItem('recentSearches')
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed)) setRecentSearches(parsed.filter(Boolean))
            }
        } catch {}
    }, [])

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches')
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved))
            } catch (error) {
                console.error('Error parsing recent searches:', error)
            }
        }
    }, [])

    const handleLogout = async () => {
        try {
            await auth.signOut()
            // Close the popup if it's open
            if (openLoginPopup) {
                handleLoginPopup()
            }
            // Redirect to home page
            router.push('/')
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    useEffect(() => {
        let active = true
        const run = async () => {
            const q = searchKeyword.trim().toLowerCase()
            if (!q) {
                setSearchResults([])
                setSearching(false)
                return
            }
            setSearching(true)
            try {
                const productsRef = ref(database, '/products')
                const snapshot = await get(productsRef)
                if (!active) return
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    const all: ProductType[] = Object.entries(data).map(([id, value]) => {
                        const fb = { id, ...(value as any) } as FirebaseProductType
                        return convertFirebaseToUIProduct(fb)
                    })
                    const matched = all.filter(p => {
                        const tagsText = Array.isArray((p as any).tags)
                            ? ((p as any).tags as any[]).map(t => (t?.name || '')).join(' ').toLowerCase()
                            : ''
                        return (
                            p.name.toLowerCase().includes(q) ||
                            p.type.toLowerCase().includes(q) ||
                            (p.brand || '').toLowerCase().includes(q) ||
                            (p.slug || '').toLowerCase().includes(q) ||
                            tagsText.includes(q)
                        )
                    }).slice(0, 6)
                    setSearchResults(matched)
                } else {
                    setSearchResults([])
                }
            } catch {
                setSearchResults([])
            } finally {
                if (active) setSearching(false)
            }
        }
        const t = setTimeout(run, 300)
        return () => { active = false; clearTimeout(t) }
    }, [searchKeyword])

    const handleOpenSubNavMobile = (index: number) => {
        setOpenSubNavMobile(openSubNavMobile === index ? null : index)
    }

    const [fixedHeader, setFixedHeader] = useState(false)
    const [lastScrollPosition, setLastScrollPosition] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setFixedHeader(scrollPosition > 0 && scrollPosition < lastScrollPosition);
            setLastScrollPosition(scrollPosition);
        };

        // Gắn sự kiện cuộn khi component được mount
        window.addEventListener('scroll', handleScroll);

        // Hủy sự kiện khi component bị unmount
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollPosition]);

    // Fetch categories for mobile menu
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
                setCategoriesLoading(false)
            } catch (err) {
                console.error('Error fetching categories:', err)
                setCategoriesLoading(false)
            }
        }

        fetchCategories()
    }, []);

    const handleGenderClick = (gender: string) => {
        router.push(`/shop/breadcrumb1?gender=${gender}`);
    };

    const handleCategoryClick = (category: string) => {
        router.push(`/shop/breadcrumb1?category=${category}`);
    };

    const handleTypeClick = (type: string) => {
        router.push(`/shop/breadcrumb1?type=${type}`);
    };

    return (
        <>
            <div className={`header-menu style-one ${fixedHeader ? ' fixed' : 'relative'} w-full md:h-[74px] h-[56px] ${props}`}>
                <div className="container mx-auto h-full">
                    <div className="header-main flex items-center justify-between h-full">
                        {/* Left: text logo */}
                        <Link href={'/'} className='flex items-center'>
                            <div className="heading4">Shopping LaLa</div>
                        </Link>

                        {/* Center: desktop search (absolute center) */}
                        <div className="max-lg:hidden xl:absolute xl:top-1/2 xl:left-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 w-full max-w-[560px]">
                            <div className="form-search relative z-[1]">
                                <Icon.MagnifyingGlass
                                    size={16}
                                    className='absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer'
                                    onClick={() => {
                                        handleSearch(searchKeyword)
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder='What are you looking for?'
                                    className=' h-10 rounded-lg border border-line caption2 w-full pl-9 pr-4'
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchKeyword)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                                />
                                {(searchKeyword.trim().length > 0 || (isSearchFocused && recentSearches.length > 0)) && (
                                    <div className="absolute top-full mt-2 w-full bg-white border border-line rounded-lg shadow-md p-3">
                                        {searchKeyword.trim().length > 0 ? (
                                            <>
                                                {searching ? (
                                                    <div className="space-y-2">
                                                        {Array.from({ length: 4 }).map((_, idx) => (
                                                            <div key={`sr-skel-${idx}`} className="flex items-center gap-3 animate-pulse">
                                                                <div className="w-10 h-10 bg-gray-200 rounded" />
                                                                <div className="flex-1">
                                                                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                                                                    <div className="h-3 bg-gray-200 rounded w-1/3 mt-1" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <>
                                                        {searchResults.length === 0 ? (
                                                            <div className="caption1 text-secondary">No results</div>
                                                        ) : (
                                                            <ul className="space-y-2">
                                                                {searchResults.map(p => (
                                                                    <li key={p.id}>
                                                                        <Link href={`/product/default?id=${p.id}`} className="flex items-center gap-3 hover:bg-surface px-2 py-2 rounded">
                                                                            <Image src={(p.thumbImage?.[0] || p.images?.[0] || '/images/other/404-img.png')} alt={p.name} width={40} height={40} className="w-10 h-10 rounded object-cover" />
                                                                            <div className="flex-1">
                                                                                <div className="caption1">{p.name}</div>
                                                                                <div className="caption2 text-secondary">₹{((p as any).salePrice ?? p.price)}.00</div>
                                                                            </div>
                                                                        </Link>
                                                                    </li>
                                                                ))}
                                                                <li>
                                                                    <button className="caption1 text-black underline mt-1" onClick={() => handleSearch(searchKeyword)}>See all results</button>
                                                                </li>
                                                            </ul>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <div>
                                                <div className="caption1 text-secondary mb-2">Recent searches</div>
                                                <ul className="flex flex-wrap gap-2">
                                                    {recentSearches.map((term, idx) => (
                                                        <li key={`recent-${idx}`}>
                                                            <button
                                                                className="px-3 py-1 rounded-full bg-surface caption2 hover:bg-gray-100"
                                                                onClick={() => handleSearch(term)}
                                                            >
                                                                {term}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-2">
                                                    <button
                                                        className="caption2 text-secondary hover:underline"
                                                        onClick={() => {
                                                            setRecentSearches([])
                                                            try { localStorage.removeItem('recentSearches') } catch {}
                                                        }}
                                                    >
                                                        Clear recent searches
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: actions */}
                        <div className="right flex gap-4 md:gap-6 items-center relative z-[1]">
                            <div className="list-action flex items-center gap-4">
                                <div className="user-icon flex items-center justify-center cursor-pointer">
                                    <Icon.User size={24} color='black' onClick={handleLoginPopup} />
                                    <div
                                        className={`login-popup absolute top-[74px] w-[320px] p-7 rounded-xl bg-white box-shadow-sm 
                                            ${openLoginPopup ? 'open' : ''}`}
                                    >
                                        {!isLoggedIn ? (
                                            <>
                                                <Link href={'/login'} className="button-main w-full text-center">Login</Link>
                                                <div className="text-secondary text-center mt-3 pb-4">Don&apos;t have an account?
                                                    <Link href={'/register'} className='text-black pl-1 hover:underline'>Register</Link>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-center mb-4">
                                                    <div className="text-black font-medium">Welcome back!</div>
                                                    <div className="text-secondary text-sm">{user?.email || user?.displayName || 'User'}</div>
                                                </div>
                                                <Link href={'/my-account'} className="button-main w-full text-center">My Profile</Link>
                                                <button 
                                                    onClick={handleLogout}
                                                    className="button-main bg-white text-black border border-black w-full text-center mt-3"
                                                >
                                                    Logout
                                                </button>
                                            </>
                                        )}
                                        <div className="bottom mt-4 pt-4 border-t border-line"></div>
                                        <Link href={'/pages/contact'} className='body1 hover:underline'>Support</Link>
                                    </div>
                                </div>
                                <Link href={'/wishlist'} className="wishlist-icon flex items-center cursor-pointer">
                                    <Icon.Heart size={24} color='black' />
                                </Link>
                                <div className="cart-icon flex items-center relative cursor-pointer" onClick={openModalCart}>
                                    <Icon.Handbag size={24} color='black' />
                                    <span className="quantity cart-quantity absolute -right-1.5 -top-1.5 text-xs text-white bg-black w-4 h-4 flex items-center justify-center rounded-full">{cartState.cartArray.length}</span>
                                </div>
                            </div>
                            <div className="menu-mobile-icon lg:hidden flex items-center" onClick={handleMenuMobile}>
                                <i className="icon-category text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile search row (below header) */}
            <div className="lg:hidden w-full bg-white border-t border-line">
                <div className="container mx-auto py-2">
                    <div className="form-search relative z-[1]">
                        <Icon.MagnifyingGlass
                            size={18}
                            className='absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer'
                            onClick={() => {
                                handleSearch(searchKeyword)
                            }}
                        />
                        <input
                            type="text"
                            placeholder='Search products...'
                            className='h-11 rounded-lg border border-line caption2 w-full pl-9 pr-4'
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchKeyword)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                        />
                        {(searchKeyword.trim().length > 0 || (isSearchFocused && recentSearches.length > 0)) && (
                            <div className="absolute top-full mt-2 w-full bg-white border border-line rounded-lg shadow-md p-3">
                                {searchKeyword.trim().length > 0 ? (
                                    <>
                                        {searching ? (
                                            <div className="space-y-2">
                                                {Array.from({ length: 4 }).map((_, idx) => (
                                                    <div key={`sr-skel-m-${idx}`} className="flex items-center gap-3 animate-pulse">
                                                        <div className="w-10 h-10 bg-gray-200 rounded" />
                                                        <div className="flex-1">
                                                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                                                            <div className="h-3 bg-gray-200 rounded w-1/3 mt-1" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <>
                                                {searchResults.length === 0 ? (
                                                    <div className="caption1 text-secondary">No results</div>
                                                ) : (
                                                    <ul className="space-y-2">
                                                        {searchResults.map(p => (
                                                            <li key={p.id}>
                                                                <Link href={`/product/default?id=${p.id}`} className="flex items-center gap-3 hover:bg-surface px-2 py-2 rounded">
                                                                    <Image src={(p.thumbImage?.[0] || p.images?.[0] || '/images/other/404-img.png')} alt={p.name} width={40} height={40} className="w-10 h-10 rounded object-cover" />
                                                                    <div className="flex-1">
                                                                        <div className="caption1">{p.name}</div>
                                                                        <div className="caption2 text-secondary">₹{((p as any).salePrice ?? p.price)}.00</div>
                                                                    </div>
                                                                </Link>
                                                            </li>
                                                        ))}
                                                        <li>
                                                            <button className="caption1 text-black underline mt-1" onClick={() => handleSearch(searchKeyword)}>See all results</button>
                                                        </li>
                                                    </ul>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div>
                                        <div className="caption1 text-secondary mb-2">Recent searches</div>
                                        <ul className="flex flex-wrap gap-2">
                                            {recentSearches.map((term, idx) => (
                                                <li key={`recent-m-${idx}`}>
                                                    <button
                                                        className="px-3 py-1 rounded-full bg-surface caption2 hover:bg-gray-100"
                                                        onClick={() => handleSearch(term)}
                                                    >
                                                        {term}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-2">
                                            <button
                                                className="caption2 text-secondary hover:underline"
                                                onClick={() => {
                                                    setRecentSearches([])
                                                    try { localStorage.removeItem('recentSearches') } catch {}
                                                }}
                                            >
                                                Clear recent searches
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div id="menu-mobile" className={`${openMenuMobile ? 'open' : ''}`}>
                <div className="menu-container bg-white h-full">
                    <div className="container h-full">
                        <div className="menu-main h-full overflow-hidden">
                            <div className="heading py-2 relative flex items-center justify-center">
                                <div
                                    className="close-menu-mobile-btn absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface flex items-center justify-center"
                                    onClick={handleMenuMobile}
                                >
                                    <Icon.X size={14} />
                                </div>
                                <Link href={'/'} className='logo text-3xl font-semibold text-center'>Shopping LaLa</Link>
                            </div>
                            <div className="form-search relative mt-2">
                                <Icon.MagnifyingGlass size={20} className='absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer' />
                                <input type="text" placeholder='What are you looking for?' className=' h-12 rounded-lg border border-line text-sm w-full pl-10 pr-4' />
                            </div>
                            <div className="list-nav mt-6">
                                <ul>
                                    {categoriesLoading ? (
                                        // Loading skeleton
                                        Array.from({ length: 6 }).map((_, idx) => (
                                            <li key={`cat-skel-${idx}`} className="py-3">
                                                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                                            </li>
                                        ))
                                    ) : categories.length > 0 ? (
                                        // Dynamic categories
                                        categories.map((category) => (
                                            <li key={category.id}>
                                                <Link 
                                                    href={`/shop/breadcrumb1?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                                                    className="text-xl font-semibold flex items-center justify-between py-3 hover:text-green transition-colors"
                                                    onClick={handleMenuMobile}
                                                >
                                                    {category.name}
                                                    <Icon.CaretRight size={20} />
                                                </Link>
                                            </li>
                                        ))
                                    ) : (
                                        // Fallback if no categories
                                        <li>
                                            <Link 
                                                href="/shop/breadcrumb1"
                                                className="text-xl font-semibold flex items-center justify-between py-3 hover:text-green transition-colors"
                                                onClick={handleMenuMobile}
                                            >
                                                Shop All
                                                <Icon.CaretRight size={20} />
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default MenuFurniture