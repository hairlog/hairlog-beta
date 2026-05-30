import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession } from '../lib/auth'
import { CheckCircle } from 'lucide-react'

export default function Survey() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [willUse, setWillUse] = useState<boolean|null>(null)
  const [painPoint, setPainPoint] = useState('')
  const [price, setPrice] = useState('')
  const [churnReason, setChurnReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSession(s)
  }, [])

  async function handleSubmit() {
    if (willUse === null) { alert('실제 사용 의향을 선택해주세요'); return }
    if (!price) { alert('가격 의향을 선택해주세요'); return }
    setSubmitting(true)
    const res = await fetch('/api/survey/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        designer_id: session.designer_id,
        will_use: willUse,
        pain_point: painPoint,
        price_willingness: price,
        churn_reason: churnReason,
      })
    })
    setSubmitting(false)
    if (res.ok) setDone(true)
    else alert('제출 실패. 다시 시도해주세요.')
  }

  if (done) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <CheckCircle size={40} className="text-emerald-500 mb-4" />
      <h2 className="text-xl font-bold text-zinc-900 tracking-tight mb-2">감사합니다!</h2>
      <p className="text-sm text-zinc-500 leading-relaxed mb-6">소중한 피드백이 헤어로그 발전에<br/>큰 도움이 됩니다.</p>
      <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl">
        대시보드로 돌아가기
      </button>
    </div>
  )

  if (!session) return null

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-zinc-100">
        <p className="text-xs font-semibold text-[#B37346] tracking-wider uppercase mb-2">BETA FEEDBACK</p>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">베타 피드백 설문</h2>
        <p className="text-xs text-zinc-400 mt-1">솔직한 의견이 큰 도움이 돼요 (1분 소요)</p>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-8">

        {/* Q1 */}
        <div>
          <p className="text-sm font-bold text-zinc-900 mb-1">Q1. 실제 고객에게 써볼 생각 있나요?</p>
          <p className="text-xs text-zinc-400 mb-3">현장에서 직접 사용할 의향이 있는지 알려주세요</p>
          <div className="grid grid-cols-2 gap-2">
            {[{v:true,l:'네, 써볼게요'},{v:false,l:'아직 모르겠어요'}].map(({v,l}) => (
              <button key={String(v)} onClick={() => setWillUse(v)}
                className={'py-3.5 rounded-xl text-sm font-semibold border-2 transition ' +
                  (willUse===v ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div>
          <p className="text-sm font-bold text-zinc-900 mb-1">Q2. 가장 불편했던 부분은 무엇인가요?</p>
          <p className="text-xs text-zinc-400 mb-3">자유롭게 적어주세요</p>
          <textarea value={painPoint} onChange={e=>setPainPoint(e.target.value)} rows={3}
            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-400 resize-none bg-zinc-50 placeholder:text-zinc-400"
            placeholder="예) 동의 절차가 복잡해요, 시술 항목이 너무 많아요..." />
        </div>

        {/* Q3 */}
        <div>
          <p className="text-sm font-bold text-zinc-900 mb-1">Q3. 돈 내고 쓸 의향이 있나요?</p>
          <p className="text-xs text-zinc-400 mb-3">월 구독 기준으로 생각해주세요</p>
          <div className="space-y-2">
            {[
              { v:'5000', l:'월 5,000원 이내' },
              { v:'10000', l:'월 10,000원 이내' },
              { v:'20000', l:'월 20,000원' },
              { v:'free', l:'공짜여도 안 씀' },
            ].map(({v,l}) => (
              <button key={v} onClick={() => setPrice(v)}
                className={'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition ' +
                  (price===v ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white hover:border-zinc-300')}>
                <div className={'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' +
                  (price===v ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300')}>
                  {price===v && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className={'text-sm font-medium ' + (price===v ? 'text-zinc-900' : 'text-zinc-600')}>{l}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Q4 */}
        <div>
          <p className="text-sm font-bold text-zinc-900 mb-1">Q4. 안 쓰게 된다면 이유가 뭔가요?</p>
          <p className="text-xs text-zinc-400 mb-3">솔직하게 적어주실수록 도움이 돼요</p>
          <textarea value={churnReason} onChange={e=>setChurnReason(e.target.value)} rows={3}
            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-400 resize-none bg-zinc-50 placeholder:text-zinc-400"
            placeholder="예) 기능이 부족해요, 쓰기 번거로워요..." />
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-4 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 active:scale-[0.99] transition disabled:opacity-40">
          {submitting ? '제출 중...' : '설문 제출하기'}
        </button>
      </div>
    </div>
  )
}
