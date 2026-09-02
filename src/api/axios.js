import axios from 'axios';

const apiClient = axios.create({
  // تحديد رابط الدومين الصريح للـ API بـ HTTPS
  baseURL: 'https://iconqa.online/api/', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor لإرفاق التوكن
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor للتعامل مع انتهاء صلاحية التوكن
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
