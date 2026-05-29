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
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="bg-white/90 sticky top-0 z-50 px-4 py-4 flex items-center gap-3 border-b border-gray-100 backdrop-blur-md">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition text-xl font-bold">←</button>
        <h2 className="text-xl font-bold tracking-tight">내 프로필</h2>
      </div>

      <form onSubmit={handleSave} className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{f.label}</label>
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                name={f.name} value={(form as any)[f.name]} onChange={handleChange} placeholder={f.placeholder} />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-xs font-bold text-gray-600 mb-1.5">
            📅 임시 휴무일
            <span className="text-xs text-gray-400 font-normal ml-2">(문자 발송 시 자동 포함)</span>
          </label>
          <textarea name="temp_holidays" value={form.temp_holidays} onChange={handleChange} rows={2}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium resize-none"
            placeholder={'예) 2026.06.05 (수) 개인 사정으로 휴무\n2026.06.10~11 여름 휴가'} />
          <p className="text-xs text-gray-400 mt-1.5">설정 시 시술 완료 문자 하단에 자동으로 표시됩니다</p>
        </div>

        <button type="submit"
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl shadow-md hover:opacity-95 transition-all text-base active:scale-[0.99] disabled:opacity-50"
          disabled={saving}>
          {saving ? '저장 중...' : saved ? '✅ 저장됐어요!' : '저장하기'}
        </button>
      </form>

      <BottomNavBar activeMenu="profile" router={router} />
    </div>
  )
}

function BottomNavBar({ activeMenu, router }: { activeMenu: string; router: any }) {
  const menus = [
    { k: 'home', l: '오늘시술', i: '📅', path: '/dashboard' },
    { k: 'customers', l: '고객목록', i: '👥', path: '/customers' },
    { k: 'service', l: '시술작성', i: '✂️', path: '/service/new' },
    { k: 'revisit', l: '재방문관리', i: '🔄', path: '/revisit' },
    { k: 'profile', l: '프로필', i: '👤', path: '/profile' },
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-gray-100 px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] backdrop-blur-md max-w-lg mx-auto flex justify-around items-center rounded-t-2xl">
      {menus.map((m) => {
        const isAct = activeMenu === m.k
        return (
          <button key={m.k} onClick={() => router.push(m.path)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95">
            <span className={`text-xl mb-0.5 ${isAct ? 'scale-110' : 'opacity-60'}`}>{m.i}</span>
            <span className={`text-[10px] font-bold ${isAct ? 'text-amber-500 font-black' : 'text-gray-400'}`}>{m.l}</span>
          </button>
        )
      })}
    </div>
  )
}
