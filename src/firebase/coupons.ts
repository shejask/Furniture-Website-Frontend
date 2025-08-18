'use client'

import { get, ref } from 'firebase/database';
import { database } from './config';

export interface CouponRecord {
    id: string;
    code: string;
    title?: string;
    description?: string;
    type: 'fixed' | 'percent';
    status?: 'active' | 'inactive' | string;
    isExpired?: boolean;
    isFirstOrder?: boolean;
    isUnlimited?: boolean;
    applyToAllProducts?: boolean;
    minSpend?: number;
    usagePerCoupon?: number;
    usagePerCustomer?: number;
    createdAt?: string;
    updatedAt?: string;
    // Some databases may store explicit amount fields; include common ones
    amount?: number;
    value?: number;
    discountValue?: number;
}

const parseDiscountAmount = (coupon: CouponRecord): number => {
    if (typeof coupon.amount === 'number') return coupon.amount;
    if (typeof coupon.value === 'number') return coupon.value;
    if (typeof coupon.discountValue === 'number') return coupon.discountValue;
    // Fallback: extract first number from title or code
    const fromTitle = (coupon.title || '').match(/\d+/);
    if (fromTitle && fromTitle[0]) return Number(fromTitle[0]);
    const fromCode = (coupon.code || '').match(/\d+/);
    if (fromCode && fromCode[0]) return Number(fromCode[0]);
    return 0;
};

export const getCouponByCode = async (code: string): Promise<CouponRecord | null> => {
    if (!code) return null;
    const allRef = ref(database, '/coupons');
    const snap = await get(allRef);
    if (!snap.exists()) return null;
    const obj = snap.val() as Record<string, any>;
    const list: CouponRecord[] = Object.entries(obj).map(([id, data]) => ({ id, ...data })) as any;
    const found = list.find(c => (c.code || '').toLowerCase() === code.toLowerCase());
    return found || null;
};

export const computeCouponDiscount = (
    subtotal: number,
    coupon: CouponRecord
) => {
    const result = { valid: false, reason: '', discount: 0 };
    if (!coupon) { result.reason = 'Coupon not found'; return result; }
    if (coupon.status && coupon.status !== 'active') { result.reason = 'Coupon inactive'; return result; }
    if (coupon.isExpired) { result.reason = 'Coupon expired'; return result; }
    const minSpend = typeof coupon.minSpend === 'number' ? coupon.minSpend : 0;
    if (subtotal < minSpend) { result.reason = `Minimum spend is ${minSpend}`; return result; }

    const amount = parseDiscountAmount(coupon);
    if (amount <= 0) { result.reason = 'Invalid coupon value'; return result; }

    let discount = 0;
    if (coupon.type === 'percent') {
        discount = Math.floor((subtotal * amount) / 100);
    } else {
        discount = amount;
    }
    discount = Math.max(0, Math.min(subtotal, discount));

    result.valid = true;
    result.discount = discount;
    return result;
};


