import apiClient from '../axios';

export const getNotifications = (params) => apiClient.get('notifications/', { params });
export const markNotificationRead = (id) => apiClient.post(`notifications/${id}/read/`);
export const markAllNotificationsRead = () => apiClient.post('notifications/mark-all-read/');