# Escrow Marketplace - Technical Architecture

## System Overview

```
┌─────────────┐                    ┌─────────────┐
│   Buyer     │                    │   Seller    │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       └──────────────┬───────────────────┘
                      │
          ┌───────────▼────────────┐
          │   Next.js Frontend     │
          │  (React Components)    │
          └───────────┬────────────┘
                      │
        ┌─────────────┼──────────────┐
        │             │              │
        ▼             ▼              ▼
    ┌────────┐  ┌─────────┐  ┌──────────┐
    │ Stripe │  │Supabase │  │QR Code   │
    │Payment │  │Database │  │Generator │
    └────────┘  └─────────┘  └──────────┘
```

## Database Schema

### Users
```sql
id (UUID)                 -- Unique user ID
email (VARCHAR)          -- User email
phone (VARCHAR)          -- Optional phone
stripe_account_id (VARCHAR) -- Seller's Stripe Connect account
created_at               -- Account creation timestamp
```

### Listings
```sql
id (UUID)                -- Unique listing ID
seller_id (UUID)         -- FK to users
title (VARCHAR)          -- Item title
description (TEXT)       -- Item description
deposit_amount (INT)     -- Deposit in cents
full_amount (INT)        -- Full price in cents
status (VARCHAR)         -- active, completed, cancelled
created_at               -- When listing was created
```

### Transactions
```sql
id (UUID)                        -- Unique transaction ID
listing_id (UUID)                -- FK to listings
buyer_id (UUID)                  -- FK to users (buyer)
seller_id (UUID)                 -- FK to users (seller)
stripe_payment_intent_id (VARCHAR) -- Stripe PI ID
deposit_amount (INT)             -- Deposit paid in cents
full_amount (INT)                -- Total transaction amount
status (VARCHAR)                 -- pending, deposit_paid, completed, refunded
deposit_paid_at (TIMESTAMP)      -- When deposit was paid
completed_at (TIMESTAMP)         -- When transaction completed
qr_code_secret (VARCHAR)         -- Secret for QR verification
created_at                       -- Transaction creation time
```

## API Routes

### POST /api/create-payment-intent
**Purpose**: Initiate a payment for deposit

**Request**:
```json
{
  "listingId": "uuid",
  "buyerEmail": "buyer@example.com",
  "depositAmount": 10000
}
```

**Response**:
```json
{
  "clientSecret": "pi_test_xxxxx_secret_xxxxx",
  "transactionId": "uuid",
  "qrSecret": "random-secret-code"
}
```

**Flow**:
1. Verify listing exists
2. Create/get buyer user
3. Create transaction record
4. Create Stripe PaymentIntent
5. Return client secret for frontend payment

---

### POST /api/webhook
**Purpose**: Stripe webhook for payment events

**Triggers on**: `payment_intent.succeeded`

**Actions**:
1. Verify webhook signature
2. Update transaction status to `deposit_paid`
3. Set `deposit_paid_at` timestamp
4. Log event

---

### POST /api/complete-transaction
**Purpose**: Release funds to seller after meetup

**Request**:
```json
{
  "transactionId": "uuid",
  "qrSecret": "random-secret-code"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Transaction completed"
}
```

**Flow**:
1. Verify transaction exists
2. Verify QR secret matches
3. Check transaction status is `deposit_paid`
4. Get seller's Stripe Connect account
5. Transfer remaining balance to seller
6. Update transaction status to `completed`
7. Set `completed_at` timestamp

---

## Frontend Pages

### `/` - Landing Page
- Home with overview
- Quick links to seller/buyer flows

### `/seller/create-listing`
- Form to create new listing
- Inputs: email, title, description, deposit, full amount
- Generates shareable link

### `/buy/[id]` - Buyer Checkout
- Display listing details
- Stripe card element
- Email input
- Submit deposit payment

### `/confirmation/[id]` - QR & Completion
- Show QR code with transaction data
- Display deposit amount
- Instructions for pickup
- "Complete Transaction" button
- Shows final status

---

## Payment Flow (Step-by-Step)

### Step 1: Seller Lists (Web)
```
Seller fills form → POST /api/create-listing
Database: INSERT into listings
Response: Shareable URL like /buy/listing-id-abc123
Seller shares link via FB Marketplace, Kijiji, SMS, etc.
```

