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
  const [selected, setSelected] = useState<any>(null)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/customers')} className="text-gray-500">←</button>
        <h2 className="text-lg font-semibold">{customer.name}</h2>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* 고객 기본 정보 */}
        <div className="card">
          <p className="font-semibold text-lg">{customer.name}</p>
          <p className="text-gray-500 text-sm">{customer.phone}</p>
          {customer.last_visit_at && (
            <p className="text-xs text-gray-400 mt-1">마지막 방문: {new Date(customer.last_visit_at).toLocaleDateString('ko-KR')}</p>
          )}
        </div>

        {/* 시술 이력 */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">시술 이력 ({records.length}건)</h3>
          {records.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">시술 기록이 없어요</p>
          ) : (
            <div className="space-y-2">
              {records.map(r => (
                <div key={r.id}>
                  <button
                    onClick={() => setSelected(selected?.id === r.id ? null : r)}
                    className="card w-full text-left hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{r.service_type}</span>
                      <span className="text-sm text-gray-400">{r.service_date}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{r.service_date} · {r.service_type}</p>
                  </button>

                  {/* 상세 펼치기 */}
                  {selected?.id === r.id && (
                    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 mt-1 space-y-2 text-sm">
                      {r.memo && <div><span className="text-gray-500">메모: </span>{r.memo}</div>}
                      {r.secret_recipe && (
                        <div className="bg-orange-50 rounded-lg p-2">
                          <span className="text-orange-600 font-medium">🔒 비밀 레시피: </span>
                          <span className="text-orange-800">{r.secret_recipe}</span>
                        </div>
                      )}
                      <div><span className="text-gray-500">문자 발송: </span>{r.sms_sent ? '✅ 발송됨' : '미발송'}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
