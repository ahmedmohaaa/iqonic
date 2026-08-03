import apiClient from '../axios';

// Team Management
export const getSupervisionTeam = (projectId) => apiClient.get(`projects/${projectId}/supervision-team/`);
export const assignEngineer = (projectId, data) => apiClient.post(`projects/${projectId}/supervision-team/assign/`, data);
export const updateAssignment = (assignmentId, data) => apiClient.patch(`supervision-team/${assignmentId}/update/`, data);
export const removeAssignment = (assignmentId) => apiClient.delete(`supervision-team/${assignmentId}/remove/`);

// Supervision Replacement Requests (Engineer requesting replacement)
export const requestSupervisionReplacement = (data) => apiClient.post(`supervision-team/replacement-request/`, data);

// Action Requests (Site engineers requesting actions from PM)
export const getActionRequests = (projectId) => apiClient.get(`projects/${projectId}/action-requests/`);

// Supervision Directory
export const getSupervisionProjects = (params) => apiClient.get('projects/supervision/', { params });
export const getActiveSupervisionProjects = (params) => apiClient.get('projects/supervision/', { params: { ...params, is_active: 'true' } });
export const getClosedSupervisionProjects = (params) => apiClient.get('projects/supervision/', { params: { ...params, is_active: 'false' } });

// Action Requests
export const createActionRequest = (projectId, data) => apiClient.post(`projects/${projectId}/action-requests/`, data);
export const updateActionRequest = (id, data) => apiClient.patch(`action-requests/${id}/update/`, data);

// Internal Design Review
export const getInternalDesignReview = (projectId) => apiClient.get(`projects/${projectId}/internal-design-review/`);
export const updateInternalReviewStage = (projectId, data) => apiClient.patch(`projects/${projectId}/internal-design-review/`, data);