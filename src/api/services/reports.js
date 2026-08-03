// src/api/services/reports.js
import apiClient from '../axios';

// لوحة الإحصاءات العامة (StatisticsAPIView → path: statistics/)
export const getOverviewStatistics = () =>
  apiClient.get('statistics/');

// تقرير المشاريع (ProjectReportAPIView → path: reports/projects/)
export const getProjectReport = (params) =>
  apiClient.get('reports/projects/', { params });

// تقرير المهام (TaskReportAPIView → path: reports/tasks/)
export const getTaskReport = (params) =>
  apiClient.get('reports/tasks/', { params });

// تقرير الموظفين (EmployeeReportAPIView → path: reports/employees/)
export const getEmployeeReport = (params) =>
  apiClient.get('reports/employees/', { params });

// التقرير المالي (FinancialReportAPIView → path: reports/financial/)
export const getFinancialReport = (params) =>
  apiClient.get('reports/financial/', { params });