import apiClient from '../axios';

// ── لوحة المراجعة داخل صفحة مشروع الإشراف (قراءة + تعيين + تدوير) ──
export const getInternalReview = (projectId) =>
  apiClient.get(`projects/${projectId}/internal-review/`);

export const assignReviewers = (projectId, assigneeIds) =>
  apiClient.patch(`projects/${projectId}/internal-review/assign/`, { assignees: assigneeIds });

export const updateReviewStage = (stageId, payload) =>
  apiClient.patch(`internal-review/${stageId}/update/`, payload);

// ── تبويب "مهامي → Internal": مشاريع المهندس المعيّن + مراحلها ──
export const getMyInternalReviewsList = () =>
  apiClient.get('my-internal-reviews/');

// ── مهام المراجعة الفردية المكلَّف بها المهندس (لربطها بالمراحل) ──
export const getMyInternalReviews = () =>
  apiClient.get('tasks/my-internal-reviews/');

// ── لوحة الإنشاء عند زبادي: المشاريع المفعّلة + التخصصات المفلترة ──
export const getActiveReviewProjects = () =>
  apiClient.get('internal-review/active-projects/');

export const getReviewDisciplineItems = (reviewStage) =>
  apiClient.get('internal-review/discipline-items/', { params: { review_stage: reviewStage } });
// ── تفعيل جسر المراجعة التصميمية الداخلية للمشروع ──
export const activateInternalReview = (projectId) =>
  apiClient.post(`projects/${projectId}/internal-review/activate/`);

