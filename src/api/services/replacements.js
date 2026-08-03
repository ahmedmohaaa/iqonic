import apiClient from '../axios';

// Task Replacement Requests
export const getTaskReplacementRequests = (params) => apiClient.get('replacement-requests/', { params });
export const respondToTaskReplacement = (id, data) => apiClient.patch(`replacement-requests/${id}/respond/`, data);

// Supervision Team Replacement Requests
export const getSupervisionReplacementRequests = (params) => apiClient.get('supervision-replacement-requests/', { params });
export const respondToSupervisionReplacement = (id, data) => apiClient.patch(`supervision-team/replacement-request/`, { 
    assignment_id: data.assignment_id,
    new_engineer_id: data.new_engineer_id,
    status: data.status,
    response_reason: data.response_reason
});

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