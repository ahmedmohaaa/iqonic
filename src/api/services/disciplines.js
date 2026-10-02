// استورد إعدادات axios الخاصة بمشروعك (تأكد من مسار الاستيراد الصحيح في مشروعك)
// قد يكون اسمه api أو axiosInstance وموجود في مجلد api
import api from '../axios'; // <-- عدل هذا السطر بناءً على اسم ومكان ملف الـ axios في مشروعك

export const getDisciplineItems = (params) => {
  // 1. تأكد من استخدام الـ api instance وليس axios الافتراضي
  // 2. تأكد من أن المسار يطابق بالضبط ما في Django (تأكد من وجود / في نهاية الرابط)
  return api.get('/discipline-items/', { params }); 
  
  // ملاحظة: إذا كان الـ baseURL في مشروعك لا يحتوي على /api، 
  // فقد تحتاج لكتابتها هكذا: api.get('/api/discipline-items/', { params })
};



// ═══════════════════════════════════════════════════════════
//  Discipline Management API Services
// ═══════════════════════════════════════════════════════════

/**
 * جلب كل الـ Disciplines (مع فلاتر اختيارية)
 */
export const getDisciplineItem = (params = {}) => {
  return api.get('/disciplines/', { params });
};

/**
 * إنشاء Discipline جديد
 */
export const createDisciplineItem = (data) => {
  return api.post('/disciplines/', data);
};

/**
 * تحديث Discipline موجود
 */
export const updateDisciplineItem = (id, data) => {
  return api.patch(`/disciplines/${id}/`, data);
};

/**
 * حذف Discipline
 */
export const deleteDisciplineItem = (id) => {
  return api.delete(`/disciplines/${id}/`);
};

/**
 * خيارات الأقسام المتاحة
 */
export const DEPARTMENT_OPTIONS = [
  { value: 'ARCH', label: 'Architecture (معماري)' },
  { value: 'STRUCT', label: 'Structure (إنشائي)' },
  { value: 'MECH', label: 'Mechanical (ميكانيكا)' },
  { value: 'ELEC', label: 'Electrical (كهرباء)' },
  { value: 'LAND', label: 'Landscape (لاندسكيب)' },
  { value: 'INFRA', label: 'Infrastructure (بنية تحتية)' },
  { value: 'PM', label: 'Project Management' },
  { value: 'QS', label: 'Quantity Surveying' },
];

/**
 * خيارات المراحل المتاحة
 */
export const STAGE_OPTIONS = [
  { value: 'CONCEPT', label: 'Concept Design' },
  { value: 'DC1', label: 'DC1 (Design Criteria 1)' },
  { value: 'DC2', label: 'DC2 (Design Criteria 2)' },
  { value: 'TENDER', label: 'Tender Documents' },
  { value: 'OTHER', label: 'Other (أخرى)' },
];


// ═══════════════════════════════════════════════════════════
//  NEW: Project Stage Discipline API Services
// ═══════════════════════════════════════════════════════════

/**
 * جلب اختيارات الـ Stages والـ Disciplines لمشروع محدد
 */
export const getProjectStageDisciplines = (projectId) => {
  return api.get(`/projects/${projectId}/stage-disciplines/`);
};

/**
 * إضافة مجموعة من الـ Disciplines المختارة لمشروع محدد
 */
export const bulkAddStageDisciplines = (projectId, items) => {
  return api.post(`/projects/${projectId}/stage-disciplines/bulk/`, { items });
};

/**
 * إلغاء اختيار Discipline (is_active = False)
 */
export const deactivateStageDiscipline = (projectId, itemId) => {
  return api.post(`/projects/${projectId}/stage-disciplines/${itemId}/toggle/`);
};

/**
 * إعادة اختيار Discipline (is_active = True)
 */
export const reactivateStageDiscipline = (projectId, itemId) => {
  return api.delete(`/projects/${projectId}/stage-disciplines/${itemId}/toggle/`);
};

/**
 * إلغاء مجموعة من الـ Disciplines المختارة
 */
export const bulkDeactivateStageDisciplines = (projectId, itemIds) => {
  return api.delete(`/projects/${projectId}/stage-disciplines/bulk/`, { 
    data: { item_ids: itemIds } 
  });
};
