import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../../lib/auth'

const PRIVACY_TEXT = `[개인정보 수집 및 이용 동의 (필수)]
수집 목적: 헤어 디자이너의 시술 이력 관리, 맞춤형 헤어 케어 서비스 제공 및 시술 내역 SMS 발송
수집 항목: 고객 성명, 휴대전화번호, 시술 내역
보유 및 이용 기간: 고객의 동의 철회 시 또는 서비스 종료 시까지`

const CUT_FEMALE: Record<string, string[]> = {
  '숏': ['숏컷','투블럭컷','샤기컷','기타'],
  '단발': ['일자단발','보브단발','허쉬컷','커트단발','태슬컷','머시룸컷','샤기컷','기타'],
  '미디움': ['일자컷','허쉬컷','미디엄레이어드','샤기컷','슬릭컷','히메컷','기타'],
  '롱': ['라인원랭스컷','허쉬컷','로우레이어드','하이레이어드','슬릭컷','샤기컷','히메컷','기타'],
}
const CUT_MALE = ['댄디컷','리젠트컷','울프컷','투블럭컷','포마드컷','바버컷','슬릭백컷','슬릭백언더컷','가일컷','모히칸컷','상고머리컷','아이비리그컷','드롭컷','슬릭컷','기타']
const PERM_FEMALE = ['볼륨매직','볼륨펌','뿌리볼륨펌','컬펌','컬빌드펌','히피펌','젤리펌','물결펌','발롱펌','베이비펌','복구펌','아이롱펌','슬릭펌','그레이스펌','기타']
const PERM_MALE = ['가르마펌','애즈펌','포마드펌','가일펌','댄디펌','디지털펌','리젠트펌','베이비펌','볼륨펌','뿌리볼륨펌','셋팅펌','쉐도우펌','스핀스왈로펌','볼륨매직','아이롱펌','앞머리펌','호일펌','기타']
const COLOR_GROUPS: Record<string, string[]> = {
  '톤': ['1레벨','2레벨','3레벨','4레벨','5레벨','6레벨','7레벨','8레벨','9레벨','10레벨'],
  '색상': ['애쉬','바이올렛','블루블랙','초코브라운','레드브라운','카키','베이지','오렌지','코퍼','로즈','실버','블론드','누드브라운','기타'],
  '기법': ['전체염색','뿌리염색','그라데이션','발레아쥬','하이라이트','기타'],
}
const CLINIC_LIST = ['단백질트리트먼트','PPT클리닉','케라틴트리트먼트','스팀트리트먼트','앰플클리닉','매직클리닉','기타']
const SCALP_LIST = ['두피스케일링','두피앰플','탈모케어','지성두피케어','건성두피케어','기타']
const SERVICE_ITEMS = [
  {k:'cut', icon:'✂️', label:'컷'},
  {k:'perm', icon:'🌀', label:'펌'},
  {k:'color', icon:'🎨', label:'염색'},
  {k:'clinic', icon:'💊', label:'클리닉'},
  {k:'scalp', icon:'🌿', label:'두피케어'},
]
const DEFAULT_PHRASES: Record<string, string[]> = {
  care: ['드라이 후 아이론 150도 이하','왁스 소량으로 마무리','반건조 상태에서 자연건조 권장','무스 사용 후 드라이','빗질 없이 손으로 모양 잡기'],
  caution: ['샴푸 내일모레부터','샴푸 48시간 후부터','2주 뒤 크리닉 권장','직사광선 주의','묶거나 집게 사용 금지','뜨거운 물 금지 (48시간)'],
  next: ['컷 5~6주 후','컷 8주 후','뿌염 4주 후','파마 3개월 후','파마 4~5개월 후','클리닉 2주 후','두피케어 2~3주 후'],
  memo: ['투블럭 6미리로','옆머리 귀 라인만','앞머리 조금만 자르기','컬 강하게','컬 약하게','뿌리볼륨 살리기'],
}

