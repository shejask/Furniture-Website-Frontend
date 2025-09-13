'use client'

// WishlistContext.tsx
import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';
import { ProductType } from '@/type/ProductType';
import { ref, onValue } from 'firebase/database';
import { database, auth } from '@/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { convertFirebaseToUIProduct, FirebaseProductType } from '@/type/FirebaseProductType';
import { addToFirebaseWishlist, removeFromFirebaseWishlist } from '@/firebase/wishlist';

interface WishlistItem extends ProductType {
}

interface WishlistState {
    wishlistArray: WishlistItem[]
}

type WishlistAction =
    | { type: 'ADD_TO_WISHLIST'; payload: ProductType }
    | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
    | { type: 'LOAD_WISHLIST'; payload: WishlistItem[] }

interface WishlistContextProps {
    wishlistState: WishlistState;
    addToWishlist: (item: ProductType) => void;
    removeFromWishlist: (itemId: string) => void;
}

const WishlistContext = createContext<WishlistContextProps | undefined>(undefined);

const WishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
    switch (action.type) {
        case 'ADD_TO_WISHLIST':
            const newItem: WishlistItem = { ...action.payload };
            return {
                ...state,
                wishlistArray: [...state.wishlistArray, newItem],
            };
        case 'REMOVE_FROM_WISHLIST':
            return {
                ...state,
                wishlistArray: state.wishlistArray.filter((item) => item.id !== action.payload),
            };
        case 'LOAD_WISHLIST':
            return {
                ...state,
                wishlistArray: action.payload,
            };
        default:
            return state;
    }
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wishlistState, dispatch] = useReducer(WishlistReducer, { wishlistArray: [] });
    const [user] = useAuthState(auth);

    const addToWishlist = (item: ProductType) => {
        dispatch({ type: 'ADD_TO_WISHLIST', payload: item });
        if (user) {
            (async () => {
                try {
                    const fb: FirebaseProductType = {
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        salePrice: (item as any).salePrice ?? item.price,
                        thumbnail: item.thumbImage?.[0] || item.images?.[0] || '',
                        productType: 'physical',
                        status: 'enabled',
                        stockStatus: 'in_stock',
                        stockQuantity: item.quantity,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        sku: item.id,
                        slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
                        vendor: 'admin',
                        inventoryType: 'simple',
                        new: false,
                        bestSeller: false,
                        onSale: false,
                        newArrivals: false,
                        trending: false,
                        featured: false
                    };
                    await addToFirebaseWishlist(user.uid, fb);
                } catch {}
            })();
        }
    };

    const removeFromWishlist = (itemId: string) => {
        dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: itemId });
        if (user) {
            (async () => {
                try {
                    await removeFromFirebaseWishlist(user.uid, itemId);
                } catch {}
            })();
        }
    };

    useEffect(() => {
        if (!user) {
            dispatch({ type: 'LOAD_WISHLIST', payload: [] });
            return;
        }
        const wishlistRef = ref(database, `/customers/${user.uid}/wishlist`);
        const unsubscribe = onValue(wishlistRef, (snap) => {
            if (!snap.exists()) {
                dispatch({ type: 'LOAD_WISHLIST', payload: [] });
                return;
            }
            const obj = snap.val() as Record<string, FirebaseProductType>;
            const list: ProductType[] = Object.values(obj).map((fb) => convertFirebaseToUIProduct(fb));
            dispatch({ type: 'LOAD_WISHLIST', payload: list });
        });
        return () => unsubscribe();
    }, [user, user?.uid]);

    return (
        <WishlistContext.Provider value={{ wishlistState, addToWishlist, removeFromWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
