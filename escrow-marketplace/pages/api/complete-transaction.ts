// pages/api/complete-transaction.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transactionId, qrSecret } = req.body

    // Get transaction and verify
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (transaction.qr_code_secret !== qrSecret) {
      return res.status(401).json({ error: 'Invalid QR code' })
    }

    if (transaction.status !== 'deposit_paid') {
      return res.status(400).json({ error: 'Transaction not ready to complete' })
    }

    // Get seller's Stripe account
    const { data: seller } = await supabase
      .from('users')
      .select('stripe_account_id')
      .eq('id', transaction.seller_id)
      .single()

    if (!seller?.stripe_account_id) {
      return res.status(400).json({ error: 'Seller has not set up Stripe' })
    }

    // Transfer remaining balance to seller
    const remainingAmount = transaction.full_amount - transaction.deposit_amount

    if (remainingAmount > 0) {
      await stripe.transfers.create({
        amount: remainingAmount,
        currency: 'usd',
        destination: seller.stripe_account_id,
        metadata: {
          transactionId: transaction.id,
        },
      })
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    res.status(200).json({ success: true, message: 'Transaction completed' })
  } catch (error) {
    console.error('Complete transaction error:', error)
    res.status(500).json({ error: 'Failed to complete transaction' })
  }
}
