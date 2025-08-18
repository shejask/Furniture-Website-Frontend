interface Variation {
    color: string;
    colorCode: string;
    colorImage: string;
    image: string;
}

// ProductType interface with all required properties including Firebase fields

export interface ProductType {
    id: string,
    category: string,
    type: string,
    name: string,
    gender: string,
    new: boolean,
    sale: boolean,
    rate: number,
    price: number,
    salePrice?: number,
    originPrice: number,
    brand: string,
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
    updatedAt?: string
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
    endDate: string;
    imageUrl: string;
    isActive: boolean;
    linkUrl: string;
    startDate: string;
    title: string;
    updatedAt: string;
}