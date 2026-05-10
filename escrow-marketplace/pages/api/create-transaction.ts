import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { itemName, sellerEmail, fullAmount, depositAmount } = req.body

    // Get or create seller
    let { data: seller } = await supabase
      .from('users')
      .select('id')
      .eq('email', sellerEmail)
      .single()

    if (!seller) {
      const { data: newSeller } = await supabase
        .from('users')
        .insert({ email: sellerEmail })
        .select()
        .single()
      seller = newSeller
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount,
      currency: 'usd',
      metadata: { itemName, sellerEmail },
    })

    // Create transaction row
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        seller_id: seller?.id,
        item_name: itemName,
        full_amount: fullAmount,
        deposit_amount: depositAmount,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_payment_intent_client_secret: paymentIntent.client_secret,
        status: 'pending',
        qr_code_secret: uuidv4(),
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
