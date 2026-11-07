import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles, allowManagementSecretary }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // ✅ NEW: السماح لسكرتيرة الإدارة (لندا) بالوصول إذا كان العنصر يدعمها
  if (allowManagementSecretary && user.role === 'SECRETARY' && user.department === 'Management') {
    return children;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
