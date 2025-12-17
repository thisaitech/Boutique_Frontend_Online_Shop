# Backend Routes Not Matched with Frontend

This file lists all backend API routes that do NOT have corresponding frontend implementation.
Each entry includes the HTTP method, route path, backend file name, and line number.

---

## Dashboard Controller
**File:** `Boutique_Backend_Online_Shop/src/admin/controller/dashboard/dashboard.controller.ts`

| Method | Route | Line | Description |
|--------|-------|------|-------------|
| GET | `/admin/dashboard/products` | 75 | Product analytics - category breakdown, top sellers, inventory status |
| GET | `/admin/dashboard/customers` | 90 | Customer analytics for given period |
| GET | `/admin/dashboard/revenue-comparison` | 137 | Compare revenue between two periods (month-over-month) |
| GET | `/admin/dashboard/quick-stats` | 187 | Quick stats for notification badges |

---

## Order Controller
**File:** `Boutique_Backend_Online_Shop/src/admin/controller/order/order.controller.ts`

| Method | Route | Line | Description |
|--------|-------|------|-------------|
| GET | `/admin/orders/number/:orderNumber` | 122 | Get order by order number (ORD-YYYYMMDD-XXXX) |
| PUT | `/admin/orders/:id/confirm` | 187 | Quick action to confirm pending order |
| PUT | `/admin/orders/:id/cancel` | 202 | Quick action to cancel order with reason |

---

## Customer Controller
**File:** `Boutique_Backend_Online_Shop/src/admin/controller/customer/customer.controller.ts`

| Method | Route | Line | Description |
|--------|-------|------|-------------|
| PATCH | `/admin/customers/:id/status` | 125 | Update customer active status |
| POST | `/admin/customers/:id/addresses` | 145 | Add address to customer profile |
| DELETE | `/admin/customers/:id/addresses/:addressId` | 163 | Remove address from customer profile |
| PATCH | `/admin/customers/:id/loyalty-points` | 181 | Add or deduct loyalty points |
| PUT | `/admin/customers/:id/activate` | 198 | Quick action to activate customer |
| PUT | `/admin/customers/:id/deactivate` | 212 | Quick action to deactivate customer |

---

## Site Config Controller
**File:** `Boutique_Backend_Online_Shop/src/admin/controller/site-config/site-config.controller.ts`

| Method | Route | Line | Description |
|--------|-------|------|-------------|
| PUT | `/admin/site-config/banners/:id/toggle` | 143 | Toggle banner active status |
| PUT | `/admin/site-config/trust-badges` | 186 | Update trust badges |
| PUT | `/admin/site-config/maintenance` | 200 | Toggle maintenance mode |
| PUT | `/admin/site-config/flash-sale` | 217 | Update flash sale settings |
| POST | `/admin/site-config/reset` | 271 | Reset configuration to defaults |

---

## Advertisement Controller
**File:** `Boutique_Backend_Online_Shop/src/admin/controller/advertisement/advertisement.controller.ts`

| Method | Route | Line | Description |
|--------|-------|------|-------------|
| POST | `/admin/advertisements/process-scheduled` | 107 | Process scheduled ads (activate/expire) - for cron job |
| POST | `/admin/advertisements/:id/view` | 214 | Track ad view for analytics |
| POST | `/admin/advertisements/:id/click` | 229 | Track ad click for analytics |
| POST | `/admin/advertisements/:id/duplicate` | 244 | Create a copy of advertisement |

---

## Message Controller
**File:** `Boutique_Backend_Online_Shop/src/admin/controller/message/message.controller.ts`

