import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../lib/auth'
import { supabase } from '../lib/supabase'

const DEFAULT_MSGS: Record<string, { warn: string; danger: string }> = {
  cut: {
    warn: '안녕하세요 😊 지난번 컷 이후 슬슬 머리가 자라셨을 것 같아서 연락드렸어요!\n다음 컷 예약하시면 깔끔하게 정리해드릴게요 ✂️',
    danger: '안녕하세요 😊 오랜만이에요!\n요즘 머리 관리는 잘 되고 계신가요?\n언제든 편하게 연락 주세요, 기다리고 있을게요 ✂️',
  },
  color: {
    warn: '안녕하세요 😊 지난번 염색 이후 색이 많이 바래셨을 것 같아서 연락드렸어요!\n뿌염·재염색 시기가 됐어요 🎨\n요즘 트렌드 컬러도 예쁜 게 많아요, 같이 상담해봐요!',
    danger: '안녕하세요 😊 오랜만이에요!\n혹시 머리색 때문에 고민 중이신 거 있으시면\n편하게 연락 주세요 🎨 항상 반갑게 맞이할게요!',
  },
  perm: {
    warn: '안녕하세요 😊 지난번 파마 이후 슬슬 컬이 풀리셨을 것 같아서 연락드렸어요!\n다시 살려드릴까요? 🌀\n이번엔 새로운 스타일도 제안해드릴 수 있어요!',
    danger: '안녕하세요 😊 오랜만이에요!\n파마 풀리고 나서 어떻게 관리하고 계세요? 🌀\n언제든 편하게 오세요, 기다리고 있을게요!',
  },
  clinic: {
    warn: '안녕하세요 😊 지난번 클리닉 이후 주기가 됐어요!\n꾸준한 케어가 건강한 모발의 비결이에요 💊\n이번에도 모발 상태 꼼꼼하게 봐드릴게요!',
    danger: '안녕하세요 😊 오랜만이에요!\n모발 상태는 괜찮으신가요? 💊\n언제든 방문 주시면 집중 케어 해드릴게요!',
  },
  scalp: {
    warn: '안녕하세요 😊 지난번 두피케어 이후 주기가 됐어요!\n두피는 꾸준한 관리가 정말 중요해요 🌿\n이번에도 시원하게 케어해드릴게요!',
    danger: '안녕하세요 😊 오랜만이에요!\n두피 상태는 괜찮으신가요? 🌿\n가려움이나 불편함 있으시면 편하게 연락 주세요!',
  },
}

const DEFAULT_PERIODS: Record<string, number> = {
  cut: 35, color: 30, perm: 90, clinic: 14, scalp: 21,
}

const SVC_TABS = [
  { k: 'cut', icon: '✂️', label: '컷' },
  { k: 'color', icon: '🎨', label: '염색' },
  { k: 'perm', icon: '🌀', label: '파마' },
  { k: 'clinic', icon: '💊', label: '클리닉' },
  { k: 'scalp', icon: '🌿', label: '두피' },
]

function detectSvcType(serviceType: string): string {
  const t = serviceType?.toLowerCase() || ''
  if (t.includes('두피')) return 'scalp'
  if (t.includes('클리닉') || t.includes('트리트먼트')) return 'clinic'
  if (t.includes('파마') || t.includes('펌')) return 'perm'
  if (t.includes('염색') || t.includes('컬러') || t.includes('레벨')) return 'color'
  if (t.includes('컷') || t.includes('cut')) return 'cut'
  return 'cut'
}

