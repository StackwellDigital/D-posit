// pages/api/stripe-connect-callback.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state: userId, error } = req.query

  if (error) {
    console.error('Stripe Connect OAuth error:', error)
    return res.redirect('/connect?error=oauth_denied')
  }

  if (!code || !userId) {
    return res.redirect('/connect?error=missing_params')
  }

  try {
    // Exchange code for access token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code as string,
    })

    const stripeConnectId = response.stripe_user_id

    if (!stripeConnectId) {
      return res.redirect('/connect?error=no_account_id')
    }

    // Save to users table
    const { error: dbError } = await supabase
      .from('users')
      .update({ stripe_connect_id: stripeConnectId })
      .eq('id', userId as string)

    if (dbError) {
      console.error('DB error saving stripe_connect_id:', dbError)
      return res.redirect('/connect?error=db_error')
    }

    // Success — send seller to generate-link
    return res.redirect('/generate-link')

  } catch (err) {
    console.error('Stripe OAuth token exchange failed:', err)
    return res.redirect('/connect?error=token_exchange_failed')
  }
}
