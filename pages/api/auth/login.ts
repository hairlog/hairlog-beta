import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { nickname, password } = req.body
  if (!nickname || !password) return res.status(400).json({ error: '닉네임과 비밀번호를 입력해주세요' })

  const { data: user } = await supabaseAdmin.from('beta_users').select('*').eq('nickname', nickname).single()
  if (!user) return res.status(401).json({ error: '닉네임 또는 비밀번호가 틀렸어요' })

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return res.status(401).json({ error: '닉네임 또는 비밀번호가 틀렸어요' })

  return res.status(200).json({ user: { id: user.id, nickname: user.nickname, designer_id: user.designer_id } })
}
