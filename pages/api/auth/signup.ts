import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { nickname, password } = req.body
  if (!nickname || !password) return res.status(400).json({ error: '닉네임과 비밀번호를 입력해주세요' })
  if (password.length < 4) return res.status(400).json({ error: '비밀번호는 4자 이상이어야 해요' })

  const { data: existing } = await supabaseAdmin.from('beta_users').select('id').eq('nickname', nickname).single()
  if (existing) return res.status(400).json({ error: '이미 사용 중인 닉네임이에요' })

  // 디자이너 레코드 먼저 생성
  const { data: designer, error: dErr } = await supabaseAdmin.from('designers').insert({ name: nickname }).select().single()
  if (dErr) return res.status(500).json({ error: '오류가 발생했습니다' })

  const password_hash = await bcrypt.hash(password, 10)
  const { data: user, error } = await supabaseAdmin.from('beta_users').insert({
    nickname, password_hash, designer_id: designer.id
  }).select().single()
  if (error) return res.status(500).json({ error: '오류가 발생했습니다' })

  return res.status(200).json({ user: { id: user.id, nickname: user.nickname, designer_id: user.designer_id } })
}
