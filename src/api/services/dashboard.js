import apiClient from '../axios';

export const getDashboardData = () => apiClient.get('dashboard/');
export const getGlobalSearch = (query) => apiClient.get(`search/?q=${query}`);
export const getNotifications = (params) => apiClient.get('notifications/', { params });
export const markNotificationRead = (id) => apiClient.post(`notifications/${id}/read/`);