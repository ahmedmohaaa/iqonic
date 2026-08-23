import apiClient from '../axios';

// Task Replacement Requests
export const getTaskReplacementRequests = (params) => apiClient.get('replacement-requests/', { params });
export const respondToTaskReplacement = (id, data) => apiClient.patch(`replacement-requests/${id}/respond/`, data);

// Supervision Team Replacement Requests
export const getSupervisionReplacementRequests = (params) => apiClient.get('supervision-replacement-requests/', { params });
// ✅ الرد الفعلي (المهندس المقترح أو زبادي) — نفس فيو الرد في الباك-إند
export const respondToSupervisionReplacement = (id, data) =>
  apiClient.patch(`supervision-replacement-requests/${id}/respond/`, data);

// src/api/services/reports.js  — أضف هذا السطر
export const getOverviewStatistics = () => apiClient.get('statistics/');
export const getEmployeeReport = (employeeId) => apiClient.get(`employees/${employeeId}/report/`);

// لوحة الإحصاءات العامة (StatisticsAPIView → path: statistics/)


// تقرير المشاريع (ProjectReportAPIView → path: reports/projects/)
export const getProjectReport = (params) =>
  apiClient.get('reports/projects/', { params });

// تقرير المهام (TaskReportAPIView → path: reports/tasks/)
export const getTaskReport = (params) =>
  apiClient.get('reports/tasks/', { params });


// التقرير المالي (FinancialReportAPIView → path: reports/financial/)
export const getFinancialReport = (params) =>
  apiClient.get('reports/financial/', { params });


export const engineerRespondToReplacement = (id, data) => apiClient.patch(`replacement-requests/${id}/engineer-respond/`, data);

