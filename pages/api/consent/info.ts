import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query
  if (!token) return res.status(400).json({ error: '토큰 없음' })

  const { data: customer } = await supabaseAdmin
    .from('customers').select('*, designers(*)')
    .eq('consent_token', token).single()

  if (!customer) return res.status(404).json({ error: '유효하지 않은 링크' })

  return res.status(200).json({
    consent_status: customer.consent_status,
    designer: customer.designers
  })
}
