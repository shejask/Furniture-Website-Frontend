export interface FirebaseProductType {
    id: string;
    name: string;
    description?: string;
    shortDescription?: string;
    price: number;
    salePrice: number;
    images?: string[];
    thumbnail: string;
    category?: string;
    productType: 'physical' | 'digital';
    status: 'enabled' | 'disabled';
    stockStatus: 'in_stock' | 'out_of_stock';
    stockQuantity: number;
    sku: string;
    slug: string;
    unit?: string;
    weight?: number;
    sizeChart?: string;
    trending?: boolean;
    featured?: boolean;
    vendor?: string;
    tags?: Array<{
        id: string;
        name: string;
    }>;
    createdAt: string;
    updatedAt: string;
    randomRelatedProduct?: boolean;
    wholesalePriceType?: string;
}

// Helper function to convert Firebase product to UI product type
export const convertFirebaseToUIProduct = (product: FirebaseProductType) => {
    const now = new Date();
    const createdDate = new Date(product.createdAt);
    const isNew = now.getTime() - createdDate.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days

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
        category: product.category || '',
        type: product.productType,
        status: product.status,
        stockStatus: product.stockStatus,
        trending: product.trending || false,
        featured: product.featured || false,
        new: isNew,
        sale: product.salePrice > 0,
        isActive: product.status === 'enabled',
        variation: [],
        sizes: [],
        rate: 5,
        review: 0,
        gender: '',
        brand: '',
        action: 'add to cart',
        quantityPurchase: 1,
        vendor: product.vendor,
        unit: product.unit,
        weight: product.weight,
        sizeChart: product.sizeChart,
        tags: product.tags
    }
}