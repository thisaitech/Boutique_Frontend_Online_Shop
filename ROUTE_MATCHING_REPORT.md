# Backend-Frontend Route Matching Report

## Summary
- **Total Backend Routes:** ~150+ endpoints
- **Matched Routes (Implement with Axios):** ~85%
- **Unmatched Routes (Do NOT implement):** ~15%

---

## MATCHED ROUTES - IMPLEMENT WITH AXIOS

### 1. AUTHENTICATION ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `POST /user/request-otp` | POST | Login.jsx | Request OTP for phone login | MATCH - Frontend has OTP flow |
| `POST /user/register` | POST | Login.jsx | User registration | MATCH - signup with phone+OTP |
| `POST /user/verify-otp` | POST | Login.jsx | Verify OTP and login | MATCH |
| `POST /user/refresh-token` | POST | GlobalContext | Token refresh | MATCH - implement in axios interceptor |
| `POST /user/logout` | POST | GlobalContext | Logout user | MATCH |

**Files to modify:** `Login.jsx`, `GlobalContext.jsx`
**Lines with mock auth:** Login.jsx:11-12 (ADMIN_CREDENTIALS), Login.jsx:13-14 (FAKE_CUSTOMER)

---

### 2. USER PROFILE ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /user/profile` | GET | Settings.jsx | Get current user profile | MATCH |
| `PUT /user/profile` | PUT | Settings.jsx | Update profile | MATCH |

**Files to modify:** `Settings.jsx`
**Lines with mock data:** GlobalContext.jsx:71-74 (demo customers)

---

### 3. WISHLIST ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /user/wishlist` | GET | Wishlist.jsx | Get user's wishlist | MATCH |
| `POST /user/wishlist` | POST | ProductDetail.jsx, ProductCard.jsx | Add to wishlist | MATCH |
| `DELETE /user/wishlist/:productId` | DELETE | Wishlist.jsx | Remove from wishlist | MATCH |

**Files to modify:** `Wishlist.jsx`, `ProductDetail.jsx`, `ProductCard.jsx`
**Current storage:** localStorage `thisai_wishlist`

---

### 4. CART ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /user/cart` | GET | CartDrawer.jsx, Checkout.jsx | Get user's cart | MATCH |
| `POST /user/cart` | POST | ProductDetail.jsx, ProductCard.jsx | Add to cart | MATCH |
| `PATCH /user/cart` | PATCH | CartDrawer.jsx | Update quantity | MATCH |
| `DELETE /user/cart/:productId` | DELETE | CartDrawer.jsx | Remove from cart | MATCH |
| `DELETE /user/cart` | DELETE | Checkout.jsx | Clear cart after order | MATCH |

**Files to modify:** `CartDrawer.jsx`, `Checkout.jsx`, `ProductDetail.jsx`, `ProductCard.jsx`
**Lines:** GlobalContext.jsx:162-188 (cart actions)

---

### 5. ADDRESS ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /user/addresses` | GET | Settings.jsx, Checkout.jsx | Get addresses | MATCH |
| `POST /user/addresses` | POST | Settings.jsx, Checkout.jsx | Add address | MATCH |
| `PUT /user/addresses/:addressId` | PUT | Settings.jsx | Update address | MATCH |
| `DELETE /user/addresses/:addressId` | DELETE | Settings.jsx | Delete address | MATCH |
| `PATCH /user/addresses/:addressId/default` | PATCH | Settings.jsx | Set default | MATCH |

**Files to modify:** `Settings.jsx`, `Checkout.jsx`

---

### 6. REVIEW ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `POST /user/reviews` | POST | Review.jsx, ReviewModal.jsx | Submit review | MATCH |
| `GET /user/reviews` | GET | Orders.jsx (my reviews) | Get my reviews | MATCH |
| `GET /user/reviews/product/:productId` | GET | ProductDetail.jsx | Get product reviews | MATCH (public) |
| `PUT /user/reviews/:reviewId` | PUT | Review.jsx | Update review | MATCH |
| `DELETE /user/reviews/:reviewId` | DELETE | Review.jsx | Delete review | MATCH |

**Files to modify:** `Review.jsx`, `ReviewModal.jsx`, `ProductDetail.jsx`, `Orders.jsx`
**Lines with mock:** Review.jsx (predefinedStatements)

---

