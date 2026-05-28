import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../../lib/auth'

const PRIVACY_TEXT = `[개인정보 수집 및 이용 동의 (필수)]
수집 목적: 헤어 디자이너의 시술 이력 관리, 맞춤형 헤어 케어 서비스 제공 및 시술 내역 SMS 발송
수집 항목: 고객 성명, 휴대전화번호, 시술 내역
보유 및 이용 기간: 고객의 동의 철회 시 또는 서비스 종료 시까지
귀하는 본 동의를 거부할 권리가 있으나, 거부 시 서비스 이용이 제한됩니다.`

const SERVICE_TYPES = ['커트', '염색', '펌', '매직/스트레이트', '클리닉', '두피케어', '기타']
const DAMAGE_LEVELS = ['하 (건강)', '중 (보통)', '상 (손상심함)']

export default function NewService() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [loading, setLoading] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    service_date: new Date().toISOString().split('T')[0],
    service_type: '',
    gender: '',
    damage_level: '',
    damage_part: '',
    care_method: '',
    caution: '',
    next_service: '',
    memo: '',
    secret_recipe: '',
  })

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push('/'); return }
    setSession(s)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function setField(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function validateForm() {
    if (!form.customer_name.trim()) return '고객 이름을 입력해주세요'
    if (!form.customer_phone.trim()) return '연락처를 입력해주세요'
    if (!form.service_type) return '시술 종류를 선택해주세요'
    return ''
  }

  function goConfirm() {
    const err = validateForm()
    if (err) { setError(err); return }
    setError('')
    setStep('confirm')
  }

  async function handleConfirmAndSend() {
    if (!privacyAgreed) { setError('개인정보 수집 동의가 필요합니다'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/service-records/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, designer_id: session.designer_id }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      router.push('/dashboard')
    } else {
      setError(data.error || '오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  if (!session) return null

  if (step === 'confirm') {
    const genderLabel = form.gender === 'female' ? '여성' : form.gender === 'male' ? '남성' : '-'
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
          <button onClick={() => setStep('form')} className="text-gray-500 text-lg">←</button>
          <h2 className="text-lg font-semibold">시술 내역 확인</h2>
        </div>
        <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-700">📋 작성 내용 확인</h3>
            <div className="divide-y divide-gray-100 text-sm">
              <Row label="고객명" val={form.customer_name} />
              <Row label="연락처" val={form.customer_phone} />
              <Row label="성별" val={genderLabel} />
              <Row label="시술일" val={form.service_date} />
              <Row label="시술 종류" val={form.service_type} />
              {form.damage_level && <Row label="전체 손상도" val={form.damage_level} />}
              {form.damage_part && <Row label="부분 손상도" val={form.damage_part} />}
              {form.care_method && <RowLong label="손질법" val={form.care_method} />}
              {form.caution && <RowLong label="주의사항" val={form.caution} />}
              {form.next_service && <Row label="다음 시술 권장" val={form.next_service} />}
            </div>
          </div>

          {(form.memo || form.secret_recipe) && (
            <div className="card space-y-3 border border-orange-200">
              <h3 className="font-semibold text-orange-700 text-sm">🔒 디자이너 전용 (고객에게 발송 안 됨)</h3>
              <div className="divide-y divide-gray-100 text-sm">
                {form.memo && <RowLong label="📌 메모" val={form.memo} />}
                {form.secret_recipe && <RowLong label="🔒 비밀 레시피" val={form.secret_recipe} />}
              </div>
            </div>
          )}

          <div className="card bg-gray-50 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">📱 고객에게 발송될 문자 미리보기</p>
            <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
              {`[헤어로그] 시술 내역 안내\n\n${form.customer_name}님, 오늘 시술 감사합니다 😊\n\n📋 시술 내역\n날짜: ${form.service_date}\n시술: ${form.service_type}${form.care_method ? `\n손질법: ${form.care_method}` : ''}${form.caution ? `\n주의사항: ${form.caution}` : ''}${form.next_service ? `\n다음 시술: ${form.next_service}` : ''}`}
            </div>
          </div>

          <div className="card">
            <pre className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">{PRIVACY_TEXT}</pre>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" checked={privacyAgreed} onChange={e => setPrivacyAgreed(e.target.checked)} className="w-4 h-4 accent-amber-500" />
              <span className="text-sm font-medium">위 내용에 동의합니다 (필수)</span>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button onClick={handleConfirmAndSend} disabled={loading || !privacyAgreed}
            className="btn-primary w-full disabled:opacity-50 py-3 text-base">
            {loading ? '저장 중...' : '✅ 확인하고 문자 발송'}
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
            <input className="input" name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="홍길동" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">휴대전화번호 <span className="text-red-400">*</span></label>
            <input className="input" name="customer_phone" value={form.customer_phone} onChange={handleChange} placeholder="010-1234-5678" inputMode="tel" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">성별</label>
            <div className="flex gap-2">
              {[['female', '여성 👩'], ['male', '남성 👨']].map(([val, label]) => (
                <button key={val} type="button"
                  onClick={() => setField('gender', form.gender === val ? '' : val)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${form.gender === val ? 'bg-accent text-white border-accent' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold">✂️ 시술 정보</h3>
          <div>
            <label className="block text-sm font-medium mb-1">시술 날짜 <span className="text-red-400">*</span></label>
            <input className="input" type="date" name="service_date" value={form.service_date} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">시술 종류 <span className="text-red-400">*</span></label>
            <select className="input" name="service_type" value={form.service_type} onChange={handleChange}>
              <option value="">선택해주세요</option>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">손상도 <span className="text-gray-400 font-normal text-xs ml-1">(선택)</span></label>
            <p className="text-xs text-gray-500 mb-1.5">전체 손상도</p>
            <div className="flex gap-2 mb-3">
              {DAMAGE_LEVELS.map(lvl => (
                <button key={lvl} type="button"
                  onClick={() => setField('damage_level', form.damage_level === lvl ? '' : lvl)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${form.damage_level === lvl ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mb-1.5">부분 손상도 <span className="text-gray-400">(직접 입력)</span></p>
            <input className="input text-sm" name="damage_part" value={form.damage_part} onChange={handleChange}
              placeholder="예) 끝머리 20cm 가량 손상 심함" />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold">📱 추가 안내 <span className="text-xs text-gray-400 font-normal">— 고객 문자에 포함됩니다</span></h3>
          <div>
            <label className="block text-sm font-medium mb-1">손질법</label>
            <textarea className="input text-sm" name="care_method" value={form.care_method} onChange={handleChange}
              placeholder="예) 드라이 후 아이론 150도 이하 사용" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">주의사항</label>
            <textarea className="input text-sm" name="caution" value={form.caution} onChange={handleChange}
              placeholder="예) 샴푸 48시간 후부터, 묶거나 집게 금지" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">다음 시술 권장</label>
            <input className="input text-sm" name="next_service" value={form.next_service} onChange={handleChange}
              placeholder="예) 컷 5~6주 후, 뿌염 4주 후" />
          </div>
        </div>

        <div className="card space-y-4 border border-orange-100">
          <h3 className="font-semibold text-orange-700">🔒 디자이너 전용 <span className="text-xs font-normal text-gray-400">— 고객에게 발송 안 됨</span></h3>
          <div>
            <label className="block text-sm font-medium mb-1">📌 메모</label>
            <textarea className="input text-sm" name="memo" value={form.memo} onChange={handleChange}
              placeholder="예) 다음엔 파마 강도 조금 세게, 두피 민감" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">🔒 비밀 레시피</label>
            <textarea className="input text-sm" name="secret_recipe" value={form.secret_recipe} onChange={handleChange}
              placeholder="예) 밀본 7.60 × 3% 산화제 1:1, 방치 25분" rows={2} />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button onClick={goConfirm} className="btn-primary w-full py-3 text-base">
          다음 → 내용 확인
        </button>
      </div>
    </div>
  )
}

function Row({ label, val }: { label: string; val: string }) {
  if (!val || val === '-') return (
    <div className="flex justify-between py-2">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-300">-</span>
    </div>
  )
  return (
    <div className="flex justify-between py-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{val}</span>
    </div>
  )
}

function RowLong({ label, val }: { label: string; val: string }) {
  return (
    <div className="py-2">
      <span className="text-gray-500 block mb-1">{label}</span>
      <p className="font-medium text-sm leading-relaxed">{val}</p>
    </div>
  )
}
