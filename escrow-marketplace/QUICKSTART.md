# Escrow Marketplace - Quick Reference

## What You're Building

A decentralized escrow system for used goods sales. Stripe holds the deposit, both parties verify, funds release.

**Core Problem It Solves**: 
- Buyer fears: Seller ghosting after deposit
- Seller fears: Buyer chargeback after receiving goods
- Solution: Stripe escrow + QR verification

---

## Files You Have

```
escrow_app/
├── pages/
│   ├── index.tsx                      # Landing page
│   ├── seller/
│   │   └── create-listing.tsx         # Create listing form
│   ├── buy/
│   │   └── [id].tsx                   # Buyer payment page
│   ├── confirmation/
│   │   └── [id].tsx                   # QR code & completion
│   └── api/
│       ├── create-payment-intent.ts   # Start Stripe payment
│       ├── webhook.ts                 # Stripe confirmation
│       └── complete-transaction.ts    # Release funds
├── lib/
│   └── supabase.ts                    # Database client
├── package.json                        # Dependencies
├── tailwind.config.js                 # Styling config
├── next.config.js                     # Next.js config
├── .env.local                         # Secrets (not in git)
├── SETUP.md                           # Deployment guide
└── ARCHITECTURE.md                    # Technical deep dive
```

---

## 5-Minute Deployment Path

1. **Supabase** (2 min)
   - Go to https://supabase.com → New Project
   - SQL Editor → paste `escrow_schema.sql`
   - Copy URL & Anon Key

2. **Stripe** (1 min)
   - Go to https://stripe.com → Test Mode
   - Copy Publishable Key (pk_test) & Secret Key (sk_test)

3. **Vercel** (2 min)
   - Push code to GitHub
   - Import repo in https://vercel.com
   - Add 5 env variables
   - Deploy

**Done.** App is live.

---

## Transaction Lifecycle

```
1. SELLER CREATES LISTING
   ├─ Email, title, description
   ├─ Deposit amount ($)
   ├─ Full amount ($)
   └─ Gets shareable link: yoursite.com/buy/ABC123

2. BUYER PAYS DEPOSIT
   ├─ Clicks link
   ├─ Enters email + card
   ├─ Stripe holds deposit securely
   ├─ Transaction created in DB (status: deposit_paid)
   └─ Gets QR code + instructions

3. MEETUP (1 week later, e.g.)
   ├─ Parties meet IRL
   ├─ Inspect item
   ├─ Scan QR code from confirmation page
   └─ System verifies transaction

4. FUNDS RELEASE
   ├─ Remaining balance transferred to seller
   ├─ Transaction marked complete
   ├─ Seller has cash in Stripe account
   └─ Buyer has item

5. SELLER WITHDRAWS
   ├─ Seller links bank to Stripe
   ├─ Receives payout within 2-5 business days
   └─ Done
```

---

## Key Decisions Made (MVP)

| Decision | What | Why |
|----------|------|-----|
| **Stack** | Next.js + Supabase + Stripe | Fastest, free tier, minimal config |
| **Payment** | Stripe (not Connect yet) | Simpler initial flow, add Connect later |
| **QR** | Data encoded in QR (transaction ID + secret) | No backend call needed at meetup |
| **Escrow** | Stripe holds funds | No licensing, built-in chargeback protection |
| **Auth** | None (MVP) | Email-based user lookup is enough initially |
| **Refunds** | Manual (future) | Avoid complexity, handle edge cases later |

---

## What's NOT Included (Add Later)

- [ ] User authentication (NextAuth.js)
- [ ] Email notifications (Resend or SendGrid)
- [ ] Seller ratings/reviews
- [ ] Dispute resolution UI
- [ ] Seller Stripe Connect onboarding
- [ ] Transaction history/dashboard
- [ ] Admin panel
- [ ] Seller account balance tracking
- [ ] Automatic refund after timeout
- [ ] Mobile app

---

## Testing the Flow

### Seller Side
1. Go to `/seller/create-listing`
2. Enter:
   - Email: `seller@test.com`
   - Title: `iPhone 14`
   - Description: `Mint condition`
   - Deposit: `100`
   - Full amount: `800`
3. Get shareable link

### Buyer Side
1. Visit `/buy/[listing-id]`
2. Enter email: `buyer@test.com`
3. Use Stripe test card: `4242 4242 4242 4242`
4. Expiry: `12/34`, CVC: `567`
5. Get QR code

### Completion
1. Click "Complete Transaction" button
2. Check Supabase → transactions table for status change

---

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_APP_URL=https://yoursite.vercel.app
```

---

## Cost Breakdown (First Month)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase | $0 | Free tier (500MB) |
| Vercel | $0 | Free hobby tier |
| Stripe | Variable | 2.9% + $0.30 per transaction |
| Domain | ~$12 | Optional (GoDaddy, Namecheap) |
| **Total** | **~$12** | Can add revenue with 1-2% fee |

At scale (100 transactions/month at $500 avg):
- Stripe takes: ~$1,450
- You could take: 1% = $500 (minus infra costs ~$50-100)

---

## Common Issues & Fixes

### "Payment failed"
- Check Stripe keys are correct
- Ensure webhook endpoint is configured
- Check Supabase connection

### "Transaction not found"
- Confirm listing ID is correct
- Check Supabase database has records
- Verify API response contains transactionId

### "QR code not scanning"
- Browser needs camera permission
- Try different QR code reader
- Check QR code data is valid JSON

### "Webhook not firing"
- Verify endpoint URL in Stripe dashboard
- Check signing secret matches in code
- Look at Stripe webhook logs for errors
- Ensure STRIPE_WEBHOOK_SECRET is set in env

---

## Next Steps (In Priority Order)

1. **Deploy & test end-to-end**
   - Get it live first
   - Test with real Stripe test account

2. **Add email notifications**
   - Deposit confirmation
   - Completion reminder
   - Funds released notification

3. **Add user dashboard**
   - Show active listings/transactions
   - Transaction history
   - Seller balance

4. **Stripe Connect for sellers**
   - Automatic payouts
   - Seller account management

5. **Dispute handling**
   - 24-48 hour window for disputes
   - Mediation (maybe manual for now)
   - Refund process

6. **Analytics & monitoring**
   - Transaction volume
   - Average deal size
   - Chargeback rate

---

## Support Resources

- **Stripe Docs**: https://stripe.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Test Cards**: https://stripe.com/docs/testing

---

## Remember

This is an MVP. It's not perfect. It's meant to validate the idea and get user feedback.

Key metrics to watch:
- How many listings are created?
- What's the conversion (listing → deposit paid)?
- Average deal size?
- Chargeback/fraud rate?
- User feedback on trust/safety?

Use those numbers to decide if it's worth scaling to include Connect, ratings, disputes, etc.

Good luck! 🚀
