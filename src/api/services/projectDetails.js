import apiClient from '../axios';

// Project Details & Lifecycle
export const getProjectDetails = (id) => apiClient.get(`projects/${id}/`);
export const getLifecycleStages = (projectId) => apiClient.get(`lifecycle/?project_id=${projectId}`);
export const updateLifecycleStage = (id, data) => apiClient.patch(`lifecycle/${id}/update/`, data);

// Discipline Flags (DC1, DC2, Structural, IFC)
export const getDC1Status = (id) => apiClient.get(`projects/${id}/dc1-status/`);
export const getDC2Status = (id) => apiClient.get(`projects/${id}/dc2-status/`);
export const getStructuralStatus = (id) => apiClient.get(`projects/${id}/structural-status/`);
export const updateStructuralStatus = (id, data) => apiClient.patch(`projects/${id}/structural-status/`, data);
export const getIFCStatus = (id) => apiClient.get(`projects/${id}/ifc-status/`);
export const updateIFCStatus = (id, data) => apiClient.patch(`projects/${id}/ifc-status/`, data);

// Financials
export const getProjectInvoices = (projectId) => apiClient.get(`invoices/?project=${projectId}`);
export const createInvoice = (data) => apiClient.post('invoices/create/', data);
export const recordPayment = (data) => apiClient.post('invoices/payment/', data);
export const getInvoiceStatistics = (projectId) => apiClient.get(`projects/${projectId}/invoices/statistics/`);

// Tendering
export const getTendering = (projectId) => apiClient.get(`projects/${projectId}/tendering/`);
export const updateTendering = (projectId, data) => apiClient.patch(`projects/${projectId}/tendering/update/`, data);

// Chat & Notes
export const getChatRoom = (projectId) => apiClient.get(`projects/${projectId}/chat/`);
export const getChatMessages = (roomId) => apiClient.get(`chat/${roomId}/messages/`);
export const sendChatMessage = (roomId, formData) => apiClient.post(`chat/${roomId}/send/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const getProjectNotes = (projectId) => apiClient.get(`projects/${projectId}/notes/`);
export const addProjectNote = (projectId, data) => apiClient.post(`projects/${projectId}/notes/add/`, data);