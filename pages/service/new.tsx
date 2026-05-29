import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../../lib/auth'
import { CheckCircle, ChevronDown, ChevronUp, X, Camera, Lock, MessageSquare, Mic, CalendarDays, Users, Scissors, Bell, UserCircle } from 'lucide-react'

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
  {k:'cut',label:'컷'},{k:'perm',label:'펌'},{k:'color',label:'염색'},
  {k:'clinic',label:'클리닉'},{k:'scalp',label:'두피케어'},
]
const DEFAULT_PHRASES: Record<string, string[]> = {
  care: ['드라이 후 아이론 150도 이하','왁스 소량으로 마무리','반건조 후 자연건조 권장','무스 사용 후 드라이','빗질 없이 손으로 모양 잡기'],
  caution: ['샴푸 내일모레부터','샴푸 48시간 후부터','2주 뒤 클리닉 권장','직사광선 주의','묶거나 집게 사용 금지'],
  next: ['컷 5~6주 후','컷 8주 후','뿌염 4주 후','파마 3개월 후','파마 4~5개월 후','클리닉 2주 후'],
  memo: ['투블럭 6미리로','옆머리 귀 라인만','앞머리 조금만','컬 강하게','컬 약하게','뿌리볼륨 살리기'],
}

function lsGet(k: string): string[] { if (typeof window==='undefined') return []; try { return JSON.parse(localStorage.getItem(k)||'[]') } catch { return [] } }
function lsSet(k: string, v: string[]) { if (typeof window==='undefined') return; try { localStorage.setItem(k,JSON.stringify(v)) } catch {} }

