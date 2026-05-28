import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { designer_id, customer_name, customer_phone, service_date, service_type,
    gender, damage_level, damage_part, care_method, caution, next_service, memo, cust_memo, secret_recipe, photo_urls } = req.body

  const { data: designer } = await supabaseAdmin.from('designers').select('*').eq('id', designer_id).single()

  let { data: customer } = await supabaseAdmin.from('customers')
    .select('*').eq('designer_id', designer_id).eq('phone', customer_phone).single()

  if (!customer) {
    const { data: newCustomer, error: cErr } = await supabaseAdmin.from('customers').insert({
      designer_id, name: customer_name, phone: customer_phone,
      gender: gender || null,
      privacy_agreed: true, privacy_agreed_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString()
    }).select().single()
    if (cErr) return res.status(500).json({ error: '고객 등록 실패' })
    customer = newCustomer
  } else {
    await supabaseAdmin.from('customers').update({
      last_visit_at: new Date().toISOString(),
      name: customer_name,
      gender: gender || customer.gender || null
    }).eq('id', customer.id)
  }

  const { data: record, error: rErr } = await supabaseAdmin.from('service_records').insert({
    designer_id, customer_id: customer.id,
    service_date, service_type,
    gender: gender || null,
    damage_level: damage_level || null,
    damage_part: damage_part || null,
    care_method: care_method || null,
    caution: caution || null,
    next_service: next_service || null,
    memo: memo || null,
    cust_memo: cust_memo || null,
    secret_recipe: secret_recipe || null,
    photo_urls: photo_urls || null,
    sms_sent: false
  }).select().single()
  if (rErr) return res.status(500).json({ error: '시술 기록 저장 실패' })

  try {
    const phone = customer_phone.replace(/-/g, '')
    const designerInfo = designer
      ? `\n\n담당: ${designer.name}${designer.salon_name ? ` (${designer.salon_name})` : ''}${designer.business_hours ? `\n영업시간: ${designer.business_hours}` : ''}${designer.day_off ? `\n휴무일: ${designer.day_off}` : ''}`
      : ''
    const messageParts = [
      `[헤어로그] 시술 내역 안내`, ``,
      `${customer_name}님, 오늘 시술 감사합니다 😊`, ``,
      `📋 시술 내역`, `날짜: ${service_date}`, `시술: ${service_type}`,
    ]
    if (care_method) messageParts.push(`손질법: ${care_method}`)
    if (caution) messageParts.push(`주의사항: ${caution}`)
    if (next_service) messageParts.push(`다음 시술: ${next_service}`)
    const message = messageParts.join('\n') + designerInfo

    const solapi = require('solapi')
    const SolapiMessageService = solapi.SolapiMessageService || solapi.default || solapi
    const messageService = new SolapiMessageService(process.env.SOLAPI_API_KEY, process.env.SOLAPI_API_SECRET)
    await messageService.sendOne({ to: phone, from: '07080805174', text: message })
    await supabaseAdmin.from('service_records').update({ sms_sent: true, sms_sent_at: new Date().toISOString() }).eq('id', record.id)
    await supabaseAdmin.from('sms_logs').insert({ designer_id, customer_id: customer.id, phone: customer_phone, message, send_type: 'service' })
  } catch (e) {
    console.error('SMS 발송 오류:', e)
  }

  return res.status(200).json({ success: true, record_id: record.id, customer_id: customer.id })
}