| Method | Route | Line | Description |
|--------|-------|------|-------------|
| GET | `/admin/messages/unread` | 93 | Get recent unread messages for notifications |
| PATCH | `/admin/messages/:id/priority` | 165 | Update message priority (low/medium/high/urgent) |
| PATCH | `/admin/messages/:id/assign` | 183 | Assign message to admin user |
| PUT | `/admin/messages/:id/star` | 201 | Toggle star/flag on message |
| PUT | `/admin/messages/:id/resolve` | 215 | Quick action to mark as resolved |
| PUT | `/admin/messages/:id/spam` | 229 | Quick action to mark as spam |
| PUT | `/admin/messages/bulk` | 244 | Bulk update multiple messages |
| DELETE | `/admin/messages/bulk` | 272 | Bulk delete multiple messages |

---

## Review Controller
**File:** `Boutique_Backend_Online_Shop/src/admin/controller/review/review.controller.ts`

| Method | Route | Line | Description |
|--------|-------|------|-------------|
| GET | `/admin/reviews/pending` | 93 | Get pending reviews for moderation queue |
| PUT | `/admin/reviews/:id/featured` | 242 | Toggle featured status of review |
| POST | `/admin/reviews/:id/helpful` | 257 | Mark review as helpful (customer action) |
| POST | `/admin/reviews/:id/report` | 276 | Report a review (customer action) |
| PUT | `/admin/reviews/bulk/moderate` | 295 | Bulk moderate multiple reviews |

---

## Booking Controller
**File:** `Boutique_Backend_Online_Shop/src/admin/controller/booking/booking.controller.ts`

| Method | Route | Line | Description |
|--------|-------|------|-------------|
| GET | `/admin/bookings/today` | 92 | Get all bookings for today |
| GET | `/admin/bookings/upcoming` | 108 | Get upcoming confirmed/pending bookings |
| POST | `/admin/bookings/check-availability` | 124 | Check available time slots for date |
| GET | `/admin/bookings/reference/:bookingRef` | 140 | Get booking by reference number |
| PUT | `/admin/bookings/:id/complete` | 221 | Quick action to mark as completed |
| PUT | `/admin/bookings/:id/no-show` | 258 | Mark booking as no-show |
| PATCH | `/admin/bookings/:id/reschedule` | 275 | Reschedule booking to new date/time |
| PUT | `/admin/bookings/:id/reminder-sent` | 293 | Mark reminder as sent |

---

## User Controller
**File:** `Boutique_Backend_Online_Shop/src/users/controller/user/user.controller.ts`

| Method | Route | Line | Description |
|--------|-------|------|-------------|
| GET | `/user/bookings/track/:bookingRef` | 372 | Track booking by reference (public) |
| POST | `/user/reviews/:reviewId/helpful` | 338 | Mark review as helpful (authenticated) |

---

## Summary

| Category | Unmatched Routes | Percentage |
|----------|-----------------|------------|
| Dashboard Analytics | 4 | - |
| Order Management | 3 | - |
| Customer Management | 6 | - |
| Site Configuration | 5 | - |
| Advertisements | 4 | - |
| Messages | 8 | - |
| Reviews | 5 | - |
| Bookings | 8 | - |
| User/Customer | 2 | - |
| **Total** | **45** | ~15% of all routes |

---

## Recommendations

### Priority 1 - Should Implement:
- `/admin/dashboard/quick-stats` - Useful for admin notifications
- `/admin/messages/unread` - For notification badges
- `/admin/reviews/pending` - For moderation workflow
- `/admin/bookings/today` - For daily schedule view

### Priority 2 - Nice to Have:
- Bulk operations (messages, reviews) - Improves admin efficiency
- Quick actions (confirm, cancel, activate) - Already have main update routes

### Priority 3 - Optional:
- Analytics routes (product, customer, revenue-comparison) - Advanced features
- Ad tracking (view, click) - Only if implementing analytics dashboard
- Loyalty points - Only if implementing loyalty program

---

## Notes

- All line numbers reference the backend controller files
- Frontend uses graceful fallback to localStorage when API fails
- Many "quick action" routes are convenience endpoints - main update routes work
- Bulk operations are efficiency improvements, not critical functionality
