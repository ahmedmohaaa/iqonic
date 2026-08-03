import apiClient from '../axios';

// My Tasks Sections
export const getMyTasks = (params) => apiClient.get('tasks/my-tasks/', { params });
export const getMyInternalReviews = (params) => apiClient.get('tasks/my-internal-reviews/', { params });
export const getMyChangeOrders = (params) => apiClient.get('tasks/my-change-orders/', { params });

// Task Details & Updates
export const updateTaskStatus = (id, data) => apiClient.patch(`tasks/${id}/status/`, data);

// Assignments
export const selfAssignTask = (id) => apiClient.post(`tasks/${id}/self-assign/`);
export const assignTask = (id, data) => apiClient.patch(`tasks/${id}/assign/`, data);
export const reassignTask = (id, data) => apiClient.patch(`tasks/${id}/reassign/`, data);

// Replacement Requests
export const createReplacementRequest = (id, data) => apiClient.post(`tasks/${id}/replacement-request/`, data);
export const respondToReplacement = (id, data) => apiClient.patch(`replacement-requests/${id}/respond/`, data);

// All Tasks (للمديرين)
export const getAllTasks = (params) => apiClient.get('tasks/', { params });
export const createTask = (data) => apiClient.post('tasks/create/', data);
export const getTaskDetails = (id) => apiClient.get(`tasks/${id}/`);
export const updateTask = (id, data) => apiClient.patch(`tasks/${id}/update/`, data);
export const deleteTask = (id) => apiClient.delete(`tasks/${id}/delete/`);

// Priority Update
export const updateTaskPriority = (id, data) => apiClient.patch(`tasks/${id}/update/`, data);

// Assignment History
export const getAssignmentHistory = (id) => apiClient.get(`tasks/${id}/assignment-history/`);