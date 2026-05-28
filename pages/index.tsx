import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession, setSession } from '../lib/auth'

export default function Login() {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [autoLogin, setAutoLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getSession()
    if (s) { router.replace('/dashboard'); return }
    setLoading(false)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || '오류가 발생했습니다'); return }
    setSession(data.user)
    router.replace('/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400 text-sm">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent">헤어로그</h1>
          <p className="text-gray-500 mt-2 text-sm">디자이너 전용 시술 기록 관리</p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">{isSignup ? '회원가입' : '로그인'}</h2>

          {isSignup && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700 leading-relaxed">
                ⚠️ 현재는 베타 서비스 기간으로 기본 정보(이메일, 전화번호 등)를 받고 있지 않아서, 닉네임과 비밀번호 분실 시 찾을 수가 없습니다.<br /><br />
                <strong>반드시 핸드폰 메모장에 닉네임과 비밀번호를 저장해 놓으세요!</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">닉네임</label>
              <input className="input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="닉네임 입력" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 입력" required />
            </div>
            {!isSignup && (
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setAutoLogin(!autoLogin)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${autoLogin ? 'bg-accent border-accent' : 'border-gray-300'}`}>
                  {autoLogin && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm text-gray-600">자동 로그인</span>
              </label>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? '처리 중...' : (isSignup ? '가입하기' : '로그인')}
            </button>
          </form>
          <button onClick={() => { setIsSignup(!isSignup); setError('') }}
            className="w-full text-center text-sm text-gray-500 mt-4 hover:text-accent">
            {isSignup ? '이미 계정이 있어요 → 로그인' : '처음이에요 → 회원가입'}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-6">베타 버전 · 헤어로그</p>
      </div>
    </div>
  )
}
