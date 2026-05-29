import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { CalendarDays, Users, Scissors, Bell, UserCircle, ChevronLeft } from 'lucide-react'

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

  const sections = [
    {
      title: '기본 정보',
      fields: [
        { name: 'name', label: '이름', placeholder: '홍길동', required: true },
        { name: 'salon_name', label: '소속 미용실', placeholder: '미쁨헤어' },
        { name: 'position', label: '직책', placeholder: '원장 / 수석디자이너' },
        { name: 'career', label: '경력', placeholder: '10년, 수상 이력 등' },
        { name: 'phone', label: '연락처', placeholder: '010-0000-0000' },
      ]
    },
    {
      title: '영업 정보',
      fields: [
        { name: 'business_hours', label: '영업시간', placeholder: '10:00 ~ 20:00' },
        { name: 'day_off', label: '정기 휴무일', placeholder: '매주 일요일' },
      ]
    },
    {
      title: '예약 링크',
      fields: [
        { name: 'kakao_link', label: '카카오톡 채널', placeholder: 'https://pf.kakao.com/...' },
        { name: 'naver_link', label: '네이버 예약', placeholder: 'https://booking.naver.com/...' },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 */}
      <div className="bg-white px-5 pt-14 pb-4 border-b border-zinc-100 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="p-1 -ml-1 rounded-lg hover:bg-zinc-100 transition">
          <ChevronLeft size={20} className="text-zinc-600" />
        </button>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">프로필</h2>
      </div>

      <form onSubmit={handleSave} className="max-w-lg mx-auto px-5 py-5 space-y-6">
        {sections.map(section => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase mb-3">{section.title}</p>
            <div className="border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
              {section.fields.map(f => (
                <div key={f.name} className="flex items-center px-4 py-3 gap-3">
                  <label className="text-xs font-semibold text-zinc-500 w-20 flex-shrink-0">
                    {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <input
                    name={f.name}
                    value={(form as any)[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    className="flex-1 text-sm text-zinc-900 bg-transparent outline-none placeholder:text-zinc-300 tracking-tight"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 임시 휴무일 */}
        <div>
          <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase mb-3">임시 휴무일</p>
          <div className="border border-zinc-100 rounded-xl p-4">
            <textarea
              name="temp_holidays"
              value={form.temp_holidays}
              onChange={handleChange}
              rows={3}
              className="w-full text-sm text-zinc-900 bg-transparent outline-none resize-none placeholder:text-zinc-300 leading-relaxed"
              placeholder={'예) 2026.06.05 (수) 개인 사정\n2026.06.10~11 여름 휴가'}
            />
            <p className="text-[10px] text-zinc-400 mt-2">설정 시 시술 완료 문자에 자동으로 포함됩니다</p>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 active:scale-[0.99] transition disabled:opacity-40">
          {saving ? '저장 중...' : saved ? '저장됐어요' : '저장하기'}
        </button>
      </form>

      <BottomNavBar activeMenu="profile" router={router} />
    </div>
  )
}

function BottomNavBar({ activeMenu, router }: { activeMenu: string; router: any }) {
  const menus = [
    { k: 'home', l: '오늘', Icon: CalendarDays, path: '/dashboard' },
    { k: 'customers', l: '고객', Icon: Users, path: '/customers' },
    { k: 'service', l: '시술', Icon: Scissors, path: '/service/new' },
    { k: 'revisit', l: '재방문', Icon: Bell, path: '/revisit' },
    { k: 'profile', l: '프로필', Icon: UserCircle, path: '/profile' },
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 max-w-lg mx-auto flex justify-around items-center py-2 px-2">
      {menus.map(({ k, l, Icon, path }) => {
        const isAct = activeMenu === k
        return (
          <button key={k} onClick={() => router.push(path)}
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all active:scale-95">
            <Icon size={20} strokeWidth={isAct ? 2 : 1.5} className={isAct ? 'text-[#B37346]' : 'text-zinc-400'} />
            <span className={'text-[10px] font-medium ' + (isAct ? 'text-[#B37346]' : 'text-zinc-400')}>{l}</span>
          </button>
        )
      })}
    </div>
  )
}
