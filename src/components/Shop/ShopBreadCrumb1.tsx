'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import * as Icon from "@phosphor-icons/react/dist/ssr";
import { ProductType } from '@/type/ProductType'
import Product from '../Product/Product';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css'
import HandlePagination from '../Other/HandlePagination';
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'
import { fetchVendors, Vendor } from '@/firebase/vendors'
import { fetchBrands, Brand } from '@/firebase/brands'

interface Props {
    data: Array<ProductType>
    productPerPage: number
    dataType: string | null | undefined
    gender: string | null
    category: string | null
    categoryId?: string | null
    vendorId?: string | null
    vendorName?: string
}

const ShopBreadCrumb1: React.FC<Props> = ({ data, productPerPage, dataType, gender, category, categoryId, vendorId, vendorName }) => {
    const [sortOption, setSortOption] = useState('');
    const [type, setType] = useState<string | null | undefined>(dataType)
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | null>()
    const [allBrands, setAllBrands] = useState<Brand[]>([])
    const [selectedStyle, setSelectedStyle] = useState<string | null>()
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>()
    const [brand, setBrand] = useState<string | null>()
    const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 50000 });
    const [actualPriceRange, setActualPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 50000 });
    const [currentPage, setCurrentPage] = useState(0);
    const productsPerPage = productPerPage;
    const offset = currentPage * productsPerPage;

    // Category meta and subcategories
    const [categoryName, setCategoryName] = useState<string>('Shop')
    const [categoryDescription, setCategoryDescription] = useState<string>('')
    const [categoryBanner, setCategoryBanner] = useState<string>('')
    const [subCategories, setSubCategories] = useState<Array<{ id: string; name: string }>>([])
    const [allSubCategories, setAllSubCategories] = useState<Array<{ id: string; name: string; categoryId: string }>>([])
    
    // Vendors
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [vendorMap, setVendorMap] = useState<Record<string, string>>({})

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                if (!categoryId) return;
                const categoryRef = ref(database, `categories/${categoryId}`)
                const snapshot = await get(categoryRef)
                if (snapshot.exists()) {
                    const cat = snapshot.val() as any
                    setCategoryName(cat?.name || 'Shop')
                    setCategoryDescription(cat?.description || '')
                    setCategoryBanner(cat?.banner || '')
                    const subs = Array.isArray(cat?.subCategories) ? cat.subCategories : []
                    setSubCategories(subs.map((s: any) => {
                        // Handle both object format {id, name} and string format
                        if (typeof s === 'object' && s.id && s.name) {
                            return { id: s.id, name: s.name }
                        } else if (typeof s === 'string') {
                            return { id: s, name: s }
                        }
                        return { id: '', name: '' }
                    }).filter((sub: { id: string; name: string }) => sub.id && sub.name))
                } else {
                    setCategoryName('Shop')
                    setCategoryDescription('')
                    setCategoryBanner('')
                    setSubCategories([])
                }
            } catch (e) {
                setCategoryName('Shop')
                setCategoryDescription('')
                setCategoryBanner('')
                setSubCategories([])
            }
        }
        fetchCategory()
    }, [categoryId])

    useEffect(() => {
        const fetchVendorsData = async () => {
            try {
                const vendorsData = await fetchVendors()
                setVendors(vendorsData)
                
                // Create a map of vendor ID to business name
                const map: Record<string, string> = {}
                vendorsData.forEach(vendor => {
                    map[vendor.id] = vendor.businessName || vendor.storeName || vendor.name || vendor.id
                })
                setVendorMap(map)
            } catch (error) {
                console.error('Error fetching vendors:', error)
            }
        }
        fetchVendorsData()
    }, [])

    useEffect(() => {
        const fetchSubCategoriesForCategory = async () => {
            try {
                if (!categoryId) {
                    setAllSubCategories([])
                    return
                }

                const categoryRef = ref(database, `categories/${categoryId}`)
                const snapshot = await get(categoryRef)
                
                if (snapshot.exists()) {
                    const categoryData = snapshot.val()
                    const subCategories: Array<{ id: string; name: string; categoryId: string }> = []
                    
                    if (categoryData.subCategories && Array.isArray(categoryData.subCategories)) {
                        categoryData.subCategories.forEach((sub: any) => {
                            // Handle both object format {id, name} and string format
                            if (typeof sub === 'object' && sub.id && sub.name) {
                                subCategories.push({
                                    id: sub.id,
                                    name: sub.name,
                                    categoryId: categoryId
                                })
                            } else if (typeof sub === 'string') {
                                // If sub is just a string, use it as both id and name
                                subCategories.push({
                                    id: sub,
                                    name: sub,
                                    categoryId: categoryId
                                })
                            }
                        })
                    }
                    
                    setAllSubCategories(subCategories)
                } else {
                    setAllSubCategories([])
                }
            } catch (error) {
                console.error('Error fetching subcategories:', error)
                setAllSubCategories([])
            }
        }
        fetchSubCategoriesForCategory()
    }, [categoryId])

    useEffect(() => {
        const loadBrands = async () => {
            try {
                const brands = await fetchBrands()
                setAllBrands(brands)
            } catch (error) {
                console.error('Error loading brands:', error)
            }
        }
        loadBrands()
    }, [])

    useEffect(() => {
        // Calculate actual price range from product data
        if (data.length > 0) {
            const prices = data.map(product => product.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const roundedMin = Math.floor(minPrice / 500) * 500; // Round down to nearest 500
            const roundedMax = Math.ceil(maxPrice / 500) * 500; // Round up to nearest 500
            
            setActualPriceRange({ min: roundedMin, max: roundedMax });
            // Only set initial price range if it hasn't been changed by user
            if (priceRange.min === 0 && priceRange.max === 50000) {
                setPriceRange({ min: roundedMin, max: roundedMax });
            }
        }
    }, [data])


    const handleSortChange = (option: string) => {
        setSortOption(option);
        setCurrentPage(0);
    };

    const handleType = (type: string | null) => {
        setType((prevType) => (prevType === type ? null : type))
        setCurrentPage(0);
    }

    const handleBrandFilter = (brandId: string) => {
        setSelectedBrandFilter((prevBrand) => (prevBrand === brandId ? null : brandId))
        setCurrentPage(0);
    }

    const handleStyle = (style: string) => {
        setSelectedStyle((prevStyle) => (prevStyle === style ? null : style))
        setCurrentPage(0);
    }

    const handleMaterial = (material: string) => {
        setSelectedMaterial((prevMaterial) => (prevMaterial === material ? null : material))
        setCurrentPage(0);
    }

    const handlePriceChange = (values: number | number[]) => {
        if (Array.isArray(values)) {
            setPriceRange({ min: values[0], max: values[1] });
            setCurrentPage(0);
        }
    };


    const handleBrand = (brand: string) => {
        setBrand((prevBrand) => (prevBrand === brand ? null : brand));
        setCurrentPage(0);
    }


    // Filter product
    let filteredData = data.filter(product => {

        let isDatagenderMatched = true;
        if (gender) {
            isDatagenderMatched = product.gender === gender
        }

        let isDataCategoryMatched = true;
        if (category) {
            // If category is an ID (from Firebase), match against product.category when it stores id
            const prodCat = (product as any).category;
            isDataCategoryMatched = prodCat === category || (typeof prodCat === 'string' && prodCat.toLowerCase() === category.toLowerCase());
        }

        let isDataTypeMatched = true;
        if (dataType) {
            isDataTypeMatched = product.type === dataType
        }

        let isTypeMatched = true;
        if (type) {
            // Check if type matches subcategory ID in subCategories array or single subCategory field
            const productSubCategories = (product as any).subCategories || [];
            const productSubCategory = (product as any).subCategory;
            isTypeMatched = productSubCategories.includes(type) || productSubCategory === type;
        }

        let isBrandFilterMatched = true;
        if (selectedBrandFilter) {
            // Check if product has brands array and includes the selected brand
            const productBrands = (product as any).brands || [];
            isBrandFilterMatched = productBrands.includes(selectedBrandFilter);
            console.log(`Filtering product "${product.name}" for brand "${selectedBrandFilter}":`, {
                productBrands,
                selectedBrandFilter,
                matches: isBrandFilterMatched
            });
        }

        let isStyleMatched = true;
        if (selectedStyle) {
            // Check if product has style array and includes the selected style
            const productStyles = (product as any).style || [];
            isStyleMatched = productStyles.some((style: string) => style.toLowerCase() === selectedStyle.toLowerCase());
            console.log(`Filtering product "${product.name}" for style "${selectedStyle}":`, {
                productStyles,
                selectedStyle,
                matches: isStyleMatched
            });
        }

        let isPriceRangeMatched = true;
        if (priceRange.min !== actualPriceRange.min || priceRange.max !== actualPriceRange.max) {
            isPriceRangeMatched = product.price >= priceRange.min && product.price <= priceRange.max;
        }

        let isMaterialMatched = true;
        if (selectedMaterial) {
            // Check if product has primaryMaterial array and includes the selected material
            const productMaterials = (product as any).primaryMaterial || [];
            isMaterialMatched = productMaterials.some((material: string) => material === selectedMaterial);
            console.log(`Filtering product "${product.name}" for material "${selectedMaterial}":`, {
                productMaterials,
                selectedMaterial,
                matches: isMaterialMatched
            });
        }

        let isBrandMatched = true;
        if (brand) {
            isBrandMatched = (product as any).vendor === brand;
        }

        return isDatagenderMatched && isDataCategoryMatched && isDataTypeMatched && isTypeMatched && isBrandFilterMatched && isStyleMatched && isMaterialMatched && isBrandMatched && isPriceRangeMatched;
    })


    // Create a copy array filtered to sort
    let sortedData = [...filteredData];

    if (sortOption === 'priceHighToLow') {
        filteredData = sortedData.sort((a, b) => b.price - a.price)
    }

    if (sortOption === 'priceLowToHigh') {
        filteredData = sortedData.sort((a, b) => a.price - b.price)
    }

    const totalProducts = filteredData.length
    const selectedType = type
    const selectedBrandName = selectedBrandFilter ? allBrands.find(b => b.id === selectedBrandFilter)?.name : null
    const selectedStyleName = selectedStyle
    const selectedMaterialName = selectedMaterial
    const selectedBrand = brand


    if (filteredData.length === 0) {
        filteredData = [{
            id: 'no-data',
            category: 'no-data',
            type: 'no-data',
            name: 'no-data',
            gender: 'no-data',
            new: false,
            sale: false,
            rate: 0,
            price: 0,
            originPrice: 0,
            brand: 'no-data',
            sold: 0,
            quantity: 0,
            quantityPurchase: 0,
            sizes: [],
            variation: [],
            thumbImage: [],
            images: [],
            description: 'no-data',
            action: 'no-data',
            slug: 'no-data'
        }];
    }


    // Find page number base on filteredData
    const pageCount = Math.ceil(filteredData.length / productsPerPage);

    // If page number 0, set current page = 0
    if (pageCount === 0) {
        setCurrentPage(0);
    }

    // Get product data for current page
    let currentProducts: ProductType[];

    if (filteredData.length > 0) {
        currentProducts = filteredData.slice(offset, offset + productsPerPage);
    } else {
        currentProducts = []
    }

    const handlePageChange = (selected: number) => {
        setCurrentPage(selected);
    };

    const handleClearAll = () => {
        dataType = null
        setSortOption('');
        setType(null);
        setSelectedBrandFilter(null);
        setSelectedStyle(null);
        setSelectedMaterial(null);
        setBrand(null);
        setPriceRange({ min: actualPriceRange.min, max: actualPriceRange.max });
        setCurrentPage(0);
        handleType(null)
    };

    return (
        <>
            <div className="breadcrumb-block style-img">
                <div className="breadcrumb-main bg-linear overflow-hidden">
                    <div className="container lg:pt-[134px] pt-24 pb-10 relative">
                        <div className="main-content w-full h-full flex flex-col items-center justify-center relative z-[1]">
                            <div className="text-content flex flex-col items-center">
                                <div className="link flex items-center justify-center gap-1 caption1">
                                    <Link href={'/'}>Homepage</Link>
                                    <Icon.CaretRight size={14} className='text-secondary2' />
                                    <Link href={'/shop/breadcrumb1'} className='text-secondary2'>Shop</Link>
                                    <Icon.CaretRight size={14} className='text-secondary2' />
                                    <div className='text-secondary2 capitalize'>{vendorId ? vendorName : categoryName}</div>
                                </div>
                                <div className="heading2 text-center mt-2">{vendorId ? vendorName : categoryName}</div>
                                {categoryDescription && (
                                    <div className="caption1 text-center text-secondary mt-3 max-w-3xl">
                                        {categoryDescription}
                                    </div>
                                )}
                            </div>
                            <div className="list-tab flex flex-wrap items-center justify-center gap-y-5 gap-8 lg:mt-[32px] mt-8 overflow-hidden">
                                {subCategories.length > 0 ? (
                                    subCategories.map((sub) => (
                                        <Link
                                            key={sub.id}
                                            href={`/shop/breadcrumb1?categoryId=${encodeURIComponent(categoryId || '')}&subCategory=${encodeURIComponent(sub.id)}`}
                                            className={`tab-item text-button-uppercase cursor-pointer has-line-before line-2px`}
                                        >
                                            {sub.name}
                                        </Link>
                                    ))
                                ) : (
                                    <></>
                                )}
                            </div>
                        </div>
                    </div>
                    {categoryBanner && (
                        <div className="container pb-10">
                            <div className="w-full">
                                <Image
                                    src={categoryBanner}
                                    alt={categoryName}
                                    width={2560}
                                    height={500}
                                    className="w-full h-auto rounded-xl object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="shop-product breadcrumb1 lg:py-20 md:py-14 py-10">
                <div className="container">
                    <div className="flex max-md:flex-wrap max-md:flex-col-reverse gap-y-8">
                        <div className="sidebar lg:w-1/4 md:w-1/3 w-full md:pr-12">
                            <div className="filter-type pb-8 border-b border-line">
                                <div className="heading6">Sub Categories</div>
                                <div className="list-type mt-4">
                                    {categoryId ? (
                                        allSubCategories.length > 0 ? (
                                            allSubCategories.map((subCategory, index) => (
                                                <div
                                                    key={index}
                                                    className={`item flex items-center justify-between cursor-pointer ${dataType === subCategory.id ? 'active' : ''}`}
                                                    onClick={() => handleType(subCategory.id)}
                                                >
                                                    <div className='text-secondary has-line-before hover:text-black capitalize'>{subCategory.name}</div>
                                                    <div className='text-secondary2'>
                                                        ({data.filter(dataItem => {
                                                            const productSubCategories = (dataItem as any).subCategories || [];
                                                            const productSubCategory = (dataItem as any).subCategory;
                                                            return productSubCategories.includes(subCategory.id) || productSubCategory === subCategory.id;
                                                        }).length})
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-secondary text-sm">No subcategories available for this category</div>
                                        )
                                    ) : (
                                        <div className="text-secondary text-sm">Select a category to view subcategories</div>
                                    )}
                                </div>
                            </div>
                            <div className="filter-brand pb-8 border-b border-line mt-8">
                                <div className="heading6">Brands</div>
                                <div className="list-brand mt-4">
                                    {allBrands.length > 0 ? (
                                        allBrands.map((brand, index) => (
                                            <div key={index} className="brand-item flex items-center justify-between mt-3">
                                                <div className="left flex items-center cursor-pointer" onClick={() => handleBrandFilter(brand.id)}>
                                                    <div className="block-input">
                                                        <input
                                                            type="checkbox"
                                                            name={brand.id}
                                                            id={brand.id}
                                                            checked={selectedBrandFilter === brand.id}
                                                            onChange={() => handleBrandFilter(brand.id)} />
                                                        <Icon.CheckSquare size={20} weight='fill' className='icon-checkbox' />
                                                    </div>
                                                    <label htmlFor={brand.id} className='brand-name capitalize pl-2 cursor-pointer'>{brand.name}</label>
                                                </div>
                                                <div className='text-secondary2'>
                                                    ({(() => {
                                                        const matchingProducts = data.filter(dataItem => {
                                                            const productBrands = (dataItem as any).brands || [];
                                                            const matches = productBrands.includes(brand.id);
                                                            console.log(`Product "${dataItem.name}" brand check for "${brand.name}" (${brand.id}):`, {
                                                                productBrands,
                                                                brandId: brand.id,
                                                                matches
                                                            });
                                                            return matches;
                                                        });
                                                        console.log(`Total products for brand "${brand.name}":`, matchingProducts.length);
                                                        return matchingProducts.length;
                                                    })()})
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-secondary text-sm">No brands available</div>
                                    )}
                                </div>
                            </div>
                            <div className="filter-style pb-8 border-b border-line mt-8">
                                <div className="heading6">Style & Design</div>
                                <div className="list-style mt-4">
                                    {['Modern', 'Scandinavian', 'Contemporary', 'Industrial', 'Minimalist', 'Bohemian', 'Traditional'].map((style, index) => (
                                        <div key={index} className="style-item flex items-center justify-between mt-3">
                                            <div className="left flex items-center cursor-pointer" onClick={() => handleStyle(style)}>
                                                <div className="block-input">
                                                    <input
                                                        type="checkbox"
                                                        name={style}
                                                        id={style}
                                                        checked={selectedStyle === style}
                                                        onChange={() => handleStyle(style)} />
                                                    <Icon.CheckSquare size={20} weight='fill' className='icon-checkbox' />
                                                </div>
                                                <label htmlFor={style} className='style-name capitalize pl-2 cursor-pointer'>{style}</label>
                                            </div>
                                            <div className='text-secondary2'>
                                                ({data.filter(dataItem => {
                                                    const productStyles = (dataItem as any).style || [];
                                                    return productStyles.some((productStyle: string) => productStyle.toLowerCase() === style.toLowerCase());
                                                }).length})
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-price pb-8 border-b border-line mt-8">
                                <div className="heading6">Price Range</div>
                                <Slider
                                    range
                                    value={[priceRange.min, priceRange.max]}
                                    min={actualPriceRange.min}
                                    max={actualPriceRange.max}
                                    step={500}
                                    onChange={handlePriceChange}
                                    className='mt-5'
                                />
                                <div className="price-block flex items-center justify-between flex-wrap mt-4">
                                    <div className="min flex items-center gap-1">
                                        <div>Min price:</div>
                                        <div className='price-min'>₹
                                            <span>{priceRange.min.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                    <div className="max flex items-center gap-1">
                                        <div>Max price:</div>
                                        <div className='price-max'>₹
                                            <span>{priceRange.max.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="filter-material pb-8 border-b border-line mt-8">
                                <div className="heading6">Primary Material</div>
                                <div className="list-material mt-4">
                                    {['Wood (Teak)', 'Wood (Oak)', 'Wood (Engineered)', 'Metal', 'Glass', 'Plastic', 'Rattan', 'Fabric', 'Marble', 'Granite', 'Ceramic', 'Bamboo'].map((material, index) => (
                                        <div key={index} className="material-item flex items-center justify-between mt-3">
                                            <div className="left flex items-center cursor-pointer" onClick={() => handleMaterial(material)}>
                                                <div className="block-input">
                                                    <input
                                                        type="checkbox"
                                                        name={material}
                                                        id={material}
                                                        checked={selectedMaterial === material}
                                                        onChange={() => handleMaterial(material)} />
                                                    <Icon.CheckSquare size={20} weight='fill' className='icon-checkbox' />
                                                </div>
                                                <label htmlFor={material} className='material-name pl-2 cursor-pointer'>{material}</label>
                                            </div>
                                            <div className='text-secondary2'>
                                                ({data.filter(dataItem => {
                                                    const productMaterials = (dataItem as any).primaryMaterial || [];
                                                    return productMaterials.some((productMaterial: string) => productMaterial === material);
                                                }).length})
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="filter-brand mt-8">
                                <div className="heading6">Vendors</div>
                                <div className="list-brand mt-4">
                                    {Array.from(new Set(data.map(item => (item as any).vendor).filter(Boolean))).map((vendorId, index) => {
                                        const vendorName = vendorMap[vendorId] || vendorId
                                        return (
                                            <div key={index} className="brand-item flex items-center justify-between">
                                                <div className="left flex items-center cursor-pointer">
                                                    <div className="block-input">
                                                        <input
                                                            type="checkbox"
                                                            name={vendorId}
                                                            id={vendorId}
                                                            checked={brand === vendorId}
                                                            onChange={() => handleBrand(vendorId)} />
                                                        <Icon.CheckSquare size={20} weight='fill' className='icon-checkbox' />
                                                    </div>
                                                    <label htmlFor={vendorId} className="brand-name capitalize pl-2 cursor-pointer">{vendorName}</label>
                                                </div>
                                                <div className='text-secondary2'>
                                                    ({data.filter(dataItem => (dataItem as any).vendor === vendorId).length})
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="list-product-block lg:w-3/4 md:w-2/3 w-full md:pl-3">
                            <div className="filter-heading flex items-center justify-between gap-5 flex-wrap">
                                <div className="left flex has-line items-center flex-wrap gap-5">
                                </div>
                                <div className="right flex items-center gap-3">
                                    <div className="select-block relative">
                                        <select
                                            id="select-filter"
                                            name="select-filter"
                                            className='caption1 py-2 pl-3 md:pr-20 pr-10 rounded-lg border border-line'
                                            onChange={(e) => { handleSortChange(e.target.value) }}
                                            defaultValue={'Sorting'}
                                        >
                                        <option value="Sorting" disabled>Sorting</option>
                                        <option value="priceHighToLow">Price High To Low</option>
                                        <option value="priceLowToHigh">Price Low To High</option>
                                        </select>
                                        <Icon.CaretDown size={12} className='absolute top-1/2 -translate-y-1/2 md:right-4 right-2' />
                                    </div>
                                </div>
                            </div>

                            <div className="list-filtered flex items-center gap-3 mt-4">
                                <div className="total-product">
                                    {totalProducts}
                                    <span className='text-secondary pl-1'>Products Found</span>
                                </div>
                                {
                                    (selectedType || selectedBrandName || selectedStyleName || selectedMaterialName || selectedBrand) && (
                                        <>
                                            <div className="list flex items-center gap-3">
                                                <div className='w-px h-4 bg-line'></div>
                                                {selectedType && (
                                                    <div className="item flex items-center px-2 py-1 gap-1 bg-linear rounded-full capitalize" onClick={() => { setType(null) }}>
                                                        <Icon.X className='cursor-pointer' />
                                                        <span>{allSubCategories.find(sub => sub.id === selectedType)?.name || selectedType}</span>
                                                    </div>
                                                )}
                                                {selectedBrandName && (
                                                    <div className="item flex items-center px-2 py-1 gap-1 bg-linear rounded-full capitalize" onClick={() => { setSelectedBrandFilter(null) }}>
                                                        <Icon.X className='cursor-pointer' />
                                                        <span>{selectedBrandName}</span>
                                                    </div>
                                                )}
                                                {selectedStyleName && (
                                                    <div className="item flex items-center px-2 py-1 gap-1 bg-linear rounded-full capitalize" onClick={() => { setSelectedStyle(null) }}>
                                                        <Icon.X className='cursor-pointer' />
                                                        <span>{selectedStyleName}</span>
                                                    </div>
                                                )}
                                                {selectedMaterialName && (
                                                    <div className="item flex items-center px-2 py-1 gap-1 bg-linear rounded-full capitalize" onClick={() => { setSelectedMaterial(null) }}>
                                                        <Icon.X className='cursor-pointer' />
                                                        <span>{selectedMaterialName}</span>
                                                    </div>
                                                )}
                                                {selectedBrand && (
                                                    <div className="item flex items-center px-2 py-1 gap-1 bg-linear rounded-full capitalize" onClick={() => { setBrand(null) }}>
                                                        <Icon.X className='cursor-pointer' />
                                                        <span>{selectedBrand}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className="clear-btn flex items-center px-2 py-1 gap-1 rounded-full border border-red cursor-pointer"
                                                onClick={handleClearAll}
                                            >
                                                <Icon.X color='rgb(219, 68, 68)' className='cursor-pointer' />
                                                <span className='text-button-uppercase text-red'>Clear All</span>
                                            </div>
                                        </>
                                    )
                                }
                            </div>

                            <div className="list-product hide-product-sold grid lg:grid-cols-3 grid-cols-2 sm:gap-[30px] gap-[20px] mt-7">
                                {currentProducts.map((item) => (
                                    item.id === 'no-data' ? (
                                        <div key={item.id} className="no-data-product">No products match the selected criteria.</div>
                                    ) : (
                                        <Product key={item.id} data={item} type='grid' style='style-1' />
                                    )
                                ))}
                            </div>

                            {pageCount > 1 && (
                                <div className="list-pagination flex items-center md:mt-10 mt-7">
                                    <HandlePagination pageCount={pageCount} onPageChange={handlePageChange} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}

export default ShopBreadCrumb1