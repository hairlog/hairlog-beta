import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { CalendarDays, Users, Scissors, Bell, UserCircle, ChevronDown, ChevronLeft } from 'lucide-react'

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
const DEFAULT_PERIODS: Record<string, number> = { cut: 35, color: 30, perm: 90, clinic: 14, scalp: 21 }
const SVC_TABS = [
  { k: 'cut', label: '컷' }, { k: 'color', label: '염색' }, { k: 'perm', label: '파마' },
  { k: 'clinic', label: '클리닉' }, { k: 'scalp', label: '두피' },
]

function detectSvcType(serviceType: string): string {
  const t = serviceType?.toLowerCase() || ''
  if (t.includes('두피')) return 'scalp'
  if (t.includes('클리닉') || t.includes('트리트먼트')) return 'clinic'
  if (t.includes('파마') || t.includes('펌')) return 'perm'
  if (t.includes('염색') || t.includes('컬러') || t.includes('레벨')) return 'color'
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
  const [showPeriodSetting, setShowPeriodSetting] = useState(false)
  const [periodEdit, setPeriodEdit] = useState<Record<string,number>>(DEFAULT_PERIODS)
  const [savingPeriod, setSavingPeriod] = useState(false)
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
    if (d?.revisit_settings) {
      setPeriodEdit({ ...DEFAULT_PERIODS, ...d.revisit_settings })
    }
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

  function getStatus(c: any): 'recent'|'warn'|'danger'|'none' {
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
    if (svcFilter !== 'all' && detectSvcType(c.last_service?.service_type||'') !== svcFilter) return false
    if (statusFilter !== 'all' && status !== statusFilter) return false
    return true
  })

  function toggleSelect(id: string) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  function switchMsgTab(k: string) {
    setMsgTab(k)
    setMsgEdit(msgTemplates[k] || DEFAULT_MSGS[k as keyof typeof DEFAULT_MSGS])
  }

  async function savePeriod() {
    setSavingPeriod(true)
    await supabase.from('designers').update({ revisit_settings: periodEdit }).eq('id', session.designer_id)
    setDesigner((p: any) => ({ ...p, revisit_settings: periodEdit }))
    setSavingPeriod(false)
    alert('재방문 주기가 저장됐어요!')
  }

  async function saveMsgTemplate() {
    setSavingMsg(true)
    const updated = { ...msgTemplates, [msgTab]: msgEdit }
    setMsgTemplates(updated)
    await supabase.from('designers').update({ message_templates: updated }).eq('id', session.designer_id)
    setSavingMsg(false)
    alert('저장됐어요!')
  }

  async function sendBulk() {
    if (selected.length === 0) { alert('고객을 선택해주세요'); return }
    if (!confirm(selected.length + '명에게 재방문 알림을 발송할까요?')) return
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
    if (res.ok) { alert(selected.length + '명에게 발송 완료!'); setSelected([]) }
    else alert('발송 중 오류가 발생했어요')
  }

  if (!session) return null

  const STATUS_META = {
    warn:   { dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700', label: '방문권장' },
    danger: { dot: 'bg-red-400',   badge: 'bg-red-50 text-red-600',     label: '장기미방문' },
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 */}
      <div className="bg-white px-5 pt-14 pb-4 border-b border-zinc-100 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="p-1 -ml-1 rounded-lg hover:bg-zinc-100 transition">
          <ChevronLeft size={20} className="text-zinc-600" />
        </button>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">재방문 관리</h2>
      </div>

      <div className="max-w-lg mx-auto px-5 py-4 space-y-4">
        {/* 필터 */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {[{v:'all',l:'전체'},{v:'female',l:'여성'},{v:'male',l:'남성'}].map(({v,l}) => (
              <button key={v} onClick={() => setGenderFilter(v as any)}
                className={'px-3 py-1.5 rounded-full text-xs font-semibold border transition ' +
                  (genderFilter===v ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200')}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSvcFilter('all')} className={'px-3 py-1.5 rounded-full text-xs font-semibold border transition ' + (svcFilter==='all' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200')}>전체</button>
            {SVC_TABS.map(({ k, label }) => (
              <button key={k} onClick={() => setSvcFilter(k)}
                className={'px-3 py-1.5 rounded-full text-xs font-semibold border transition ' +
                  (svcFilter===k ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200')}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[{v:'all',l:'전체'},{v:'warn',l:'방문권장'},{v:'danger',l:'장기미방문'}].map(({v,l}) => (
              <button key={v} onClick={() => setStatusFilter(v as any)}
                className={'px-3 py-1.5 rounded-full text-xs font-semibold border transition ' +
                  (statusFilter===v ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 재방문 주기 설정 */}
        <div className="border border-zinc-100 rounded-xl overflow-hidden">
          <button onClick={() => setShowPeriodSetting(!showPeriodSetting)}
            className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-zinc-50 transition">
            <div>
              <p className="text-sm font-semibold text-zinc-900 tracking-tight">재방문 주기 설정</p>
              <p className="text-xs text-zinc-400 mt-0.5">시술별 권장 재방문 일수 설정</p>
            </div>
            <ChevronDown size={16} className={'text-zinc-400 transition-transform ' + (showPeriodSetting ? 'rotate-180' : '')} />
          </button>
          {showPeriodSetting && (
            <div className="border-t border-zinc-100 px-4 py-4 space-y-3">
              {SVC_TABS.map(({ k, label }) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">{label}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setPeriodEdit(p => ({ ...p, [k]: Math.max(1, (p[k]||DEFAULT_PERIODS[k]) - 1) }))}
                      className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition text-lg font-medium">−</button>
                    <div className="w-16 text-center">
                      <span className="text-sm font-semibold text-zinc-900 tracking-tight">{periodEdit[k] || DEFAULT_PERIODS[k]}</span>
                      <span className="text-xs text-zinc-400 ml-1">일</span>
                    </div>
                    <button type="button" onClick={() => setPeriodEdit(p => ({ ...p, [k]: (p[k]||DEFAULT_PERIODS[k]) + 1 }))}
                      className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition text-lg font-medium">+</button>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-zinc-400 pt-1">설정한 일수가 지나면 방문권장, 2배가 지나면 장기미방문으로 표시됩니다</p>
              <button onClick={savePeriod} disabled={savingPeriod}
                className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold disabled:opacity-40">
                {savingPeriod ? '저장 중...' : '주기 저장하기'}
              </button>
            </div>
          )}
        </div>

        {/* 발송 문구 설정 */}
        <div className="border border-zinc-100 rounded-xl overflow-hidden">
          <button onClick={() => setShowMsgSetting(!showMsgSetting)}
            className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-zinc-50 transition">
            <div>
              <p className="text-sm font-semibold text-zinc-900 tracking-tight">발송 문구 설정</p>
              <p className="text-xs text-zinc-400 mt-0.5">시술별 재방문 알림 문구 수정</p>
            </div>
            <ChevronDown size={16} className={'text-zinc-400 transition-transform ' + (showMsgSetting ? 'rotate-180' : '')} />
          </button>
          {showMsgSetting && (
            <div className="border-t border-zinc-100">
              <div className="flex border-b border-zinc-100 overflow-x-auto">
                {SVC_TABS.map(({ k, label }) => (
                  <button key={k} onClick={() => switchMsgTab(k)}
                    className={'flex-1 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap px-2 ' +
                      (msgTab===k ? 'text-zinc-900 border-zinc-900' : 'text-zinc-400 border-transparent')}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="px-4 py-4 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <p className="text-xs font-semibold text-zinc-600">방문권장 문구</p>
                  </div>
                  <textarea value={msgEdit.warn} onChange={e => setMsgEdit(p => ({...p, warn: e.target.value}))}
                    rows={4} className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-xs outline-none resize-none focus:border-zinc-400 leading-relaxed bg-zinc-50" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <p className="text-xs font-semibold text-zinc-600">장기미방문 문구</p>
                  </div>
                  <textarea value={msgEdit.danger} onChange={e => setMsgEdit(p => ({...p, danger: e.target.value}))}
                    rows={4} className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-xs outline-none resize-none focus:border-zinc-400 leading-relaxed bg-zinc-50" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMsgEdit(DEFAULT_MSGS[msgTab as keyof typeof DEFAULT_MSGS])}
                    className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition">
                    기본값으로
                  </button>
                  <button onClick={saveMsgTemplate} disabled={savingMsg}
                    className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold disabled:opacity-40">
                    {savingMsg ? '저장 중...' : '저장하기'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 고객 목록 */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">{filtered.length}명</span>
            <button onClick={() => setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id))}
              className="text-xs font-semibold text-zinc-500 underline underline-offset-2">
              {selected.length === filtered.length && filtered.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          {loading ? (
            <p className="text-center text-zinc-400 text-sm py-8">불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <div className="border border-zinc-100 rounded-xl p-10 text-center">
              <p className="text-sm text-zinc-400">재방문 알림이 필요한 고객이 없어요</p>
              <p className="text-xs text-zinc-300 mt-1">최근 방문 고객은 자동으로 제외됩니다</p>
            </div>
          ) : (
            <div className="border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
              {filtered.map(c => {
                const status = getStatus(c) as 'warn'|'danger'
                const meta = STATUS_META[status]
                const last4 = c.phone?.replace(/-/g,'').slice(-4)
                const daysAgo = c.last_visit_at ? Math.floor((Date.now() - new Date(c.last_visit_at).getTime()) / 86400000) : null
                const svcType = detectSvcType(c.last_service?.service_type || '')
                const svcInfo = SVC_TABS.find(t => t.k === svcType)
                const isSelected = selected.includes(c.id)
                return (
                  <div key={c.id} onClick={() => toggleSelect(c.id)}
                    className={'flex items-center gap-3 px-4 py-3.5 cursor-pointer transition ' + (isSelected ? 'bg-zinc-50' : 'hover:bg-zinc-50')}>
                    <div className={'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ' + (isSelected ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300')}>
                      {isSelected && <span className="text-white text-[9px] font-black">✓</span>}
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                    <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {c.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-zinc-900 tracking-tight">{c.name}</span>
                        {last4 && <span className="text-xs text-zinc-400 tracking-tight">({last4})</span>}
                        {c.gender === 'female' && <span className="text-[10px] bg-[#F5EFEA] text-[#8A624A] rounded-full px-1.5 py-0.5 font-medium">여</span>}
                        {c.gender === 'male' && <span className="text-[10px] bg-zinc-100 text-zinc-500 rounded-full px-1.5 py-0.5 font-medium">남</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {svcInfo && <span className="text-xs text-zinc-400">{svcInfo.label}</span>}
                        {daysAgo !== null && <span className="text-xs text-zinc-400">· {daysAgo}일 전</span>}
                      </div>
                    </div>
                    <span className={'text-[10px] px-2 py-1 rounded-full font-semibold flex-shrink-0 ' + meta.badge}>
                      {meta.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 발송 버튼 */}
      {selected.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-5 z-40 max-w-lg mx-auto">
          <button onClick={sendBulk} disabled={sending}
            className="w-full py-3.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl shadow-lg disabled:opacity-40 active:scale-[0.99] transition">
            {sending ? '발송 중...' : selected.length + '명에게 알림 발송'}
          </button>
        </div>
      )}

      <BottomNavBar activeMenu="revisit" router={router} />
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
