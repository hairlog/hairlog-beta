import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

type VisitStatus = 'recent' | 'warn' | 'danger' | 'none'

function getVisitStatus(last_visit_at: string | null): VisitStatus {
  if (!last_visit_at) return 'none'
  const days = Math.floor((Date.now() - new Date(last_visit_at).getTime()) / 86400000)
  if (days >= 60) return 'danger'
  if (days >= 30) return 'warn'
  return 'recent'
}

const STATUS_META: Record<VisitStatus, { dot: string; badge: string; label: string }> = {
  recent: { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700',  label: '최근방문' },
  warn:   { dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', label: '방문권장' },
  danger: { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-600',       label: '장기미방문' },
  none:   { dot: 'bg-gray-300',   badge: 'bg-gray-100 text-gray-500',     label: '-' },
}

const SVC_FILTERS = [
  { k: 'all', label: '전체' },
  { k: '컷', label: '✂️ 컷' },
  { k: '염색', label: '🎨 염색' },
  { k: '파마', label: '🌀 파마' },
  { k: '클리닉', label: '💊 클리닉' },
  { k: '두피', label: '🌿 두피' },
]

export default function Customers() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState<'all'|'female'|'male'>('all')
  const [statusFilter, setStatusFilter] = useState<'all'|'recent'|'warn'|'danger'>('all')
  const [svcFilter, setSvcFilter] = useState('all')

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSession(s)
    loadCustomers(s.designer_id)
  }, [])

  async function loadCustomers(designer_id: string) {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*')
      .eq('designer_id', designer_id).order('last_visit_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }

  const filtered = customers.filter(c => {
    const q = search.trim()
    const matchSearch = !q || c.name?.includes(q) || c.phone?.replace(/-/g,'').slice(-4) === q || c.phone?.includes(q)
    const matchGender = genderFilter === 'all' || c.gender === genderFilter
    const matchStatus = statusFilter === 'all' || getVisitStatus(c.last_visit_at) === statusFilter
    const matchSvc = svcFilter === 'all'
    return matchSearch && matchGender && matchStatus && matchSvc
  })

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="bg-white/90 sticky top-0 z-50 px-4 py-4 flex items-center gap-3 border-b border-gray-100 backdrop-blur-md">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition text-xl font-bold">←</button>
        <h2 className="text-xl font-bold tracking-tight">고객 목록</h2>
        <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">총 {customers.length}명</span>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
          placeholder="🔍 이름 또는 뒷번호(4자리) 검색"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white border-b border-gray-100 px-4 pb-3 pt-2 space-y-2">
        <div className="flex gap-2">
          {[{v:'all',l:'전체'},{v:'female',l:'여성 👩'},{v:'male',l:'남성 👨'}].map(({v,l}) => (
            <button key={v} onClick={() => setGenderFilter(v as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${genderFilter===v?'bg-amber-500 text-white border-amber-500':'bg-white text-gray-500 border-gray-200'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {SVC_FILTERS.map(({k, label}) => (
            <button key={k} onClick={() => setSvcFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap ${svcFilter===k?'bg-amber-500 text-white border-amber-500':'bg-white text-gray-500 border-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{v:'all',l:'전체'},{v:'recent',l:'🟢 최근방문'},{v:'warn',l:'🟡 방문권장'},{v:'danger',l:'🔴 장기미방문'}].map(({v,l}) => (
            <button key={v} onClick={() => setStatusFilter(v as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${statusFilter===v?'bg-amber-500 text-white border-amber-500':'bg-white text-gray-500 border-gray-200'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-10">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-10">해당하는 고객이 없어요</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => {
              const status = getVisitStatus(c.last_visit_at)
              const meta = STATUS_META[status]
              const last4 = c.phone?.replace(/-/g,'').slice(-4)
              const daysAgo = c.last_visit_at
                ? Math.floor((Date.now() - new Date(c.last_visit_at).getTime()) / 86400000) : null
              return (
                <Link key={c.id} href={`/customers/${c.id}`}
                  className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:shadow-md transition cursor-pointer block shadow-sm border border-gray-100 active:scale-[0.99]">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                    {c.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm">{c.name}</span>
                      {last4 && <span className="text-xs text-gray-400">({last4})</span>}
                      {c.gender === 'female' && <span className="text-xs bg-pink-100 text-pink-600 rounded-full px-1.5 py-0.5">여</span>}
                      {c.gender === 'male' && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">남</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {daysAgo !== null ? `${daysAgo}일 전 방문` : '방문 기록 없음'}
                    </p>
                  </div>
                  {status !== 'none' && (
                    <span className={`text-xs px-2 py-1 rounded-full font-bold flex-shrink-0 ${meta.badge}`}>
                      {meta.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <BottomNavBar activeMenu="customers" router={router} />
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
