import apiClient from '../axios';

export const getProjectCards = (params) => apiClient.get('projects/cards/', { params });
export const getGlobalFilterProjects = (params) => apiClient.get('projects/filter/', { params });
export const getProjectDetails = (id) => apiClient.get(`projects/${id}/`);
export const createProject = (data) => apiClient.post('projects/create/', data);
export const updateProject = (id, data) => apiClient.patch(`projects/${id}/update/`, data);

// Closed & Pending Projects
export const getClosedProjects = (params) => apiClient.get('projects/closed/', { params });
export const getPendingProjects = (params) => apiClient.get('projects/pending/', { params });
export const getActiveProjects = (params) => apiClient.get('projects/active/', { params });
export const getDesignProjects = (params) => apiClient.get('projects/design/', { params });
export const getSupervisionProjects = (params) => apiClient.get('projects/supervision/', { params });

// Change Order
export const createChangeOrder = (projectId, data) => apiClient.post(`projects/${projectId}/change-order/create/`, data);
export const getSubProjects = (projectId) => apiClient.get(`projects/${projectId}/sub-projects/`);

// Priority
export const updateProjectPriority = (id, data) => apiClient.patch(`projects/${id}/priority/`, data);
export const getPriorityHistory = (id) => apiClient.get(`projects/${id}/priority-history/`);

// Lifecycle & Timeline
// التعديل المطلوب في ملف الـ API
// بدلاً من إرسال الـ ID في مسار الرابط، أرسله كـ Query Parameter
// ✅ الدالة الصحيحة (تأكد من وجودها مرة واحدة فقط في الملف)
export const getLifecycleStages = (id) => apiClient.get('lifecycle/', { 
  params: { project_id: id } 
});
// Offer Status
export const updateOfferStatus = (id, data) => apiClient.patch(`projects/${id}/offer-status/`, data);
// حساب التواريخ المخططة تلقائياً
export const calculatePlannedDates = (projectId) => apiClient.post(`projects/${projectId}/calculate-planned-dates/`);
export const getPlannedDates = (projectId) => apiClient.get(`projects/${projectId}/calculate-planned-dates/`);

export const getProjects = (params) =>
  apiClient.get('projects/', { params });


export const getLifecycleAnalytics = (id) => apiClient.get('lifecycle/analytics/', { 
  params: { project_id: id } 
});