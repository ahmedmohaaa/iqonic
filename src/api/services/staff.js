import apiClient from '../axios';

// Get all engineers with KPI insights
export const getStaffKPIInsights = (params) => apiClient.get('staff/kpi-insights/', { params });

// Get detailed KPI for a specific engineer
export const getEngineerKPIDetail = (id) => apiClient.get(`staff/${id}/kpi-detail/`);