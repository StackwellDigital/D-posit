// pages/api/create-account-link.ts
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
  if (req.method !== 'POST') return res.status(401).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_connect_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_connect_id) {
      return res.status(400).json({ error: 'No Stripe account found — create one first' })
    }

    const accountLink = await stripe.accountLinks.create({
      account: profile.stripe_connect_id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/connect/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/connect/return`,
      type: 'account_onboarding',
    })

    res.status(200).json({ url: accountLink.url })

  } catch (err) {
    console.error('Create account link error:', err)
    res.status(500).json({ error: 'Failed to create onboarding link' })
  }
}
