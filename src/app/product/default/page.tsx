import { Metadata } from 'next'
import { ref, get } from 'firebase/database'
import { database } from '@/firebase/config'
import ProductClient from './ProductClient'

export async function generateMetadata({ searchParams }: { searchParams: { id: string } }): Promise<Metadata> {
    try {
        if (!searchParams.id) {
            return {
                title: 'Oak and Aura',
                description: 'Furniture eCommerce ',
            }
        }

        const productRef = ref(database, `/products/${searchParams.id}`);
        const snapshot = await get(productRef);
        
        if (!snapshot.exists()) {
            return {
                title: 'Product Not Found',
                description: 'The requested product could not be found.',
            }
        }

        const productData = snapshot.val();
        
        return {
            title: productData.metaTitle || productData.name,
            description: productData.metaDescription || productData.description,
            openGraph: {
                images: [productData.metaImage || productData.thumbnail],
            },
        }
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Anvogue',
            description: 'Multipurpose eCommerce Template',
        }
    }
}

export default function ProductDefault({ searchParams }: { searchParams: { id: string } }) {
    return <ProductClient productId={searchParams.id} />
}