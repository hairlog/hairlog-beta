import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

const ADMIN_PW = 'hairlog2026admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // 비밀번호 확인 (관리자만 데이터 조회 가능)
  const { password } = req.body
  if (password !== ADMIN_PW) return res.status(401).json({ error: '인증 실패' })

  try {
    const { data: d } = await supabaseAdmin.from('designers').select('*').order('created_at', { ascending: false })
    const { data: s } = await supabaseAdmin.from('beta_surveys').select('*').order('created_at', { ascending: false })
    const { data: smsLogs } = await supabaseAdmin.from('sms_logs').select('id').gte('created_at', new Date(Date.now() - 86400000).toISOString())
    const { data: custList } = await supabaseAdmin.from('customers').select('designer_id')
    const { data: recList } = await supabaseAdmin.from('service_records').select('designer_id')

    const custMap: Record<string, number> = {}
    const recMap: Record<string, number> = {}
    ;(custList || []).forEach((c: any) => { custMap[c.designer_id] = (custMap[c.designer_id] || 0) + 1 })
    ;(recList || []).forEach((r: any) => { recMap[r.designer_id] = (recMap[r.designer_id] || 0) + 1 })

    const enriched = (d || []).map((des: any) => ({
      ...des, customerCount: custMap[des.id] || 0, recordCount: recMap[des.id] || 0
    }))

    const surveys = s || []

    return res.status(200).json({
      designers: enriched,
      surveys,
      stats: {
        totalDesigners: (d || []).length,
        todaySms: (smsLogs || []).length,
        totalSurveys: surveys.length,
        willingToPay: surveys.filter((x: any) => x.price_willingness !== 'free').length,
      },
    })
  } catch (e) {
    return res.status(500).json({ error: '데이터 조회 실패' })
  }
}
