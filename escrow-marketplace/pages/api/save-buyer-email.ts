import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { transactionId, buyerEmail } = req.body
  if (!transactionId || !buyerEmail) return res.status(400).json({ error: 'Missing fields' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('transactions')
    .update({ buyer_email: buyerEmail })
    .eq('id', transactionId)
    .eq('status', 'pending') // safety check — don't overwrite if already paid

  if (error) return res.status(500).json({ error: 'Failed to save email' })

  res.status(200).json({ ok: true })
}