### 7. BOOKING/APPOINTMENT ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /user/bookings/services` | GET | Service.jsx | Get service types | MATCH (public) |
| `GET /user/bookings/slots/:date` | GET | Service.jsx | Get available slots | MATCH (public) |
| `POST /user/bookings/guest` | POST | Service.jsx | Guest booking | MATCH |
| `POST /user/bookings` | POST | Service.jsx | Authenticated booking | MATCH |
| `GET /user/bookings` | GET | Orders.jsx (or new page) | Get my bookings | MATCH |
| `DELETE /user/bookings/:bookingId` | DELETE | Service.jsx | Cancel booking | MATCH |

**Files to modify:** `Service.jsx`
**Lines with mock:** siteConfig.js:201-207 (serviceTypes)

---

### 8. CONTACT MESSAGE ROUTE

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `POST /user/contact` | POST | Contact.jsx | Submit contact form | MATCH |

**Files to modify:** `Contact.jsx`

---

### 9. ORDER ROUTES (Customer)

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `POST /user/orders` | POST | Checkout.jsx | Place order | MATCH |
| `GET /user/orders` | GET | Orders.jsx | Get my orders | MATCH |
| `GET /user/orders/:orderId` | GET | Orders.jsx | Get order detail | MATCH |
| `DELETE /user/orders/:orderId` | DELETE | Orders.jsx | Cancel order | MATCH |

**Files to modify:** `Checkout.jsx`, `Orders.jsx`

---

### 10. ADMIN PRODUCT ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `POST /admin/products` | POST | AddProduct.jsx | Create product | MATCH |
| `GET /admin/products` | GET | Inventory.jsx, Home, Shop, etc | Get all products | MATCH |
| `GET /admin/products/:id` | GET | EditProduct.jsx, ProductDetail.jsx | Get single product | MATCH |
| `PUT /admin/products/:id` | PUT | EditProduct.jsx | Update product | MATCH |
| `DELETE /admin/products/:id` | DELETE | Inventory.jsx | Delete product | MATCH |
| `GET /admin/products/category/:category` | GET | Women.jsx, Kids.jsx, Fashion.jsx | Filter by category | MATCH |
| `GET /admin/products/filter/featured` | GET | FeaturedProducts.jsx, Home.jsx | Get featured | MATCH |
| `PUT /admin/products/filter/featured` | PUT | FeaturedProducts.jsx | Update featured | MATCH |
| `GET /admin/products/filter/top-selling` | GET | Home.jsx | Get top sellers | MATCH |

**Files to modify:** All inventory pages, product pages, Home.jsx
**Lines with mock:** products.js (entire file - 300+ products)

---

### 11. ADMIN ORDER ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /admin/orders` | GET | admin/Orders.jsx | Get all orders | MATCH |
| `GET /admin/orders/statistics` | GET | Overview.jsx | Order stats | MATCH |
| `GET /admin/orders/recent` | GET | Overview.jsx | Recent orders | MATCH |
| `GET /admin/orders/:id` | GET | admin/Orders.jsx | Single order | MATCH |
| `PATCH /admin/orders/:id/status` | PATCH | admin/Orders.jsx | Update status | MATCH |
| `PATCH /admin/orders/:id/payment` | PATCH | admin/Orders.jsx | Update payment | MATCH |
| `PUT /admin/orders/:id/confirm` | PUT | admin/Orders.jsx | Confirm order | MATCH |
| `PUT /admin/orders/:id/cancel` | PUT | admin/Orders.jsx | Cancel order | MATCH |
| `DELETE /admin/orders/:id` | DELETE | admin/Orders.jsx | Delete order | MATCH |

**Files to modify:** `admin/Orders.jsx`, `Overview.jsx`

---

### 12. ADMIN CUSTOMER ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /admin/customers` | GET | Customers.jsx | List customers | MATCH |
| `GET /admin/customers/statistics` | GET | Overview.jsx | Customer stats | MATCH |
| `GET /admin/customers/:id` | GET | Customers.jsx | Customer detail | MATCH |
| `PUT /admin/customers/:id` | PUT | Customers.jsx | Update customer | MATCH |
| `PATCH /admin/customers/:id/status` | PATCH | Customers.jsx | Toggle active | MATCH |
| `DELETE /admin/customers/:id` | DELETE | Customers.jsx | Delete customer | MATCH |

**Files to modify:** `admin/Customers.jsx`

---

