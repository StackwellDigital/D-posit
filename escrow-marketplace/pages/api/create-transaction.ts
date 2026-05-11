import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Auth check — use service role to validate the user's JWT from cookie
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

    const { itemName, fullAmount, depositAmount } = req.body

    if (!itemName || !fullAmount || !depositAmount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount,
      currency: 'usd',
      metadata: { itemName, sellerEmail: user.email ?? '' },
    })

    // Create transaction row
    const { data: transaction, error } = await supabaseServer
      .from('transactions')
      .insert({
        seller_id: user.id,
        seller_email: user.email,
        item_name: itemName,
        full_amount: fullAmount,
        deposit_amount: depositAmount,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_payment_intent_client_secret: paymentIntent.client_secret,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    res.status(200).json({ transactionId: transaction.id })
  } catch (error) {
    console.error('Create transaction error:', error)
    res.status(500).json({ error: 'Failed to create transaction' })
  }
}
