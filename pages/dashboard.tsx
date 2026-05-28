import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSession, clearSession } from '../lib/auth'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push('/'); return }
    setSession(s)
  }, [])

  function logout() { clearSession(); router.push('/') }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-accent">헤어로그</h1>
        <button onClick={logout} className="text-sm text-gray-400">로그아웃</button>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <p className="text-gray-500 text-sm">안녕하세요, <span className="font-semibold text-primary">{session.nickname}</span>님 👋</p>

        {/* 메뉴 카드 */}
        <Link href="/service/new" className="card flex items-center gap-4 hover:shadow-md transition cursor-pointer block">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white text-2xl">✂️</div>
          <div>
            <p className="font-semibold">시술 기록 작성</p>
            <p className="text-sm text-gray-400">새 시술 내역을 기록해요</p>
          </div>
        </Link>

        <Link href="/customers" className="card flex items-center gap-4 hover:shadow-md transition cursor-pointer block">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">👥</div>
          <div>
            <p className="font-semibold">고객 목록</p>
            <p className="text-sm text-gray-400">고객 검색 및 시술 이력 확인</p>
          </div>
        </Link>

        <Link href="/revisit" className="card flex items-center gap-4 hover:shadow-md transition cursor-pointer block">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">🔔</div>
          <div>
            <p className="font-semibold">재방문 관리</p>
            <p className="text-sm text-gray-400">장기 미방문 고객 문자 발송</p>
          </div>
        </Link>

        <Link href="/profile" className="card flex items-center gap-4 hover:shadow-md transition cursor-pointer block">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">💼</div>
          <div>
            <p className="font-semibold">내 프로필</p>
            <p className="text-sm text-gray-400">소속, 경력, 예약링크 관리</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