export default function NewService() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [designer, setDesigner] = useState<any>(null)
  const [step, setStep] = useState<'form'|'confirm'>('form')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')

  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [svcDate, setSvcDate] = useState(new Date().toISOString().split('T')[0])
  const [gender, setGender] = useState('')

  const [consentStatus, setConsentStatus] = useState<'idle'|'checking'|'agreed'|'pending'|'rejected'|'new'>('idle')
  const [existingCustomer, setExistingCustomer] = useState<any>(null)
  const [sendingConsent, setSendingConsent] = useState(false)
  const [processingVerbal, setProcessingVerbal] = useState(false)

  const [checked, setChecked] = useState<Record<string,boolean>>({})
  const [cutLen, setCutLen] = useState('')
  const [tags, setTags] = useState<Record<string,string[]>>({})
  const [colorTags, setColorTags] = useState<Record<string,string[]>>({})
  const [svcInput, setSvcInput] = useState<Record<string,string>>({})
  const [svcTick, setSvcTick] = useState(0)
  const [dmgLevel, setDmgLevel] = useState('')
  const [dmgPart, setDmgPart] = useState('')
  const [noteTab, setNoteTab] = useState('care')
  const [noteVal, setNoteVal] = useState<Record<string,string>>({care:'',caution:'',next:'',memo:''})
  const [noteInput, setNoteInput] = useState<Record<string,string>>({care:'',caution:'',next:'',memo:''})
  const [myPhrases, setMyPhrases] = useState<Record<string,string[]>>({care:[],caution:[],next:[],memo:[]})
  const [showRecipe, setShowRecipe] = useState(false)
  const [recipe, setRecipe] = useState('')
  const [showMemo, setShowMemo] = useState(false)
  const [custMemo, setCustMemo] = useState('')
  const [photos, setPhotos] = useState<{preview:string;file:File}[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSession(s)
    const p: Record<string,string[]> = {}
    Object.keys(DEFAULT_PHRASES).forEach(k => { p[k] = lsGet('hl_p_'+k) })
    setMyPhrases(p)
    import('../../lib/supabase').then(({supabase}) => {
      supabase.from('designers').select('*').eq('id',s.designer_id).single().then(({data}) => { if (data) setDesigner(data) })
    })
  }, [])

  async function checkConsent(phone: string) {
    const clean = phone.replace(/-/g,'')
    if (clean.length < 10) { setConsentStatus('idle'); return }
    setConsentStatus('checking')
    const {supabase} = await import('../../lib/supabase')
    const {data} = await supabase.from('customers').select('*').eq('designer_id',session.designer_id).eq('phone',phone).single()
    if (data) {
      setExistingCustomer(data)
      if (data.name && !custName) setCustName(data.name)
      setConsentStatus(data.consent_status==='agreed'?'agreed':(data.consent_status||'pending'))
    } else { setExistingCustomer(null); setConsentStatus('new') }
  }

  async function handleVerbalConsent() {
    if (!custPhone.trim()) { alert('연락처를 먼저 입력해주세요'); return }
    setProcessingVerbal(true)
    if (existingCustomer) {
      const {supabase} = await import('../../lib/supabase')
      await supabase.from('customers').update({privacy_agreed:true,consent_type:'verbal',consent_status:'agreed',privacy_agreed_at:new Date().toISOString()}).eq('id',existingCustomer.id)
      setExistingCustomer((p:any)=>({...p,consent_status:'agreed',consent_type:'verbal'}))
    }
    setConsentStatus('agreed'); setProcessingVerbal(false)
  }

  async function handleSmsConsent() {
    if (!custPhone.trim()) { alert('연락처를 먼저 입력해주세요'); return }
    setSendingConsent(true)
    let customerId = existingCustomer?.id
    if (!existingCustomer) {
      const {supabase} = await import('../../lib/supabase')
      const {data:newCust} = await supabase.from('customers').insert({designer_id:session.designer_id,name:custName||'고객',phone:custPhone,consent_status:'pending',consent_type:'sms'}).select().single()
      if (newCust) { setExistingCustomer(newCust); customerId = newCust.id }
    }
    const res = await fetch('/api/consent/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_id:customerId,designer_id:session.designer_id})})
    setSendingConsent(false)
    if (res.ok) alert('동의 요청 문자를 발송했어요.')
    else alert('발송 실패.')
  }

  function toggleTag(k:string,t:string){setTags(p=>{const c=p[k]||[];return{...p,[k]:c.includes(t)?c.filter(x=>x!==t):[...c,t]}})}
  function toggleColorTag(g:string,t:string){setColorTags(p=>{const c=p[g]||[];return{...p,[g]:c.includes(t)?c.filter(x=>x!==t):[...c,t]}})}
  function addPhrase(tab:string,ph:string){setNoteVal(p=>({...p,[tab]:p[tab]?p[tab]+'\n'+ph:ph}))}
  function savePhrase(tab:string){const v=noteInput[tab]?.trim();if(!v)return;const mine=lsGet('hl_p_'+tab);if(mine.includes(v)){alert('이미 저장됨');return};mine.unshift(v);if(mine.length>15)mine.pop();lsSet('hl_p_'+tab,mine);setMyPhrases(p=>({...p,[tab]:mine}));setNoteInput(p=>({...p,[tab]:''}))}
  function deleteMyPhrase(tab:string,i:number){const mine=lsGet('hl_p_'+tab);mine.splice(i,1);lsSet('hl_p_'+tab,mine);setMyPhrases(p=>({...p,[tab]:mine}))}
  function saveMyStyle(k:string){const v=svcInput[k]?.trim();if(!v)return;const mine=lsGet('hl_s_'+k);if(mine.includes(v)){alert('이미 저장됨');return};mine.unshift(v);if(mine.length>20)mine.pop();lsSet('hl_s_'+k,mine);setSvcInput(p=>({...p,[k]:''}));setSvcTick(t=>t+1)}
  function deleteMyStyle(k:string,i:number){const mine=lsGet('hl_s_'+k);mine.splice(i,1);lsSet('hl_s_'+k,mine);setSvcTick(t=>t+1)}
  function handlePhotoSelect(e:React.ChangeEvent<HTMLInputElement>){Array.from(e.target.files||[]).slice(0,5-photos.length).forEach(file=>{const r=new FileReader();r.onload=ev=>{setPhotos(p=>[...p,{preview:ev.target?.result as string,file}])};r.readAsDataURL(file)});if(fileInputRef.current)fileInputRef.current.value=''}
  function removePhoto(i:number){setPhotos(p=>p.filter((_,idx)=>idx!==i))}

  async function uploadPhotos():Promise<string[]>{
    if(!photos.length)return[]
    const urls:string[]=[]
    for(const p of photos){
      const r=new FileReader()
      const b64=await new Promise<string>(res=>{r.onload=e=>res(e.target?.result as string);r.readAsDataURL(p.file)})
      const res=await fetch('/api/upload-photo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_base64:b64,file_name:p.file.name,designer_id:session.designer_id})})
      const d=await res.json()
      if(d.url)urls.push(d.url)
    }
    return urls
  }

  function buildSvc(){
    const parts:string[]=[]
    SERVICE_ITEMS.forEach(({k,label})=>{
      if(!checked[k])return
      if(k==='color'){const cp=Object.entries(colorTags).map(([,ts])=>ts.join(' ')).filter(Boolean);parts.push(label+(cp.length?': '+cp.join(' / '):''))}
      else{const ts=tags[k]||[];parts.push(label+(ts.length?': '+ts.join(', '):''))}
    })
    return parts.join(' · ')
  }

  function validate(){
    if(!custName.trim())return '고객 이름을 입력해주세요'
    if(!custPhone.trim())return '연락처를 입력해주세요'
    if(!Object.values(checked).some(Boolean))return '시술 항목을 하나 이상 선택해주세요'
    return ''
  }

  function goConfirm(){
    const err=validate()
    if(err){alert(err);return}
    setError('');setStep('confirm')
  }

  async function handleSubmit(){
    if(!agreed){setError('개인정보 수집 동의가 필요합니다');return}
    setLoading(true);setError('');setUploadingPhotos(true)
    const photoUrls=await uploadPhotos();setUploadingPhotos(false)
    const res=await fetch('/api/service-records/create',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        designer_id:session.designer_id,customer_name:custName,customer_phone:custPhone,
        service_date:svcDate,service_type:buildSvc(),gender:gender||null,
        damage_level:dmgLevel||null,damage_part:dmgPart||null,
        care_method:noteVal.care||null,caution:noteVal.caution||null,
        next_service:noteVal.next||null,memo:noteVal.memo||null,
        cust_memo:custMemo||null,secret_recipe:recipe||null,
        photo_urls:photoUrls.length>0?photoUrls:null,
        consent_type:existingCustomer?.consent_type||'verbal'
      })
    })
    const data=await res.json();setLoading(false)
    if(res.ok)router.replace('/dashboard')
    else setError(data.error||'오류가 발생했습니다')
  }

  if(!session)return null
  const noteTabs=[{k:'care',l:'손질법'},{k:'caution',l:'주의사항'},{k:'next',l:'다음시술'},{k:'memo',l:'메모'}]
  const svc=buildSvc()
  const consentAgreed=consentStatus==='agreed'

  function buildPreview(){
    let txt='[헤어로그] 시술 내역 안내\n\n'+custName+'님, 오늘 시술 감사드립니다.\n\n날짜: '+svcDate+'\n시술: '+svc
    if(noteVal.care)txt+='\n손질법: '+noteVal.care
    if(noteVal.caution)txt+='\n주의: '+noteVal.caution
    if(noteVal.next)txt+='\n다음 시술: '+noteVal.next
    if(designer){
      txt+='\n\n담당: '+(designer.salon_name||'')+(designer.position?' '+designer.position:'')+' '+(designer.name||'')
      if(designer.business_hours)txt+='\n영업: '+designer.business_hours+(designer.day_off?' (정기휴무: '+designer.day_off+')':'')
      if(designer.temp_holidays)txt+='\n임시휴무: '+designer.temp_holidays
    }
    return txt
  }

  if(step==='confirm'){
    return (
      <div className="min-h-screen bg-white pb-28">
        <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-3 border-b border-zinc-100">
          <button onClick={()=>setStep('form')} className="p-1 rounded-lg hover:bg-zinc-100 transition"><span className="text-zinc-600 text-lg">←</span></button>
          <h2 className="text-base font-semibold tracking-tight">시술 내역 확인</h2>
        </div>
        <div className="px-4 py-5 max-w-lg mx-auto space-y-3">
          <div className="card">
            <p className="text-xs font-semibold text-zinc-400 mb-3 tracking-wider uppercase">고객 정보</p>
            <div className="divide-y divide-zinc-100 text-sm">
              <CRow label="고객명" val={custName}/>
              <CRow label="연락처" val={custPhone}/>
              <CRow label="성별" val={gender==='female'?'여성':gender==='male'?'남성':'-'}/>
              <CRow label="시술일" val={svcDate}/>
              <CRow label="시술" val={svc}/>
              <CRow label="동의" val={existingCustomer?.consent_type==='verbal'?'구두 동의':'문자 동의'}/>
              {dmgLevel&&<CRow label="손상도" val={dmgLevel}/>}
              {dmgPart&&<CRowLong label="부분 손상" val={dmgPart}/>}
              {noteVal.care&&<CRowLong label="손질법" val={noteVal.care}/>}
              {noteVal.caution&&<CRowLong label="주의사항" val={noteVal.caution}/>}
              {noteVal.next&&<CRow label="다음 시술" val={noteVal.next}/>}
              {noteVal.memo&&<CRowLong label="메모" val={noteVal.memo}/>}
            </div>
          </div>

          {photos.length>0&&(
            <div className="card">
              <p className="text-xs font-semibold text-zinc-400 mb-2 tracking-wider uppercase">시술 사진 {photos.length}장</p>
              <div className="flex gap-2 flex-wrap">
                {photos.map((p,i)=><img key={i} src={p.preview} className="w-16 h-16 rounded-lg object-cover border border-zinc-200" alt=""/>)}
              </div>
            </div>
          )}

          {(custMemo||recipe)&&(
            <div className="card bg-zinc-50">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={12} className="text-zinc-400"/>
                <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">디자이너 전용</p>
              </div>
              <div className="divide-y divide-zinc-200 text-sm">
                {custMemo&&<CRowLong label="고객 메모" val={custMemo}/>}
                {recipe&&<CRowLong label="비밀 레시피" val={recipe}/>}
              </div>
            </div>
          )}

          <div className="card bg-zinc-900 border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 mb-2 tracking-wider uppercase">발송될 문자</p>
            <pre className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">{buildPreview()}</pre>
          </div>

          <div className="card">
            <p className="text-xs text-zinc-500 leading-relaxed mb-3">
              [개인정보 수집 및 이용 동의]{'\n'}
              수집 목적: 시술 이력 관리, 맞춤 케어 서비스, SMS 발송{'\n'}
              수집 항목: 성명, 연락처, 시술 내역{'\n'}
              보유 기간: 동의 철회 또는 서비스 종료 시까지
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="w-4 h-4 accent-zinc-900"/>
              <span className="text-sm font-medium text-zinc-800">위 내용에 동의합니다 (필수)</span>
            </label>
          </div>

          {error&&<p className="text-red-500 text-sm text-center">{error}</p>}
          <button onClick={handleSubmit} disabled={loading||!agreed} className="btn-primary w-full py-4 text-sm disabled:opacity-40">
            {loading?(uploadingPhotos?'사진 업로드 중...':'저장 중...'):'저장 및 문자 발송'}
          </button>
        </div>
        <BottomNavBar activeMenu="service" router={router}/>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-3 border-b border-zinc-100">
        <button onClick={()=>router.push('/dashboard')} className="p-1 rounded-lg hover:bg-zinc-100 transition"><span className="text-zinc-600 text-lg">←</span></button>
        <h2 className="text-base font-semibold tracking-tight">시술 기록 작성</h2>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {/* 고객 정보 */}
        <div className="card space-y-3">
          <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">고객 정보</p>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">이름 <span className="text-red-400">*</span></label>
            <input className="input" value={custName} onChange={e=>setCustName(e.target.value)} placeholder="홍길동"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">연락처 <span className="text-red-400">*</span></label>
            <input className="input" value={custPhone} onChange={e=>setCustPhone(e.target.value)}
              onBlur={e=>{if(session)checkConsent(e.target.value)}}
              placeholder="010-1234-5678" inputMode="tel"/>
          </div>

          {consentStatus==='checking'&&<p className="text-xs text-zinc-400">확인 중...</p>}
          {consentStatus==='agreed'&&(
            <div className="flex items-center gap-2 py-2 px-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <CheckCircle size={14} className="text-emerald-600 flex-shrink-0"/>
              <span className="text-xs font-medium text-emerald-700">
                동의 완료 — {existingCustomer?.consent_type==='verbal'?'구두 동의':'문자 동의'}
              </span>
            </div>
          )}

          {(consentStatus==='pending'||consentStatus==='rejected'||consentStatus==='new')&&(
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 space-y-3">
              <div>
                <p className="text-sm font-semibold text-zinc-800">개인정보 수집 동의 필요</p>
                <p className="text-xs text-zinc-500 mt-0.5">시술 기록 작성 전 동의를 진행해 주세요.</p>
              </div>
              <div className="border border-zinc-200 rounded-lg p-3 bg-white">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Mic size={11} className="text-zinc-400"/>
                  <p className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">현장 안내 가이드</p>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">"고객님, 시술 이력 관리와 재방문 알림을 위해 개인정보 수집에 구두 동의해 주시겠어요?"</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleSmsConsent} disabled={sendingConsent}
                  className="flex items-center justify-center gap-1.5 py-2.5 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition disabled:opacity-50">
                  <MessageSquare size={13}/>
                  {sendingConsent?'발송 중...':'문자로 동의 요청'}
                </button>
                <button onClick={handleVerbalConsent} disabled={processingVerbal}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-[#18181B] text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition disabled:opacity-50">
                  <Mic size={13}/>
                  {processingVerbal?'처리 중...':'구두 동의 완료'}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">성별</label>
            <div className="flex gap-2">
              {[{v:'female',l:'여성'},{v:'male',l:'남성'}].map(({v,l})=>(
                <button key={v} type="button" onClick={()=>setGender(gender===v?'':v)}
                  className={'flex-1 py-2.5 rounded-xl text-xs font-semibold border transition '+(gender===v?'bg-[#18181B] text-white border-[#18181B]':'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400')}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">시술 날짜</label>
            <input className="input" type="date" value={svcDate} onChange={e=>setSvcDate(e.target.value)}/>
          </div>
        </div>

        {/* 시술 항목 */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">시술 항목 <span className="text-red-400">*</span></p>
          </div>
          <div className="divide-y divide-zinc-100">
            {SERVICE_ITEMS.map(({k,label})=>{
              const myStyles=lsGet('hl_s_'+k)
              const curTags=tags[k]||[]
              const isCkd=!!checked[k]
              return (
                <div key={k+'-'+svcTick}>
                  <button type="button" onClick={()=>setChecked(p=>({...p,[k]:!p[k]}))}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-zinc-50 transition text-left">
                    <div className={'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition '+(isCkd?'bg-[#18181B] border-[#18181B]':'border-zinc-300')}>
                      {isCkd&&<span className="text-white text-[9px] font-black">✓</span>}
                    </div>
                    <span className="text-sm font-medium text-zinc-800">{label}</span>
                  </button>
                  {isCkd&&(
                    <div className="bg-zinc-50 border-t border-zinc-100 px-4 py-3 space-y-3">
                      {k==='cut'&&(gender==='male'
                        ?<div className="flex flex-wrap gap-1.5">{CUT_MALE.map(t=><Chip key={t} label={t} active={curTags.includes(t)} onClick={()=>toggleTag(k,t)}/>)}</div>
                        :!cutLen
                          ?<div><p className="text-xs text-zinc-400 mb-2">기장 선택</p><div className="flex gap-2 flex-wrap">{['숏','단발','미디움','롱'].map(l=><button key={l} type="button" onClick={()=>setCutLen(l)} className="px-4 py-2 rounded-lg text-xs font-medium border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 transition">{l}</button>)}</div></div>
                          :<div><button onClick={()=>setCutLen('')} className="text-xs text-[#B37346] font-medium mb-2 block">‹ {cutLen} 변경</button><div className="flex flex-wrap gap-1.5">{(CUT_FEMALE[cutLen]||[]).map(t=><Chip key={t} label={t} active={curTags.includes(t)} onClick={()=>toggleTag(k,t)}/>)}</div></div>
                      )}
                      {k==='perm'&&<div className="flex flex-wrap gap-1.5">{(gender==='male'?PERM_MALE:PERM_FEMALE).map(t=><Chip key={t} label={t} active={curTags.includes(t)} onClick={()=>toggleTag(k,t)}/>)}</div>}
                      {k==='color'&&<div className="space-y-3">{Object.entries(COLOR_GROUPS).map(([g,items])=><div key={g}><p className="text-xs font-medium text-zinc-400 mb-1.5">{g}</p><div className="flex flex-wrap gap-1.5">{items.map(t=><Chip key={t} label={t} active={(colorTags[g]||[]).includes(t)} onClick={()=>toggleColorTag(g,t)}/>)}</div></div>)}</div>}
                      {k==='clinic'&&<div className="flex flex-wrap gap-1.5">{CLINIC_LIST.map(t=><Chip key={t} label={t} active={curTags.includes(t)} onClick={()=>toggleTag(k,t)}/>)}</div>}
                      {k==='scalp'&&<div className="flex flex-wrap gap-1.5">{SCALP_LIST.map(t=><Chip key={t} label={t} active={curTags.includes(t)} onClick={()=>toggleTag(k,t)}/>)}</div>}
                      {myStyles.length>0&&(
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-200">
                          {myStyles.map((s:string,i:number)=>(
                            <div key={i} className="flex">
                              <button type="button" onClick={()=>toggleTag(k,s)} className={'px-3 py-1.5 rounded-l-full text-xs font-medium border-y border-l transition '+(curTags.includes(s)?'bg-[#18181B] text-white border-[#18181B]':'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400')}>★ {s}</button>
                              <button type="button" onClick={()=>deleteMyStyle(k,i)} className="px-2 rounded-r-full border-y border-r border-zinc-200 bg-white text-zinc-400 text-xs hover:bg-red-50 hover:text-red-400 transition">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input value={svcInput[k]||''} onChange={e=>setSvcInput(p=>({...p,[k]:e.target.value}))}
                          onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();saveMyStyle(k)}}}
                          className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-xs outline-none bg-white focus:border-zinc-400 placeholder:text-zinc-400"
                          placeholder="직접 입력 후 저장"/>
                        <button type="button" onClick={()=>saveMyStyle(k)} className="px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition whitespace-nowrap">저장 ★</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <div className="px-4 py-3 flex items-center gap-4 bg-white">
              <span className="text-xs font-medium text-zinc-600 flex-shrink-0">손상도</span>
              <div className="flex gap-2 ml-auto">
                {['상','중','하'].map(l=>(
                  <button key={l} type="button" onClick={()=>setDmgLevel(dmgLevel===l?'':l)}
                    className={'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition '+(dmgLevel===l?'bg-[#18181B] text-white border-[#18181B]':'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400')}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 pb-3 bg-white">
              <input className="input text-xs" value={dmgPart} onChange={e=>setDmgPart(e.target.value)} placeholder="부분 손상 상세 (예: 끝머리 20cm)"/>
            </div>
          </div>
        </div>

        {/* 사진 */}
        <div className="card">
          <p className="text-xs font-semibold text-zinc-400 mb-3 tracking-wider uppercase">시술 사진 (최대 5장)</p>
          <div className="flex gap-2.5 flex-wrap">
            {photos.map((p,i)=>(
              <div key={i} className="relative">
                <img src={p.preview} className="w-20 h-20 rounded-xl object-cover border border-zinc-200" alt=""/>
                <button type="button" onClick={()=>removePhoto(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 text-white rounded-full text-xs flex items-center justify-center shadow">
                  <X size={10}/>
                </button>
              </div>
            ))}
            {photos.length<5&&(
              <button type="button" onClick={()=>fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-1 hover:border-zinc-400 transition">
                <Camera size={18} className="text-zinc-400"/>
                <span className="text-[10px] text-zinc-400 font-medium">추가</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect}/>
        </div>

        {/* 노트 탭 */}
        <div className="card p-0 overflow-hidden">
          <div className="flex border-b border-zinc-100 bg-zinc-50 p-1 gap-1">
            {noteTabs.map(t=>(
              <button key={t.k} onClick={()=>setNoteTab(t.k)}
                className={'flex-1 py-2 text-xs font-semibold rounded-lg transition '+(noteTab===t.k?'bg-white text-zinc-800 shadow-sm':'text-zinc-400 hover:text-zinc-600')}>
                {t.l}
              </button>
            ))}
          </div>
          <div className="p-4 space-y-3">
            {(myPhrases[noteTab]||[]).length>0&&(
              <div className="flex flex-wrap gap-1.5">
                {(myPhrases[noteTab]||[]).map((ph:string,i:number)=>(
                  <div key={i} className="flex">
                    <button type="button" onClick={()=>addPhrase(noteTab,ph)} className="px-3 py-1.5 rounded-l-full text-xs font-medium bg-white text-zinc-700 border-y border-l border-zinc-200 hover:bg-zinc-50 max-w-[180px] truncate">★ {ph}</button>
                    <button type="button" onClick={()=>deleteMyPhrase(noteTab,i)} className="px-2 rounded-r-full border-y border-r border-zinc-200 bg-white text-zinc-400 text-xs hover:text-red-400">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {(DEFAULT_PHRASES[noteTab]||[]).map((ph:string)=>(
                <button key={ph} type="button" onClick={()=>addPhrase(noteTab,ph)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition">
                  {ph}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={noteInput[noteTab]||''} onChange={e=>setNoteInput(p=>({...p,[noteTab]:e.target.value}))}
                onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();savePhrase(noteTab)}}}
                className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-xs outline-none bg-white focus:border-zinc-400 placeholder:text-zinc-400"
                placeholder="직접 입력 후 저장"/>
              <button type="button" onClick={()=>savePhrase(noteTab)} className="px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition whitespace-nowrap">저장 ★</button>
            </div>
            <textarea value={noteVal[noteTab]||''} onChange={e=>setNoteVal(p=>({...p,[noteTab]:e.target.value}))}
              rows={2} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs resize-none outline-none focus:border-zinc-400 bg-zinc-50"
              placeholder="위 태그를 눌러 추가하거나 직접 입력"/>
          </div>
        </div>

        {/* 비밀 레시피 / 메모 */}
        <div className="card p-0 overflow-hidden divide-y divide-zinc-100">
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={13} className="text-zinc-400"/>
              <div>
                <div className="text-xs font-semibold text-zinc-700">비밀 레시피</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">고객 비공개</div>
              </div>
            </div>
            <button onClick={()=>setShowRecipe(!showRecipe)}
              style={{height:'22px',width:'40px'}}
              className={'rounded-full transition-colors relative '+(showRecipe?'bg-[#18181B]':'bg-zinc-200')}>
              <div className="absolute w-4 h-4 bg-white rounded-full shadow transition-all" style={{top:'3px',left:showRecipe?'22px':'3px'}}/>
            </button>
          </div>
          {showRecipe&&(
            <div className="px-4 pb-3 pt-1">
              <textarea className="input text-xs resize-none mt-1" rows={2} value={recipe} onChange={e=>setRecipe(e.target.value)} placeholder="예) 밀본 7.60 × 3% 산화제 1:1, 방치 25분"/>
            </div>
          )}
          <button type="button" onClick={()=>setShowMemo(!showMemo)} className="w-full px-4 py-3.5 flex items-center gap-2 text-left hover:bg-zinc-50 transition">
            <span className="text-zinc-400 text-xs">📌</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-zinc-700">고객 메모</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">다음 방문 참고 · 고객 비공개</div>
            </div>
            {showMemo?<ChevronUp size={14} className="text-zinc-400"/>:<ChevronDown size={14} className="text-zinc-400"/>}
          </button>
          {showMemo&&(
            <div className="px-4 pb-3 pt-1">
              <textarea className="input text-xs resize-none" rows={2} value={custMemo} onChange={e=>setCustMemo(e.target.value)} placeholder="예) 다음엔 파마 강도 세게, 두피 민감"/>
            </div>
          )}
        </div>

        {error&&<p className="text-red-500 text-xs text-center">{error}</p>}
        <button onClick={goConfirm} className="btn-primary w-full py-3.5 text-sm">
          다음 — 내용 확인
        </button>
      </div>

      <BottomNavBar activeMenu="service" router={router}/>
    </div>
  )
}

function Chip({label,active,onClick}:{label:string;active:boolean;onClick:()=>void}){
  return(
    <button type="button" onClick={onClick}
      className={'px-3 py-1.5 rounded-full text-xs font-medium border transition active:scale-[0.97] '+(active?'bg-[#18181B] text-white border-[#18181B]':'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400')}>
      {label}
    </button>
  )
}
function CRow({label,val}:{label:string;val:string}){
  return(
    <div className="flex justify-between items-center py-2.5">
      <span className="text-xs text-zinc-400 flex-shrink-0 mr-4">{label}</span>
      <span className="text-sm font-medium text-zinc-800 text-right">{val||'-'}</span>
    </div>
  )
}
function CRowLong({label,val}:{label:string;val:string}){
  return(
    <div className="py-2.5">
      <span className="text-xs text-zinc-400 block mb-1">{label}</span>
      <p className="text-sm font-medium text-zinc-800 leading-relaxed whitespace-pre-wrap">{val}</p>
    </div>
  )
}
function BottomNavBar({activeMenu,router}:{activeMenu:string;router:any}){
  const menus=[
    {k:'home',l:'오늘',Icon:CalendarDays,path:'/dashboard'},
    {k:'customers',l:'고객',Icon:Users,path:'/customers'},
    {k:'service',l:'시술',Icon:Scissors,path:'/service/new'},
    {k:'revisit',l:'재방문',Icon:Bell,path:'/revisit'},
    {k:'profile',l:'프로필',Icon:UserCircle,path:'/profile'},
  ]
  return(
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 max-w-lg mx-auto flex justify-around items-center py-2 px-2">
      {menus.map(({k,l,Icon,path})=>{
        const isAct=activeMenu===k
        return(
          <button key={k} onClick={()=>router.push(path)}
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all active:scale-95">
            <Icon size={20} strokeWidth={isAct?2:1.5} className={isAct?'text-[#B37346]':'text-zinc-400'}/>
            <span className={'text-[10px] font-medium '+(isAct?'text-[#B37346]':'text-zinc-400')}>{l}</span>
          </button>
        )
      })}
    </div>
  )
}
