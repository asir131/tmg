# Promo Code API Integration - Changes Summary

## Quick Reference: API Changes

### Single Purchase Intent

#### Before (Old)
```typescript
// Request
{
  competition_id: string;
  quantity: number;
  answer: string;  // Required
  promo_code?: string;
}

// Response
{
  payment_intent_id: string;
  checkout_url: string;
  amount: number;
  currency: string;
  promo_discount?: number;  // Optional
}
```

#### After (Following PROMO_INTEGRATION.md)
```typescript
// Request
{
  competition_id: string;
  quantity: number;
  answer?: string;  // ✅ NOW OPTIONAL
  promo_code?: string;
}

// Response
{
  payment_intent_id: string;
  checkout_url: string;
  amount: number;
  currency: string;
  original_amount: number;           // ✅ NEW
  promo_discount: number;            // ✅ NOW REQUIRED
  promo_code_applied: string | null; // ✅ NEW
  payment_job_reference: string;     // ✅ NEW
}
```

---

### Checkout Intent

#### Before (Old)
```typescript
// Request
{
  points_to_redeem: number;  // Required
  promo_code?: string;
}

// Response
{
  payment_intent_id: string;
  checkout_url: string;
  amount: number;
  currency: string;
  cart_total: number;
  discount_amount: number;
  points_redeemed: number;
  promo_discount?: number;  // Optional
}
```

#### After (Following PROMO_INTEGRATION.md)
```typescript
// Request
{
  points_to_redeem?: number;  // ✅ NOW OPTIONAL
  promo_code?: string;
}

// Response
{
  payment_intent_id: string;
  checkout_url: string;
  amount: number;
  currency: string;
  cart_total: number;
  discount_amount: number;
  points_redeemed: number;
  promo_discount: number;            // ✅ NOW REQUIRED
  promo_code_applied: string | null; // ✅ NEW
  payment_job_reference: string;     // ✅ NEW
}
```

---

## Error Handling Changes

### Before
```typescript
catch (err: any) {
  toast.error(err?.data?.message || 'Error');
  onClose(); // ❌ Always closed modal/navigated away
}
```

### After
```typescript
catch (err: any) {
  // ✅ Promo errors - Keep UI open
  if (err?.data?.code === 'PROMO_CODE_ERROR' || 
      err?.data?.message?.toLowerCase().includes('promo')) {
    setPromoError(errorMessage);
    toast.error(errorMessage);
    return; // Stay on page - let user fix
  }
  
  // ✅ Other errors - Handle appropriately
  else {
    toast.error(message);
    onClose();
  }
}
```

---

## Display Logic Changes

### Before (Checkout)
```tsx
{promoDiscount > 0 && (
  <div className="flex justify-between text-accent">
    <span>Promo Discount</span>
    <span>-£{promoDiscount.toFixed(2)}</span>
  </div>
)}
```

### After
```tsx
{checkoutResponse?.promo_discount && checkoutResponse.promo_discount > 0 && (
  <div className="flex justify-between text-green-400">
    {/* ✅ Shows the actual code name from backend */}
    <span>Promo Code Discount ({checkoutResponse.promo_code_applied})</span>
    <span>-£{checkoutResponse.promo_discount.toFixed(2)}</span>
  </div>
)}
```

---

## State Management Changes

### Before (Checkout)
```typescript
const [checkoutResponse, setCheckoutResponse] = useState<{
  discount_amount: number;
  points_redeemed: number;
  amount: number;
  promo_discount?: number;  // Optional
} | null>(null);
```

### After
```typescript
const [checkoutResponse, setCheckoutResponse] = useState<{
  discount_amount: number;
  points_redeemed: number;
  amount: number;
  promo_discount: number;            // ✅ Required
  promo_code_applied: string | null; // ✅ NEW - shows actual code
} | null>(null);
```

---

## Key Improvements

### 1. Type Safety ✅
- All response fields properly typed
- No more optional fields that should be required
- Matches backend spec exactly

### 2. Error Recovery ✅
- Promo code errors don't close modal/page
- Users can correct invalid codes
- Clear error messages displayed

### 3. User Experience ✅
- Shows actual promo code applied
- Clear discount breakdown
- No auto-redirects (time to enter code)

### 4. Backend Alignment ✅
- Request format matches exactly
- Response format matches exactly
- Error codes handled correctly

---

## Migration Notes

### If Backend Already Implemented

✅ **Ready to use** - Frontend matches backend spec

### If Backend Not Yet Implemented

⚠️ **Backend must return:**
- `original_amount` in single purchase response
- `promo_code_applied` in both responses
- `payment_job_reference` in both responses
- `promo_discount` as non-optional number (can be 0)

### Fallback Handling

If backend doesn't return new fields yet:
```typescript
const promoDiscount = response.promo_discount || 0;
const promoCodeApplied = response.promo_code_applied || null;
```

Frontend handles gracefully with `|| 0` and `|| null` operators.

---

## Testing Scenarios

### Scenario 1: Valid Promo Code
```
User Input: "SAVE10"
Backend Response: {
  original_amount: 100.00,
  promo_discount: 10.00,
  promo_code_applied: "SAVE10",
  amount: 90.00
}
Display: "Promo Code Discount (SAVE10): -£10.00"
```

### Scenario 2: Invalid Promo Code
```
User Input: "INVALID"
Backend Response: {
  success: false,
  code: "PROMO_CODE_INVALID",
  message: "Invalid promo code"
}
Display: Error message, modal/page stays open
```

### Scenario 3: No Promo Code
```
User Input: ""
Backend Response: {
  original_amount: 100.00,
  promo_discount: 0,
  promo_code_applied: null,
  amount: 100.00
}
Display: No promo section shown
```

### Scenario 4: Expired Promo Code
```
User Input: "EXPIRED10"
Backend Response: {
  success: false,
  code: "PROMO_CODE_EXPIRED",
  message: "This promo code has expired"
}
Display: Error message, modal/page stays open
```

---

## Summary of Files Changed

### 1. `src/store/api/cartApi.ts`
- Updated `createSinglePurchaseIntent` request/response types
- Updated `createCheckoutIntent` request/response types
- Made optional parameters truly optional

### 2. `src/components/SinglePurchaseModal.tsx`
- Added promo code error handling (keep modal open)
- Updated to use new response fields

### 3. `src/pages/Checkout.tsx`
- Added promo code error handling (stay on page)
- Updated state to include `promo_code_applied`
- Display actual promo code name from backend
- Show promo discount with code name

---

## Quick Comparison Table

| Aspect | Before | After |
|--------|--------|-------|
| **answer param** | Required | Optional ✅ |
| **points_to_redeem** | Required | Optional ✅ |
| **promo_discount** | Optional | Required (0 if none) ✅ |
| **original_amount** | ❌ Missing | ✅ Added |
| **promo_code_applied** | ❌ Missing | ✅ Added |
| **payment_job_reference** | ❌ Missing | ✅ Added |
| **Error handling** | Always closes | Smart handling ✅ |
| **Code display** | User input | Backend value ✅ |

---

## Verification Checklist

✅ Request types match PROMO_INTEGRATION.md
✅ Response types match PROMO_INTEGRATION.md
✅ Error handling follows best practices
✅ Promo code errors don't block checkout
✅ TypeScript types are correct
✅ No linter errors
✅ Backward compatible
✅ Documentation complete

---

**Status:** ✅ Implementation Complete & Aligned with Backend Spec
