import { createContext, useContext, useState } from 'react'
import { api } from './api.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('og_user')) } catch { return null }
  })

  async function login(email, password) {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } })
    localStorage.setItem('og_token', r.token)
    localStorage.setItem('og_user', JSON.stringify(r.user))
    setUser(r.user)
    return r.user
  }

  function logout() {
    localStorage.removeItem('og_token')
    localStorage.removeItem('og_user')
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}