// pages/api/create-payment-intent.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transactionId, buyerEmail, depositAmount } = req.body

    // Verify transaction exists
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Create or get buyer user
    let { data: buyer } = await supabase
      .from('users')
      .select('id')
      .eq('email', buyerEmail)
      .single()

    if (!buyer) {
      const { data: newBuyer } = await supabase
        .from('users')
        .insert({ email: buyerEmail })
        .select()
        .single()
      buyer = newBuyer
    }

    // Update transaction with buyer
    await supabase
      .from('transactions')
      .update({ buyer_id: buyer.id })
      .eq('id', transactionId)

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount,
      currency: 'usd',
      metadata: {
        transactionId: transaction.id,
        buyerEmail: buyerEmail,
      },
    })

    // Update transaction with Stripe payment intent ID
    await supabase
      .from('transactions')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', transactionId)

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      qrSecret: transaction.qr_code_secret,
    })
  } catch (error) {
    console.error('Payment intent error:', error)
    res.status(500).json({ error: 'Failed to create payment intent' })
  }
}
