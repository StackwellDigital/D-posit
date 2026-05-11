// pages/api/create-connect-account.ts
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    // Check if seller already has a Connect account
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_connect_id')
      .eq('id', user.id)
      .single()

    let stripeConnectId = profile?.stripe_connect_id

    // Create Express account if doesn't exist
    if (!stripeConnectId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: { supabase_user_id: user.id },
      })

      stripeConnectId = account.id

      // Save to users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ stripe_connect_id: stripeConnectId })
        .eq('id', user.id)

      if (dbError) throw dbError
    }

    res.status(200).json({ stripeConnectId })

  } catch (err) {
    console.error('Create connect account error:', err)
    res.status(500).json({ error: 'Failed to create Stripe account' })
  }
}