### Step 2: Buyer Pays (Web)
```
Buyer clicks link → GET /buy/[id]
Display listing details + payment form
Buyer enters email + card → POST /api/create-payment-intent
Backend: Create transaction, create Stripe PaymentIntent
Frontend: Use Stripe.js to confirm payment
Backend (webhook): payment_intent.succeeded
Database: Update transaction status to "deposit_paid"
Buyer redirected → /confirmation/[id]?qrSecret=XXX
```

### Step 3: Meetup (Mobile)
```
Parties meet at agreed location/time
Buyer/Seller opens /confirmation/[id]
QR code displayed on screen
Either party scans QR (or just clicks "Complete")
POST /api/complete-transaction with qrSecret
Backend: Verify secret, transfer funds to seller
Database: Update transaction status to "completed"
Both parties get confirmation
Seller's Stripe account receives balance
```

---

## Stripe Connect Integration (Future)

Currently using standard Stripe. To enable seller payouts:

1. Add Stripe Connect onboarding to seller registration
2. Store `stripe_account_id` in users table
3. Use `destination` parameter in transfer API
4. Create `stripe_connect_account.ts` endpoint

```typescript
// Example of Connect transfer
await stripe.transfers.create({
  amount: remainingBalance,
  currency: 'usd',
  destination: seller.stripe_account_id, // Connected account
})
```

---

## Security Considerations

### Current Implementation
- ✅ QR code secret per transaction (cryptographically random)
- ✅ Stripe webhook signature verification
- ✅ Transaction status checks before releasing funds
- ✅ HTTPS enforced (Vercel/production)

### Recommended Additions
- [ ] Email verification for new users
- [ ] Rate limiting on API endpoints
- [ ] Fraud detection (multiple deposits from same card, velocity checks)
- [ ] 2FA for high-value transactions (>$500)
- [ ] Audit logging for all financial events
- [ ] Dispute/chargeback handling
- [ ] CSRF protection
- [ ] Input validation & sanitization
- [ ] SQL injection prevention (Supabase client already handles this)

---

## Testing Checklist

- [ ] Seller can create listing
- [ ] Shareable link works
- [ ] Buyer can view listing
- [ ] Stripe payment form accepts test card
- [ ] Webhook fires after payment
- [ ] Confirmation page shows QR code
- [ ] QR code data encodes correctly
- [ ] Complete transaction updates status
- [ ] Transaction history displays
- [ ] Email confirmations sent (add later)

---

## Scaling Considerations

### Current Limits (Free Tier)
- Supabase: 500MB database, 2GB bandwidth/month
- Vercel: 100GB bandwidth/month
- Stripe: No transaction limit, standard 2.9% + $0.30 fee

### When to Upgrade
- **Database**: 1GB+ data → upgrade to $25/mo plan
- **API**: 10+ req/sec → add read replicas, caching
- **Bandwidth**: 50GB+/month → optimize images, add CDN

### Optimization Ideas
- Add Redis cache for listing lookups
- Implement GraphQL instead of REST
- Use Stripe webhooks more extensively (defer work)
- Batch process transactions at off-peak times

---

## Cost Model Options

### Option 1: No Platform Fee (MVP)
- Users pay Stripe's 2.9% + $0.30
- You cover operational costs
- Pros: Simplest, user-friendly
- Cons: No revenue, unsustainable long-term

### Option 2: Platform Fee (1-2%)
- Add 1.5% platform fee on top of Stripe
- Covers ops + profit
- Pros: Sustainable, fair split
- Cons: Slightly less competitive

### Option 3: Seller Pays (Similar to eBay)
- Seller pays 2% platform + Stripe fee
- Buyer pays nothing extra
- Pros: Attracts buyers, seller benefit
- Cons: Sellers might resent fee

---

## Deployment Checklist

- [ ] Create Supabase project
- [ ] Run schema.sql
- [ ] Create Stripe account (standard account, not Connect yet)
- [ ] Create GitHub repo
- [ ] Deploy to Vercel
- [ ] Set env variables in Vercel
- [ ] Test payment flow end-to-end
- [ ] Set up Stripe webhook
- [ ] Set up monitoring/alerting
- [ ] Add custom domain (optional)
- [ ] Set up email notifications (SendGrid, Resend, etc.)
