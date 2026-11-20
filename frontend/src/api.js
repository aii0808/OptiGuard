const BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://optiguard-backend-987q.vercel.app'
    : 'http://localhost:4000');

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  const token = localStorage.getItem('og_token')
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (form) payload = form
  else if (body) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(BASE + path, { method, headers, body: payload })
  const data = await res.json().catch(() => ({}))

  if (res.status === 401 && path !== '/auth/login') {
    localStorage.removeItem('og_token')
    localStorage.removeItem('og_user')
    window.location.href = '/login'
  }
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')
  return data
}