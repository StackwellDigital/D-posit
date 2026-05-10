# Escrow Marketplace - MVP Setup Guide

## Quick Start (15 minutes)

### Step 1: Supabase Setup
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to SQL Editor and run the schema from `escrow_schema.sql`
4. Copy your URL and Anon Key from Settings → API

### Step 2: Stripe Setup
1. Go to https://stripe.com and create an account (test mode)
2. Go to Developers → API Keys
3. Copy your Publishable Key (pk_test_...) and Secret Key (sk_test_...)
4. Go to Developers → Webhooks and add endpoint:
   - Endpoint: `https://yourdomain.com/api/webhook`
   - Events: `payment_intent.succeeded`
   - Copy the signing secret (whsec_...)

### Step 3: Deploy to Vercel
```bash
# Clone or create repo
git init
git add .
git commit -m "Initial commit"

# Push to GitHub (create repo first)
git remote add origin https://github.com/yourusername/escrow-marketplace
git push -u origin main

# Deploy to Vercel
# 1. Go to https://vercel.com/new
# 2. Import your GitHub repo
# 3. Add environment variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
#    - STRIPE_SECRET_KEY
#    - STRIPE_WEBHOOK_SECRET
#    - NEXT_PUBLIC_APP_URL (your Vercel domain)
# 4. Click Deploy
```

### Step 4: Update Stripe Webhook
1. Go back to Stripe Webhooks
2. Update endpoint URL to: `https://your-vercel-domain.vercel.app/api/webhook`

## Key Files Overview

- `escrow_schema.sql` - Database schema (run in Supabase)
- `pages/index.tsx` - Landing page
- `pages/seller/create-listing.tsx` - Seller listing creation
- `pages/buy/[id].tsx` - Buyer payment page
- `pages/confirmation/[id].tsx` - QR code & completion
- `pages/api/create-payment-intent.ts` - Stripe payment setup
- `pages/api/webhook.ts` - Stripe webhook handler
- `pages/api/complete-transaction.ts` - Transaction completion

## Flow Explained

1. **Seller** creates listing at `/seller/create-listing`
   - Enters email, item details, deposit amount, full amount
   - Gets shareable link like `yoursite.com/buy/listing-id`

2. **Buyer** visits link and pays deposit
   - Enters email, card details
   - Stripe holds deposit securely
   - Redirected to confirmation page with QR code

3. **At Meetup** - either party scans QR code
   - Opens confirmation page
   - Shows QR with encoded transaction data
   - Buyer/seller verifies code, clicks "Complete Transaction"

4. **Payment Released**
   - Remaining balance transferred to seller's Stripe account
   - Transaction marked complete
   - Both parties get confirmation

## TODO / Next Steps

- [ ] Add user authentication (NextAuth.js)
- [ ] Add seller Stripe Connect onboarding
- [ ] Add dispute/refund handling
- [ ] Add transaction history/dashboard
- [ ] Add notification emails
- [ ] Add buyer/seller ratings
- [ ] Mobile app (React Native)
- [ ] Two-party QR confirmation (both must scan)
- [ ] Time-based refund (auto-refund after X days if not completed)

## Testing in Stripe Test Mode

Use these test cards:
- Success: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 0002`

Expiry: any future date
CVC: any 3 digits

## Security Notes

- QR code secret is generated per transaction (not guessable)
- Stripe webhook verifies all payments
- Deposits held until both parties confirm
- Consider adding rate limiting and fraud detection
- Add email verification for users
- Consider 2FA for high-value transactions

## Cost Breakdown (Monthly Estimate)

- Supabase: $0-25 (pay as you go)
- Vercel: $0-20 (hobby plan free, then $20/mo)
- Stripe: 2.9% + $0.30 per transaction (you might take a cut, e.g., 1.5%)
- **Total baseline: ~$20-45/month**

Scale up pricing:
- Each transaction takes ~$0.005 in Supabase/Vercel costs
- Stripe takes their cut automatically
- You could add 1-2% processing fee to cover costs + profit

Enjoy! DM if you hit any walls.
