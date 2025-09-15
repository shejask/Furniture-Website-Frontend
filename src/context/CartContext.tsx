'use client'

// CartContext.tsx
import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';
import { ProductType } from '@/type/ProductType';
import { addOrUpdateFirebaseCartItem, removeFirebaseCartItem, updateFirebaseCartItemFields, overwriteFirebaseCartFromItems } from '@/firebase/cart';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase/config';
import { ref, onValue } from 'firebase/database';
import { database } from '@/firebase/config';
import { useRouter } from 'next/navigation';

interface CartItem extends ProductType {
    quantity: number
    selectedSize: string
    selectedColor: string
}

interface CartState {
    cartArray: CartItem[]
}

type CartAction =
    | { 
        type: 'ADD_TO_CART'; 
        payload: ProductType & { 
            selectedSize?: string; 
            selectedColor?: string; 
        } 
    }
    | { type: 'REMOVE_FROM_CART'; payload: string }
    | {
        type: 'UPDATE_CART'; payload: {
            itemId: string; quantity: number, selectedSize: string, selectedColor: string
        }
    }
    | { type: 'LOAD_CART'; payload: CartItem[] }
    | { type: 'CLEAR_CART' }

interface CartContextProps {
    cartState: CartState;
    addToCart: (item: ProductType & { selectedSize?: string; selectedColor?: string }) => Promise<boolean>; // Return boolean to indicate success/failure
    removeFromCart: (itemId: string) => void;
    updateCart: (itemId: string, quantity: number, selectedSize: string, selectedColor: string) => void;
    clearCart: () => void;
    requireLogin: () => void; // Function to handle login requirement
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
    switch (action.type) {
        case 'ADD_TO_CART':
            const existingItemIndex = state.cartArray.findIndex(item => item.id === action.payload.id);
            
            if (existingItemIndex !== -1) {
                // Product already exists, increment quantity
                const updatedCartArray = [...state.cartArray];
                updatedCartArray[existingItemIndex] = {
                    ...updatedCartArray[existingItemIndex],
                    quantity: updatedCartArray[existingItemIndex].quantity + 1
                };
                return {
                    ...state,
                    cartArray: updatedCartArray,
                };
            } else {
                // Product doesn't exist, add new item
                const newItem: CartItem = { 
                    ...action.payload, 
                    quantity: 1, 
                    selectedSize: action.payload.selectedSize || '', 
                    selectedColor: action.payload.selectedColor || ''
                };
                return {
                    ...state,
                    cartArray: [...state.cartArray, newItem],
                };
            }
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
        case 'CLEAR_CART':
            return {
                ...state,
                cartArray: [],
            };
        default:
            return state;
    }
};





    // SECOND CART PROVIDER - with Firebase sync
