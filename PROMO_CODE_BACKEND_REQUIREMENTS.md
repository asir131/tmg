# Promo Code Feature - Backend Implementation Requirements

## Document Version
- **Version:** 1.0
- **Date:** January 22, 2026
- **Frontend Implementation:** Completed
- **Backend Implementation:** Required

---

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Validation Logic](#validation-logic)
5. [Integration Points](#integration-points)
6. [Error Handling](#error-handling)
7. [Testing Requirements](#testing-requirements)
8. [Security Considerations](#security-considerations)

---

## Overview

The promo code feature allows users to apply discount codes during:
1. **Single Competition Purchase** (Buy Now flow)
2. **Cart Checkout** (Multiple competitions)

### Key Features
- Promo codes are optional
- Codes are case-insensitive (frontend converts to uppercase)
- Discounts can be percentage-based or fixed amount
- Codes can have usage limits and expiration dates
- Codes can be competition-specific or site-wide

---

## Database Schema

### New Table: `promo_codes`

```sql
CREATE TABLE promo_codes (
  _id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  
  -- Usage Constraints
  max_uses INT DEFAULT NULL,                    -- NULL = unlimited
  used_count INT DEFAULT 0,
  max_uses_per_user INT DEFAULT 1,
  
  -- Date Constraints
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  
  -- Application Scope
  is_site_wide BOOLEAN DEFAULT true,
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Competition Restrictions (optional)
  applicable_competition_ids JSON DEFAULT NULL,  -- Array of competition IDs or NULL for all
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_active_dates (is_active, valid_from, valid_until),
  INDEX idx_used_count (used_count, max_uses)
);
```

### New Table: `promo_code_usage`

Track individual uses of promo codes:

```sql
CREATE TABLE promo_code_usage (
  _id VARCHAR(255) PRIMARY KEY,
  promo_code_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  payment_intent_id VARCHAR(255) NOT NULL,
  
  -- Usage Details
  discount_amount DECIMAL(10, 2) NOT NULL,
  original_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,
  
  -- Competition Info (for single purchases)
  competition_id VARCHAR(255) DEFAULT NULL,
  
  -- Timestamps
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(_id),
  FOREIGN KEY (user_id) REFERENCES users(_id),
  INDEX idx_user_promo (user_id, promo_code_id),
  INDEX idx_payment_intent (payment_intent_id)
);
```

---

## API Endpoints

### 1. Single Purchase with Promo Code

**Endpoint:** `POST /api/v1/payments/create-intent/single`

**Request Body (Modified):**
```json
{
  "competition_id": "string",
  "quantity": number,
  "answer": "string",
  "promo_code": "string (optional)"
}
```

**Response (Modified):**
```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "payment_intent_id": "string",
    "checkout_url": "string",
    "amount": number,
    "currency": "GBP",
    "original_amount": number,            // NEW
    "promo_discount": number,             // NEW (0 if no promo applied)
    "promo_code_applied": "string | null" // NEW
  }
}
```

### 2. Checkout with Promo Code

**Endpoint:** `POST /api/v1/payments/create-intent/checkout`

**Request Body (Modified):**
```json
{
  "points_to_redeem": number,
  "promo_code": "string (optional)"
}
```

**Response (Modified):**
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
    "discount_amount": number,           // Points discount
    "points_redeemed": number,
    "promo_discount": number,            // NEW
    "promo_code_applied": "string | null" // NEW
  }
}
```

### 3. Admin Endpoints (Required for Management)

#### Create Promo Code
**Endpoint:** `POST /api/v1/admin/promo-codes`
```json
{
  "code": "SUMMER2026",
  "description": "Summer Sale 2026",
  "discount_type": "percentage",
  "discount_value": 20,
  "max_uses": 100,
  "max_uses_per_user": 1,
  "valid_from": "2026-06-01T00:00:00Z",
  "valid_until": "2026-08-31T23:59:59Z",
  "is_site_wide": true,
  "min_purchase_amount": 10.00,
  "applicable_competition_ids": null
}
```

#### Update Promo Code
**Endpoint:** `PUT /api/v1/admin/promo-codes/:id`

#### Delete/Deactivate Promo Code
**Endpoint:** `DELETE /api/v1/admin/promo-codes/:id`

#### List Promo Codes
**Endpoint:** `GET /api/v1/admin/promo-codes?page=1&limit=20&active=true`

#### Get Promo Code Usage Stats
**Endpoint:** `GET /api/v1/admin/promo-codes/:id/stats`

---

## Validation Logic

### Promo Code Validation Flow

When a promo code is provided, validate in this order:

1. **Code Existence Check**
   ```javascript
   const promoCode = await PromoCode.findOne({ 
     code: codeInput.toUpperCase().trim() 
   });
   if (!promoCode) {
     throw new Error('Invalid promo code');
   }
   ```

2. **Active Status Check**
   ```javascript
   if (!promoCode.is_active) {
     throw new Error('This promo code is no longer active');
   }
   ```

3. **Date Validity Check**
   ```javascript
   const now = new Date();
   if (now < promoCode.valid_from) {
     throw new Error('This promo code is not yet valid');
   }
   if (now > promoCode.valid_until) {
     throw new Error('This promo code has expired');
   }
   ```

4. **Usage Limit Check**
   ```javascript
   if (promoCode.max_uses !== null && promoCode.used_count >= promoCode.max_uses) {
     throw new Error('This promo code has reached its maximum usage limit');
   }
   ```

5. **Per-User Usage Check**
   ```javascript
   const userUsageCount = await PromoCodeUsage.countDocuments({
     promo_code_id: promoCode._id,
     user_id: userId
   });
   
   if (userUsageCount >= promoCode.max_uses_per_user) {
     throw new Error('You have already used this promo code the maximum number of times');
   }
   ```

6. **Minimum Purchase Amount Check**
   ```javascript
   if (cartTotal < promoCode.min_purchase_amount) {
     throw new Error(`Minimum purchase amount of £${promoCode.min_purchase_amount} required for this promo code`);
   }
   ```

7. **Competition Applicability Check** (for single purchases)
   ```javascript
   if (!promoCode.is_site_wide && promoCode.applicable_competition_ids) {
     if (!promoCode.applicable_competition_ids.includes(competitionId)) {
       throw new Error('This promo code is not valid for this competition');
     }
   }
   ```

8. **Calculate Discount**
   ```javascript
   let discount = 0;
   if (promoCode.discount_type === 'percentage') {
     discount = (cartTotal * promoCode.discount_value) / 100;
   } else if (promoCode.discount_type === 'fixed') {
     discount = promoCode.discount_value;
   }
   
   // Ensure discount doesn't exceed cart total
   discount = Math.min(discount, cartTotal);
   ```

### Discount Calculation Order

**Important:** Apply discounts in this order:
1. **Points discount** (if using loyalty points)
2. **Promo code discount** (applied to remaining amount after points)

Example:
```javascript
const originalAmount = 100.00;
const pointsDiscount = 10.00;  // User redeems 1000 points
const amountAfterPoints = originalAmount - pointsDiscount;  // 90.00

// Apply promo code to remaining amount
let promoDiscount = 0;
if (promoCode) {
  if (promoCode.discount_type === 'percentage') {
    promoDiscount = (amountAfterPoints * promoCode.discount_value) / 100;
  } else {
    promoDiscount = Math.min(promoCode.discount_value, amountAfterPoints);
  }
}

const finalAmount = amountAfterPoints - promoDiscount;
```

---

## Integration Points

### 1. Single Purchase Flow

**File:** `controllers/paymentController.js` or similar

**Function:** `createSinglePurchaseIntent`

```javascript
async function createSinglePurchaseIntent(req, res) {
  const { competition_id, quantity, answer, promo_code } = req.body;
  const userId = req.user._id;
  
  // Existing validation...
  const competition = await Competition.findById(competition_id);
  const originalAmount = competition.ticket_price * quantity;
  
  let promoDiscount = 0;
  let promoCodeApplied = null;
  
  // NEW: Promo code validation and discount calculation
  if (promo_code) {
    const validationResult = await validateAndCalculatePromoDiscount(
      promo_code,
      originalAmount,
      userId,
      competition_id
    );
    
    if (validationResult.valid) {
      promoDiscount = validationResult.discount;
      promoCodeApplied = promo_code;
    } else {
      // Return error or ignore silently based on requirements
      return res.status(400).json({
        success: false,
        message: validationResult.error
      });
    }
  }
  
  const finalAmount = originalAmount - promoDiscount;
  
  // Create payment intent with Cashflows
  const paymentIntent = await createCashflowsPaymentIntent({
    amount: finalAmount,
    metadata: {
      competition_id,
      quantity,
      answer,
      promo_code: promoCodeApplied,
      promo_discount: promoDiscount,
      original_amount: originalAmount
    }
  });
  
  // Record promo code usage (mark as pending until payment succeeds)
  if (promoCodeApplied) {
    await recordPromoCodeUsage({
      promo_code: promoCodeApplied,
      user_id: userId,
      payment_intent_id: paymentIntent.id,
      discount_amount: promoDiscount,
      original_amount: originalAmount,
      final_amount: finalAmount,
      competition_id
    });
  }
  
  return res.json({
    success: true,
    data: {
      payment_intent_id: paymentIntent.id,
      checkout_url: paymentIntent.checkout_url,
      amount: finalAmount,
      currency: 'GBP',
      original_amount: originalAmount,
      promo_discount: promoDiscount,
      promo_code_applied: promoCodeApplied
    }
  });
}
```

### 2. Checkout Flow

**Function:** `createCheckoutIntent`

```javascript
async function createCheckoutIntent(req, res) {
  const { points_to_redeem, promo_code } = req.body;
  const userId = req.user._id;
  
  // Get user's cart
  const cart = await Cart.findOne({ user_id: userId }).populate('cart_items');
  const cartTotal = cart.summary.total_price;
  
  // Apply points discount first
  const pointsDiscount = calculatePointsDiscount(points_to_redeem);
  const amountAfterPoints = cartTotal - pointsDiscount;
  
  let promoDiscount = 0;
  let promoCodeApplied = null;
  
  // Apply promo code to remaining amount
  if (promo_code) {
    const validationResult = await validateAndCalculatePromoDiscount(
      promo_code,
      amountAfterPoints,  // Apply to amount after points
      userId,
      null  // No specific competition for cart checkout
    );
    
    if (validationResult.valid) {
      promoDiscount = validationResult.discount;
      promoCodeApplied = promo_code;
    } else {
      return res.status(400).json({
        success: false,
        message: validationResult.error
      });
    }
  }
  
  const finalAmount = amountAfterPoints - promoDiscount;
  
  // Create payment intent
  const paymentIntent = await createCashflowsPaymentIntent({
    amount: finalAmount,
    metadata: {
      cart_id: cart._id,
      points_redeemed: points_to_redeem,
      points_discount: pointsDiscount,
      promo_code: promoCodeApplied,
      promo_discount: promoDiscount,
      cart_total: cartTotal
    }
  });
  
  // Record promo code usage
  if (promoCodeApplied) {
    await recordPromoCodeUsage({
      promo_code: promoCodeApplied,
      user_id: userId,
      payment_intent_id: paymentIntent.id,
      discount_amount: promoDiscount,
      original_amount: amountAfterPoints,
      final_amount: finalAmount,
      competition_id: null
    });
  }
  
  return res.json({
    success: true,
    data: {
      payment_intent_id: paymentIntent.id,
      checkout_url: paymentIntent.checkout_url,
      amount: finalAmount,
      currency: 'GBP',
      cart_total: cartTotal,
      discount_amount: pointsDiscount,
      points_redeemed: points_to_redeem,
      promo_discount: promoDiscount,
      promo_code_applied: promoCodeApplied
    }
  });
}
```

### 3. Payment Success Webhook

When payment succeeds, update promo code usage:

```javascript
async function handlePaymentSuccess(paymentIntentId) {
  // Find promo code usage record
  const usage = await PromoCodeUsage.findOne({ 
    payment_intent_id: paymentIntentId 
  });
  
  if (usage) {
    // Increment promo code used count
    await PromoCode.findByIdAndUpdate(usage.promo_code_id, {
      $inc: { used_count: 1 }
    });
    
    // Mark usage as confirmed (optional field)
    await PromoCodeUsage.findByIdAndUpdate(usage._id, {
      status: 'confirmed',
      confirmed_at: new Date()
    });
  }
}
```

### 4. Payment Failure/Cancellation

Clean up pending promo code usage:

```javascript
async function handlePaymentFailure(paymentIntentId) {
  // Remove pending promo code usage record
  await PromoCodeUsage.findOneAndDelete({ 
    payment_intent_id: paymentIntentId 
  });
}
```

---

## Error Handling

### Standard Error Responses

All promo code validation errors should return:

```json
{
  "success": false,
  "message": "Error message here",
  "code": "PROMO_CODE_ERROR"
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

---

## Testing Requirements

### Unit Tests

1. **Promo Code Validation**
   - Valid code with no restrictions
   - Expired code
   - Not yet valid code
   - Inactive code
   - Usage limit reached
   - User limit reached
   - Minimum purchase not met
   - Competition-specific code on wrong competition

2. **Discount Calculation**
   - Percentage discount
   - Fixed amount discount
   - Discount exceeding cart total
   - Discount with points redemption
   - Rounding edge cases

3. **Promo Code Usage Recording**
   - Single purchase with promo
   - Cart checkout with promo
   - Multiple users using same code
   - Same user attempting reuse

### Integration Tests

1. **End-to-End Purchase Flows**
   - Single purchase with valid promo code
   - Single purchase with invalid promo code
   - Cart checkout with valid promo code
   - Cart checkout with promo code and points
   - Payment success webhook updating usage count
   - Payment failure cleaning up usage record

2. **Admin Management**
   - Create promo code
   - Update promo code
   - Deactivate promo code
   - View usage statistics

### Test Data

Create these test promo codes:

```javascript
const testPromoCodes = [
  {
    code: 'TEST10',
    discount_type: 'percentage',
    discount_value: 10,
    is_site_wide: true,
    valid_from: '2026-01-01',
    valid_until: '2026-12-31'
  },
  {
    code: 'SAVE5',
    discount_type: 'fixed',
    discount_value: 5.00,
    is_site_wide: true,
    valid_from: '2026-01-01',
    valid_until: '2026-12-31'
  },
  {
    code: 'ONEUSE',
    discount_type: 'percentage',
    discount_value: 20,
    max_uses_per_user: 1,
    is_site_wide: true,
    valid_from: '2026-01-01',
    valid_until: '2026-12-31'
  },
  {
    code: 'EXPIRED',
    discount_type: 'percentage',
    discount_value: 50,
    is_site_wide: true,
    valid_from: '2025-01-01',
    valid_until: '2025-12-31'
  }
];
```

---

## Security Considerations

### 1. Input Validation
- Sanitize promo code input (remove special characters except alphanumeric and hyphens)
- Convert to uppercase for case-insensitive matching
- Limit length to prevent abuse (max 50 characters)

### 2. Rate Limiting
- Implement rate limiting on promo code validation attempts
- Suggested: 10 attempts per minute per user
- Prevents brute force attempts to guess valid codes

### 3. Logging
- Log all promo code validation attempts (success and failure)
- Track IP addresses for suspicious activity
- Alert on unusual patterns (e.g., same code tried 100 times)

### 4. Atomicity
- Use database transactions when applying promo codes
- Ensure usage count increment and payment creation are atomic
- Prevent race conditions with multiple simultaneous uses

### 5. Promo Code Generation
- Use secure random generation for codes
- Avoid predictable patterns (e.g., sequential numbers)
- Consider using format like: `PREFIX-XXXX-XXXX`

---

## Additional Features (Future Enhancements)

### 1. Stacking Rules
Define whether promo codes can stack with:
- Points discounts (currently allowed)
- Other promo codes (currently not supported)
- Competition-specific discounts

### 2. User-Specific Promo Codes
- Generate unique codes for specific users
- Referral program integration
- Birthday/anniversary codes

### 3. First-Time User Codes
- Special codes only valid for users' first purchase
- Track in user profile

### 4. Analytics Dashboard
- Total revenue impact of promo codes
- Most popular codes
- Conversion rate with vs without promo codes
- Average discount per transaction

### 5. Automatic Code Application
- Apply best available code automatically
- Suggest codes at checkout based on cart contents

---

## Implementation Checklist

### Backend Team Tasks

- [ ] Create database migrations for `promo_codes` and `promo_code_usage` tables
- [ ] Implement promo code validation helper function
- [ ] Modify `createSinglePurchaseIntent` to accept and process promo codes
- [ ] Modify `createCheckoutIntent` to accept and process promo codes
- [ ] Update payment success webhook to increment usage count
- [ ] Update payment failure webhook to clean up usage records
- [ ] Create admin CRUD endpoints for promo code management
- [ ] Add promo code usage tracking endpoint
- [ ] Write unit tests for validation logic
- [ ] Write integration tests for purchase flows
- [ ] Add rate limiting for promo code validation
- [ ] Add logging for promo code attempts
- [ ] Update API documentation
- [ ] Create sample promo codes for testing
- [ ] Deploy and test in staging environment

### Time Estimate
- Database schema: 1-2 hours
- Core validation logic: 3-4 hours
- API integration: 4-6 hours
- Admin endpoints: 3-4 hours
- Testing: 4-6 hours
- Documentation: 2-3 hours
- **Total: 17-25 hours**

---

## Contact Information

For questions or clarifications, contact:
- **Frontend Team:** [Your contact info]
- **Product Manager:** [PM contact info]
- **Technical Lead:** [Lead contact info]

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-22 | Initial documentation | Frontend Team |

---

## Appendix: Example Request/Response Flows

### Example 1: Single Purchase with Promo Code

**Request:**
```http
POST /api/v1/payments/create-intent/single
Content-Type: application/json
Authorization: Bearer <token>

{
  "competition_id": "6770f3d63aa1e30f10e3e8b2",
  "quantity": 5,
  "answer": "Option A",
  "promo_code": "SAVE10"
}
```

**Response (Success):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "payment_intent_id": "pi_abc123xyz",
    "checkout_url": "https://checkout.cashflows.com/...",
    "amount": 4.50,
    "currency": "GBP",
    "original_amount": 5.00,
    "promo_discount": 0.50,
    "promo_code_applied": "SAVE10"
  }
}
```

**Response (Invalid Code):**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "message": "Invalid promo code",
  "code": "PROMO_CODE_INVALID"
}
```

### Example 2: Cart Checkout with Points and Promo Code

**Request:**
```http
POST /api/v1/payments/create-intent/checkout
Content-Type: application/json
Authorization: Bearer <token>

{
  "points_to_redeem": 1000,
  "promo_code": "WELCOME20"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Checkout intent created successfully",
  "data": {
    "payment_intent_id": "pi_xyz789abc",
    "checkout_url": "https://checkout.cashflows.com/...",
    "amount": 72.00,
    "currency": "GBP",
    "cart_total": 100.00,
    "discount_amount": 10.00,
    "points_redeemed": 1000,
    "promo_discount": 18.00,
    "promo_code_applied": "WELCOME20"
  }
}
```

**Calculation Breakdown:**
- Cart Total: £100.00
- Points Discount (1000 points): -£10.00
- Amount After Points: £90.00
- Promo Discount (20% of £90.00): -£18.00
- **Final Amount: £72.00**

---

## Summary

This document provides complete specifications for implementing promo code functionality in the backend. The frontend has been fully implemented and is ready to integrate with these backend endpoints once they are available.

**Key Points:**
1. Promo codes are optional in both purchase flows
2. Frontend sends uppercase, trimmed codes
3. Backend must validate codes and calculate discounts
4. Points discounts apply before promo code discounts
5. Usage tracking is essential for limits and analytics
6. Admin management endpoints are required for creating/managing codes

Please review this document and reach out with any questions before beginning implementation.
