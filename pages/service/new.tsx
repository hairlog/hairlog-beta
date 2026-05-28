import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../../lib/auth'

const PRIVACY_TEXT = `[개인정보 수집 및 이용 동의 (필수)]
수집 목적: 헤어 디자이너의 시술 이력 관리, 맞춤형 헤어 케어 서비스 제공 및 시술 내역 SMS 발송
수집 항목: 고객 성명, 휴대전화번호, 시술 내역(메모 및 사진 포함)
보유 및 이용 기간: 고객의 동의 철회 시 또는 서비스 종료 시까지
귀하는 본 동의를 거부할 권리가 있으나, 거부 시 시술 내역 발송 및 이력 관리 서비스 이용이 제한됩니다.`

export default function NewService() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [loading, setLoading] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    service_date: new Date().toISOString().split('T')[0],
    service_type: '',
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

  async function handleConfirmAndSend() {
    if (!privacyAgreed) { alert('개인정보 수집 동의가 필요합니다'); return }
    setLoading(true)
    const res = await fetch('/api/service-records/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, designer_id: session.designer_id }),
    })
    setLoading(false)
    if (res.ok) { alert('시술 기록이 저장되고 고객에게 문자가 발송됐어요!'); router.push('/customers') }
    else { alert('오류가 발생했습니다. 다시 시도해주세요.') }
  }

  if (!session) return null

  const SERVICE_TYPES = ['커트', '염색', '펌', '매직/스트레이트', '클리닉', '두피케어', '기타']

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
          <button onClick={() => setStep('form')} className="text-gray-500">←</button>
          <h2 className="text-lg font-semibold">시술 내역 확인</h2>
        </div>
        <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-700">📋 작성 내용 확인</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">고객명</span><span className="font-medium">{form.customer_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">연락처</span><span className="font-medium">{form.customer_phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">시술일</span><span className="font-medium">{form.service_date}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">시술 종류</span><span className="font-medium">{form.service_type}</span></div>
              {form.memo && <div><span className="text-gray-500">메모</span><p className="font-medium mt-1">{form.memo}</p></div>}
              {form.secret_recipe && <div><span className="text-gray-500">비밀 레시피 🔒</span><p className="font-medium mt-1 text-orange-600">{form.secret_recipe}</p></div>}
            </div>
          </div>

          {/* 개인정보 동의 */}
          <div className="card">
            <pre className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">{PRIVACY_TEXT}</pre>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" checked={privacyAgreed} onChange={e => setPrivacyAgreed(e.target.checked)} className="w-4 h-4 accent-amber-500" />
              <span className="text-sm font-medium">위 내용에 동의합니다 (필수)</span>
            </label>
          </div>

          <p className="text-xs text-gray-400 text-center">확인 후 고객에게 시술 내역 문자가 발송됩니다</p>

          <button onClick={handleConfirmAndSend} disabled={loading || !privacyAgreed} className="btn-primary w-full disabled:opacity-50">
            {loading ? '발송 중...' : '✅ 확인하고 문자 발송'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500">←</button>
        <h2 className="text-lg font-semibold">시술 기록 작성</h2>
      </div>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <div className="card space-y-4">
          <h3 className="font-semibold">👤 고객 정보</h3>
          <div>
            <label className="block text-sm font-medium mb-1">고객 이름 *</label>
            <input className="input" name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="홍길동" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">휴대전화번호 *</label>
            <input className="input" name="customer_phone" value={form.customer_phone} onChange={handleChange} placeholder="010-1234-5678" required />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold">✂️ 시술 정보</h3>
          <div>
            <label className="block text-sm font-medium mb-1">시술 날짜 *</label>
            <input className="input" type="date" name="service_date" value={form.service_date} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">시술 종류 *</label>
            <select className="input" name="service_type" value={form.service_type} onChange={handleChange} required>
              <option value="">선택해주세요</option>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">메모</label>
            <textarea className="input" name="memo" value={form.memo} onChange={handleChange} placeholder="시술 내용, 고객 특이사항 등" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">🔒 비밀 레시피 (디자이너만 볼 수 있어요)</label>
            <textarea className="input" name="secret_recipe" value={form.secret_recipe} onChange={handleChange} placeholder="약품 배합, 처리 시간 등" rows={3} />
          </div>
        </div>

        <button
          onClick={() => {
            if (!form.customer_name || !form.customer_phone || !form.service_type) { alert('필수 항목을 입력해주세요'); return }
            setStep('confirm')
          }}
          className="btn-primary w-full"
        >
          다음 → 내용 확인
        </button>
      </div>
    </div>
  )
}
