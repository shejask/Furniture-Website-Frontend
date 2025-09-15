export interface FirebaseProductType {
    id: string;
    productType: 'physical' | 'digital';
    vendor: string;
    name: string;
    slug: string;
    shortDescription?: string;
    description?: string;
    thumbnail: string;
    images?: string[];
    inventoryType: 'variable' | 'simple';
    stockStatus: 'in_stock' | 'out_of_stock';
    sku: string;
    stockQuantity: number;
    price: number;
    discount?: number;
    salePrice: number;
    commissionAmount?: number;
    variableOptions?: Array<{
        name: string;
        values: string[];
    }>;
    tags?: string[];
    categories?: string[];
    brands?: string[];
    subCategory?: string;
    subCategories?: string[];
    style?: string[];
    primaryMaterial?: string[];
    metaTitle?: string;
    metaDescription?: string;
    metaImage?: string;
    weight?: number;
    estimatedDeliveryText?: string;
    dimensions?: string;
    roomType?: string;
    warrantyTime?: string;
    new: boolean;
    bestSeller: boolean;
    onSale: boolean;
    newArrivals: boolean;
    trending: boolean;
    featured: boolean;
    createdAt: string;
    updatedAt: string;
    // Legacy fields for backward compatibility
    status?: 'enabled' | 'disabled';
    unit?: string;
    sizeChart?: string;
    randomRelatedProduct?: boolean;
    wholesalePriceType?: string;
    taxId?: string; // Tax identification number
    rating?: number; // Product rating (1-5 stars)
}

// Helper function to convert Firebase product to UI product type
export const convertFirebaseToUIProduct = (product: FirebaseProductType) => {
    const now = new Date();
    const createdDate = new Date(product.createdAt);
    const isNew = now.getTime() - createdDate.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days

    // Extract sizes and colors from variableOptions if available
    const sizes: string[] = [];
    const variation: Array<{
        color: string;
        colorCode: string;
        colorImage: string;
        image: string;
    }> = [];

    if (product.variableOptions) {
        product.variableOptions.forEach(option => {
            if (option.name.toLowerCase() === 'size') {
                sizes.push(...option.values);
            } else if (option.name.toLowerCase() === 'color') {
                option.values.forEach(color => {
                    variation.push({
                        color,
                        colorCode: color.toLowerCase(),
                        colorImage: product.thumbnail,
                        image: product.thumbnail
                    });
                });
            }
        });
    }

    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        originPrice: product.salePrice > 0 ? product.price : product.price,
        salePrice: product.salePrice,
        thumbImage: [product.thumbnail],
        images: product.images || [product.thumbnail],
        quantity: product.stockQuantity,
        sold: 0,
        description: product.description || product.shortDescription || '',
        shortDescription: product.shortDescription,
        category: product.categories?.[0] || '',
        type: product.productType,
        status: product.status || 'enabled',
        stockStatus: product.stockStatus,
        trending: product.trending || false,
        featured: product.featured || false,
        new: product.new || isNew,
        sale: product.onSale || product.salePrice > 0,
        isActive: (product.status || 'enabled') === 'enabled',
        variation: variation,
        sizes: sizes,
        rate: 5,
        review: 0,
        gender: '',
        brand: product.brands?.[0] || '',
        brands: product.brands || [],
        action: 'add to cart',
        quantityPurchase: 1,
        vendor: product.vendor,
        subCategory: product.subCategory,
        subCategories: product.subCategories,
        style: product.style || [],
        primaryMaterial: product.primaryMaterial || [],
        unit: product.unit,
        weight: product.weight,
        sizeChart: product.sizeChart,
        tags: product.tags || [],
        discount: product.discount,
        estimatedDeliveryText: product.estimatedDeliveryText,
        dimensions: product.dimensions,
        roomType: product.roomType,
        warrantyTime: product.warrantyTime,
        bestSeller: product.bestSeller || false,
        onSale: product.onSale || false,
        newArrivals: product.newArrivals || false,
        taxId: product.taxId,
        rating: product.rating || 4 // Default rating if not provided
    }
}