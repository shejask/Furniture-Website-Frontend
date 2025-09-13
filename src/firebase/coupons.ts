'use client'

import { get, ref } from 'firebase/database';
import { database } from './config';

export interface CouponRecord {
    id: string;
    code: string;
    title?: string;
    description?: string;
    type?: 'fixed' | 'percent' | 'free_shipping';
    status?: 'active' | 'inactive' | string;
    isActive?: boolean;
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
    // Primary discount type field (your database structure)
    discountType?: 'fixed' | 'percentage' | 'free_shipping';
    minOrderAmount?: number;
    // Additional fields from your database
    perUserLimit?: number;
    totalQuantity?: number;
    usageCount?: number;
    usageLimit?: number;
    validFrom?: string;
    validTo?: string;
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
    const result = { valid: false, reason: '', discount: 0, isFreeShipping: false };
    console.log('=== COUPON DEBUG START ===');
    console.log('Coupon data:', coupon);
    console.log('Subtotal:', subtotal);
    
    if (!coupon) { 
        result.reason = 'Coupon not found'; 
        console.log('❌ Coupon not found');
        return result; 
    }
    
    // Check if coupon is active (handle both isActive and status fields)
    const isActive = coupon.isActive === true || coupon.status === 'active';
    if (!isActive) { 
        result.reason = 'Coupon inactive'; 
        console.log('❌ Coupon inactive. isActive:', coupon.isActive, 'status:', coupon.status);
        return result; 
    }
    
    if (coupon.isExpired) { 
        result.reason = 'Coupon expired'; 
        console.log('❌ Coupon expired');
        return result; 
    }
    
    // Check date validity
    const now = new Date();
    if (coupon.validFrom) {
        const validFrom = new Date(coupon.validFrom);
        if (now < validFrom) {
            result.reason = 'Coupon not yet valid';
            console.log('❌ Coupon not yet valid. Valid from:', validFrom);
            return result;
        }
    }
    if (coupon.validTo) {
        const validTo = new Date(coupon.validTo);
        if (now > validTo) {
            result.reason = 'Coupon has expired';
            console.log('❌ Coupon has expired. Valid until:', validTo);
            return result;
        }
    }
    
    // Check minimum spend requirements
    const minSpend = typeof coupon.minSpend === 'number' ? coupon.minSpend : 
                     typeof coupon.minOrderAmount === 'number' ? coupon.minOrderAmount : 0;
    console.log('Min spend required:', minSpend);
    if (subtotal < minSpend) { 
        result.reason = `Minimum spend is ₹${minSpend}`; 
        console.log('❌ Minimum spend not met. Required:', minSpend, 'Current:', subtotal);
        return result; 
    }
    
    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount && coupon.usageCount >= coupon.usageLimit) {
        result.reason = 'Coupon usage limit exceeded';
        console.log('❌ Usage limit exceeded. Used:', coupon.usageCount, 'Limit:', coupon.usageLimit);
        return result;
    }
    
    if (coupon.totalQuantity && coupon.usageCount && coupon.usageCount >= coupon.totalQuantity) {
        result.reason = 'Coupon total quantity exceeded';
        console.log('❌ Total quantity exceeded. Used:', coupon.usageCount, 'Total:', coupon.totalQuantity);
        return result;
    }

    // Handle free shipping coupons
    const isFreeShippingCoupon = coupon.type === 'free_shipping' || coupon.discountType === 'free_shipping';
    console.log('Is free shipping coupon:', isFreeShippingCoupon);
    console.log('Coupon type:', coupon.type);
    console.log('Coupon discountType:', coupon.discountType);
    
    if (isFreeShippingCoupon) {
        result.valid = true;
        result.discount = 0; // No discount on subtotal
        result.isFreeShipping = true;
        console.log('✅ Free shipping coupon applied');
        console.log('=== COUPON DEBUG END ===');
        return result;
    }

    // Handle regular discount coupons (percentage and fixed)
    const discountType = coupon.discountType || coupon.type;
    const discountValue = coupon.discountValue || parseDiscountAmount(coupon);
    
    console.log('Discount type:', discountType);
    console.log('Discount value:', discountValue);
    
    if (discountValue <= 0) { 
        result.reason = 'Invalid coupon value'; 
        console.log('❌ Invalid coupon value:', discountValue);
        return result; 
    }

    let discount = 0;
    if (discountType === 'percentage' || discountType === 'percent') {
        discount = Math.floor((subtotal * discountValue) / 100);
        console.log('Percentage discount calculated:', discount, 'from', discountValue + '%');
    } else if (discountType === 'fixed') {
        discount = discountValue;
        console.log('Fixed discount applied:', discount);
    } else {
        result.reason = 'Invalid discount type';
        console.log('❌ Invalid discount type:', discountType);
        return result;
    }
    
    // Ensure discount doesn't exceed subtotal
    discount = Math.max(0, Math.min(subtotal, discount));
    console.log('Final discount amount:', discount);

    result.valid = true;
    result.discount = discount;
    result.isFreeShipping = false;
    console.log('✅ Discount coupon applied successfully');
    console.log('=== COUPON DEBUG END ===');
    return result;
};


