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
      .from('service_records')
      .select('*, customers(name, phone)')
      .eq('designer_id', designer_id)
      .eq('service_date', today)
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
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-accent">헤어로그</h1>
          <p className="text-xs text-gray-400 mt-0.5">{todayStr}</p>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5">로그아웃</button>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        <p className="text-gray-500 text-sm">안녕하세요, <span className="font-semibold text-primary">{session.nickname}</span>님 👋</p>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-gray-700">📋 오늘 시술 현황</h2>
            <span className="text-xs text-gray-400">{todayRecords.length}건 완료</span>
          </div>
          {loadingToday ? (
            <div className="card text-center py-4 text-sm text-gray-400">불러오는 중...</div>
          ) : todayRecords.length === 0 ? (
            <div className="card text-center py-5">
              <p className="text-gray-400 text-sm">오늘 시술 기록이 없어요</p>
              <Link href="/service/new" className="text-accent text-sm font-medium mt-2 inline-block">+ 첫 시술 기록하기</Link>
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
                      className="card flex items-center gap-3 hover:shadow-md transition cursor-pointer block">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                        {name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm">{name}</span>
                          {last4 && <span className="text-xs text-gray-400">({last4})</span>}
                          {r.gender === 'female' && <span className="text-xs bg-pink-100 text-pink-600 rounded-full px-1.5 py-0.5">여</span>}
                          {r.gender === 'male' && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">남</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{r.service_type}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">완료 ✅</span>
                        <span className="text-xs text-gray-400">{r.sms_sent ? '문자 발송됨' : '문자 미발송'}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
              {hasMore && (
                <button onClick={() => setShowAll(!showAll)}
                  className="w-full mt-2 py-2 text-xs text-accent font-semibold border border-accent rounded-lg bg-white hover:bg-amber-50 transition">
                  {showAll ? '▲ 접기' : `▼ 더보기 (${todayRecords.length - 4}건 더)`}
                </button>
              )}
            </>
          )}
        </div>

        <div className="space-y-3">
          <Link href="/service/new" className="card flex items-center gap-4 hover:shadow-md transition cursor-pointer block">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white text-2xl">✂️</div>
            <div><p className="font-semibold">시술 기록 작성</p><p className="text-sm text-gray-400">새 시술 내역을 기록해요</p></div>
          </Link>
          <Link href="/customers" className="card flex items-center gap-4 hover:shadow-md transition cursor-pointer block">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">👥</div>
            <div><p className="font-semibold">고객 목록</p><p className="text-sm text-gray-400">고객 검색 및 시술 이력 확인</p></div>
          </Link>
          <Link href="/revisit" className="card flex items-center gap-4 hover:shadow-md transition cursor-pointer block">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">🔔</div>
            <div><p className="font-semibold">재방문 관리</p><p className="text-sm text-gray-400">장기 미방문 고객 문자 발송</p></div>
          </Link>
          <Link href="/profile" className="card flex items-center gap-4 hover:shadow-md transition cursor-pointer block">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">💼</div>
            <div><p className="font-semibold">내 프로필</p><p className="text-sm text-gray-400">소속, 경력, 예약링크 관리</p></div>
          </Link>
        </div>
      </div>
    </div>
  )
}
