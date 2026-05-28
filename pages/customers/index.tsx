import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Customers() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push('/'); return }
    setSession(s)
    loadCustomers(s.designer_id)
  }, [])

  async function loadCustomers(designer_id: string) {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').eq('designer_id', designer_id).order('last_visit_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }

  const filtered = customers.filter(c =>
    c.name.includes(search) || c.phone.includes(search)
  )

  function getVisitStatus(last_visit_at: string) {
    if (!last_visit_at) return null
    const days = Math.floor((Date.now() - new Date(last_visit_at).getTime()) / (1000 * 60 * 60 * 24))
    if (days >= 60) return { label: '장기미방문', color: 'bg-red-100 text-red-600' }
    if (days >= 30) return { label: '재방문필요', color: 'bg-orange-100 text-orange-600' }
    return null
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500">←</button>
        <h2 className="text-lg font-semibold">고객 목록</h2>
        <span className="ml-auto text-sm text-gray-400">{customers.length}명</span>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        <input
          className="input mb-4"
          placeholder="🔍 이름 또는 전화번호로 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-center text-gray-400 py-10">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-10">고객이 없어요</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => {
              const status = getVisitStatus(c.last_visit_at)
              return (
                <Link key={c.id} href={`/customers/${c.id}`} className="card flex items-center justify-between hover:shadow-md transition cursor-pointer block">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-gray-400">{c.phone}</p>
                    {c.last_visit_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        마지막 방문: {new Date(c.last_visit_at).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                  {status && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
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
