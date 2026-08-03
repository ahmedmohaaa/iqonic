import apiClient from '../axios';

// Audit Logs
export const getAuditLogs = (params) => apiClient.get('audit-logs/', { params });

// Helper APIs for Filters
export const getUsersList = () => apiClient.get('users/');
export const getProjectsList = () => apiClient.get('projects/'); // يمكن استخدام Global Search بدلاً من ذلك