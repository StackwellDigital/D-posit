import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { transactionId } = req.query
  if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('transactions')
    .select('meetup_pin, buyer_email')
    .eq('id', transactionId)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Not found' })

  res.status(200).json({ pin: data.meetup_pin })
}
