import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { file_base64, file_name, designer_id } = req.body
  if (!file_base64 || !file_name) return res.status(400).json({ error: '파일 없음' })

  try {
    const base64Data = file_base64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const ext = file_name.split('.').pop() || 'jpg'
    const path = `${designer_id}/${Date.now()}.${ext}`

    const { error } = await supabaseAdmin.storage
      .from('hairlog-photos')
      .upload(path, buffer, { contentType: `image/${ext}`, upsert: false })

    if (error) return res.status(500).json({ error: '업로드 실패: ' + error.message })

    const { data: urlData } = supabaseAdmin.storage.from('hairlog-photos').getPublicUrl(path)
    return res.status(200).json({ url: urlData.publicUrl })
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' })
  }
}
