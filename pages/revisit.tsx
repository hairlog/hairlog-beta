import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function Revisit() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | '30' | '60'>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState('안녕하세요! 방문해 주셔서 감사합니다. 오랫동안 뵙지 못했는데 다시 방문해 주시면 정성껏 시술해 드리겠습니다 😊')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push('/'); return }
    setSession(s)
    loadCustomers(s.designer_id)
  }, [])

  async function loadCustomers(designer_id: string) {
    const { data } = await supabase.from('customers').select('*').eq('designer_id', designer_id).order('last_visit_at', { ascending: true })
    setCustomers(data || [])
  }

  function getDays(last_visit_at: string) {
    if (!last_visit_at) return 999
    return Math.floor((Date.now() - new Date(last_visit_at).getTime()) / (1000 * 60 * 60 * 24))
  }

  const filtered = customers.filter(c => {
    const days = getDays(c.last_visit_at)
    if (filter === '30') return days >= 30 && days < 60
    if (filter === '60') return days >= 60
    return days >= 30
  })

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function selectAll() {
    if (selected.length === filtered.length) setSelected([])
    else setSelected(filtered.map(c => c.id))
  }

  async function sendBulk() {
    if (selected.length === 0) { alert('고객을 선택해주세요'); return }
    if (!confirm(`${selected.length}명에게 문자를 발송할까요?`)) return
    setSending(true)
    const res = await fetch('/api/sms/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designer_id: session.designer_id, customer_ids: selected, message }),
    })
    setSending(false)
    if (res.ok) { alert('문자 발송 완료!'); setSelected([]) }
    else alert('발송 중 오류가 발생했어요')
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500">←</button>
        <h2 className="text-lg font-semibold">재방문 관리</h2>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* 필터 */}
        <div className="flex gap-2">
          {[['all', '전체'], ['30', '재방문 필요 (30일+)'], ['60', '장기미방문 (60일+)']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val as any)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${filter === val ? 'bg-accent text-white' : 'bg-white text-gray-500 border'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* 일괄 메시지 */}
        <div className="card">
          <label className="block text-sm font-medium mb-2">발송할 메시지</label>
          <textarea className="input text-sm" rows={3} value={message} onChange={e => setMessage(e.target.value)} />
        </div>

        {/* 고객 목록 */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{filtered.length}명</p>
          <button onClick={selectAll} className="text-sm text-accent font-medium">
            {selected.length === filtered.length ? '전체 해제' : '전체 선택'}
          </button>
        </div>

        <div className="space-y-2">
          {filtered.map(c => {
            const days = getDays(c.last_visit_at)
            const isLong = days >= 60
            return (
              <div key={c.id} onClick={() => toggleSelect(c.id)}
                className={`card flex items-center gap-3 cursor-pointer transition ${selected.includes(c.id) ? 'border-2 border-accent' : ''}`}>
                <input type="checkbox" checked={selected.includes(c.id)} onChange={() => {}} className="w-4 h-4 accent-amber-500" />
                <div className="flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-gray-400">{c.phone}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${isLong ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {days}일 전
                </span>
              </div>
            )
          })}
        </div>

        {selected.length > 0 && (
          <button onClick={sendBulk} disabled={sending} className="btn-primary w-full sticky bottom-4">
            {sending ? '발송 중...' : `📨 선택한 ${selected.length}명에게 문자 발송`}
          </button>
        )}
      </div>
    </div>
  )
}
