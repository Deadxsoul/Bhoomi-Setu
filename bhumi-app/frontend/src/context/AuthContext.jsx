import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load (or a refresh), if a token is already saved, rehydrate the
  // user from it instead of bouncing them back to /login.
  useEffect(() => {
    const token = localStorage.getItem('bhumi_token');
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get('/auth/me')
      .then(({ data }) => setUser(data.user || (data.guest ? { guest: true } : null)))
      .catch(() => localStorage.removeItem('bhumi_token'))
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData) {
    localStorage.setItem('bhumi_token', token);
    setUser(userData || { guest: true });
  }

  function logout() {
    localStorage.removeItem('bhumi_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
