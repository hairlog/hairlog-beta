// 버전을 올리면(v1 → v2 → v3...) 기존 캐시를 자동으로 비우고 새로 받습니다.
// 큰 업데이트를 배포할 때마다 이 숫자만 올려주세요.
const CACHE_NAME = 'hairlog-v2'

// 설치되면 곧바로 활성화 (대기 상태로 머물지 않음)
self.addEventListener('install', e => {
  self.skipWaiting()
})

// 활성화될 때, 이름이 다른(=옛날 버전) 캐시를 전부 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const req = e.request

  // GET 요청만 처리 (POST 같은 건 그대로 통과 — 로그인/저장 등이 캐시에 안 걸리게)
  if (req.method !== 'GET') return

  // API 호출은 절대 캐시하지 않음 (항상 최신 데이터)
  if (req.url.includes('/api/')) return

  const url = new URL(req.url)
  const isPageNavigation = req.mode === 'navigate'
  const isNextAsset = url.pathname.startsWith('/_next/')

  // 화면(페이지) 이동: 항상 네트워크 우선 → 실패(오프라인) 시에만 캐시
  if (isPageNavigation) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/')))
    )
    return
  }

  // Next.js 빌드 자산(_next): 파일명에 해시가 붙어 안전하므로 캐시 우선(빠름)
  if (isNextAsset) {
    e.respondWith(
      caches.match(req).then(cached =>
        cached || fetch(req).then(res => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(req, copy))
          return res
        })
      )
    )
    return
  }

  // 그 외(이미지 등): 네트워크 우선, 실패 시 캐시
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then(c => c.put(req, copy))
        return res
      })
      .catch(() => caches.match(req))
  )
})
