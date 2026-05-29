import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { designer_id, customer_name, customer_phone, service_date, service_type,
    gender, damage_level, damage_part, care_method, caution, next_service,
    memo, cust_memo, secret_recipe, photo_urls, consent_type } = req.body

  const { data: designer } = await supabaseAdmin.from('designers').select('*').eq('id', designer_id).single()

  let { data: customer } = await supabaseAdmin.from('customers')
    .select('*').eq('designer_id', designer_id).eq('phone', customer_phone).single()

  if (!customer) {
    const { data: newCustomer, error: cErr } = await supabaseAdmin.from('customers').insert({
      designer_id, name: customer_name, phone: customer_phone,
      gender: gender || null,
      privacy_agreed: consent_type === 'oral' ? true : false,
      consent_type: consent_type || 'oral',
      consent_status: consent_type === 'oral' ? 'agreed' : 'pending',
      privacy_agreed_at: consent_type === 'oral' ? new Date().toISOString() : null,
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

  // 문자 동의면 동의 링크 발송, 구두 동의면 시술 내역 문자 발송
  if (consent_type === 'sms_consent') {
    // 동의 링크 발송
    try {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      await supabaseAdmin.from('customers').update({ consent_token: token, consent_status: 'pending' }).eq('id', customer.id)
      const consentUrl = `https://www.hairlog.co.kr/consent/${token}`
      const msg = `[헤어로그] 개인정보 동의 안내\n\n안녕하세요 고객님, 맞춤 시술 기록 관리를 위해 개인정보 동의가 필요합니다.\n\n✔ 목적: 시술 이력 관리 및 안내\n✔ 항목: 성명, 연락처\n\n▶ 동의하러 가기:\n${consentUrl}`
      const solapi = require('solapi')
      const SolapiMessageService = solapi.SolapiMessageService || solapi.default || solapi
      const messageService = new SolapiMessageService(process.env.SOLAPI_API_KEY, process.env.SOLAPI_API_SECRET)
      await messageService.sendOne({ to: customer_phone.replace(/-/g, ''), from: '07080805174', text: msg })
    } catch (e) { console.error('동의 문자 오류:', e) }
  } else {
    // 시술 내역 문자 발송 (가독성 개선)
    try {
      const phone = customer_phone.replace(/-/g, '')
      const position = designer?.position ? ` ${designer.position}` : ''
      const salonName = designer?.salon_name || ''
      const designerName = designer?.name || ''

      let msg = `[헤어로그] 시술 내역 안내\n\n${customer_name}님, 오늘 시술 감사드립니다. ✨\n\n🗓 시술 날짜: ${service_date}\n✂ 시술 내용: ${service_type}`
      if (care_method) msg += `\n\n[홈케어 손질법]\n✔ ${care_method.split('\n').join('\n✔ ')}`
      if (caution) msg += `\n\n[시술 후 주의사항]\n✔ ${caution.split('\n').join('\n✔ ')}`
      if (next_service) msg += `\n\n📅 다음 시술 권장: ${next_service}`
      msg += `\n\n💈 매장: ${salonName}${position ? ' (' + position + ' ' + designerName + ')' : ' ' + designerName}`
      if (designer?.business_hours) msg += `\n⏰ 영업시간: ${designer.business_hours}`
      if (designer?.day_off) msg += ` (정기휴무: ${designer.day_off})`
      if (designer?.temp_holidays) msg += `\n⚠️ 임시휴무: ${designer.temp_holidays}`

      const solapi = require('solapi')
      const SolapiMessageService = solapi.SolapiMessageService || solapi.default || solapi
      const messageService = new SolapiMessageService(process.env.SOLAPI_API_KEY, process.env.SOLAPI_API_SECRET)
      await messageService.sendOne({ to: phone, from: '07080805174', text: msg })
      await supabaseAdmin.from('service_records').update({ sms_sent: true, sms_sent_at: new Date().toISOString() }).eq('id', record.id)
      await supabaseAdmin.from('sms_logs').insert({ designer_id, customer_id: customer.id, phone: customer_phone, message: msg, send_type: 'service' })
    } catch (e) { console.error('SMS 발송 오류:', e) }
  }

  return res.status(200).json({ success: true, record_id: record.id, customer_id: customer.id })
}
