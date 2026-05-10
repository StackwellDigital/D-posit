// pages/api/complete-transaction.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transactionId, qrSecret } = req.body
    console.log('received qrSecret:', qrSecret)

    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    console.log('db qr_code_secret:', transaction?.qr_code_secret)

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (transaction.qr_code_secret !== qrSecret) {
      return res.status(401).json({ error: 'Invalid QR code' })
    }

    if (transaction.status !== 'deposit_paid') {
      return res.status(400).json({ error: 'Transaction not ready to complete' })
    }

    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Complete transaction error:', error)
    res.status(500).json({ error: 'Failed to complete transaction' })
  }
}
