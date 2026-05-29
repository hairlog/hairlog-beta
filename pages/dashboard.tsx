import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSession, clearSession } from '../lib/auth'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [todayRecords, setTodayRecords] = useState<any[]>([])
  const [loadingToday, setLoadingToday] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSession(s)
    loadTodayRecords(s.designer_id)
  }, [])

  async function loadTodayRecords(designer_id: string) {
    setLoadingToday(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('service_records').select('*, customers(name, phone)')
      .eq('designer_id', designer_id).eq('service_date', today)
      .order('created_at', { ascending: false })
    setTodayRecords(data || [])
    setLoadingToday(false)
  }

  function logout() { clearSession(); router.replace('/') }

  if (!session) return null

  const todayStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  const displayed = showAll ? todayRecords : todayRecords.slice(0, 4)
  const hasMore = todayRecords.length > 4

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="bg-white/90 sticky top-0 z-50 px-4 py-4 flex justify-between items-center border-b border-gray-100 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-black text-amber-500">헤어로그</h1>
          <p className="text-xs text-gray-400 mt-0.5">{todayStr}</p>
        </div>
        <button onClick={logout} className="text-xs text-gray-400 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50 transition">로그아웃</button>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        <p className="text-gray-500 text-sm">안녕하세요, <span className="font-bold text-gray-800">{session.nickname}</span>님 👋</p>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-gray-700">📋 오늘 시술 현황</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{todayRecords.length}건 완료</span>
          </div>
          {loadingToday ? (
            <div className="bg-white rounded-2xl p-6 text-center text-sm text-gray-400 shadow-sm border border-gray-100">불러오는 중...</div>
          ) : todayRecords.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <p className="text-gray-400 text-sm">오늘 시술 기록이 없어요</p>
              <Link href="/service/new" className="text-amber-500 text-sm font-bold mt-2 inline-block">+ 첫 시술 기록하기</Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {displayed.map(r => {
                  const name = r.customers?.name || '고객'
                  const phone = r.customers?.phone || ''
                  const last4 = phone.replace(/-/g, '').slice(-4)
                  return (
                    <Link key={r.id} href={`/customers/${r.customer_id}`}
                      className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:shadow-md transition cursor-pointer block shadow-sm border border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-base flex-shrink-0">{name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">{name}</span>
                          {last4 && <span className="text-xs text-gray-400">({last4})</span>}
                          {r.gender === 'female' && <span className="text-xs bg-pink-100 text-pink-600 rounded-full px-1.5 py-0.5">여</span>}
                          {r.gender === 'male' && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">남</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{r.service_type}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">완료 ✅</span>
                        <span className="text-xs text-gray-400">{r.sms_sent ? '문자발송됨' : '미발송'}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
              {hasMore && (
                <button onClick={() => setShowAll(!showAll)}
                  className="w-full mt-2 py-2.5 text-xs text-amber-600 font-bold border border-amber-200 rounded-xl bg-amber-50 hover:bg-amber-100 transition">
                  {showAll ? '▲ 접기' : `▼ 더보기 (${todayRecords.length - 4}건 더)`}
                </button>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/service/new', icon: '✂️', bg: 'bg-amber-500', label: '시술 기록 작성', sub: '새 시술 내역 기록' },
            { href: '/customers', icon: '👥', bg: 'bg-blue-100', label: '고객 목록', sub: '고객 검색 및 이력 확인' },
            { href: '/revisit', icon: '🔔', bg: 'bg-orange-100', label: '재방문 관리', sub: '미방문 고객 문자 발송' },
            { href: '/profile', icon: '💼', bg: 'bg-green-100', label: '내 프로필', sub: '소속, 경력, 예약링크' },
          ].map(m => (
            <Link key={m.href} href={m.href}
              className="bg-white rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md transition shadow-sm border border-gray-100 active:scale-[0.98]">
              <div className={`w-11 h-11 ${m.bg} rounded-xl flex items-center justify-center text-xl ${m.bg === 'bg-amber-500' ? 'text-white' : ''}`}>{m.icon}</div>
              <div>
                <p className="font-bold text-sm text-gray-800">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNavBar activeMenu="home" router={router} />
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
