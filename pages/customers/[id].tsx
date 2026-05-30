import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import {
  ChevronLeft, Bell, Pencil, Trash2, Send, ChevronDown, ChevronUp,
  Lock, StickyNote, Image as ImageIcon, X, CheckCircle, Clock, XCircle
} from 'lucide-react'

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
    <div className="min-h-screen bg-white pb-12">
      {/* 헤더 */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-zinc-100 flex items-center gap-2">
        <button onClick={() => router.push('/customers')}
          className="w-9 h-9 -ml-1 flex items-center justify-center rounded-lg hover:bg-zinc-50 transition">
          <ChevronLeft size={20} className="text-zinc-500" />
        </button>
        <h2 className="text-base font-bold tracking-tight text-zinc-900">{customer.name} 고객 이력</h2>
        <button onClick={() => router.push('/revisit')}
          className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#B37346]">
          <Bell size={13} strokeWidth={2} /> 알림 보내기
        </button>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">

        {/* 고객 프로필 */}
        <div className="border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
              {customer.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-lg text-zinc-900 tracking-tight">{customer.name}</span>
                {customer.gender === 'female' && <span className="badge-brown">여성</span>}
                {customer.gender === 'male' && <span className="badge-gray">남성</span>}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 tracking-tight">{customer.phone}</p>
              {/* 동의 상태 */}
              <div className="mt-1.5">
                {customer.consent_status === 'rejected' ? (
                  <span className="inline-flex items-center gap-1 badge-red"><XCircle size={11} /> 동의 거절</span>
                ) : customer.privacy_agreed ? (
                  <span className="inline-flex items-center gap-1 badge-green">
                    <CheckCircle size={11} /> 동의완료 ({customer.consent_type === 'oral' ? '구두' : '문자'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 badge-yellow"><Clock size={11} /> 동의 대기</span>
                )}
              </div>
            </div>
          </div>

          {/* 동의 재요청 버튼 */}
          {(customer.consent_status === 'rejected' || customer.consent_status === 'pending') && (
            <button onClick={sendConsentAgain} disabled={sendingConsent}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-semibold mb-3 disabled:opacity-50 transition">
              <Send size={13} /> {sendingConsent ? '발송 중...' : '동의 문자 재요청 보내기'}
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-zinc-50 rounded-xl p-3 text-center">
              <p className="text-xs text-zinc-400">총 방문</p>
              <p className="font-bold text-zinc-900 text-lg mt-0.5">{records.length}회</p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3 text-center">
              <p className="text-xs text-zinc-400">마지막 방문</p>
              <p className="font-bold text-zinc-900 text-lg mt-0.5">{daysAgo !== null ? `${daysAgo}일 전` : '-'}</p>
            </div>
          </div>

          {/* 수정/삭제 버튼 */}
          <div className="flex gap-2">
            <button onClick={() => setShowEdit(!showEdit)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition">
              <Pencil size={13} /> 정보 수정
            </button>
            <button onClick={deleteCustomer}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-red-200 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition">
              <Trash2 size={13} /> 고객 삭제
            </button>
          </div>

          {/* 수정 폼 */}
          {showEdit && (
            <div className="mt-3 space-y-2.5 border-t border-zinc-100 pt-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">이름</label>
                <input className="input text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">전화번호</label>
                <input className="input text-sm" value={editPhone} onChange={e => setEditPhone(e.target.value)} inputMode="tel" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1 py-2.5">{saving ? '저장 중...' : '저장'}</button>
                <button onClick={() => setShowEdit(false)} className="btn-secondary flex-1 py-2.5">취소</button>
              </div>
            </div>
          )}
        </div>

        {/* 디자이너 메모 */}
        <div className="border border-zinc-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <StickyNote size={14} className="text-[#B37346]" />
              <span className="text-sm font-semibold text-zinc-900">디자이너 메모</span>
              <span className="badge-gray">고객 비공개</span>
            </div>
            <button onClick={() => setEditingMemo(!editingMemo)}
              className="flex items-center gap-1 text-xs text-[#B37346] font-semibold">
              <Pencil size={12} /> 수정
            </button>
          </div>
          {editingMemo ? (
            <div>
              <textarea value={memoVal} onChange={e => setMemoVal(e.target.value)} rows={3}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={saveMemo} className="btn-primary flex-1 py-2.5">저장</button>
                <button onClick={() => { setEditingMemo(false); setMemoVal(customer.designer_memo || '') }}
                  className="btn-secondary flex-1 py-2.5">취소</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 leading-relaxed">
              {customer.designer_memo || <span className="text-zinc-300">메모가 없어요</span>}
            </p>
          )}
        </div>

        {/* 시술 이력 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">전체 시술 이력</span>
            <span className="text-xs text-zinc-400">{records.length}건</span>
          </div>
          {records.length === 0 ? (
            <div className="border border-zinc-100 rounded-xl p-8 text-center text-zinc-400 text-sm">시술 기록이 없어요</div>
          ) : (
            <div className="space-y-3">
              {records.map((r, idx) => {
                const isOpen = expanded === r.id
                const isLatest = idx === 0
                return (
                  <div key={r.id} className={`border rounded-xl overflow-hidden ${isLatest ? 'border-[#E4D4C5]' : 'border-zinc-100'}`}>
                    <div className="px-4 py-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-zinc-400 tracking-tight">{r.service_date}</span>
                        {isLatest && <span className="badge-brown">최근</span>}
                      </div>
                      <div className="font-bold text-base text-zinc-900 mb-2 tracking-tight">{r.service_type}</div>
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {r.damage_level && <span className="badge-yellow">손상도 {r.damage_level}</span>}
                        {r.gender === 'female' && <span className="badge-brown">여</span>}
                        {r.gender === 'male' && <span className="badge-gray">남</span>}
                      </div>
                      {(r.care_method || r.caution || r.next_service || r.memo) && (
                        <button onClick={() => setExpanded(isOpen ? null : r.id)}
                          className="flex items-center gap-1 text-xs text-[#B37346] font-medium mt-2">
                          {isOpen ? <><ChevronUp size={13} /> 접기</> : <><ChevronDown size={13} /> 손질법·주의사항 보기</>}
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <div className="px-4 pb-3.5 border-t border-zinc-50 space-y-2.5 pt-3">
                        {r.care_method && <div><span className="text-xs text-zinc-400 block">손질법</span><p className="text-sm text-zinc-600 leading-relaxed mt-0.5">{r.care_method}</p></div>}
                        {r.caution && <div><span className="text-xs text-zinc-400 block">주의사항</span><p className="text-sm text-zinc-600 leading-relaxed mt-0.5">{r.caution}</p></div>}
                        {r.next_service && <div><span className="text-xs text-zinc-400 block">다음 시술 권장</span><p className="text-sm text-zinc-600 mt-0.5">{r.next_service}</p></div>}
                        {r.memo && <div><span className="text-xs text-zinc-400 block">메모</span><p className="text-sm text-zinc-600 leading-relaxed mt-0.5">{r.memo}</p></div>}
                      </div>
                    )}
                    {r.secret_recipe && (
                      <div className="bg-zinc-900 px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#D9A878]"><Lock size={11} /> 비밀 레시피</span>
                        <p className="text-sm text-zinc-200 font-mono leading-relaxed mt-1">{r.secret_recipe}</p>
                      </div>
                    )}
                    {r.cust_memo && (
                      <div className="bg-zinc-50 px-4 py-3 border-t border-zinc-100">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 mb-1">
                          <StickyNote size={11} className="text-[#B37346]" /> 메모 <span className="font-normal text-zinc-400">(고객 비공개)</span>
                        </span>
                        <p className="text-sm text-zinc-600 leading-relaxed">{r.cust_memo}</p>
                      </div>
                    )}
                    {r.photo_urls && r.photo_urls.length > 0 && (
                      <div className="px-4 pb-3.5 border-t border-zinc-50 pt-3">
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-400 mb-2"><ImageIcon size={11} /> 시술 사진</span>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {r.photo_urls.map((url: string, i: number) => (
                            <img key={i} src={url} alt="" className="w-16 h-16 rounded-xl object-cover cursor-pointer border border-zinc-200"
                              onClick={() => setPhotoModal(r.photo_urls)} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="px-4 py-2.5 border-t border-zinc-50">
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        {r.sms_sent ? <><CheckCircle size={11} className="text-emerald-500" /> 문자 발송됨</> : '문자 미발송'}
                      </span>
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
          <div className="flex justify-end p-4">
            <button className="w-9 h-9 flex items-center justify-center text-white"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-x-auto flex items-center gap-4 px-4">
            {photoModal.map((url, i) => <img key={i} src={url} alt="" className="max-h-full max-w-xs rounded-xl object-contain" onClick={e => e.stopPropagation()} />)}
          </div>
        </div>
      )}
    </div>
  )
}
