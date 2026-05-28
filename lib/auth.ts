export function getSession() {
  if (typeof window === 'undefined') return null
  const s = localStorage.getItem('hairlog_session')
  if (!s) return null
  try { return JSON.parse(s) } catch { return null }
}

export function setSession(data: any) {
  localStorage.setItem('hairlog_session', JSON.stringify(data))
}

export function clearSession() {
  localStorage.removeItem('hairlog_session')
}
