import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { login, getCurrentUser } from '../../api/services/auth';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Lock, User, AlertCircle, Loader } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = useState('');

const onSubmit = async (data) => {
    setError('');
    try {
      // 1. جلب الـ Tokens (Access & Refresh)
      const tokenResponse = await login(data);
      const { access, refresh } = tokenResponse.data;

      // 2. جلب بيانات المستخدم الحالي باستخدام الـ Access Token صراحةً
      const userResponse = await getCurrentUser(access); // <-- PASS THE TOKEN HERE
      const userData = userResponse.data;

      // 3. حفظ البيانات في الـ Context والـ LocalStorage
      authLogin({ access, refresh }, userData);

      // 4. التوجيه إلى الصفحة الرئيسية
      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
      } else {
        setError('حدث خطأ في الاتصال بالخادم. تأكد من أن الباك إند يعمل.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <LogIn className="text-primary" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">ERP System Login</h1>
          <p className="text-sm text-gray-500 mt-1">Consulting & Engineering Office</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded flex items-center text-sm text-red-700">
            <AlertCircle size={18} className="mr-2" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                {...register('username', { required: 'Username is required' })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="e.g. nasser.tatouni"
              />
            </div>
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold bg-blue-800 transition flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? <Loader className="animate-spin mr-2" size={18} /> : <LogIn size={18} className="mr-2" />}
            {isSubmitting ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Restricted Access. Authorized personnel only.
        </p>
      </div>
    </div>
  );
};

export default Login;
