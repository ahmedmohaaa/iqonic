import apiClient from '../axios';

// قائمة الـ Revisions التابعة لأبٍ معيّن (مع حالاتها وتقدّمها)
export const getChangeOrders = (parentPk) =>
  apiClient.get(`projects/${parentPk}/change-orders/`);

// إنشاء Revision جديد (Case 1 = CONFIRMED فوراً، Case 2 = PENDING_CONFIRMATION)
export const createChangeOrder = (parentPk, data) =>
  apiClient.post(`projects/${parentPk}/change-orders/`, data);

export const getChangeOrder = (pk) =>
  apiClient.get(`change-orders/${pk}/`);

// بوابة مدير التصميم (Case 2)
export const confirmChangeOrder = (pk) =>
  apiClient.post(`change-orders/${pk}/confirm/`);

export const rejectChangeOrder = (pk, reason) =>
  apiClient.post(`change-orders/${pk}/reject/`, { reason });

export const cancelChangeOrder = (pk) =>
  apiClient.post(`change-orders/${pk}/cancel/`);

export const getActiveChangeOrders = () => apiClient.get('change-orders/active/');
