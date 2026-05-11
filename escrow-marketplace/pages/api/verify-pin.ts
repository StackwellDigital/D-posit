import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { transactionId, pin } = req.body
  if (!transactionId || !pin) return res.status(400).json({ error: 'Missing fields' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('transactions')
    .select('meetup_pin')
    .eq('id', transactionId)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Transaction not found' })
  if (data.meetup_pin !== pin) return res.status(400).json({ error: 'Incorrect PIN' })

  res.status(200).json({ ok: true })
}
