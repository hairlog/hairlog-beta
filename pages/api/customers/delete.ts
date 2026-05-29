import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { customer_id } = req.body
  if (!customer_id) return res.status(400).json({ error: '고객 ID 없음' })

  await supabaseAdmin.from('service_records').delete().eq('customer_id', customer_id)
  await supabaseAdmin.from('sms_logs').delete().eq('customer_id', customer_id)
  const { error } = await supabaseAdmin.from('customers').delete().eq('id', customer_id)
  if (error) return res.status(500).json({ error: '삭제 실패' })
  return res.status(200).json({ success: true })
}
