import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { designer_id, customer_ids, message } = req.body

  const { data: customers } = await supabaseAdmin.from('customers').select('*').in('id', customer_ids)
  if (!customers) return res.status(400).json({ error: '고객 없음' })

  const { data: designer } = await supabaseAdmin.from('designers').select('*').eq('id', designer_id).single()

  try {
    const SolapiMessageService = require('solapi').default
    const messageService = new SolapiMessageService(process.env.SOLAPI_API_KEY, process.env.SOLAPI_API_SECRET)
    const designerSuffix = designer ? `\n\n- ${designer.name}${designer.salon_name ? ` (${designer.salon_name})` : ''}` : ''
    const fullMessage = message + designerSuffix

    for (const c of customers) {
      const phone = c.phone.replace(/-/g, '')
      try {
        await messageService.sendOne({ to: phone, from: '01000000000', text: fullMessage })
        await supabaseAdmin.from('sms_logs').insert({ designer_id, customer_id: c.id, phone: c.phone, message: fullMessage, send_type: 'bulk' })
      } catch (e) { console.error('SMS 오류:', c.phone, e) }
    }
    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: '발송 실패' })
  }
}
