import apiClient from '../axios';

// User Management
export const getUsers = (params) => apiClient.get('users/', { params });
export const createUser = (data) => apiClient.post('users/create/', data);
export const updateUser = (id, data) => apiClient.patch(`users/${id}/update/`, data);
export const deleteUser = (id) => apiClient.delete(`users/${id}/delete/`);
export const getUserDetails = (id) => apiClient.get(`users/${id}/`);

// External Logs
export const getExternalLogs = (params) => apiClient.get('external-logs/', { params });
export const createExternalLog = (data) => apiClient.post('external-logs/', data);

// Statistics & Reports
export const getStatistics = () => apiClient.get('statistics/');
export const getDashboard = () => apiClient.get('dashboard/');
export const getFinancialDashboard = () => apiClient.get('financial-dashboard/');
export const getStaffKPIInsights = (params) => apiClient.get('staff/kpi-insights/', { params });