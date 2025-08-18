'use client'

import { ref, set, remove, get } from 'firebase/database';
import { database } from './config';
import { FirebaseProductType } from '@/type/FirebaseProductType';

export const addToFirebaseWishlist = async (userId: string, product: FirebaseProductType) => {
    try {
        console.log('Adding to Firebase wishlist:', {
            path: `/wishlist/0/${product.id}`,
            product
        });
        
        if (!userId) throw new Error('User ID is required');
        const wishlistRef = ref(database, `/customers/${userId}/wishlist/${product.id}`);
        await set(wishlistRef, {
            ...product,
            addedAt: new Date().toISOString()
        });
        
        console.log('Successfully added to Firebase wishlist');
        return true;
    } catch (error) {
        console.error('Detailed Firebase error:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            product
        });
        throw error; // Re-throw to handle in component
    }
};

export const removeFromFirebaseWishlist = async (userId: string, productId: string) => {
    try {
        console.log('Removing from Firebase wishlist:', {
            path: `/wishlist/0/${productId}`,
            productId
        });
        
        if (!userId) throw new Error('User ID is required');
        const wishlistRef = ref(database, `/customers/${userId}/wishlist/${productId}`);
        await remove(wishlistRef);
        
        console.log('Successfully removed from Firebase wishlist');
        return true;
    } catch (error) {
        console.error('Detailed Firebase remove error:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            productId
        });
        throw error; // Re-throw to handle in component
    }
};

export const getWishlist = async (userId: string) => {
    try {
        if (!userId) throw new Error('User ID is required');
        const wishlistRef = ref(database, `/customers/${userId}/wishlist`);
        const snapshot = await get(wishlistRef);
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        }
        return [];
    } catch (error) {
        console.error('Error getting wishlist:', error);
        return [];
    }
};
