export async function api(path, { method = 'GET', body, form } = {}) {
  // Always use unified relative /api path (works on Vercel same-origin & Vite dev proxy)
  const endpoint = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : '/' + path}`;
  
  const headers = {};
  const token = localStorage.getItem('og_token');
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(endpoint, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && !path.includes('/auth/login')) {
    localStorage.removeItem('og_token');
    localStorage.removeItem('og_user');
    window.location.href = '/login';
  }
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
  return data;
}
