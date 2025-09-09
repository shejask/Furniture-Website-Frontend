'use client'

import { ref, set, remove, get, update } from 'firebase/database';
import { database } from './config';
import { ProductType } from '@/type/ProductType';

interface CartItemPayload {
    id: string;
    name: string;
    price: number; // original price
    salePrice?: number; // final price used for totals
    originPrice: number;
    thumbnail: string;
    quantity: number;
    selectedSize: string;
    selectedColor: string;
    subtotal: number;
    slug?: string;
}

const buildCartItemPayload = (
    product: ProductType,
    quantity: number,
    selectedSize: string,
    selectedColor: string
): CartItemPayload => {
    const thumbnail = (product.images && product.images[0]) || (product.thumbImage && product.thumbImage[0]) || '';
    const safeQuantity = Math.max(1, quantity || 1);
    const unit = (product as any).salePrice ?? product.price;
    return {
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: (product as any).salePrice,
        originPrice: product.originPrice,
        thumbnail,
        quantity: safeQuantity,
        selectedSize: selectedSize || '',
        selectedColor: selectedColor || '',
        subtotal: unit * safeQuantity,
        slug: product.slug
    };
};

const recomputeAndSaveTotal = async (userId: string) => {
    const productsRef = ref(database, `/customers/${userId}/cart/products`);
    const snapshot = await get(productsRef);
    let total = 0;
    if (snapshot.exists()) {
        const productsObj = snapshot.val() as Record<string, CartItemPayload>;
        total = Object.values(productsObj).reduce((sum, item: any) => {
            const qty = Number(item?.quantity || 0);
            const priceToUse = item?.salePrice ?? item?.price ?? 0;
            const price = Number(priceToUse || 0);
            return sum + qty * price;
        }, 0);
    }
    const totalRef = ref(database, `/customers/${userId}/cart/total`);
    await set(totalRef, total);
    const metaRef = ref(database, `/customers/${userId}/cart/metadata`);
    await update(metaRef, { updatedAt: new Date().toISOString() });
    return total;
};

export const addOrUpdateFirebaseCartItem = async (
    userId: string,
    product: ProductType,
    quantity: number,
    selectedSize: string,
    selectedColor: string
) => {
    if (!userId) return;
    const payload = buildCartItemPayload(product, quantity, selectedSize, selectedColor);
    const itemRef = ref(database, `/customers/${userId}/cart/products/${product.id}`);
    await set(itemRef, payload);
    await recomputeAndSaveTotal(userId);
};

export const removeFirebaseCartItem = async (userId: string, productId: string) => {
    if (!userId) return;
    const itemRef = ref(database, `/customers/${userId}/cart/products/${productId}`);
    await remove(itemRef);
    await recomputeAndSaveTotal(userId);
};

export const getFirebaseCart = async (userId: string) => {
    if (!userId) return { products: {}, total: 0 };
    const productsRef = ref(database, `/customers/${userId}/cart/products`);
    const totalRef = ref(database, `/customers/${userId}/cart/total`);
    const [productsSnap, totalSnap] = await Promise.all([get(productsRef), get(totalRef)]);
    const products = productsSnap.exists() ? productsSnap.val() : {};
    const total = totalSnap.exists() ? totalSnap.val() : 0;
    return { products, total };
};

export const updateFirebaseCartItemFields = async (
    userId: string,
    productId: string,
    changes: { quantity?: number; selectedSize?: string; selectedColor?: string }
) => {
    if (!userId || !productId) return;
    const itemRef = ref(database, `/customers/${userId}/cart/products/${productId}`);
    const snap = await get(itemRef);
    if (!snap.exists()) return;
    const current = snap.val() as CartItemPayload;
    const nextQuantity = Math.max(1, changes.quantity ?? current.quantity ?? 1);
    const next: Partial<CartItemPayload> = {
        quantity: nextQuantity,
        selectedSize: changes.selectedSize ?? current.selectedSize ?? '',
        selectedColor: changes.selectedColor ?? current.selectedColor ?? '',
        subtotal: (current.price || 0) * nextQuantity
    };
    await update(itemRef, next as any);
    await recomputeAndSaveTotal(userId);
};

export const overwriteFirebaseCartFromItems = async (
    userId: string,
    items: Array<{
        product: ProductType;
        quantity: number;
        selectedSize: string;
        selectedColor: string;
    }>
) => {
    if (!userId) return;
    const productsPayload: Record<string, CartItemPayload> = {};
    let total = 0;
    for (const { product, quantity, selectedSize, selectedColor } of items) {
        const payload = buildCartItemPayload(product, quantity, selectedSize, selectedColor);
        productsPayload[payload.id] = payload;
        total += payload.subtotal;
    }
    const baseRef = ref(database, `/customers/${userId}/cart`);
    await update(baseRef, {
        products: productsPayload,
        total,
        metadata: { updatedAt: new Date().toISOString() }
    });
};


