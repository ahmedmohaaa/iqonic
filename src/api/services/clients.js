import apiClient from '../axios';

// Client Directory (مع الإحصائيات)
export const getClientDirectory = () => apiClient.get('client-directory/');
export const getClientDetails = (id) => apiClient.get(`client-directory/${id}/`);

// Client Projects
export const getClientProjects = (id) => apiClient.get(`clients/${id}/projects/`);

// Basic CRUD
export const getClients = () => apiClient.get('clients/');
export const createClient = (data) => apiClient.post('clients/', data);
export const updateClient = (id, data) => apiClient.patch(`clients/${id}/`, data);
export const deleteClient = (id) => apiClient.delete(`clients/${id}/`);