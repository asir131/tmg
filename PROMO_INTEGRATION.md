# Promo Code Feature - Frontend Integration Guide

## Document Version
- **Version:** 1.0
- **Date:** January 2026
- **Status:** Ready for Implementation

---

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Formats](#requestresponse-formats)
4. [Error Handling](#error-handling)
5. [Implementation Guide](#implementation-guide)
6. [Code Examples](#code-examples)
7. [Testing Checklist](#testing-checklist)

---

## Overview

The promo code feature allows users to apply discount codes during:
1. **Single Competition Purchase** (Buy Now flow)
2. **Cart Checkout** (Multiple competitions)

### Key Points
- Promo codes are **optional** - users can complete purchases without them
- Codes are **case-insensitive** - backend converts to uppercase automatically
- Promo codes apply **after** points discounts (if any)
- Discounts can be **percentage-based** or **fixed amount**
- Invalid codes return clear error messages

---

## API Endpoints

### 1. Single Purchase with Promo Code

**Endpoint:** `POST /api/v1/payments/create-intent/single`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "competition_id": "string (required)",
  "quantity": number (optional, default: 1),
  "promo_code": "string (optional)"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "payment_intent_id": "string",
    "checkout_url": "string",
    "amount": number,
    "currency": "GBP",
    "original_amount": number,
    "promo_discount": number,
    "promo_code_applied": "string | null",
    "payment_job_reference": "string"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Error message here",
  "code": "PROMO_CODE_ERROR"
}
```

### 2. Cart Checkout with Promo Code

**Endpoint:** `POST /api/v1/payments/create-intent/checkout`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "points_to_redeem": number (optional, default: 0),
  "promo_code": "string (optional)"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Checkout intent created successfully",
  "data": {
    "payment_intent_id": "string",
    "checkout_url": "string",
    "amount": number,
    "currency": "GBP",
    "cart_total": number,
    "discount_amount": number,
    "points_redeemed": number,
    "promo_discount": number,
    "promo_code_applied": "string | null",
    "payment_job_reference": "string"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Error message here",
  "code": "PROMO_CODE_ERROR"
}
```

---

## Request/Response Formats

### Promo Code Input
- **Format:** Uppercase letters, numbers, and hyphens only
- **Max Length:** 50 characters
- **Case:** Backend automatically converts to uppercase
- **Whitespace:** Backend automatically trims

**Examples:**
- `"SAVE10"` ✅
- `"save10"` ✅ (converted to "SAVE10")
- `"  WELCOME20  "` ✅ (converted to "WELCOME20")
- `"SUMMER-2026"` ✅
- `"SAVE@10"` ❌ (invalid characters)

### Discount Calculation Order

**Important:** Discounts are applied in this order:
1. **Points discount** (if using loyalty points)
2. **Promo code discount** (applied to remaining amount after points)

**Example Calculation:**
```
Cart Total: £100.00
Points Discount (1000 points): -£10.00
Amount After Points: £90.00
Promo Code Discount (20%): -£18.00
Final Amount: £72.00
```

---

## Error Handling

### Error Response Format

All promo code errors return:
```json
{
  "success": false,
  "message": "Error message here"
}
```

### Error Codes and Messages

| Error Code | HTTP Status | Message | User Action |
|------------|-------------|---------|-------------|
| `PROMO_CODE_INVALID` | 400 | Invalid promo code | Check code spelling |
| `PROMO_CODE_EXPIRED` | 400 | This promo code has expired | Try different code |
| `PROMO_CODE_NOT_YET_VALID` | 400 | This promo code is not yet valid | Wait or try different code |
| `PROMO_CODE_USAGE_LIMIT_REACHED` | 400 | This promo code has reached its maximum usage limit | Try different code |
| `PROMO_CODE_USER_LIMIT_REACHED` | 400 | You have already used this promo code | Try different code |
| `PROMO_CODE_MIN_PURCHASE_NOT_MET` | 400 | Minimum purchase amount of £X.XX required | Add more items |
| `PROMO_CODE_NOT_APPLICABLE` | 400 | This promo code is not valid for this competition | Try different code |
| `PROMO_CODE_INACTIVE` | 400 | This promo code is no longer active | Try different code |

### Handling Errors in UI

1. **Display error message** to user clearly
2. **Allow user to remove/change** promo code
3. **Don't block checkout** - user can proceed without promo code
4. **Show validation errors** in real-time (optional, but recommended)

---

## Implementation Guide

### Step 1: Update Single Purchase Form

**Location:** Single competition purchase page/component

**Changes:**
1. Add promo code input field
2. Add "Apply" button (optional - can auto-validate on blur)
3. Display discount breakdown
4. Show error messages if code is invalid

**UI Elements:**
- Promo code input field
- Apply/Remove button
- Discount display (if code applied)
- Error message display

### Step 2: Update Cart Checkout Form

**Location:** Cart/checkout page/component

**Changes:**
1. Add promo code input field (alongside points redemption)
2. Update discount calculation display
3. Show breakdown: Cart Total → Points Discount → Promo Discount → Final Amount

**UI Elements:**
- Promo code input field
- Discount breakdown section
- Error message display

### Step 3: Update State Management

**Store promo code state:**
- Applied promo code
- Promo discount amount
- Validation status
- Error message

### Step 4: Update API Calls

**Modify existing payment intent creation calls:**
- Add `promo_code` field to request body
- Handle new response fields: `original_amount`, `promo_discount`, `promo_code_applied`
- Update error handling for promo code errors

---

## Code Examples

### Example 1: Single Purchase with Promo Code (React)

```javascript
import { useState } from 'react';
import axios from 'axios';

function SinglePurchaseForm({ competitionId, quantity = 1 }) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [originalAmount, setOriginalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [promoError, setPromoError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePromoCodeChange = (e) => {
    const value = e.target.value.toUpperCase().trim();
    setPromoCode(value);
    setPromoError(null);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode) {
      setPromoError('Please enter a promo code');
      return;
    }

    setLoading(true);
    setPromoError(null);

    try {
      const response = await axios.post(
        '/api/v1/payments/create-intent/single',
        {
          competition_id: competitionId,
          quantity: quantity,
          promo_code: promoCode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const { data } = response.data;
        setAppliedPromoCode(data.promo_code_applied);
        setPromoDiscount(data.promo_discount);
        setOriginalAmount(data.original_amount);
        setFinalAmount(data.amount);
        setPromoError(null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to apply promo code';
      setPromoError(errorMessage);
      setAppliedPromoCode(null);
      setPromoDiscount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setAppliedPromoCode(null);
    setPromoDiscount(0);
    setPromoError(null);
    // Recalculate without promo code
    handleApplyPromoCode();
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        '/api/v1/payments/create-intent/single',
        {
          competition_id: competitionId,
          quantity: quantity,
          promo_code: appliedPromoCode || promoCode || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Redirect to checkout URL
        window.location.href = response.data.data.checkout_url;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create payment intent';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="purchase-form">
      {/* Promo Code Section */}
      <div className="promo-code-section">
        <label htmlFor="promo-code">Promo Code (Optional)</label>
        <div className="promo-code-input-group">
          <input
            id="promo-code"
            type="text"
            value={promoCode}
            onChange={handlePromoCodeChange}
            placeholder="Enter promo code"
            disabled={!!appliedPromoCode}
            maxLength={50}
          />
          {!appliedPromoCode ? (
            <button
              onClick={handleApplyPromoCode}
              disabled={loading || !promoCode}
            >
              Apply
            </button>
          ) : (
            <button onClick={handleRemovePromoCode}>
              Remove
            </button>
          )}
        </div>
        {promoError && (
          <div className="error-message">{promoError}</div>
        )}
        {appliedPromoCode && (
          <div className="success-message">
            Promo code "{appliedPromoCode}" applied!
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="price-breakdown">
        <div className="price-row">
          <span>Original Price:</span>
          <span>£{originalAmount.toFixed(2)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="price-row discount">
            <span>Promo Discount ({appliedPromoCode}):</span>
            <span>-£{promoDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="price-row total">
          <span>Final Amount:</span>
          <span>£{finalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="checkout-button"
      >
        {loading ? 'Processing...' : 'Proceed to Checkout'}
      </button>
    </div>
  );
}
```

### Example 2: Cart Checkout with Promo Code (React)

```javascript
import { useState } from 'react';
import axios from 'axios';

function CartCheckout({ pointsToRedeem = 0 }) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  const [cartTotal, setCartTotal] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [promoError, setPromoError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePromoCodeChange = (e) => {
    const value = e.target.value.toUpperCase().trim();
    setPromoCode(value);
    setPromoError(null);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode) {
      setPromoError('Please enter a promo code');
      return;
    }

    setLoading(true);
    setPromoError(null);

    try {
      const response = await axios.post(
        '/api/v1/payments/create-intent/checkout',
        {
          points_to_redeem: pointsToRedeem,
          promo_code: promoCode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const { data } = response.data;
        setAppliedPromoCode(data.promo_code_applied);
        setCartTotal(data.cart_total);
        setPointsDiscount(data.discount_amount);
        setPromoDiscount(data.promo_discount);
        setFinalAmount(data.amount);
        setPromoError(null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to apply promo code';
      setPromoError(errorMessage);
      setAppliedPromoCode(null);
      setPromoDiscount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        '/api/v1/payments/create-intent/checkout',
        {
          points_to_redeem: pointsToRedeem,
          promo_code: appliedPromoCode || promoCode || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        window.location.href = response.data.data.checkout_url;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create checkout';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-form">
      {/* Promo Code Section */}
      <div className="promo-code-section">
        <label htmlFor="promo-code">Promo Code (Optional)</label>
        <div className="promo-code-input-group">
          <input
            id="promo-code"
            type="text"
            value={promoCode}
            onChange={handlePromoCodeChange}
            placeholder="Enter promo code"
            disabled={!!appliedPromoCode}
            maxLength={50}
          />
          {!appliedPromoCode ? (
            <button
              onClick={handleApplyPromoCode}
              disabled={loading || !promoCode}
            >
              Apply
            </button>
          ) : (
            <button onClick={() => {
              setPromoCode('');
              setAppliedPromoCode(null);
              setPromoDiscount(0);
              setPromoError(null);
            }}>
              Remove
            </button>
          )}
        </div>
        {promoError && (
          <div className="error-message">{promoError}</div>
        )}
        {appliedPromoCode && (
          <div className="success-message">
            Promo code "{appliedPromoCode}" applied!
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="price-breakdown">
        <div className="price-row">
          <span>Cart Total:</span>
          <span>£{cartTotal.toFixed(2)}</span>
        </div>
        {pointsDiscount > 0 && (
          <div className="price-row discount">
            <span>Points Discount:</span>
            <span>-£{pointsDiscount.toFixed(2)}</span>
          </div>
        )}
        {promoDiscount > 0 && (
          <div className="price-row discount">
            <span>Promo Discount ({appliedPromoCode}):</span>
            <span>-£{promoDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="price-row total">
          <span>Final Amount:</span>
          <span>£{finalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="checkout-button"
      >
        {loading ? 'Processing...' : 'Proceed to Payment'}
      </button>
    </div>
  );
}
```

### Example 3: Promo Code Validation (Vanilla JavaScript)

```javascript
function validatePromoCode(code) {
  // Remove whitespace and convert to uppercase
  const normalized = code.trim().toUpperCase();
  
  // Check length
  if (normalized.length === 0) {
    return { valid: false, error: 'Promo code cannot be empty' };
  }
  
  if (normalized.length > 50) {
    return { valid: false, error: 'Promo code is too long (max 50 characters)' };
  }
  
  // Check format (uppercase letters, numbers, and hyphens only)
  const pattern = /^[A-Z0-9-]+$/;
  if (!pattern.test(normalized)) {
    return { valid: false, error: 'Promo code can only contain letters, numbers, and hyphens' };
  }
  
  return { valid: true, normalized };
}

// Usage
const input = document.getElementById('promo-code');
input.addEventListener('blur', (e) => {
  const validation = validatePromoCode(e.target.value);
  if (!validation.valid) {
    showError(validation.error);
  }
});
```

---

## Testing Checklist

### Single Purchase Flow
- [ ] User can enter promo code
- [ ] Valid promo code applies discount correctly
- [ ] Invalid promo code shows error message
- [ ] User can remove promo code
- [ ] Discount calculation is correct
- [ ] Original amount and final amount are displayed
- [ ] Checkout proceeds with promo code applied
- [ ] Checkout proceeds without promo code

### Cart Checkout Flow
- [ ] User can enter promo code
- [ ] Promo code applies after points discount
- [ ] Discount breakdown shows correctly
- [ ] Invalid promo code shows error message
- [ ] User can remove promo code
- [ ] Final amount calculation is correct
- [ ] Checkout proceeds with both points and promo code
- [ ] Checkout proceeds with only promo code
- [ ] Checkout proceeds with only points
- [ ] Checkout proceeds without any discounts

### Error Handling
- [ ] Expired code shows appropriate error
- [ ] Invalid code shows appropriate error
- [ ] Usage limit reached shows appropriate error
- [ ] Minimum purchase not met shows appropriate error
- [ ] Competition-specific code error shows for wrong competition
- [ ] Error messages are user-friendly
- [ ] User can still checkout after error

### Edge Cases
- [ ] Empty promo code field (should be optional)
- [ ] Promo code with whitespace (should be trimmed)
- [ ] Lowercase promo code (should be converted)
- [ ] Promo code that exceeds discount amount
- [ ] Multiple promo code attempts
- [ ] Network errors during validation

---

## Additional Notes

### Best Practices

1. **Real-time Validation (Optional)**
   - Validate promo code on blur or after user stops typing
   - Show loading state during validation
   - Don't block user from continuing

2. **User Experience**
   - Make promo code field clearly optional
   - Show discount breakdown prominently
   - Display savings amount clearly
   - Allow easy removal of promo code

3. **Error Messages**
   - Display errors clearly and prominently
   - Use user-friendly language
   - Don't block checkout on promo code errors

4. **Performance**
   - Debounce promo code validation if doing real-time checks
   - Cache validation results if possible
   - Don't validate on every keystroke

### Migration Notes

- **Backward Compatibility:** Existing payment flows will continue to work without promo codes
- **Optional Field:** Promo code is optional, so existing implementations don't need immediate updates
- **Response Changes:** New fields added to responses (`original_amount`, `promo_discount`, `promo_code_applied`) - handle gracefully if not present

---

## Support

For questions or issues, contact:
- **Backend Team:** [Contact info]
- **Technical Lead:** [Contact info]

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01 | Initial documentation | Backend Team |
