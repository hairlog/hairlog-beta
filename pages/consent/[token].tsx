import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function ConsentPage() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState<'loading'|'pending'|'agreed'|'rejected'|'error'>('loading')
  const [designer, setDesigner] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`/api/consent/info?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setStatus('error'); return }
        if (d.consent_status === 'agreed') { setStatus('agreed'); return }
        if (d.consent_status === 'rejected') { setStatus('rejected'); return }
        setDesigner(d.designer)
        setStatus('pending')
      })
  }, [token])

  async function handleAgree() {
    setLoading(true)
    const res = await fetch('/api/consent/confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'agree' })
    })
    setLoading(false)
    if (res.ok) setStatus('agreed')
  }

  async function handleReject() {
    setLoading(true)
    const res = await fetch('/api/consent/confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'reject' })
    })
    setLoading(false)
    if (res.ok) setStatus('rejected')
  }

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">불러오는 중...</p></div>

  if (status === 'agreed') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center"><div className="text-5xl mb-4">✅</div><h2 className="text-xl font-bold mb-2">동의 완료!</h2><p className="text-gray-500 text-sm">개인정보 수집에 동의해 주셔서 감사합니다.</p></div>
    </div>
  )

  if (status === 'rejected') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center"><div className="text-5xl mb-4">❌</div><h2 className="text-xl font-bold mb-2">동의 거절됨</h2><p className="text-gray-500 text-sm">담당 디자이너에게 문의해주세요.</p></div>
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center"><div className="text-5xl mb-4">⚠️</div><h2 className="text-xl font-bold mb-2">링크 오류</h2><p className="text-gray-500 text-sm">유효하지 않은 링크입니다. 재요청해 주세요.</p></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-amber-600">헤어로그</h1>
          <p className="text-sm text-gray-500 mt-1">개인정보 수집 및 이용 동의</p>
        </div>
        {designer && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700">{designer.salon_name} {designer.position} {designer.name}</p>
          </div>
        )}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 space-y-3 text-sm text-gray-600">
          <h2 className="font-bold text-gray-800">개인정보 수집 및 이용 안내</h2>
          <div><p className="font-semibold text-gray-700 mb-1">수집 목적</p><p>시술 이력 관리, 맞춤 케어 서비스 제공, 시술 내역 안내 문자 발송</p></div>
          <div><p className="font-semibold text-gray-700 mb-1">수집 항목</p><p>고객 성명, 휴대전화번호, 시술 내역</p></div>
          <div><p className="font-semibold text-gray-700 mb-1">보유 기간</p><p>동의 철회 시 또는 서비스 종료 시까지</p></div>
          <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">※ 동의를 거부할 권리가 있으나, 거부 시 시술 기록 관리 서비스 이용이 제한됩니다.</div>
        </div>
        <div className="space-y-3">
          <button onClick={handleAgree} disabled={loading} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-base disabled:opacity-50">
            {loading ? '처리 중...' : '✅ 동의합니다'}
          </button>
          <button onClick={handleReject} disabled={loading} className="w-full py-4 border border-gray-300 text-gray-500 rounded-2xl font-medium text-sm">
            동의하지 않습니다
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">헤어로그 · 개인정보보호법 준수</p>
      </div>
    </div>
  )
}
