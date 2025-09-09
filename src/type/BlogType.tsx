
export interface BlogType {
    id: string;
    title: string;
    category: string;
    tag: string;
    date: string;
    author: string;
    avatar: string;
    thumbImg: string;
    coverImg: string;
    subImg: string[];
    shortDesc: string;
    description: string;
    slug: string;
    // Firebase specific fields
    imageUrl?: string;
    altText?: string;
    createdAt?: string;
    updatedAt?: string;
    isPublished?: boolean;
    content?: string;
}