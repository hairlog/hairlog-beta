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
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('designer_id', designer_id)
      .order('last_visit_at', { ascending: false })
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
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 text-lg">←</button>
        <h2 className="text-lg font-semibold">고객 목록</h2>
        <span className="ml-auto text-sm text-gray-400 font-medium">총 {customers.length}명</span>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <input className="input text-sm" placeholder="🔍 이름 또는 뒷번호(4자리) 검색"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white border-b border-gray-100 px-4 pb-3 pt-2 space-y-2">
        <div className="flex gap-2">
          {[{v:'all',l:'전체'},{v:'female',l:'여성 👩'},{v:'male',l:'남성 👨'}].map(({v,l}) => (
            <button key={v} onClick={() => setGenderFilter(v as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${genderFilter===v?'bg-primary text-white border-primary':'bg-white text-gray-500 border-gray-300'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {SVC_FILTERS.map(({k, label}) => (
            <button key={k} onClick={() => setSvcFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap ${svcFilter===k?'bg-accent text-white border-accent':'bg-white text-gray-500 border-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{v:'all',l:'전체'},{v:'recent',l:'🟢 최근방문'},{v:'warn',l:'🟡 방문권장'},{v:'danger',l:'🔴 장기미방문'}].map(({v,l}) => (
            <button key={v} onClick={() => setStatusFilter(v as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${statusFilter===v?'bg-accent text-white border-accent':'bg-white text-gray-500 border-gray-300'}`}>
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
                  className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:shadow-md transition cursor-pointer block shadow-sm">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                    {c.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm">{c.name}</span>
                      {last4 && <span className="text-xs text-gray-400">({last4})</span>}
                      {c.gender === 'female' && <span className="text-xs bg-pink-100 text-pink-600 rounded-full px-1.5 py-0.5">여</span>}
                      {c.gender === 'male' && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">남</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {daysAgo !== null ? `${daysAgo}일 전 방문` : '방문 기록 없음'}
                    </p>
                  </div>
                  {status !== 'none' && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${meta.badge}`}>
                      {meta.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