### 13. ADMIN MESSAGE ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /admin/messages` | GET | Messages.jsx | Get all messages | MATCH |
| `GET /admin/messages/statistics` | GET | Overview.jsx | Message stats | MATCH |
| `GET /admin/messages/unread` | GET | AdminDashboard.jsx | Unread count | MATCH |
| `GET /admin/messages/:id` | GET | Messages.jsx | Single message | MATCH |
| `POST /admin/messages/:id/reply` | POST | Messages.jsx | Reply to message | MATCH |
| `PATCH /admin/messages/:id/status` | PATCH | Messages.jsx | Update status | MATCH |
| `DELETE /admin/messages/:id` | DELETE | Messages.jsx | Delete message | MATCH |

**Files to modify:** `admin/Messages.jsx`

---

### 14. ADMIN REVIEW ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /admin/reviews` | GET | admin/Reviews.jsx | Get all reviews | MATCH |
| `GET /admin/reviews/statistics` | GET | Overview.jsx | Review stats | MATCH |
| `GET /admin/reviews/pending` | GET | admin/Reviews.jsx | Pending reviews | MATCH |
| `GET /admin/reviews/product/:productId` | GET | admin/Reviews.jsx | Product reviews | MATCH |
| `PATCH /admin/reviews/:id/moderate` | PATCH | admin/Reviews.jsx | Approve/reject | MATCH |
| `PUT /admin/reviews/:id/approve` | PUT | admin/Reviews.jsx | Quick approve | MATCH |
| `PUT /admin/reviews/:id/reject` | PUT | admin/Reviews.jsx | Quick reject | MATCH |
| `DELETE /admin/reviews/:id` | DELETE | admin/Reviews.jsx | Delete review | MATCH |

**Files to modify:** `admin/Reviews.jsx`

---

### 15. ADMIN BOOKING ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /admin/bookings` | GET | Bookings.jsx | Get all bookings | MATCH |
| `GET /admin/bookings/statistics` | GET | Overview.jsx | Booking stats | MATCH |
| `GET /admin/bookings/today` | GET | Bookings.jsx | Today's bookings | MATCH |
| `GET /admin/bookings/upcoming` | GET | Bookings.jsx | Upcoming bookings | MATCH |
| `POST /admin/bookings/check-availability` | POST | Bookings.jsx | Check slots | MATCH |
| `GET /admin/bookings/:id` | GET | Bookings.jsx | Single booking | MATCH |
| `PUT /admin/bookings/:id` | PUT | Bookings.jsx | Update booking | MATCH |
| `PATCH /admin/bookings/:id/status` | PATCH | Bookings.jsx | Update status | MATCH |
| `PUT /admin/bookings/:id/confirm` | PUT | Bookings.jsx | Confirm | MATCH |
| `PUT /admin/bookings/:id/complete` | PUT | Bookings.jsx | Complete | MATCH |
| `PUT /admin/bookings/:id/cancel` | PUT | Bookings.jsx | Cancel | MATCH |
| `PATCH /admin/bookings/:id/reschedule` | PATCH | Bookings.jsx | Reschedule | MATCH |
| `DELETE /admin/bookings/:id` | DELETE | Bookings.jsx | Delete | MATCH |

**Files to modify:** `admin/Bookings.jsx`

---

### 16. ADMIN SITE CONFIG ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /admin/site-config` | GET | SiteContent.jsx | Get full config | MATCH |
| `GET /admin/site-config/public` | GET | Home.jsx, About.jsx, Contact.jsx | Public config | MATCH |
| `PUT /admin/site-config` | PUT | SiteContent.jsx | Update config | MATCH |
| `GET /admin/site-config/banners` | GET | SiteContent.jsx, Home.jsx | Get banners | MATCH |
| `PUT /admin/site-config/banners` | PUT | SiteContent.jsx | Update banners | MATCH |
| `POST /admin/site-config/banners` | POST | SiteContent.jsx | Add banner | MATCH |
| `DELETE /admin/site-config/banners/:id` | DELETE | SiteContent.jsx | Remove banner | MATCH |
| `GET /admin/site-config/delivery` | GET | SiteContent.jsx | Get delivery settings | MATCH |
| `PUT /admin/site-config/delivery` | PUT | SiteContent.jsx | Update delivery | MATCH |
| `GET /admin/site-config/promo-cards` | GET | Women.jsx, Kids.jsx, Fashion.jsx | Get promo cards | MATCH |
| `PUT /admin/site-config/promo-cards` | PUT | SiteContent.jsx | Update promo cards | MATCH |

**Files to modify:** `admin/SiteContent.jsx`, `Home.jsx`, `About.jsx`, `Contact.jsx`, `Service.jsx`
**Lines with mock:** siteConfig.js (entire file)

