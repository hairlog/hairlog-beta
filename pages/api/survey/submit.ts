import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { designer_id, will_use, pain_point, price_willingness, churn_reason } = req.body
  const { error } = await supabaseAdmin.from('beta_surveys').insert({
    designer_id, will_use, pain_point, price_willingness, churn_reason
  })
  if (error) return res.status(500).json({ error: '저장 실패' })
  return res.status(200).json({ success: true })
}
