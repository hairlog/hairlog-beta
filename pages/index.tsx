import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSession, setSession } from '../lib/auth'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [autoLogin, setAutoLogin] = useState(true)
  const [showPw, setShowPw] = useState(false)
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-zinc-400 text-sm">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 상단 로고 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">헤어로그</h1>
          <p className="text-sm text-zinc-400 mt-2">디자이너 전용 시술 기록</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* 회원가입 안내 */}
          {isSignup && (
            <div className="border border-zinc-200 rounded-xl p-4">
              <p className="text-xs text-zinc-500 leading-relaxed">
                베타 기간 중 닉네임·비밀번호 분실 시 복구가 불가합니다.{' '}
                <span className="font-semibold text-zinc-800">메모장에 꼭 저장해 두세요.</span>
              </p>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-400 transition placeholder:text-zinc-400 font-medium"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="닉네임"
                required
              />
            </div>
            <div className="relative">
              <input
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 pr-11 text-sm focus:outline-none focus:border-zinc-400 transition placeholder:text-zinc-400 font-medium"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* 자동로그인 */}
            {!isSignup && (
              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <div onClick={() => setAutoLogin(!autoLogin)}
                  className={'w-4 h-4 rounded border-2 flex items-center justify-center transition ' +
                    (autoLogin ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300')}>
                  {autoLogin && <span className="text-white text-[9px] font-black">✓</span>}
                </div>
                <span className="text-sm text-zinc-500">자동 로그인</span>
              </label>
            )}

            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 active:scale-[0.99] transition disabled:opacity-40 mt-1">
              {loading ? '처리 중...' : (isSignup ? '가입하기' : '로그인')}
            </button>
          </form>

          <button onClick={() => { setIsSignup(!isSignup); setError('') }}
            className="w-full text-center text-sm text-zinc-400 py-2 hover:text-zinc-600 transition">
            {isSignup ? '이미 계정이 있어요' : '처음이에요 — 회원가입'}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-zinc-300 text-center pb-8 tracking-wider">HAIRLOG BETA</p>
    </div>
  )
}
