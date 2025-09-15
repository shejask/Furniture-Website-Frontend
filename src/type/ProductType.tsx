interface Variation {
    color: string;
    colorCode: string;
    colorImage: string;
    image: string;
}

interface VariableOption {
    name: string;
    values: string[];
}

// ProductType interface with all required properties including Firebase fields

export interface ProductType {
    id: string,
    category: string,
    categories?: string[], // Firebase categories array
    type: string,
    name: string,
    gender: string,
    new: boolean,
    sale: boolean,
    rate: number,
    rating?: number,
    price: number,
    salePrice?: number,
    originPrice: number,
    brand: string,
    brands?: string[], // Firebase brands array
    vendor?: string, // Firebase vendor field
    subCategory?: string, // Firebase subcategory field
    subCategories?: string[], // Firebase subcategories array
    style?: string[], // Firebase style array
    primaryMaterial?: string[], // Firebase primary material array
    sold: number,
    quantity: number,
    quantityPurchase: number,
    sizes: Array<string>,
    variation: Variation[],
    thumbImage: Array<string>,
    images: Array<string>,
    description: string,
    action: string,
    slug: string,
    shortDescription?: string,
    discount?: number,
    featured?: boolean,
    freeShipping?: boolean,
    estimatedDeliveryText?: string,
    encourageOrder?: boolean,
    encourageView?: boolean,
    createdAt?: string,
    updatedAt?: string,
    // New Firebase fields
    variableOptions?: VariableOption[],
    weight?: number,
    dimensions?: string,
    roomType?: string,
    warrantyTime?: string,
    bestSeller?: boolean,
    onSale?: boolean,
    newArrivals?: boolean,
    trending?: boolean,
    status?: string, // Add status field for filtering
    taxId?: string // Add taxId field for tax information
}

export interface ReviewType {
    id: string;
    title: string;
    message: string;
    rating: number;
    images: string[];
    userId: string;
    userName: string;
    userEmail: string;
    createdAt: string;
    productId: string;
}

export interface BannerType {
    id: string;
    type: string;
    altText: string;
    createdAt: string;
    description: string;
    displayOrder: number;
    endDate?: string;
    imageUrl: string;
    linkUrl: string;
    startDate?: string;
    title: string;
    updatedAt: string;
}