---

### 17. ADMIN DASHBOARD ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `GET /admin/dashboard/overview` | GET | Overview.jsx | Dashboard stats | MATCH |
| `GET /admin/dashboard/sales` | GET | Overview.jsx, Revenue.jsx | Sales analytics | MATCH |
| `GET /admin/dashboard/products` | GET | Overview.jsx | Product analytics | MATCH |
| `GET /admin/dashboard/customers` | GET | Overview.jsx | Customer analytics | MATCH |
| `GET /admin/dashboard/recent-activity` | GET | Overview.jsx | Activity feed | MATCH |
| `GET /admin/dashboard/quick-stats` | GET | AdminDashboard.jsx | Badge counts | MATCH |

**Files to modify:** `admin/Overview.jsx`, `admin/Revenue.jsx`, `AdminDashboard.jsx`
**Lines with mock:** Overview.jsx (salesData hardcoded)

---

### 18. ADMIN ADVERTISEMENT ROUTES

| Backend Route | HTTP | Frontend Page | Frontend Action | Notes |
|--------------|------|---------------|-----------------|-------|
| `POST /admin/advertisements` | POST | Advertisements.jsx | Create ad | MATCH |
| `GET /admin/advertisements` | GET | Advertisements.jsx | Get all ads | MATCH |
| `GET /admin/advertisements/active` | GET | Home.jsx (if used) | Active ads | MATCH |
| `GET /admin/advertisements/:id` | GET | Advertisements.jsx | Single ad | MATCH |
| `PUT /admin/advertisements/:id` | PUT | Advertisements.jsx | Update ad | MATCH |
| `PATCH /admin/advertisements/:id/status` | PATCH | Advertisements.jsx | Toggle status | MATCH |
| `DELETE /admin/advertisements/:id` | DELETE | Advertisements.jsx | Delete ad | MATCH |

**Files to modify:** `admin/Advertisements.jsx`

---

## UNMATCHED ROUTES - DO NOT IMPLEMENT

These backend routes have no corresponding frontend functionality:

### Backend-Only Routes (No Frontend Match)

| Backend Route | HTTP | Reason Not Matched |
|--------------|------|-------------------|
| `POST /auth/signup` | POST | Different auth module - frontend uses /user endpoints |
| `POST /auth/login` | POST | Frontend uses phone+OTP via /user endpoints |
| `POST /auth/refresh` | POST | Frontend should use /user/refresh-token |
| `GET /admin/orders/customer/:customerId` | GET | No specific customer order view in frontend |
| `GET /admin/orders/number/:orderNumber` | GET | Frontend uses order ID, not order number |
| `POST /admin/orders` | POST | Admin doesn't create orders manually (customers do) |
| `POST /admin/customers` | POST | No admin customer creation in frontend |
| `POST /admin/customers/:id/addresses` | POST | Customer manages own addresses |
| `DELETE /admin/customers/:id/addresses/:addressId` | DELETE | Customer manages own addresses |
| `PATCH /admin/customers/:id/loyalty-points` | PATCH | No loyalty points feature in frontend |
| `PUT /admin/customers/:id/activate` | PUT | Use PATCH status instead |
| `PUT /admin/customers/:id/deactivate` | PUT | Use PATCH status instead |
| `PATCH /admin/messages/:id/priority` | PATCH | No priority feature in frontend |
| `PATCH /admin/messages/:id/assign` | PATCH | No assignment feature in frontend |
| `PUT /admin/messages/:id/star` | PUT | No star feature in frontend |
| `PUT /admin/messages/:id/resolve` | PUT | Use PATCH status instead |
| `PUT /admin/messages/:id/spam` | PUT | No spam marking in frontend |
| `PUT /admin/messages/bulk` | PUT | No bulk operations in frontend |
| `DELETE /admin/messages/bulk` | DELETE | No bulk delete in frontend |
| `POST /admin/reviews` | POST | Reviews created via /user endpoint |
| `PUT /admin/reviews/:id` | PUT | Admin doesn't edit reviews |
| `POST /admin/reviews/:id/response` | POST | No admin response feature in frontend |
| `PUT /admin/reviews/:id/featured` | PUT | No featured reviews in frontend |
| `POST /admin/reviews/:id/helpful` | POST | Use /user endpoint |
| `POST /admin/reviews/:id/report` | POST | No report feature in frontend |
| `PUT /admin/reviews/bulk/moderate` | PUT | No bulk moderation in frontend |
| `POST /admin/bookings` | POST | Admin doesn't create bookings |
| `PUT /admin/bookings/:id/no-show` | PUT | No no-show marking in frontend |
| `PUT /admin/bookings/:id/reminder-sent` | PUT | No reminder tracking in frontend |
| `GET /admin/advertisements/statistics` | GET | No ad stats page in frontend |
| `POST /admin/advertisements/process-scheduled` | POST | Background job, not frontend |
| `POST /admin/advertisements/:id/view` | POST | Analytics tracking not implemented |
| `POST /admin/advertisements/:id/click` | POST | Analytics tracking not implemented |
| `POST /admin/advertisements/:id/duplicate` | POST | No duplicate feature in frontend |
| `PUT /admin/site-config/banners/:id/toggle` | PUT | Use PUT banners instead |
| `PUT /admin/site-config/trust-badges` | PUT | No trust badges editor in frontend |
| `PUT /admin/site-config/maintenance` | PUT | No maintenance mode in frontend |
| `PUT /admin/site-config/flash-sale` | PUT | Use PUT site-config instead |
| `POST /admin/site-config/reset` | POST | No reset feature in frontend |
| `GET /admin/dashboard/revenue-comparison` | GET | No comparison feature in frontend |
| `GET /user/bookings/track/:bookingRef` | GET | No booking tracking page |
| `POST /user/reviews/:reviewId/helpful` | POST | No helpful button in frontend |

