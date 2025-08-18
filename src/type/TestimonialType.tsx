
export interface TestimonialType {
    id: string;
    name: string;
    description: string;
    avatar?: string;
    date?: string;
    address?: string;
    star?: number;
    title?: string;
    // Optional fields for other testimonial sources
    altText?: string;
    createdAt?: string;
    imageUrl?: string;
    updatedAt?: string;
}