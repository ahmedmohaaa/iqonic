// ✅ مصدر حقيقة واحد: النطاقات المسموح بها لكل مستخدم (تُرسَل للـ backend)
const FULL_ACCESS_ROLES = ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR'];
const SUPERVISION_SIDE_ROLES = ['ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN', 'PM'];

export const getScopeRestriction = (user) => {
  if (!user) return '';
  // ناصر / نسرين / محمد فهمي / أحمد زبادي → كل المشاريع
  if (FULL_ACCESS_ROLES.includes(user.role)) return '';
  // فريق التصميم → تصميم + مشترك
  if (user.department === 'Design') return 'DESIGN,BOTH';
  // فريق الإشراف → إشراف + مشترك
  if (SUPERVISION_SIDE_ROLES.includes(user.role) || user.department === 'Supervision') {
    return 'SUPERVISION,BOTH';
  }
  // غيرهم → بدون تقييد (السلوك الحالي)
  return '';
};