---

## MOCK DATA FILES TO REMOVE

### Files with Mock Data:

| File | Lines | Description | Action |
|------|-------|-------------|--------|
| `src/data/products.js` | 1-2000+ | All 300+ products | REMOVE - fetch from `/admin/products` |
| `src/data/siteConfig.js` | 1-456 | All site configuration | REMOVE - fetch from `/admin/site-config/public` |
| `src/context/GlobalContext.jsx` | 2-3 | Import mock data | REMOVE imports |
| `src/context/GlobalContext.jsx` | 71-74 | Demo customers | REMOVE |
| `src/pages/Login.jsx` | 11-14 | ADMIN_CREDENTIALS, FAKE_CUSTOMER | REMOVE - use API |
| `src/pages/admin/Overview.jsx` | ~line 50 | salesData array | REMOVE - use dashboard API |
| `src/pages/Review.jsx` | ~line 20 | predefinedStatements | KEEP (UI helper, not data) |

---

## IMPLEMENTATION PRIORITY

### Phase 1: Core Setup
1. Install Redux Toolkit + Axios
2. Create API configuration
3. Create auth slice (login, logout, refresh)
4. Create user slice (profile, addresses)

### Phase 2: Product & Cart
1. Create product slice (fetch all, by category, by ID)
2. Create cart slice (get, add, update, remove)
3. Create wishlist slice
4. Connect Home, Shop, Women, Kids, Fashion pages

### Phase 3: Orders & Checkout
1. Create order slice (place, get all, cancel)
2. Connect Checkout page
3. Connect Orders page

### Phase 4: Reviews & Bookings
1. Create review slice
2. Create booking slice
3. Connect Service page
4. Connect Review page

### Phase 5: Admin Panel
1. Create admin product slice
2. Create admin order slice
3. Create admin customer slice
4. Create admin message slice
5. Create admin review slice
6. Create admin booking slice
7. Create site config slice
8. Create dashboard slice

### Phase 6: Final Cleanup
1. Remove all mock data files
2. Remove localStorage persistence (use API)
3. Update GlobalContext to use Redux
4. Test all pages

---

## IMAGE HANDLING NOTES

**Current State:** Images stored as `/images/{category}/{number}.ext` in public folder

**Required Changes:**
1. Keep images in `public/images/` folder (no cloud storage)
2. When uploading in admin, save image file to public folder
3. Store only image filename in database (e.g., "blouses/1.png")
4. Frontend constructs full path: `/images/${product.image}`

**Example Product Image Structure:**
```
public/
  images/
    blouses/
      1.png, 2.png, ...
    sarees/
      1.jpeg, 2.jpeg, ...
    kurtis/
      1.jpeg, 2.jpeg, ...
    lehengas/
      1.jpeg, 2.jpeg, ...
    kids-frocks/
      1.jpeg, 2.jpeg, ...
    etc...
```

**Backend Response:**
```json
{
  "image": "blouses/1.png",
  "hoverImage": "blouses/2.png"
}
```

**Frontend Usage:**
```jsx
<img src={`/images/${product.image}`} alt={product.name} />
```
