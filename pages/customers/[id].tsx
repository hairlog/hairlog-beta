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
  const [photoModal, setPhotoModal] = useState<string[] | null>(null)
  const [editingMemo, setEditingMemo] = useState(false)
  const [memoVal, setMemoVal] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingConsent, setSendingConsent] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSession(s)
  }, [])

  useEffect(() => { if (id) loadData() }, [id])

  async function loadData() {
    const { data: c } = await supabase.from('customers').select('*').eq('id', id).single()
    setCustomer(c)
    setMemoVal(c?.designer_memo || '')
    setEditName(c?.name || '')
    setEditPhone(c?.phone || '')
    const { data: r } = await supabase.from('service_records').select('*').eq('customer_id', id).order('created_at', { ascending: false })
    setRecords(r || [])
  }

  async function saveMemo() {
    await supabase.from('customers').update({ designer_memo: memoVal }).eq('id', id)
    setCustomer((prev: any) => ({ ...prev, designer_memo: memoVal }))
    setEditingMemo(false)
  }

  async function saveEdit() {
    setSaving(true)
    await fetch('/api/customers/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: id, name: editName, phone: editPhone })
    })
    setCustomer((prev: any) => ({ ...prev, name: editName, phone: editPhone }))
    setSaving(false); setShowEdit(false)
  }

  async function deleteCustomer() {
    if (!confirm('정말 이 고객 정보를 삭제하시겠습니까?\n삭제 시 기존 시술 기록은 복구가 불가능하며, 개인정보 동의 효력도 함께 파기됩니다. 추후 동일 고객을 재등록할 때는 개인정보 동의를 처음부터 다시 받으셔야 합니다.')) return
    const res = await fetch('/api/customers/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: id })
    })
    if (res.ok) { alert('삭제됐어요'); router.replace('/customers') }
    else alert('삭제 실패')
  }

  async function sendConsentAgain() {
    setSendingConsent(true)
    const res = await fetch('/api/consent/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: id, designer_id: session.designer_id })
    })
    setSendingConsent(false)
    if (res.ok) { alert('동의 문자를 재발송했어요!'); loadData() }
    else alert('발송 실패')
  }

  if (!session || !customer) return null

  const daysAgo = customer.last_visit_at
    ? Math.floor((Date.now() - new Date(customer.last_visit_at).getTime()) / 86400000) : null

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/customers')} className="text-gray-500 text-lg">←</button>
        <h2 className="text-lg font-semibold">{customer.name} 고객 이력</h2>
        <button onClick={() => router.push('/revisit')} className="ml-auto text-xs font-semibold text-accent">알림 보내기 →</button>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl flex-shrink-0">{customer.name?.[0]}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-lg">{customer.name}</span>
                <span className="text-sm text-gray-400">({customer.phone?.slice(-4)})</span>
                {customer.gender === 'female' && <span className="text-xs bg-pink-100 text-pink-600 rounded-full px-2 py-0.5">여성</span>}
                {customer.gender === 'male' && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">남성</span>}
              </div>
              <p className="text-xs text-gray-400 mt-1">{customer.phone}</p>
              <div className="mt-1">
                {customer.consent_status === 'rejected' ? (
                  <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5">동의 거절</span>
                ) : customer.privacy_agreed ? (
                  <span className="text-xs bg-green-100 text-green-600 rounded-full px-2 py-0.5">✅ 동의완료 ({customer.consent_type === 'oral' ? '구두' : '문자'})</span>
                ) : (
                  <span className="text-xs bg-yellow-100 text-yellow-600 rounded-full px-2 py-0.5">⏳ 동의 대기</span>
                )}
              </div>
            </div>
          </div>

          {(customer.consent_status === 'rejected' || customer.consent_status === 'pending') && (
            <button onClick={sendConsentAgain} disabled={sendingConsent}
              className="w-full py-2 bg-amber-50 border border-amber-300 text-amber-700 rounded-xl text-xs font-semibold mb-3">
              {sendingConsent ? '발송 중...' : '📨 동의 문자 재요청 보내기'}
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-400">총 방문</p>
              <p className="font-bold text-primary text-lg">{records.length}회</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-400">마지막 방문</p>
              <p className="font-bold text-primary">{daysAgo !== null ? `${daysAgo}일 전` : '-'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowEdit(!showEdit)} className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50">✏️ 정보 수정</button>
            <button onClick={deleteCustomer} className="flex-1 py-2 border border-red-200 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50">🗑 고객 삭제</button>
          </div>

          {showEdit && (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">이름</label>
                <input className="input text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">전화번호</label>
                <input className="input text-sm" value={editPhone} onChange={e => setEditPhone(e.target.value)} inputMode="tel" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold">{saving ? '저장 중...' : '저장'}</button>
                <button onClick={() => setShowEdit(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-xs text-gray-500">취소</button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span>📌</span>
              <span className="text-sm font-bold text-green-700">디자이너 메모</span>
              <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">고객 비공개</span>
            </div>
            <button onClick={() => setEditingMemo(!editingMemo)} className="text-xs text-accent font-semibold">수정 ✏️</button>
          </div>
          {editingMemo ? (
            <div>
              <textarea value={memoVal} onChange={e => setMemoVal(e.target.value)} rows={3}
                className="w-full border border-green-300 rounded-xl px-3 py-2 text-sm outline-none resize-none bg-white" />
              <div className="flex gap-2 mt-2">
                <button onClick={saveMemo} className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-bold">저장</button>
                <button onClick={() => { setEditingMemo(false); setMemoVal(customer.designer_memo || '') }}
                  className="flex-1 py-2 border border-gray-200 rounded-xl text-xs text-gray-500">취소</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">
              {customer.designer_memo || <span className="text-gray-400 italic">메모가 없어요</span>}
            </p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-3">전체 시술 이력 <span className="text-gray-400 font-normal">{records.length}건</span></h3>
          {records.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm shadow-sm">시술 기록이 없어요</div>
          ) : (
            <div className="space-y-3">
              {records.map((r, idx) => {
                const isOpen = expanded === r.id
                const isLatest = idx === 0
                return (
                  <div key={r.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${isLatest ? 'border-accent' : 'border-gray-200'}`}>
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">{r.service_date}</span>
                        {isLatest && <span className="text-xs bg-accent text-white rounded-full px-2 py-0.5">최근</span>}
                      </div>
                      <div className="font-bold text-base mb-2">{r.service_type}</div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {r.damage_level && <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">손상도 {r.damage_level}</span>}
                        {r.gender === 'female' && <span className="text-xs bg-pink-100 text-pink-600 rounded-full px-2 py-0.5">여</span>}
                        {r.gender === 'male' && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">남</span>}
                      </div>
                      {(r.care_method || r.caution || r.next_service) && (
                        <button onClick={() => setExpanded(isOpen ? null : r.id)} className="text-xs text-accent font-medium">
                          {isOpen ? '▲ 접기' : '▼ 손질법·주의사항 보기'}
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <div className="px-4 pb-3 border-t border-gray-50 space-y-2">
                        {r.care_method && <div className="pt-2"><span className="text-xs text-gray-400 block">손질법</span><p className="text-sm text-gray-700 leading-relaxed mt-0.5">{r.care_method}</p></div>}
                        {r.caution && <div><span className="text-xs text-gray-400 block">주의사항</span><p className="text-sm text-gray-700 leading-relaxed mt-0.5">{r.caution}</p></div>}
                        {r.next_service && <div><span className="text-xs text-gray-400 block">다음 시술 권장</span><p className="text-sm text-gray-700 mt-0.5">{r.next_service}</p></div>}
                        {r.memo && <div><span className="text-xs text-gray-400 block">메모</span><p className="text-sm text-gray-700 leading-relaxed mt-0.5">{r.memo}</p></div>}
                      </div>
                    )}
                    {r.secret_recipe && (
                      <div className="bg-gray-900 px-4 py-3">
                        <span className="text-xs font-bold text-accent">🔒 비밀 레시피</span>
                        <p className="text-sm text-gray-200 font-mono leading-relaxed mt-1">{r.secret_recipe}</p>
                      </div>
                    )}
                    {r.cust_memo && (
                      <div className="bg-green-50 px-4 py-3 border-t border-green-100">
                        <span className="text-xs font-bold text-green-700 block mb-1">📌 메모 <span className="font-normal text-gray-400">(고객 비공개)</span></span>
                        <p className="text-sm text-gray-700 leading-relaxed">{r.cust_memo}</p>
                      </div>
                    )}
                    {r.photo_urls && r.photo_urls.length > 0 && (
                      <div className="px-4 pb-3 border-t border-gray-50 pt-2">
                        <span className="text-xs text-gray-400 block mb-2">📸 시술 사진</span>
                        <div className="flex gap-2 flex-wrap">
                          {r.photo_urls.map((url: string, i: number) => (
                            <img key={i} src={url} alt="" className="w-16 h-16 rounded-xl object-cover cursor-pointer border border-gray-200"
                              onClick={() => setPhotoModal(r.photo_urls)} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="px-4 py-2 border-t border-gray-50">
                      <span className="text-xs text-gray-400">{r.sms_sent ? '✅ 문자 발송됨' : '문자 미발송'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {photoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col" onClick={() => setPhotoModal(null)}>
          <div className="flex justify-end p-4"><button className="text-white text-2xl font-bold">✕</button></div>
          <div className="flex-1 overflow-x-auto flex items-center gap-4 px-4">
            {photoModal.map((url, i) => <img key={i} src={url} alt="" className="max-h-full max-w-xs rounded-xl object-contain" onClick={e => e.stopPropagation()} />)}
          </div>
        </div>
      )}
    </div>
  )
}