export default function Revisit() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [designer, setDesigner] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [genderFilter, setGenderFilter] = useState<'all'|'female'|'male'>('all')
  const [svcFilter, setSvcFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all'|'warn'|'danger'>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [showMsgSetting, setShowMsgSetting] = useState(false)
  const [msgTab, setMsgTab] = useState('cut')
  const [msgTemplates, setMsgTemplates] = useState<Record<string, {warn:string;danger:string}>>(JSON.parse(JSON.stringify(DEFAULT_MSGS)))
  const [msgEdit, setMsgEdit] = useState<{warn:string;danger:string}>(DEFAULT_MSGS.cut)
  const [savingMsg, setSavingMsg] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSession(s)
    loadData(s.designer_id)
  }, [])

  async function loadData(designer_id: string) {
    setLoading(true)
    const { data: d } = await supabase.from('designers').select('*').eq('id', designer_id).single()
    setDesigner(d)
    if (d?.message_templates) {
      const merged = { ...JSON.parse(JSON.stringify(DEFAULT_MSGS)), ...d.message_templates }
      setMsgTemplates(merged)
      setMsgEdit(merged[msgTab] || DEFAULT_MSGS[msgTab])
    }
    const { data: cList } = await supabase.from('customers').select('*').eq('designer_id', designer_id)
    if (!cList) { setLoading(false); return }
    const enriched = await Promise.all(cList.map(async c => {
      const { data: lastRec } = await supabase.from('service_records')
        .select('service_type, service_date').eq('customer_id', c.id)
        .order('service_date', { ascending: false }).limit(1).single()
      return { ...c, last_service: lastRec }
    }))
    setCustomers(enriched)
    setLoading(false)
  }

  function getStatus(c: any): 'recent' | 'warn' | 'danger' | 'none' {
    if (!c.last_visit_at) return 'none'
    const days = Math.floor((Date.now() - new Date(c.last_visit_at).getTime()) / 86400000)
    const periods = designer?.revisit_settings || {}
    const svcType = detectSvcType(c.last_service?.service_type || '')
    const warnDay = periods[svcType] || DEFAULT_PERIODS[svcType]
    if (days >= warnDay * 2) return 'danger'
    if (days >= warnDay) return 'warn'
    return 'recent'
  }

  const filtered = customers.filter(c => {
    const status = getStatus(c)
    if (status === 'recent' || status === 'none') return false
    if (genderFilter !== 'all' && c.gender !== genderFilter) return false
    if (svcFilter !== 'all' && detectSvcType(c.last_service?.service_type || '') !== svcFilter) return false
    if (statusFilter !== 'all' && status !== statusFilter) return false
    return true
  })

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function selectAll() {
    setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id))
  }
  function switchMsgTab(k: string) {
    setMsgTab(k)
    setMsgEdit(msgTemplates[k] || DEFAULT_MSGS[k as keyof typeof DEFAULT_MSGS])
  }
  async function saveMsgTemplate() {
    setSavingMsg(true)
    const updated = { ...msgTemplates, [msgTab]: msgEdit }
    setMsgTemplates(updated)
    await supabase.from('designers').update({ message_templates: updated }).eq('id', session.designer_id)
    setSavingMsg(false)
    alert('✅ 저장됐어요!')
  }
  async function sendBulk() {
    if (selected.length === 0) { alert('고객을 선택해주세요'); return }
    if (!confirm(`${selected.length}명에게 재방문 알림을 발송할까요?`)) return
    setSending(true)
    const targets = filtered.filter(c => selected.includes(c.id))
    const messages = targets.map(c => {
      const status = getStatus(c)
      const svcType = detectSvcType(c.last_service?.service_type || '')
      const tmpl = msgTemplates[svcType] || DEFAULT_MSGS[svcType]
      return { customer_id: c.id, message: tmpl[status as 'warn'|'danger'] || tmpl.warn }
    })
    const res = await fetch('/api/sms/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designer_id: session.designer_id, customer_ids: selected, messages }),
    })
    setSending(false)
    if (res.ok) { alert(`✅ ${selected.length}명에게 발송 완료!`); setSelected([]) }
    else alert('발송 중 오류가 발생했어요')
  }

  if (!session) return null

  const STATUS_META = {
    warn:   { dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700', label: '방문권장' },
    danger: { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-600',       label: '장기미방문' },
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="bg-white/90 sticky top-0 z-50 px-4 py-4 flex items-center gap-3 border-b border-gray-100 backdrop-blur-md">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition text-xl font-bold">←</button>
        <h2 className="text-xl font-bold tracking-tight">재방문 알림 보내기</h2>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            {[{v:'all',l:'전체'},{v:'female',l:'여성 👩'},{v:'male',l:'남성 👨'}].map(({v,l}) => (
              <button key={v} onClick={() => setGenderFilter(v as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold border transition ${genderFilter===v?'bg-amber-500 text-white border-amber-500':'bg-white text-gray-600 border-gray-200'}`}>{l}</button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSvcFilter('all')} className={`px-4 py-1.5 rounded-full text-sm font-bold border transition ${svcFilter==='all'?'bg-amber-500 text-white border-amber-500':'bg-white text-gray-600 border-gray-200'}`}>전체</button>
            {SVC_TABS.map(({k, icon, label}) => (
              <button key={k} onClick={() => setSvcFilter(k)} className={`px-4 py-1.5 rounded-full text-sm font-bold border transition ${svcFilter===k?'bg-amber-500 text-white border-amber-500':'bg-white text-gray-600 border-gray-200'}`}>{icon} {label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {[{v:'all',l:'전체'},{v:'warn',l:'🟡 방문권장'},{v:'danger',l:'🔴 장기미방문'}].map(({v,l}) => (
              <button key={v} onClick={() => setStatusFilter(v as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${statusFilter===v?'bg-amber-500 text-white border-amber-500':'bg-white text-gray-500 border-gray-200'}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <button onClick={() => setShowMsgSetting(!showMsgSetting)} className="w-full px-5 py-4 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <span className="text-xl">✏️</span>
              <div><div className="font-bold text-base">발송 문구 설정</div><div className="text-xs text-gray-400 mt-0.5">시술별 자동완성 문구 확인·수정</div></div>
            </div>
            <span className={`text-gray-400 text-lg transition-transform ${showMsgSetting?'rotate-180':''}`}>∨</span>
          </button>
          {showMsgSetting && (
            <div className="border-t border-gray-100">
              <div className="flex border-b border-gray-100">
                {SVC_TABS.map(({k, icon, label}) => (
                  <button key={k} onClick={() => switchMsgTab(k)}
                    className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${msgTab===k?'text-amber-500 border-amber-500':'text-gray-400 border-transparent'}`}>{icon} {label}</button>
                ))}
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400"></div><span className="text-sm font-bold text-yellow-600">재방문 권장 문구</span></div>
                    <span className="text-xs text-gray-400">(발송 시 자동 입력)</span>
                  </div>
                  <textarea value={msgEdit.warn} onChange={e => setMsgEdit(prev => ({...prev, warn: e.target.value}))} rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-amber-500 leading-relaxed" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-sm font-bold text-red-500">장기 미방문 문구</span></div>
                    <span className="text-xs text-gray-400">(발송 시 자동 입력)</span>
                  </div>
                  <textarea value={msgEdit.danger} onChange={e => setMsgEdit(prev => ({...prev, danger: e.target.value}))} rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-amber-500 leading-relaxed" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setMsgEdit(DEFAULT_MSGS[msgTab as keyof typeof DEFAULT_MSGS])} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-500 bg-white hover:bg-gray-50 transition">기본값으로</button>
                  <button onClick={saveMsgTemplate} disabled={savingMsg} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50">{savingMsg ? '저장 중...' : '저장하기 ✓'}</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-500 font-bold">{filtered.length}명</p>
            <button onClick={selectAll} className="text-sm text-amber-500 font-bold">
              {selected.length === filtered.length && filtered.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          {loading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm shadow-sm border border-gray-100">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <p className="text-gray-400 text-sm">재방문 알림이 필요한 고객이 없어요</p>
              <p className="text-xs text-gray-300 mt-1">최근 방문 고객들은 자동으로 제외됩니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(c => {
                const status = getStatus(c) as 'warn' | 'danger'
                const meta = STATUS_META[status]
                const last4 = c.phone?.replace(/-/g, '').slice(-4)
                const daysAgo = c.last_visit_at ? Math.floor((Date.now() - new Date(c.last_visit_at).getTime()) / 86400000) : null
                const svcType = detectSvcType(c.last_service?.service_type || '')
                const svcInfo = SVC_TABS.find(t => t.k === svcType)
                const isSelected = selected.includes(c.id)
                return (
                  <div key={c.id} onClick={() => toggleSelect(c.id)}
                    className={`bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer transition shadow-sm border-2 active:scale-[0.99] ${isSelected?'border-amber-500':'border-transparent'}`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSelected?'bg-amber-500 border-amber-500':'border-gray-300'}`}>
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-base flex-shrink-0">{c.name?.[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm">{c.name}</span>
                        {last4 && <span className="text-xs text-gray-400">({last4})</span>}
                        {c.gender==='female' && <span className="text-xs bg-pink-100 text-pink-600 rounded-full px-1.5 py-0.5">여</span>}
                        {c.gender==='male' && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">남</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {svcInfo && <span className="text-xs text-gray-400">{svcInfo.icon} {svcInfo.label}</span>}
                        {daysAgo !== null && <span className="text-xs text-gray-400">· {daysAgo}일 전</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${meta.badge}`}>{meta.label}</span>
                      {c.last_revisit_sms_at && Math.floor((Date.now() - new Date(c.last_revisit_sms_at).getTime()) / 86400000) < 10 && (
                        <span className="text-xs text-gray-400">🔒 발송완료</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-3 pt-3 bg-white border-t border-gray-100 shadow-lg z-40">
          <button onClick={sendBulk} disabled={sending}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-base font-bold rounded-2xl shadow-md disabled:opacity-50 max-w-lg mx-auto block active:scale-[0.99] transition">
            {sending ? '발송 중...' : `📨 선택한 ${selected.length}명에게 알림 발송`}
          </button>
        </div>
      )}

      <BottomNavBar activeMenu="revisit" router={router} />
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
