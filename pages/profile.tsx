import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', salon_name: '', position: '', career: '',
    phone: '', business_hours: '', day_off: '', temp_holidays: '',
    kakao_link: '', naver_link: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSession(s)
    loadProfile(s.designer_id)
  }, [])

  async function loadProfile(designer_id: string) {
    const { data } = await supabase.from('designers').select('*').eq('id', designer_id).single()
    if (data) setForm({
      name: data.name || '', salon_name: data.salon_name || '',
      position: data.position || '', career: data.career || '',
      phone: data.phone || '', business_hours: data.business_hours || '',
      day_off: data.day_off || '', temp_holidays: data.temp_holidays || '',
      kakao_link: data.kakao_link || '', naver_link: data.naver_link || ''
    })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('designers').update(form).eq('id', session.designer_id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!session) return null

  const fields = [
    { name: 'name', label: '이름 *', placeholder: '홍길동' },
    { name: 'salon_name', label: '소속 (미용실명)', placeholder: '헤어살롱 이름' },
    { name: 'position', label: '직책', placeholder: '원장 / 수석디자이너' },
    { name: 'career', label: '경력', placeholder: '10년 경력, 수상 이력 등' },
    { name: 'phone', label: '연락처', placeholder: '010-0000-0000' },
    { name: 'business_hours', label: '영업시간', placeholder: '10:00 ~ 20:00' },
    { name: 'day_off', label: '정기 휴무일', placeholder: '매주 일요일, 공휴일' },
    { name: 'kakao_link', label: '카카오톡 채널 링크', placeholder: 'https://pf.kakao.com/...' },
    { name: 'naver_link', label: '네이버 예약 링크', placeholder: 'https://booking.naver.com/...' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 text-lg">←</button>
        <h2 className="text-lg font-semibold">내 프로필</h2>
      </div>
      <form onSubmit={handleSave} className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <div className="card space-y-4">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input className="input" name={f.name} value={(form as any)[f.name]} onChange={handleChange} placeholder={f.placeholder} />
            </div>
          ))}
        </div>
        <div className="card">
          <label className="block text-sm font-medium mb-1">
            📅 임시 휴무일
            <span className="text-xs text-gray-400 font-normal ml-2">(문자 발송 시 자동 포함)</span>
          </label>
          <textarea name="temp_holidays" value={form.temp_holidays} onChange={handleChange}
            rows={2} className="input text-sm resize-none"
            placeholder={'예) 2026.06.05 (수) 개인 사정으로 휴무\n2026.06.10~11 여름 휴가'} />
          <p className="text-xs text-gray-400 mt-1">설정 시 시술 완료 문자 하단에 자동으로 표시됩니다</p>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? '저장 중...' : saved ? '✅ 저장됐어요!' : '저장하기'}
        </button>
      </form>
    </div>
  )
}
