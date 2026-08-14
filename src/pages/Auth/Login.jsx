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
      // 1. Fetch tokens (Access & Refresh)
      const tokenResponse = await login(data);
      const { access, refresh } = tokenResponse.data;

      // 2. Fetch current user with the Access Token
      const userResponse = await getCurrentUser(access);
      const userData = userResponse.data;

      // 3. Save into Context + LocalStorage
      authLogin({ access, refresh }, userData);

      // 4. Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError('Connection error. Please make sure the backend is running.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0b1f3c]">
      {/* خلفية محيطة بنفس ستايل السايدبار والنافبار */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(54% 46% at 92% -8%, rgba(229,227,42,.07), transparent 60%),' +
            'radial-gradient(48% 42% at -4% 108%, rgba(92,198,239,.06), transparent 60%),' +
            'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 42px 42px, 42px 42px',
        }}
      />

      <div className="w-full max-w-md relative">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-[#1d3a66] bg-[#0e2547]">
          {/* شعار ICON — نفس تصميم السايدبار */}
          <div className="bg-[#0b1f3c]">
            <div className="pt-8 pb-4 flex flex-col items-center">
              <div className="flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '40px', fontWeight: 300, letterSpacing: '2px' }}>I</span>
                <span
                  className="inline-block"
                  style={{ width: '26px', height: '32px', border: '3px solid #e5e32a', borderRadius: '10px', margin: '0 5px' }}
                />
                <span className="text-white" style={{ fontSize: '40px', fontWeight: 300, letterSpacing: '2px' }}>C</span>
                <span className="text-white" style={{ fontSize: '40px', fontWeight: 300, letterSpacing: '2px' }}>N</span>
              </div>
              <span className="text-white" style={{ fontSize: '10px', letterSpacing: '3px', marginTop: '8px' }}>
                CONSULTING ENGINEERING
              </span>
            </div>
            <div style={{ height: '4px', backgroundColor: '#e5e32a' }} />
          </div>

          {/* الفورم — نفس الوظائف بالكامل */}
          <div className="p-8">
            <h1 className="text-xl font-bold text-white text-center">Sign In</h1>
            <p className="text-sm text-center mt-1 text-[#8694a4]">
              Project Management System
            </p>

            {error && (
              <div className="mt-4 bg-rose-500/10 border border-rose-500/40 p-3 rounded-lg flex items-center text-sm text-rose-300">
                <AlertCircle size={18} className="mr-2 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#c7d2e0] mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-[#8694a4]" size={18} />
                  <input
                    type="text"
                    {...register('username', { required: 'Username is required' })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0b1f3c] border border-[#1d3a66] text-white placeholder-gray-500 outline-none focus:border-[#e5e32a] focus:ring-2 focus:ring-[#e5e32a]/20 transition"
                    placeholder="e.g. nasser.tatouni"
                  />
                </div>
                {errors.username && (
                  <p className="text-rose-300 text-xs mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#c7d2e0] mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-[#8694a4]" size={18} />
                  <input
                    type="password"
                    {...register('password', { required: 'Password is required' })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0b1f3c] border border-[#1d3a66] text-white placeholder-gray-500 outline-none focus:border-[#e5e32a] focus:ring-2 focus:ring-[#e5e32a]/20 transition"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-rose-300 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg font-bold bg-[#e5e32a] text-[#0b1f3c] hover:brightness-105 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader className="animate-spin" size={18} /> : <LogIn size={18} />}
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs mt-5 text-[#5d6b7a]">
              Restricted Access. Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
