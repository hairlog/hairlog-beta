import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { designer_id, customer_ids, messages, message } = req.body

  const { data: customers } = await supabaseAdmin.from('customers').select('*').in('id', customer_ids)
  if (!customers) return res.status(400).json({ error: '고객 없음' })

  const { data: designer } = await supabaseAdmin.from('designers').select('*').eq('id', designer_id).single()

  try {
    const solapi = require('solapi')
    const SolapiMessageService = solapi.SolapiMessageService || solapi.default || solapi
    const messageService = new SolapiMessageService(process.env.SOLAPI_API_KEY, process.env.SOLAPI_API_SECRET)

    const position = designer?.position ? ` ${designer.position}` : ''
    const designerSuffix = designer
      ? `\n\n${designer.salon_name || ''}${position} ${designer.name || ''}` : ''
    const bookingLink = designer?.naver_link ? `\n📅 예약: ${designer.naver_link}` : ''
    const kakaoLink = !designer?.naver_link && designer?.kakao_link ? `\n💬 카카오: ${designer.kakao_link}` : ''

    const now = new Date().toISOString()

    for (const c of customers) {
      const phone = c.phone.replace(/-/g, '')
      let baseMsg = message || ''
      if (messages) {
        const found = messages.find((m: any) => m.customer_id === c.id)
        if (found) baseMsg = found.message
      }
      const fullMessage = baseMsg + designerSuffix + bookingLink + kakaoLink
      try {
        await messageService.sendOne({ to: phone, from: '07080805174', text: fullMessage })
        await supabaseAdmin.from('sms_logs').insert({
          designer_id, customer_id: c.id, phone: c.phone, message: fullMessage, send_type: 'revisit'
        })
        await supabaseAdmin.from('customers').update({ last_revisit_sms_at: now }).eq('id', c.id)
      } catch (e) { console.error('SMS 오류:', c.phone, e) }
    }
    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: '발송 실패' })
  }
}
