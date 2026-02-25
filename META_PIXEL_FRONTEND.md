# Meta Pixel – Main website frontend team

This doc is for the **main website** (customer-facing) frontend. It covers installing the base pixel and firing the standard events Meta needs for ads and reporting.

**Pixel ID:** `822668470196857`  
**Do not install the pixel on the admin dashboard** – only on the public site where users browse and buy.

---

## 1. Base pixel (required)

Install the base pixel so it loads on **every page** of the main website.

**Option A – Copy from repo**

- Use the snippet in **`docs/META_PIXEL_SNIPPET.html`** in this repo (it already contains Pixel ID `822668470196857`).
- Paste it into your app’s **root HTML** (e.g. `index.html`) or the root layout component that wraps all routes (e.g. inside `<head>` or just before `</body>`).

**Option B – Inline**

Add this once, in the single place that wraps the whole app:

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '822668470196857');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=822668470196857&ev=PageView&noscript=1"
alt="" /></noscript>
<!-- End Meta Pixel Code -->
```

- **PageView** is sent automatically on each full page load. If you use a SPA and want a PageView per route change, call `fbq('track', 'PageView');` again when the route changes (after the base pixel has loaded).

---

## 2. Standard events to implement

Fire these from the main website at the right user actions. Use the same Pixel ID (`822668470196857`) and standard parameter names so Meta can optimize and report correctly.

### PageView

- **When:** Already sent by the base pixel on load. Optionally fire again on each route change in your SPA.
- **Example (route change):**  
  `if (typeof fbq !== 'undefined') fbq('track', 'PageView');`

### ViewContent

- **When:** User views a competition (product) detail page.
- **Where:** Competition detail page, when the competition data is loaded.
- **Example:**

```javascript
if (typeof fbq !== 'undefined') {
  fbq('track', 'ViewContent', {
    content_type: 'product',
    content_ids: [competitionId],
    content_name: competitionTitle,
    value: ticketPrice * quantity,
    currency: 'GBP',
  });
}
```

### AddToCart

- **When:** User adds ticket(s) to cart.
- **Where:** In the handler that runs when “Add to cart” is clicked and the cart is updated.
- **Example:**

```javascript
if (typeof fbq !== 'undefined') {
  fbq('track', 'AddToCart', {
    content_type: 'product',
    content_ids: [competitionId],
    content_name: competitionTitle,
    num_items: quantity,
    value: ticketPrice * quantity,
    currency: 'GBP',
  });
}
```

### InitiateCheckout

- **When:** User starts checkout (e.g. lands on checkout page or clicks “Proceed to checkout” and you call the backend to create the checkout session).
- **Where:** Right before or after calling the backend (e.g. `POST .../payments/create-intent/single` or `.../create-intent/checkout`).
- **Example:**

```javascript
if (typeof fbq !== 'undefined') {
  fbq('track', 'InitiateCheckout', {
    content_type: 'product',
    content_ids: contentIds,
    num_items: totalQuantity,
    value: totalValue,
    currency: 'GBP',
  });
}
```

### Purchase (important for deduplication)

- **When:** User has completed payment and is on the **payment success** page (e.g. `/payment/success` with `status=succeeded`).
- **Where:** Payment success route/page, once you have confirmed success (e.g. from URL params or your API).
- **Critical:** Send **eventID** = `payment_intent_id` so Meta can deduplicate with the server-side Purchase event sent by the backend.

**Example:**

```javascript
const params = new URLSearchParams(window.location.search);
const paymentIntentId = params.get('payment_intent_id');
const status = params.get('status');

if (status === 'succeeded' && paymentIntentId && typeof fbq !== 'undefined') {
  fbq('track', 'Purchase', {
    value: orderValue,
    currency: 'GBP',
    order_id: paymentIntentId,
    content_ids: contentIds,
    content_type: 'product',
  }, { eventID: paymentIntentId });
}
```

Use the same `value`, `currency`, `order_id`, and `content_ids` as your order details. Always pass **eventID: payment_intent_id**.

---

## 3. Checklist

| Item | Where |
|------|--------|
| Base pixel + PageView | Root HTML or root layout (once per app). |
| PageView on route change | Router/route change handler (optional). |
| ViewContent | Competition detail page. |
| AddToCart | Add-to-cart action. |
| InitiateCheckout | Before/after create payment intent API call. |
| Purchase | Payment success page, with **eventID: payment_intent_id**. |

---

## 4. Verification

- **Meta Pixel Helper (Chrome):** Install from Meta’s help page. Browse the main site and go through: view competition → add to cart → checkout → purchase. Confirm the pixel loads and each event fires with no errors.
- **Events Manager:** In Meta Events Manager, open your Pixel and check **Test Events** or **Overview**. Trigger the flows above and confirm PageView, ViewContent, AddToCart, InitiateCheckout, and Purchase appear with the expected parameters.
- **Console:** Ensure there are no JavaScript errors and that `fbq` is defined when you call it.

---

## 5. Backend (for reference)

The backend also sends a server-side **Purchase** event when a payment succeeds (Conversions API). It uses the same Pixel ID and the same `event_id` (= payment_intent_id). You do not need to change the backend for the frontend; just ensure the frontend sends Purchase with **eventID: payment_intent_id** so Meta can deduplicate.

For backend configuration (env vars, service, troubleshooting), see **META_PIXEL_BACKEND.md**.
