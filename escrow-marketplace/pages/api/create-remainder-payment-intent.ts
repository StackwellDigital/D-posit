import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { transactionId } = req.body
  if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('transactions')
    .select('full_amount, deposit_amount, item_name, status')
    .eq('id', transactionId)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Transaction not found' })
  if (data.status !== 'deposit_paid') return res.status(400).json({ error: 'Transaction not in correct state' })

  const remainder = data.full_amount - data.deposit_amount
  if (remainder <= 0) return res.status(400).json({ error: 'No remainder to collect' })

  const paymentIntent = await stripe.paymentIntents.create({
    amount: remainder,
    currency: 'usd',
    metadata: { transactionId, itemName: data.item_name },
  })

  res.status(200).json({ clientSecret: paymentIntent.client_secret })
}
