import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { CalendarDays, Users, Scissors, Bell, UserCircle, Search, ChevronRight } from 'lucide-react'

type VisitStatus = 'recent' | 'warn' | 'danger' | 'none'

function getVisitStatus(last_visit_at: string | null): VisitStatus {
  if (!last_visit_at) return 'none'
  const days = Math.floor((Date.now() - new Date(last_visit_at).getTime()) / 86400000)
  if (days >= 60) return 'danger'
  if (days >= 30) return 'warn'
  return 'recent'
}

const STATUS_META: Record<VisitStatus, { dot: string; label: string; badge: string }> = {
  recent: { dot: 'bg-emerald-400', label: '최근방문', badge: 'bg-emerald-50 text-emerald-700' },
  warn:   { dot: 'bg-amber-400',   label: '방문권장', badge: 'bg-amber-50 text-amber-700' },
  danger: { dot: 'bg-red-400',     label: '장기미방문', badge: 'bg-red-50 text-red-600' },
  none:   { dot: 'bg-zinc-200',    label: '-', badge: 'bg-zinc-100 text-zinc-500' },
}

const SVC_FILTERS = ['전체', '컷', '염색', '파마', '클리닉', '두피']
const STATUS_FILTERS = [
  { v: 'all', l: '전체' },
  { v: 'recent', l: '최근방문' },
  { v: 'warn', l: '방문권장' },
  { v: 'danger', l: '장기미방문' },
]

export default function Customers() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState<'all'|'female'|'male'>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [svcFilter, setSvcFilter] = useState('전체')

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
    const matchSvc = svcFilter === '전체'
    return matchSearch && matchGender && matchStatus && matchSvc
  })

  if (!session) return null

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 */}
      <div className="bg-white px-5 pt-14 pb-4 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">고객</h2>
          <span className="text-xs text-zinc-400 tracking-tight">{customers.length}명</span>
        </div>
        {/* 검색 */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className="w-full bg-zinc-50 border border-zinc-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-300 transition placeholder:text-zinc-400"
            placeholder="이름 또는 뒷번호 4자리"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white px-5 py-3 border-b border-zinc-100 space-y-2.5">
        {/* 성별 */}
        <div className="flex gap-2">
          {[{v:'all',l:'전체'},{v:'female',l:'여성'},{v:'male',l:'남성'}].map(({v,l}) => (
            <button key={v} onClick={() => setGenderFilter(v as any)}
              className={'px-3 py-1.5 rounded-full text-xs font-semibold border transition ' +
                (genderFilter===v ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200')}>
              {l}
            </button>
          ))}
        </div>
        {/* 시술 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {SVC_FILTERS.map(f => (
            <button key={f} onClick={() => setSvcFilter(f)}
              className={'px-3 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap ' +
                (svcFilter===f ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200')}>
              {f}
            </button>
          ))}
        </div>
        {/* 방문 상태 */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({v,l}) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={'px-3 py-1.5 rounded-full text-xs font-semibold border transition ' +
                (statusFilter===v ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 고객 목록 */}
      <div className="max-w-lg mx-auto">
        {loading ? (
          <p className="text-center text-zinc-400 text-sm py-12">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-12">해당하는 고객이 없어요</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map(c => {
              const status = getVisitStatus(c.last_visit_at)
              const meta = STATUS_META[status]
              const last4 = c.phone?.replace(/-/g,'').slice(-4)
              const daysAgo = c.last_visit_at
                ? Math.floor((Date.now() - new Date(c.last_visit_at).getTime()) / 86400000) : null
              return (
                <Link key={c.id} href={`/customers/${c.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition active:bg-zinc-100">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                  <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {c.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-zinc-900 tracking-tight">{c.name}</span>
                      {last4 && <span className="text-xs text-zinc-400 tracking-tight">({last4})</span>}
                      {c.gender === 'female' && <span className="text-[10px] bg-[#F5EFEA] text-[#8A624A] rounded-full px-1.5 py-0.5 font-medium">여</span>}
                      {c.gender === 'male' && <span className="text-[10px] bg-zinc-100 text-zinc-500 rounded-full px-1.5 py-0.5 font-medium">남</span>}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 tracking-tight">
                      {daysAgo !== null ? `${daysAgo}일 전 방문` : '방문 기록 없음'}
                    </p>
                  </div>
                  {status !== 'none' && (
                    <span className={'text-[10px] px-2 py-1 rounded-full font-semibold flex-shrink-0 ' + meta.badge}>
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
