import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { designer_id, customer_name, customer_phone, service_date, service_type, memo, secret_recipe } = req.body

  // 디자이너 정보 조회
  const { data: designer } = await supabaseAdmin.from('designers').select('*').eq('id', designer_id).single()

  // 고객 찾거나 생성
  let { data: customer } = await supabaseAdmin.from('customers')
    .select('*').eq('designer_id', designer_id).eq('phone', customer_phone).single()

  if (!customer) {
    const { data: newCustomer, error: cErr } = await supabaseAdmin.from('customers').insert({
      designer_id, name: customer_name, phone: customer_phone,
      privacy_agreed: true, privacy_agreed_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString()
    }).select().single()
    if (cErr) return res.status(500).json({ error: '고객 등록 실패' })
    customer = newCustomer
  } else {
    await supabaseAdmin.from('customers').update({ last_visit_at: new Date().toISOString(), name: customer_name }).eq('id', customer.id)
  }

  // 시술 기록 저장
  const { data: record, error: rErr } = await supabaseAdmin.from('service_records').insert({
    designer_id, customer_id: customer.id, service_date, service_type, memo, secret_recipe,
    sms_sent: false
  }).select().single()
  if (rErr) return res.status(500).json({ error: '시술 기록 저장 실패' })

  // SMS 발송
  try {
    const phone = customer_phone.replace(/-/g, '')
    const designerInfo = designer ? `\n\n담당: ${designer.name}${designer.salon_name ? ` (${designer.salon_name})` : ''}${designer.business_hours ? `\n영업시간: ${designer.business_hours}` : ''}` : ''
    const message = `[헤어로그] 시술 내역 안내\n\n${customer_name}님, 오늘 시술해 주셔서 감사합니다 😊\n\n📋 시술 내역\n날짜: ${service_date}\n시술: ${service_type}${memo ? `\n메모: ${memo}` : ''}${designerInfo}`

    const SolapiMessageService = require('solapi').default
    const messageService = new SolapiMessageService(process.env.SOLAPI_API_KEY, process.env.SOLAPI_API_SECRET)
    await messageService.sendOne({ to: phone, from: '01000000000', text: message })
    await supabaseAdmin.from('service_records').update({ sms_sent: true, sms_sent_at: new Date().toISOString() }).eq('id', record.id)
    await supabaseAdmin.from('sms_logs').insert({ designer_id, customer_id: customer.id, phone: customer_phone, message, send_type: 'service' })
  } catch (e) {
    console.error('SMS 발송 오류:', e)
  }

  return res.status(200).json({ success: true, record_id: record.id })
}
