import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

export default function CustomerDetail() {
  const router = useRouter()
  const { id } = router.query
  const [session, setSession] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push('/'); return }
    setSession(s)
  }, [])

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function loadData() {
    const { data: c } = await supabase.from('customers').select('*').eq('id', id).single()
    setCustomer(c)
    const { data: r } = await supabase.from('service_records').select('*').eq('customer_id', id).order('service_date', { ascending: false })
    setRecords(r || [])
  }

  if (!session || !customer) return null

  const daysAgo = customer.last_visit_at
    ? Math.floor((Date.now() - new Date(customer.last_visit_at).getTime()) / 86400000)
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/customers')} className="text-gray-500 text-lg">←</button>
        <h2 className="text-lg font-semibold">{customer.name}</h2>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
              {customer.name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg">{customer.name}</p>
                {customer.gender === 'female' && <span className="text-xs bg-pink-100 text-pink-600 rounded-full px-2 py-0.5">여성</span>}
                {customer.gender === 'male' && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">남성</span>}
              </div>
              <p className="text-gray-500 text-sm">{customer.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-gray-400 text-xs">총 방문</p>
              <p className="font-bold text-primary">{records.length}회</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-gray-400 text-xs">마지막 방문</p>
              <p className="font-bold text-primary">{daysAgo !== null ? `${daysAgo}일 전` : '-'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-3">시술 이력 ({records.length}건)</h3>
          {records.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4 card">시술 기록이 없어요</p>
          ) : (
            <div className="space-y-2">
              {records.map((r, idx) => {
                const isOpen = expanded === r.id
                const isLatest = idx === 0
                return (
                  <div key={r.id} className={`rounded-xl overflow-hidden shadow-sm border ${isLatest ? 'border-accent' : 'border-gray-100'}`}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      className="w-full bg-white px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{r.service_type}</span>
                          {isLatest && <span className="text-xs bg-accent text-white rounded-full px-2 py-0.5">최근</span>}
                          {r.gender === 'female' && <span className="text-xs bg-pink-100 text-pink-600 rounded-full px-1.5 py-0.5">여</span>}
                          {r.gender === 'male' && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">남</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{r.service_date}</p>
                      </div>
                      <span className="text-gray-400 text-lg">{isOpen ? '∧' : '∨'}</span>
                    </button>

                    {isOpen && (
                      <div className="bg-white border-t border-gray-100 px-4 py-3 space-y-2 text-sm">
                        {r.damage_level && <Detail label="전체 손상도" val={r.damage_level} />}
                        {r.damage_part && <Detail label="부분 손상도" val={r.damage_part} />}
                        {r.care_method && <Detail label="손질법" val={r.care_method} />}
                        {r.caution && <Detail label="주의사항" val={r.caution} />}
                        {r.next_service && <Detail label="다음 시술 권장" val={r.next_service} />}
                        {r.memo && (
                          <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
                            <p className="text-xs font-semibold text-green-700 mb-1">📌 메모 <span className="font-normal text-gray-400">(고객 비공개)</span></p>
                            <p className="text-gray-700 leading-relaxed">{r.memo}</p>
                          </div>
                        )}
                        {r.secret_recipe && (
                          <div className="bg-orange-50 rounded-lg p-2.5 border border-orange-100">
                            <p className="text-xs font-semibold text-orange-700 mb-1">🔒 비밀 레시피 <span className="font-normal text-gray-400">(고객 비공개)</span></p>
                            <p className="text-orange-800 leading-relaxed">{r.secret_recipe}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 pt-1">{r.sms_sent ? '✅ 문자 발송됨' : '문자 미발송'}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({ label, val }: { label: string; val: string }) {
  return (
    <div>
      <span className="text-gray-400 text-xs">{label}</span>
      <p className="text-gray-800 leading-relaxed mt-0.5">{val}</p>
    </div>
  )
}
