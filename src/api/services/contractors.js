import apiClient from '../axios';

// Contractors Directory
export const getContractors = (params) => apiClient.get('contractors/', { params });
export const getContractorDetails = (id) => apiClient.get(`contractors/${id}/`);
export const createContractor = (data) => apiClient.post('contractors/', data);
export const updateContractor = (id, data) => apiClient.patch(`contractors/${id}/`, data);
export const deleteContractor = (id) => apiClient.delete(`contractors/${id}/`);

// Contractor Projects (مع الإحصائيات)
export const getContractorProjects = (id, params) => apiClient.get(`contractors/${id}/projects/`, { params });