import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('og_token');
      const u = localStorage.getItem('og_user');
      if (!token || !u) {
        localStorage.removeItem('og_token');
        localStorage.removeItem('og_user');
        return null;
      }
      return JSON.parse(u);
    } catch {
      localStorage.removeItem('og_token');
      localStorage.removeItem('og_user');
      return null;
    }
  });

  const [checkingAuth, setCheckingAuth] = useState(() => {
    return Boolean(localStorage.getItem('og_token'));
  });

  useEffect(() => {
    const token = localStorage.getItem('og_token');
    if (!token) {
      setUser(null);
      setCheckingAuth(false);
      return;
    }

    // Verify session validity with backend
    api('/auth/me')
      .then((res) => {
        if (res && res.user) {
          setUser(res.user);
          localStorage.setItem('og_user', JSON.stringify(res.user));
        } else {
          logout();
        }
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  async function login(email, password) {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('og_token', r.token);
    localStorage.setItem('og_user', JSON.stringify(r.user));
    setUser(r.user);
    return r.user;
  }

  function logout() {
    localStorage.removeItem('og_token');
    localStorage.removeItem('og_user');
    localStorage.removeItem('og_current_path');
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, login, logout, checkingAuth }}>
      {children}
    </Ctx.Provider>
  );
}
