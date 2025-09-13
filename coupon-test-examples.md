# Coupon System Test Examples

## Your Database Coupons

### 1. Percentage Coupon (50OFF)
```json
{
  "code": "50OFF",
  "discountType": "percentage",
  "discountValue": 43,
  "isActive": true,
  "minOrderAmount": 498,
  "perUserLimit": 1,
  "totalQuantity": 1000,
  "usageCount": 0,
  "usageLimit": 1,
  "validFrom": "2025-09-03T18:30:00.000Z",
  "validTo": "2025-09-29T18:30:00.000Z"
}
```
**Expected Behavior:**
- ✅ 43% discount on order
- ✅ Minimum order: ₹498
- ✅ Usage limit: 1 per user
- ✅ Valid until: Sep 29, 2025

### 2. Fixed Amount Coupon (2000FREE)
```json
{
  "code": "2000FREE",
  "discountType": "fixed",
  "discountValue": 1998,
  "isActive": true,
  "minOrderAmount": 496,
  "perUserLimit": 1,
  "totalQuantity": 1000,
  "usageCount": 0,
  "usageLimit": 1,
  "validFrom": "2025-09-02T18:30:00.000Z",
  "validTo": "2025-09-29T18:30:00.000Z"
}
```
**Expected Behavior:**
- ✅ ₹1998 fixed discount
- ✅ Minimum order: ₹496
- ✅ Usage limit: 1 per user
- ✅ Valid until: Sep 29, 2025

### 3. Free Shipping Coupon (SHIPPING100)
```json
{
  "code": "SHIPPING100",
  "discountType": "free_shipping",
  "discountValue": 0,
  "isActive": true,
  "minOrderAmount": 500,
  "perUserLimit": 11,
  "totalQuantity": 1000,
  "usageCount": 0,
  "usageLimit": 11,
  "validFrom": "2025-09-12T18:30:00.000Z",
  "validTo": "2025-09-29T18:30:00.000Z"
}
```
**Expected Behavior:**
- ✅ Free shipping (₹0 shipping cost)
- ✅ Minimum order: ₹500
- ✅ Usage limit: 11 per user
- ✅ Valid until: Sep 29, 2025

## Error Handling Tests

### Test Cases:
1. **Invalid Code**: "INVALID" → "Coupon not found"
2. **Inactive Coupon**: `isActive: false` → "Coupon inactive"
3. **Expired Coupon**: Past `validTo` date → "Coupon has expired"
4. **Future Coupon**: Before `validFrom` date → "Coupon not yet valid"
5. **Low Order**: Order < `minOrderAmount` → "Minimum spend is ₹X"
6. **Usage Exceeded**: `usageCount >= usageLimit` → "Coupon usage limit exceeded"
7. **Total Exceeded**: `usageCount >= totalQuantity` → "Coupon total quantity exceeded"

## Console Debug Output
When applying coupons, you'll see detailed logs:
- Coupon data structure
- Validation steps
- Discount calculations
- Success/failure reasons