function lsGet(key: string): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function lsSet(key: string, val: string[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

export default function NewService() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [svcDate, setSvcDate] = useState(new Date().toISOString().split('T')[0])
  const [gender, setGender] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [cutLen, setCutLen] = useState('')
  const [tags, setTags] = useState<Record<string, string[]>>({})
  const [colorTags, setColorTags] = useState<Record<string, string[]>>({})
  const [svcInput, setSvcInput] = useState<Record<string, string>>({})
  const [svcTick, setSvcTick] = useState(0)
  const [dmgLevel, setDmgLevel] = useState('')
  const [dmgPart, setDmgPart] = useState('')
  const [noteTab, setNoteTab] = useState('care')
  const [noteVal, setNoteVal] = useState<Record<string, string>>({care:'', caution:'', next:'', memo:''})
  const [noteInput, setNoteInput] = useState<Record<string, string>>({care:'', caution:'', next:'', memo:''})
  const [myPhrases, setMyPhrases] = useState<Record<string, string[]>>({care:[], caution:[], next:[], memo:[]})
  const [showRecipe, setShowRecipe] = useState(false)
  const [recipe, setRecipe] = useState('')
  const [showMemo, setShowMemo] = useState(false)
  const [custMemo, setCustMemo] = useState('')
  const [photos, setPhotos] = useState<{preview: string; file: File}[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSession(s)
    const p: Record<string, string[]> = {}
    Object.keys(DEFAULT_PHRASES).forEach(k => { p[k] = lsGet('hl_p_' + k) })
    setMyPhrases(p)
  }, [])

  function toggleTag(svcKey: string, tag: string) {
    setTags(prev => {
      const cur = prev[svcKey] || []
      return { ...prev, [svcKey]: cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag] }
    })
  }
  function toggleColorTag(grp: string, tag: string) {
    setColorTags(prev => {
      const cur = prev[grp] || []
      return { ...prev, [grp]: cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag] }
    })
  }
  function addPhrase(tab: string, p: string) {
    setNoteVal(prev => ({ ...prev, [tab]: prev[tab] ? prev[tab] + '\n' + p : p }))
  }
  function savePhrase(tab: string) {
    const v = noteInput[tab]?.trim(); if (!v) return
    const mine = lsGet('hl_p_' + tab)
    if (mine.includes(v)) { alert('이미 저장된 문구예요'); return }
    mine.unshift(v); if (mine.length > 15) mine.pop()
    lsSet('hl_p_' + tab, mine)
    setMyPhrases(prev => ({ ...prev, [tab]: mine }))
    setNoteInput(prev => ({ ...prev, [tab]: '' }))
  }
  function deleteMyPhrase(tab: string, i: number) {
    const mine = lsGet('hl_p_' + tab); mine.splice(i, 1)
    lsSet('hl_p_' + tab, mine)
    setMyPhrases(prev => ({ ...prev, [tab]: mine }))
  }
  function saveMyStyle(svcKey: string) {
    const v = svcInput[svcKey]?.trim(); if (!v) return
    const mine = lsGet('hl_s_' + svcKey)
    if (mine.includes(v)) { alert('이미 저장된 스타일이에요'); return }
    mine.unshift(v); if (mine.length > 20) mine.pop()
    lsSet('hl_s_' + svcKey, mine)
    setSvcInput(prev => ({ ...prev, [svcKey]: '' }))
    setSvcTick(t => t + 1)
  }
  function deleteMyStyle(svcKey: string, i: number) {
    const mine = lsGet('hl_s_' + svcKey); mine.splice(i, 1)
    lsSet('hl_s_' + svcKey, mine); setSvcTick(t => t + 1)
  }
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const toAdd = files.slice(0, 5 - photos.length)
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => { setPhotos(prev => [...prev, { preview: ev.target?.result as string, file }]) }
      reader.readAsDataURL(file)
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  function removePhoto(i: number) { setPhotos(prev => prev.filter((_, idx) => idx !== i)) }
  async function uploadPhotos(): Promise<string[]> {
    if (photos.length === 0) return []
    const urls: string[] = []
    for (const p of photos) {
      const reader = new FileReader()
      const base64 = await new Promise<string>(resolve => {
        reader.onload = e => resolve(e.target?.result as string)
        reader.readAsDataURL(p.file)
      })
      const res = await fetch('/api/upload-photo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_base64: base64, file_name: p.file.name, designer_id: session.designer_id }),
      })
      const data = await res.json()
      if (data.url) urls.push(data.url)
    }
    return urls
  }
  function buildSvcSummary() {
    const parts: string[] = []
    SERVICE_ITEMS.forEach(({k, label}) => {
      if (!checked[k]) return
      if (k === 'color') {
        const cp = Object.entries(colorTags).map(([, ts]) => ts.join(' ')).filter(Boolean)
        parts.push(label + (cp.length ? ': ' + cp.join(' / ') : ''))
      } else {
        const ts = tags[k] || []
        parts.push(label + (ts.length ? ': ' + ts.join(', ') : ''))
      }
    })
    return parts.join(' · ')
  }
  function validate() {
    if (!custName.trim()) return '고객 이름을 입력해주세요'
    if (!custPhone.trim()) return '연락처를 입력해주세요'
    if (!Object.values(checked).some(Boolean)) return '시술 항목을 하나 이상 선택해주세요'
    return ''
  }
  function goConfirm() {
    const err = validate(); if (err) { setError(err); return }
    setError(''); setStep('confirm')
  }
  async function handleSubmit() {
    if (!agreed) { setError('개인정보 수집 동의가 필요합니다'); return }
    setLoading(true); setError(''); setUploadingPhotos(true)
    const photoUrls = await uploadPhotos()
    setUploadingPhotos(false)
    const res = await fetch('/api/service-records/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        designer_id: session.designer_id, customer_name: custName, customer_phone: custPhone,
        service_date: svcDate, service_type: buildSvcSummary(), gender: gender || null,
        damage_level: dmgLevel || null, damage_part: dmgPart || null,
        care_method: noteVal.care || null, caution: noteVal.caution || null,
        next_service: noteVal.next || null, memo: noteVal.memo || null,
        cust_memo: custMemo || null, secret_recipe: recipe || null,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) { router.replace('/dashboard') }
    else { setError(data.error || '오류가 발생했습니다') }
  }

  if (!session) return null
  const noteTabs = [{k:'care',l:'손질법'},{k:'caution',l:'주의사항'},{k:'next',l:'다음시술'},{k:'memo',l:'메모'}]

  if (step === 'confirm') {
    const svc = buildSvcSummary()
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
          <button onClick={() => setStep('form')} className="text-gray-500 text-lg">←</button>
          <h2 className="text-lg font-semibold">시술 내역 확인</h2>
        </div>
        <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
          <div className="card space-y-1">
            <h3 className="font-semibold text-gray-700 mb-2">📋 작성 내용 확인</h3>
            <div className="divide-y divide-gray-100 text-sm">
              <CRow label="고객명" val={custName} />
              <CRow label="연락처" val={custPhone} />
              <CRow label="성별" val={gender === 'female' ? '여성' : gender === 'male' ? '남성' : '-'} />
              <CRow label="시술일" val={svcDate} />
              <CRow label="시술 항목" val={svc} />
              {dmgLevel && <CRow label="전체 손상도" val={dmgLevel} />}
              {dmgPart && <CRowLong label="부분 손상도" val={dmgPart} />}
              {noteVal.care && <CRowLong label="손질법" val={noteVal.care} />}
              {noteVal.caution && <CRowLong label="주의사항" val={noteVal.caution} />}
              {noteVal.next && <CRow label="다음 시술 권장" val={noteVal.next} />}
              {noteVal.memo && <CRowLong label="메모" val={noteVal.memo} />}
            </div>
          </div>
          {photos.length > 0 && (
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 mb-2">📸 시술 사진 ({photos.length}장)</p>
              <div className="flex gap-2 flex-wrap">
                {photos.map((p, i) => (
                  <img key={i} src={p.preview} className="w-16 h-16 rounded-lg object-cover border border-gray-200" alt="" />
                ))}
              </div>
            </div>
          )}
          {(custMemo || recipe) && (
            <div className="card border border-orange-200">
              <h3 className="font-semibold text-orange-700 text-sm mb-2">🔒 디자이너 전용 (고객 비공개)</h3>
              <div className="divide-y divide-gray-100 text-sm">
                {custMemo && <CRowLong label="📌 고객 메모" val={custMemo} />}
                {recipe && <CRowLong label="🔒 비밀 레시피" val={recipe} />}
              </div>
            </div>
          )}
          <div className="card bg-gray-50 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">📱 고객에게 발송될 문자</p>
            <pre className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">{`[헤어로그] 시술 내역 안내\n\n${custName}님, 오늘 시술 감사합니다 😊\n\n📋 시술 내역\n날짜: ${svcDate}\n시술: ${svc}${noteVal.care ? '\n손질법: ' + noteVal.care : ''}${noteVal.caution ? '\n주의사항: ' + noteVal.caution : ''}${noteVal.next ? '\n다음 시술: ' + noteVal.next : ''}`}</pre>
          </div>
          <div className="card">
            <pre className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">{PRIVACY_TEXT}</pre>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="w-4 h-4 accent-amber-500" />
              <span className="text-sm font-medium">위 내용에 동의합니다 (필수)</span>
            </label>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button onClick={handleSubmit} disabled={loading || !agreed} className="btn-primary w-full py-3 disabled:opacity-50">
            {loading ? (uploadingPhotos ? '사진 업로드 중...' : '저장 중...') : '✅ 확인하고 문자 발송'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 text-lg">←</button>
        <h2 className="text-lg font-semibold">시술 기록 작성</h2>
      </div>
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <div className="card space-y-4">
          <h3 className="font-semibold">👤 고객 정보</h3>
          <div>
            <label className="block text-sm font-medium mb-1">고객 이름 <span className="text-red-400">*</span></label>
            <input className="input" value={custName} onChange={e => setCustName(e.target.value)} placeholder="홍길동" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">휴대전화번호 <span className="text-red-400">*</span></label>
            <input className="input" value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="010-1234-5678" inputMode="tel" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">성별</label>
            <div className="flex gap-2">
              {[{v:'female',l:'여성 👩'},{v:'male',l:'남성 👨'}].map(({v,l}) => (
                <button key={v} type="button" onClick={() => setGender(gender === v ? '' : v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${gender === v ? 'bg-accent text-white border-accent' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">시술 날짜</label>
            <input className="input" type="date" value={svcDate} onChange={e => setSvcDate(e.target.value)} />
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold">✂️ 시술 항목 <span className="text-red-400 text-xs">*</span></h3>
          </div>
          <div className="divide-y divide-gray-100">
            {SERVICE_ITEMS.map(({k, icon, label}) => {
              const myStyles = lsGet('hl_s_' + k)
              const curTags = tags[k] || []
              const isCkd = !!checked[k]
              return (
                <div key={k + '-' + svcTick}>
                  <button type="button" onClick={() => setChecked(prev => ({...prev, [k]: !prev[k]}))}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition text-left">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isCkd ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                      {isCkd && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-semibold flex-1">{label}</span>
                  </button>
                  {isCkd && (
                    <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 space-y-3">
                      {k === 'cut' && (gender === 'male' ? (
                        <div className="flex flex-wrap gap-2">{CUT_MALE.map(t => <Chip key={t} label={t} active={curTags.includes(t)} onClick={() => toggleTag(k, t)} />)}</div>
                      ) : !cutLen ? (
                        <div>
                          <p className="text-xs text-gray-400 mb-2">기장 선택</p>
                          <div className="flex gap-2 flex-wrap">
                            {['숏','단발','미디움','롱'].map(l => (
                              <button key={l} type="button" onClick={() => setCutLen(l)}
                                className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:border-accent transition">{l}</button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <button onClick={() => setCutLen('')} className="text-xs text-accent font-semibold mb-2 block">‹ {cutLen} 변경</button>
                          <div className="flex flex-wrap gap-2">{(CUT_FEMALE[cutLen]||[]).map(t => <Chip key={t} label={t} active={curTags.includes(t)} onClick={() => toggleTag(k, t)} />)}</div>
                        </div>
                      ))}
                      {k === 'perm' && <div className="flex flex-wrap gap-2">{(gender==='male'?PERM_MALE:PERM_FEMALE).map(t => <Chip key={t} label={t} active={curTags.includes(t)} onClick={() => toggleTag(k, t)} />)}</div>}
                      {k === 'color' && (
                        <div className="space-y-3">
                          {Object.entries(COLOR_GROUPS).map(([grp, items]) => (
                            <div key={grp}>
                              <p className="text-xs text-gray-400 font-semibold mb-1.5">{grp}</p>
                              <div className="flex flex-wrap gap-2">{items.map(t => <Chip key={t} label={t} active={(colorTags[grp]||[]).includes(t)} onClick={() => toggleColorTag(grp, t)} />)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {k === 'clinic' && <div className="flex flex-wrap gap-2">{CLINIC_LIST.map(t => <Chip key={t} label={t} active={curTags.includes(t)} onClick={() => toggleTag(k, t)} />)}</div>}
                      {k === 'scalp' && <div className="flex flex-wrap gap-2">{SCALP_LIST.map(t => <Chip key={t} label={t} active={curTags.includes(t)} onClick={() => toggleTag(k, t)} />)}</div>}
                      {myStyles.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                          {myStyles.map((s: string, i: number) => (
                            <div key={i} className="flex">
                              <button type="button" onClick={() => toggleTag(k, s)}
                                className={`px-3 py-1.5 rounded-l-full text-xs font-semibold border-y border-l transition ${curTags.includes(s)?'bg-accent text-white border-accent':'bg-amber-50 text-amber-700 border-amber-300'}`}>⭐ {s}</button>
                              <button type="button" onClick={() => deleteMyStyle(k, i)}
                                className="px-2 rounded-r-full border-y border-r border-amber-300 bg-amber-50 text-amber-500 text-xs hover:bg-red-50 hover:text-red-400">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input value={svcInput[k]||''} onChange={e => setSvcInput(prev=>({...prev,[k]:e.target.value}))}
                          onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();saveMyStyle(k)}}}
                          className="flex-1 border border-amber-300 rounded-lg px-3 py-1.5 text-xs outline-none bg-amber-50/50 focus:border-accent"
                          placeholder="직접 입력 후 저장★ 누르면 내 스타일로 저장돼요" />
                        <button type="button" onClick={()=>saveMyStyle(k)} className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-bold whitespace-nowrap">저장 ⭐</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <div className="px-4 py-3 flex items-center gap-4 bg-white">
              <span className="text-sm text-gray-600 flex-shrink-0">손상도 <span className="text-xs text-gray-400">(선택)</span></span>
              <div className="flex gap-2 ml-auto">
                {['상','중','하'].map(l => (
                  <button key={l} type="button" onClick={()=>setDmgLevel(dmgLevel===l?'':l)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${dmgLevel===l?'bg-primary text-white border-primary':'bg-white text-gray-500 border-gray-300'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="px-4 pb-3 bg-white">
              <input className="input text-sm" value={dmgPart} onChange={e=>setDmgPart(e.target.value)} placeholder="부분 손상도 직접 입력 (예: 끝머리 20cm 가량)" />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">📸 시술 사진 <span className="text-xs text-gray-400 font-normal">(선택 · 최대 5장)</span></h3>
          <div className="flex gap-3 flex-wrap">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                <img src={p.preview} className="w-20 h-20 rounded-xl object-cover border border-gray-200" alt="" />
                <button type="button" onClick={()=>removePhoto(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold shadow">×</button>
              </div>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={()=>fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-1 hover:border-accent hover:bg-amber-50 transition">
                <span className="text-2xl">📷</span>
                <span className="text-xs text-gray-400 font-medium">사진 추가</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {noteTabs.map(t => (
              <button key={t.k} onClick={()=>setNoteTab(t.k)}
                className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${noteTab===t.k?'text-primary border-primary':'text-gray-400 border-transparent'}`}>{t.l}</button>
            ))}
          </div>
          <div className="p-4 space-y-3">
            {(myPhrases[noteTab]||[]).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(myPhrases[noteTab]||[]).map((p: string, i: number) => (
                  <div key={i} className="flex">
                    <button type="button" onClick={()=>addPhrase(noteTab, p)}
                      className="px-3 py-1.5 rounded-l-full text-xs font-semibold bg-amber-50 text-amber-700 border-y border-l border-amber-300 hover:bg-amber-100 max-w-[200px] truncate">⭐ {p}</button>
                    <button type="button" onClick={()=>deleteMyPhrase(noteTab, i)}
                      className="px-2 rounded-r-full border-y border-r border-amber-300 bg-amber-50 text-amber-500 text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {(DEFAULT_PHRASES[noteTab]||[]).map((p: string) => (
                <button key={p} type="button" onClick={()=>addPhrase(noteTab, p)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition">{p}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={noteInput[noteTab]||''} onChange={e=>setNoteInput(prev=>({...prev,[noteTab]:e.target.value}))}
                onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();savePhrase(noteTab)}}}
                className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-xs outline-none bg-amber-50/50 focus:border-accent"
                placeholder="직접 입력 후 저장★ 누르면 내 문구로 저장돼요" />
              <button type="button" onClick={()=>savePhrase(noteTab)} className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-bold whitespace-nowrap">저장 ⭐</button>
            </div>
            <textarea value={noteVal[noteTab]||''} onChange={e=>setNoteVal(prev=>({...prev,[noteTab]:e.target.value}))}
              rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none outline-none focus:border-accent"
              placeholder="위 태그를 클릭하거나 직접 입력하세요" />
          </div>
        </div>

        <div className="card p-0 overflow-hidden divide-y divide-gray-100">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">🔒 비밀 레시피</div>
              <div className="text-xs text-gray-400 mt-0.5">나만 보는 레시피</div>
            </div>
            <button onClick={()=>setShowRecipe(!showRecipe)} className={`w-11 h-6 rounded-full transition-colors relative ${showRecipe?'bg-primary':'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${showRecipe?'left-5':'left-0.5'}`} />
            </button>
          </div>
          {showRecipe && (
            <div className="px-4 pb-3">
              <textarea className="input text-sm mt-2 resize-none" rows={2} value={recipe} onChange={e=>setRecipe(e.target.value)} placeholder="예) 밀본 7.60 × 3% 산화제 1:1, 방치 25분" />
            </div>
          )}
          <button type="button" onClick={()=>setShowMemo(!showMemo)} className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-gray-50 transition">
            <span className="text-base">📌</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-green-700">고객 메모</div>
              <div className="text-xs text-gray-400">다음 시술 참고 · 고객 비공개</div>
            </div>
            <span className="text-gray-400 text-sm">{showMemo?'∧':'∨'}</span>
          </button>
          {showMemo && (
            <div className="px-4 pb-3">
              <textarea className="input text-sm resize-none" rows={2} value={custMemo} onChange={e=>setCustMemo(e.target.value)} placeholder="예) 다음엔 파마 강도 조금 세게, 두피 민감" />
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button onClick={goConfirm} className="btn-primary w-full py-3 text-base">다음 → 내용 확인</button>
      </div>
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${active?'bg-primary text-white border-primary':'bg-white text-gray-600 border-gray-200 hover:border-accent'}`}>
      {label}
    </button>
  )
}
function CRow({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-gray-400 flex-shrink-0 mr-4">{label}</span>
      <span className="font-medium text-right">{val || '-'}</span>
    </div>
  )
}
function CRowLong({ label, val }: { label: string; val: string }) {
  return (
    <div className="py-2">
      <span className="text-gray-400 text-xs block mb-1">{label}</span>
      <p className="font-medium text-sm leading-relaxed whitespace-pre-wrap">{val}</p>
    </div>
  )
}
