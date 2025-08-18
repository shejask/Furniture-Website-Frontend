'use client'

// CartContext.tsx
import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';
import { ProductType } from '@/type/ProductType';
import { addOrUpdateFirebaseCartItem, removeFirebaseCartItem, updateFirebaseCartItemFields } from '@/firebase/cart';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase/config';
import { ref, onValue } from 'firebase/database';
import { database } from '@/firebase/config';

interface CartItem extends ProductType {
    quantity: number
    selectedSize: string
    selectedColor: string
}

interface CartState {
    cartArray: CartItem[]
}

type CartAction =
    | { type: 'ADD_TO_CART'; payload: ProductType }
    | { type: 'REMOVE_FROM_CART'; payload: string }
    | {
        type: 'UPDATE_CART'; payload: {
            itemId: string; quantity: number, selectedSize: string, selectedColor: string
        }
    }
    | { type: 'LOAD_CART'; payload: CartItem[] }

interface CartContextProps {
    cartState: CartState;
    addToCart: (item: ProductType) => void;
    removeFromCart: (itemId: string) => void;
    updateCart: (itemId: string, quantity: number, selectedSize: string, selectedColor: string) => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
    switch (action.type) {
        case 'ADD_TO_CART':
            const newItem: CartItem = { ...action.payload, quantity: 1, selectedSize: '', selectedColor: '' };
            return {
                ...state,
                cartArray: [...state.cartArray, newItem],
            };
        case 'REMOVE_FROM_CART':
            return {
                ...state,
                cartArray: state.cartArray.filter((item) => item.id !== action.payload),
            };
        case 'UPDATE_CART':
            return {
                ...state,
                cartArray: state.cartArray.map((item) =>
                    item.id === action.payload.itemId
                        ? {
                            ...item,
                            quantity: action.payload.quantity,
                            selectedSize: action.payload.selectedSize,
                            selectedColor: action.payload.selectedColor
                        }
                        : item
                ),
            };
        case 'LOAD_CART':
            return {
                ...state,
                cartArray: action.payload,
            };
        default:
            return state;
    }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartState, dispatch] = useReducer(cartReducer, { cartArray: [] });
    const [user] = useAuthState(auth);

    const addToCart = (item: ProductType) => {
        dispatch({ type: 'ADD_TO_CART', payload: item });
        if (user) {
            // Save immediately with default quantity 1 and empty selections
            (async () => {
                try {
                    await addOrUpdateFirebaseCartItem(user.uid, item, 1, '', '');
                } catch (e) {
                    // no-op: keep local state even if remote fails
                }
            })();
        }
    };

    const removeFromCart = (itemId: string) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
        if (user) {
            (async () => {
                try {
                    await removeFirebaseCartItem(user.uid, itemId);
                } catch (e) {
                    // ignore remote error
                }
            })();
        }
    };

    const updateCart = (itemId: string, quantity: number, selectedSize: string, selectedColor: string) => {
        dispatch({ type: 'UPDATE_CART', payload: { itemId, quantity, selectedSize, selectedColor } });
        if (user) {
            (async () => {
                try {
                    await updateFirebaseCartItemFields(user.uid, itemId, { quantity, selectedSize, selectedColor });
                } catch (e) {
                    // ignore remote error
                }
            })();
        }
    };

    return (
        <CartContext.Provider value={{ cartState, addToCart, removeFromCart, updateCart }}>
            {children}
        </CartContext.Provider>
    );
};

// Load cart from Firebase whenever the authenticated user changes
// and keep it in sync in real-time
export const CartLoader: React.FC = () => {
    const { cartState } = useCart();
    const [user] = useAuthState(auth);
    const { addToCart } = useCart();
    return null;
};

// Attach a subscription inside provider
export const CartProviderWithSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartState, dispatch] = useReducer(cartReducer, { cartArray: [] });
    const [user] = useAuthState(auth);

    useEffect(() => {
        if (!user) {
            dispatch({ type: 'LOAD_CART', payload: [] });
            return;
        }
        const productsRef = ref(database, `/customers/${user.uid}/cart/products`);
        const off = onValue(productsRef, (snapshot) => {
            const productsObj = snapshot.val() || {};
            const items = Object.values(productsObj).map((p: any) => {
                const thumbnail = p?.thumbnail || '';
                const images = thumbnail ? [thumbnail] : [];
                const fallbackNumber = (n: any, def = 0) => (typeof n === 'number' && !isNaN(n) ? n : def);
                return {
                    // ProductType fields
                    id: p?.id || '',
                    category: '',
                    type: '',
                    name: p?.name || '',
                    gender: '',
                    new: false,
                    sale: false,
                    rate: 0,
                    price: fallbackNumber(p?.price, 0),
                    salePrice: fallbackNumber(p?.salePrice, undefined as any),
                    originPrice: fallbackNumber(p?.originPrice, fallbackNumber(p?.price, 0)),
                    brand: '',
                    sold: 0,
                    quantity: fallbackNumber(p?.quantity, 1), // reused as cart quantity
                    quantityPurchase: fallbackNumber(p?.quantity, 1),
                    sizes: [],
                    variation: [],
                    thumbImage: images,
                    images: images,
                    description: '',
                    action: 'add to cart',
                    slug: p?.slug || (p?.id || ''),
                    // CartItem extras
                    selectedSize: p?.selectedSize || '',
                    selectedColor: p?.selectedColor || ''
                } as any;
            });
            dispatch({ type: 'LOAD_CART', payload: items });
        });
        return () => off();
    }, [user?.uid]);

    const addToCart = (item: ProductType) => {
        dispatch({ type: 'ADD_TO_CART', payload: item });
        if (user) {
            (async () => {
                try {
                    await addOrUpdateFirebaseCartItem(user.uid, item, 1, '', '');
                } catch (e) {}
            })();
        }
    };

    const removeFromCart = (itemId: string) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
        if (user) {
            (async () => {
                try {
                    await removeFirebaseCartItem(user.uid, itemId);
                } catch (e) {}
            })();
        }
    };

    const updateCart = (itemId: string, quantity: number, selectedSize: string, selectedColor: string) => {
        dispatch({ type: 'UPDATE_CART', payload: { itemId, quantity, selectedSize, selectedColor } });
        if (user) {
            (async () => {
                try {
                    await updateFirebaseCartItemFields(user.uid, itemId, { quantity, selectedSize, selectedColor });
                } catch (e) {}
            })();
        }
    };

    return (
        <CartContext.Provider value={{ cartState, addToCart, removeFromCart, updateCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
