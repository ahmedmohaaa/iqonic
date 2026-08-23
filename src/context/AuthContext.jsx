import { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser } from '../api/services/auth';

const AuthContext = createContext();

// 4.1 الثابت خارج الـ Component
const SUPERVISION_FINANCE_USERNAMES = ['ahmed.zabady', 'mohammad.mishab'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      getCurrentUser()
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (tokens, userData) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  // دوال مساعدة للتحكم في الصلاحيات بناءً على الـ PDF
  const isManagement = () => ['GM', 'AGM'].includes(user?.role);
  const isDesignManager = () => ['GM', 'AGM', 'DESIGN_MGR'].includes(user?.role);
  const isSupervisionManager = () => ['GM', 'AGM', 'SUP_MGR', 'PM'].includes(user?.role);
  const isAccountant = () => ['GM', 'AGM', 'ACCOUNTANT'].includes(user?.role);
  const isSecretary = () => user?.role === 'SECRETARY';
  const isEngineer = () => ['ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN'].includes(user?.role);
  const canViewFinancials = () => ['GM', 'AGM', 'ACCOUNTANT'].includes(user?.role);

  // 4.2 الدالة داخل AuthProvider
  const canViewSupervisionFinance = () =>
    SUPERVISION_FINANCE_USERNAMES.includes(user?.username);

  return (
    // 4.3 إضافة canViewSupervisionFinance إلى الـ Provider
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isManagement,
        isDesignManager,
        isSupervisionManager,
        isAccountant,
        isSecretary,
        isEngineer,
        canViewFinancials,
        canViewSupervisionFinance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

