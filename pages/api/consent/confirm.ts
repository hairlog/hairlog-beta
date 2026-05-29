import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { token, action } = req.body

  const { data: customer } = await supabaseAdmin
    .from('customers').select('*').eq('consent_token', token).single()

  if (!customer) return res.status(404).json({ error: '유효하지 않은 링크' })

  const update = action === 'agree'
    ? { privacy_agreed: true, consent_status: 'agreed', privacy_agreed_at: new Date().toISOString() }
    : { consent_status: 'rejected' }

  await supabaseAdmin.from('customers').update(update).eq('id', customer.id)
  return res.status(200).json({ success: true })
}
