import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSession, clearSession } from '../lib/auth'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { CalendarDays, Users, Scissors, Bell, UserCircle, ChevronRight, CheckCircle } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [todayRecords, setTodayRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSession(s)
    loadToday(s.designer_id)
  }, [])

  async function loadToday(designer_id: string) {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('service_records').select('*, customers(name, phone)')
      .eq('designer_id', designer_id).eq('service_date', today)
      .order('created_at', { ascending: false })
    setTodayRecords(data || [])
    setLoading(false)
  }

  if (!session) return null

  const todayStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  const displayed = showAll ? todayRecords : todayRecords.slice(0, 4)

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 */}
      <div className="bg-white px-5 pt-14 pb-5 border-b border-zinc-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">헤어로그</h1>
            <p className="text-xs text-zinc-400 mt-0.5 tracking-tight">{todayStr}</p>
          </div>
          <button onClick={() => { clearSession(); router.replace('/') }}
            className="text-xs text-zinc-400 border border-zinc-200 rounded-lg px-3 py-1.5 mt-1 hover:bg-zinc-50 transition">
            로그아웃
          </button>
        </div>
        <p className="text-sm text-zinc-500 mt-4">
          안녕하세요, <span className="font-semibold text-zinc-900">{session.nickname}</span>님
        </p>
      </div>

      <div className="px-5 py-5 max-w-lg mx-auto space-y-6">

        {/* 오늘 시술 현황 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">오늘 시술</span>
            <span className="text-xs text-zinc-400 tracking-tight">{todayRecords.length}건</span>
          </div>

          {loading ? (
            <div className="border border-zinc-100 rounded-xl p-6 text-center text-sm text-zinc-400">불러오는 중...</div>
          ) : todayRecords.length === 0 ? (
            <div className="border border-zinc-100 rounded-xl p-6 text-center">
              <p className="text-sm text-zinc-400">오늘 시술 기록이 없어요</p>
              <Link href="/service/new" className="text-xs font-semibold text-zinc-900 mt-2 inline-block underline underline-offset-2">
                첫 시술 기록하기
              </Link>
            </div>
          ) : (
            <div className="border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
              {displayed.map(r => {
                const name = r.customers?.name || '고객'
                const phone = r.customers?.phone || ''
                const last4 = phone.replace(/-/g,'').slice(-4)
                return (
                  <Link key={r.id} href={`/customers/${r.customer_id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 transition">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-zinc-900 tracking-tight">{name}</span>
                        {last4 && <span className="text-xs text-zinc-400 tracking-tight">({last4})</span>}
                        {r.gender === 'female' && <span className="text-[10px] bg-[#F5EFEA] text-[#8A624A] rounded-full px-1.5 py-0.5 font-medium">여</span>}
                        {r.gender === 'male' && <span className="text-[10px] bg-zinc-100 text-zinc-500 rounded-full px-1.5 py-0.5 font-medium">남</span>}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">{r.service_type}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <CheckCircle size={12} className="text-emerald-500"/>
                        <span className="text-[10px] text-emerald-600 font-medium">완료</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">{r.sms_sent ? '문자 발송' : '미발송'}</span>
                    </div>
                  </Link>
                )
              })}
              {todayRecords.length > 4 && (
                <button onClick={() => setShowAll(!showAll)}
                  className="w-full py-3 text-xs font-medium text-zinc-500 hover:bg-zinc-50 transition flex items-center justify-center gap-1">
                  {showAll ? '접기' : `${todayRecords.length - 4}건 더 보기`}
                  <ChevronRight size={12} className={showAll ? 'rotate-90' : '-rotate-90'} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 메뉴 */}
        <div>
          <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase block mb-3">메뉴</span>
          <div className="border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
            {[
              { href: '/service/new', Icon: Scissors, label: '시술 기록 작성', sub: '새 시술 내역 기록' },
              { href: '/customers', Icon: Users, label: '고객 목록', sub: '고객 검색 및 시술 이력' },
              { href: '/revisit', Icon: Bell, label: '재방문 관리', sub: '장기 미방문 고객 알림' },
              { href: '/profile', Icon: UserCircle, label: '내 프로필', sub: '소속, 경력, 예약링크' },
            ].map(({ href, Icon, label, sub }) => (
              <Link key={href} href={href}
                className="flex items-center gap-4 px-4 py-4 hover:bg-zinc-50 transition active:bg-zinc-100">
                <div className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={17} strokeWidth={1.5} className="text-zinc-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900 tracking-tight">{label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
                </div>
                <ChevronRight size={15} className="text-zinc-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <BottomNavBar activeMenu="home" router={router} />
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
