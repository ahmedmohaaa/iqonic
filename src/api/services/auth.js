import apiClient from '../axios';

export const login = (credentials) => apiClient.post('login/', credentials);
export const refreshToken = (refresh) => apiClient.post('refresh/', { refresh });

// Allow passing the access token explicitly during the login flow
export const getCurrentUser = (token = null) => {
  const config = token 
    ? { headers: { Authorization: `Bearer ${token}` } } 
    : {};
  return apiClient.get('users/me/', config);
};
// src/api/services/auth.js  — أضف هذا السطر إن غاب
export const changePassword = (payload) =>
  apiClient.post('users/change-password/', payload);
// payload = { old_password, new_password }