import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState({ staff: [], students: [] });

  useEffect(() => {
    // Load active session
    const token = localStorage.getItem('ephesus_token');
    if (token) {
      api.getMe()
        .then(data => {
          setUser(data.user);
          setStudent(data.student);
        })
        .catch(() => {
          localStorage.removeItem('ephesus_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Pre-fetch demo users for convenient 1-click test switching
    api.getDemoUsers()
      .then(data => setDemoUsers(data))
      .catch(err => console.error('Failed to load demo accounts:', err));
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('ephesus_token', res.token);
    setUser(res.user);
    setStudent(res.student);
    return res;
  };

  const switchDemoUser = async (email) => {
    return login(email, 'ephesus123');
  };

  const logout = () => {
    localStorage.removeItem('ephesus_token');
    setUser(null);
    setStudent(null);
  };

  const refreshProfile = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setStudent(data.student);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      student,
      loading,
      login,
      logout,
      switchDemoUser,
      demoUsers,
      refreshProfile,
      isWarden: user && ['WARDEN', 'ASSISTANT_WARDEN', 'IN_CHARGE', 'ADMIN'].includes(user.role),
      isStudent: user && user.role === 'STUDENT'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