export const CartProviderWithSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartState, dispatch] = useReducer(cartReducer, { cartArray: [] });
    const [user] = useAuthState(auth);
    const [isInitialized, setIsInitialized] = useState(false);
    const router = useRouter();

    const requireLogin = () => {
        router.push('/login');
    };

    // Save cart to localStorage whenever cart changes (for non-logged in users)
    // Skip saving on initial load to prevent overwriting loaded data
    useEffect(() => {
        if (!user && isInitialized) {
            console.log('Saving cart to localStorage:', cartState.cartArray);
            localStorage.setItem('cart', JSON.stringify(cartState.cartArray));
        }
    }, [cartState.cartArray, user, isInitialized]);

    // Load cart from localStorage on mount and sync with Firebase when user changes
    useEffect(() => {
        if (!user) {
            // User not logged in, load from localStorage
            const savedCart = localStorage.getItem('cart');
            console.log('Loading cart from localStorage:', savedCart);
            if (savedCart) {
                try {
                    const parsedCart = JSON.parse(savedCart);
                    console.log('Parsed cart from localStorage:', parsedCart);
                    dispatch({ type: 'LOAD_CART', payload: parsedCart });
                } catch (error) {
                    console.error('Error loading cart from localStorage:', error);
                    dispatch({ type: 'LOAD_CART', payload: [] });
                }
            } else {
                console.log('No saved cart found in localStorage');
                dispatch({ type: 'LOAD_CART', payload: [] });
            }
            setIsInitialized(true);
            return;
        }

        // User logged in - merge local cart with Firebase cart
        const savedCart = localStorage.getItem('cart');
        let localCart: any[] = [];
        if (savedCart) {
            try {
                localCart = JSON.parse(savedCart);
            } catch (error) {
                console.error('Error parsing local cart:', error);
            }
        }

        // Listen to Firebase cart changes
        const productsRef = ref(database, `/customers/${user.uid}/cart/products`);
        const off = onValue(productsRef, (snapshot) => {
            const productsObj = snapshot.val() || {};
            const firebaseItems = Object.values(productsObj).map((p: any) => {
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

            // Merge local cart with Firebase cart
            const mergedCart = [...firebaseItems];
            
            // Add local cart items that don't exist in Firebase
            localCart.forEach((localItem: any) => {
                const existsInFirebase = firebaseItems.some((firebaseItem: any) => firebaseItem.id === localItem.id);
                if (!existsInFirebase) {
                    mergedCart.push({
                        ...localItem,
                        quantity: localItem.quantity || 1,
                        selectedSize: localItem.selectedSize || '',
                        selectedColor: localItem.selectedColor || ''
                    });
                }
            });

            dispatch({ type: 'LOAD_CART', payload: mergedCart });
            setIsInitialized(true);
            
            // Clear localStorage since we're now synced with Firebase
            localStorage.removeItem('cart');
            
            // Save merged cart to Firebase
            if (mergedCart.length > 0) {
                overwriteFirebaseCartFromItems(user.uid, mergedCart).catch(error => {
                    console.error('Error saving merged cart to Firebase:', error);
                });
            }
        });
        return () => off();
    }, [user, user?.uid]);



    const addToCart = async (item: ProductType): Promise<boolean> => {
        console.log('Adding to cart:', item, 'User logged in:', !!user);
        // Add to cart regardless of login status
        dispatch({ type: 'ADD_TO_CART', payload: item });
        
        // Save to Firebase only for authenticated users
        if (user) {
            try {
                await addOrUpdateFirebaseCartItem(user.uid, item, 1, '', '');
                return true;
            } catch (e) {
                console.error('Error saving to Firebase:', e);
                return false;
            }
        }
        
        // For non-logged in users, cart is saved to localStorage via useEffect
        return true;
    };

    const removeFromCart = (itemId: string) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
        
        // Save to Firebase for authenticated users
        if (user) {
            (async () => {
                try {
                    await removeFirebaseCartItem(user.uid, itemId);
                } catch (e) {
                    console.error('Error removing from Firebase:', e);
                }
            })();
        }
    };

    const updateCart = (itemId: string, quantity: number, selectedSize: string, selectedColor: string) => {
        dispatch({ type: 'UPDATE_CART', payload: { itemId, quantity, selectedSize, selectedColor } });
        
        // Save to Firebase for authenticated users
        if (user) {
            (async () => {
                try {
                    await updateFirebaseCartItemFields(user.uid, itemId, { quantity, selectedSize, selectedColor });
                } catch (e) {
                    console.error('Error updating Firebase:', e);
                }
            })();
        }
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
        
        // Clear Firebase cart for authenticated users
        if (user) {
            (async () => {
                try {
                    await overwriteFirebaseCartFromItems(user.uid, []);
                } catch (e) {
                    console.error('Error clearing Firebase cart:', e);
                }
            })();
        }
    };

    return (
        <CartContext.Provider value={{ cartState, addToCart, removeFromCart, updateCart, clearCart, requireLogin }}>
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
