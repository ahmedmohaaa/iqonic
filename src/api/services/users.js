import apiClient from '../axios';

// جلب بيانات المستخدم الحالي
export const getCurrentUser = () => apiClient.get('users/me/');

// تحديث بيانات المستخدم
export const updateUser = (id, data) => apiClient.patch(`users/${id}/update/`, data);

// تغيير كلمة المرور
export const changePassword = (data) => apiClient.post('users/change-password/', data);

// جلب قائمة المستخدمين (للمديرين)
export const getUsersList = (params) => apiClient.get('users/', { params });