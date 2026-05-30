import { useState, useEffect } from 'react'

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [designers, setDesigners] = useState<any[]>([])
  const [surveys, setSurveys] = useState<any[]>([])
  const [tab, setTab] = useState<'overview'|'designers'|'surveys'>('overview')
  const [loading, setLoading] = useState(false)

  const ADMIN_PW = 'hairlog2026admin'

  function login() {
    if (pw === ADMIN_PW) { setAuthed(true); loadData() }
    else alert('비밀번호가 틀렸어요')
  }

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PW }),
      })
      if (!res.ok) { alert('데이터를 불러오지 못했어요'); setLoading(false); return }
      const json = await res.json()
      setDesigners(json.designers || [])
      setSurveys(json.surveys || [])
      setStats(json.stats || null)
    } catch (e) {
      alert('데이터를 불러오지 못했어요')
    }
    setLoading(false)
  }

  if (!authed) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <h1 className="text-white font-bold text-xl tracking-tight mb-2">헤어로그</h1>
        <p className="text-zinc-500 text-xs mb-8 tracking-wider">ADMIN PANEL</p>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&login()}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500 mb-3"
          placeholder="관리자 비밀번호" autoFocus />
        <button onClick={login} className="w-full py-3 bg-white text-zinc-900 font-semibold text-sm rounded-xl hover:bg-zinc-100 transition">
          로그인
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight">관리자 대시보드</h1>
            <p className="text-xs text-zinc-500 mt-0.5">HAIRLOG BETA ADMIN</p>
          </div>
          <button onClick={() => setAuthed(false)} className="text-xs text-zinc-500 border border-zinc-700 rounded-lg px-3 py-1.5 hover:bg-zinc-800 transition">로그아웃</button>
        </div>

        <div className="flex gap-1 mb-6 border-b border-zinc-800">
          {[{k:'overview',l:'개요'},{k:'designers',l:'디자이너'},{k:'surveys',l:'설문 결과'}].map(({k,l}) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={'px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ' +
                (tab===k ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300')}>
              {l}
            </button>
          ))}
        </div>

        {loading && <p className="text-zinc-500 text-sm py-8 text-center">불러오는 중...</p>}

        {/* 개요 */}
        {!loading && tab==='overview' && stats && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '전체 디자이너', value: stats.totalDesigners + '명' },
              { label: '오늘 문자 발송', value: stats.todaySms + '건' },
              { label: '설문 참여', value: stats.totalSurveys + '명' },
              { label: '유료 의향', value: stats.willingToPay + '명' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs text-zinc-500 mb-2">{label}</p>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* 디자이너 */}
        {!loading && tab==='designers' && (
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-5 px-4 py-3 bg-zinc-900 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              <span className="col-span-2">닉네임 / 미용실</span>
              <span>고객수</span><span>기록수</span><span>가입일</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {designers.map(d => (
                <div key={d.id} className="grid grid-cols-5 px-4 py-3.5 text-sm hover:bg-zinc-900 transition">
                  <div className="col-span-2">
                    <p className="font-medium text-white">{d.nickname || d.name || '-'}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{d.salon_name || '-'}</p>
                  </div>
                  <span className="text-zinc-300 self-center">{d.customerCount}명</span>
                  <span className="text-zinc-300 self-center">{d.recordCount}건</span>
                  <span className="text-zinc-600 text-xs self-center">{d.created_at?.slice(0,10)}</span>
                </div>
              ))}
              {designers.length===0 && <p className="px-4 py-8 text-zinc-600 text-sm text-center">데이터 없음</p>}
            </div>
          </div>
        )}

        {/* 설문 */}
        {!loading && tab==='surveys' && (
          <div className="space-y-4">
            {surveys.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '실사용 의향 YES', value: surveys.filter((s:any)=>s.will_use).length + '명' },
                  { label: '유료 결제 의향', value: surveys.filter((s:any)=>s.price_willingness!=='free').length + '명' },
                  { label: '전체 응답', value: surveys.length + '명' },
                ].map(({label,value}) => (
                  <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-[10px] text-zinc-500 mb-1.5">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 px-4 py-3 bg-zinc-900 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <span>실사용</span><span>희망가격</span><span>불편한 점</span><span>미사용 이유</span>
              </div>
              <div className="divide-y divide-zinc-800">
                {surveys.map((s:any,i:number) => (
                  <div key={i} className="grid grid-cols-4 px-4 py-3 text-xs gap-2 items-start">
                    <span className={s.will_use ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{s.will_use ? 'YES' : 'NO'}</span>
                    <span className="text-zinc-300">
                      {s.price_willingness==='free'?'무료만':s.price_willingness==='5000'?'5천원 이내':s.price_willingness==='10000'?'1만원 이내':'2만원'}
                    </span>
                    <span className="text-zinc-400 leading-relaxed">{s.pain_point||'-'}</span>
                    <span className="text-zinc-400 leading-relaxed">{s.churn_reason||'-'}</span>
                  </div>
                ))}
                {surveys.length===0 && <p className="px-4 py-8 text-zinc-600 text-sm text-center">설문 응답 없음</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
