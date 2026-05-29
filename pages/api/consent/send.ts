import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { customer_id, designer_id } = req.body

  const { data: customer } = await supabaseAdmin.from('customers').select('*').eq('id', customer_id).single()
  if (!customer) return res.status(404).json({ error: '고객 없음' })

  const token = generateToken()
  await supabaseAdmin.from('customers').update({
    consent_token: token, consent_status: 'pending'
  }).eq('id', customer_id)

  const consentUrl = `https://www.hairlog.co.kr/consent/${token}`
  const message = `[헤어로그] 개인정보 동의 안내\n\n안녕하세요 고객님, 맞춤 시술 기록 관리를 위해 개인정보 동의가 필요합니다.\n\n✔ 목적: 시술 이력 관리 및 안내\n✔ 항목: 성명, 연락처\n\n▶ 동의하러 가기:\n${consentUrl}`

  try {
    const solapi = require('solapi')
    const SolapiMessageService = solapi.SolapiMessageService || solapi.default || solapi
    const messageService = new SolapiMessageService(process.env.SOLAPI_API_KEY, process.env.SOLAPI_API_SECRET)
    await messageService.sendOne({ to: customer.phone.replace(/-/g, ''), from: '07080805174', text: message })
    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: '발송 실패' })
  }
}
