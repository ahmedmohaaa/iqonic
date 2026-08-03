import apiClient from '../axios';

// Global Dashboard
export const getFinancialDashboard = () => apiClient.get('financial-dashboard/');

// Design Invoices
export const getInvoices = (params) => apiClient.get('invoices/', { params });
export const createInvoice = (data) => apiClient.post('invoices/create/', data);
export const updateInvoice = (id, data) => apiClient.patch(`invoices/${id}/update/`, data);
export const deleteInvoice = (id) => apiClient.delete(`invoices/${id}/delete/`);
export const recordPayment = (data) => apiClient.post('invoices/payment/', data);
export const getInvoiceStatistics = (projectId) => apiClient.get(`projects/${projectId}/invoices/statistics/`);

// Supervision Invoices
export const getSupervisionInvoices = (projectId) => apiClient.get(`projects/${projectId}/supervision-invoices/`);
export const createSupervisionInvoice = (projectId, data) => apiClient.post(`projects/${projectId}/supervision-invoices/`, data);
export const updateSupervisionInvoice = (id, data) => apiClient.patch(`supervision-invoices/${id}/update/`, data);
export const getSupervisionStatistics = (projectId) => apiClient.get(`projects/${projectId}/supervision-invoices/statistics/`);
export const getInvoiceDetails = (id) => apiClient.get(`invoices/${id}/`);

// Financial Reports & Statistics
export const getFinancialReport = () => apiClient.get('statistics/'); // من StatisticsAPIView
export const getAllInvoices = (params) => apiClient.get('invoices/', { params });


export const getPaymentSchedules   = (projectId) => apiClient.get(`projects/${projectId}/payment-schedules/`);
export const createPaymentSchedule = (projectId, data) => apiClient.post(`projects/${projectId}/payment-schedules/`, data);
export const updatePaymentSchedule = (id, data) => apiClient.patch(`payment-schedules/${id}/update/`, data);
export const deletePaymentSchedule = (id) => apiClient.delete(`payment-schedules/${id}/delete/`);