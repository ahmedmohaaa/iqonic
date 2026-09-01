/**
 * projectScope.js
 * يحدد نطاق المشاريع التي يمكن للمستخدم رؤيتها حسب دوره
 * هذه الدالة هي المصدر الوحيد للحقيقة للفلترة حسب الصلاحيات
 */

export function getScopeRestriction(user) {
  if (!user) return '';

  const { role } = user;

  // ✅ مديرو التصميم: ناصر (GM) + نسرين (AGM) + فهمي (DESIGN_MGR)
  //    يرون فقط مشاريع التصميم (DESIGN + BOTH)
  if (role === 'GM' || role === 'AGM' || role === 'DESIGN_MGR') {
    return 'DESIGN,BOTH';
  }

  // ✅ مديرو الإشراف: زبادي (SUP_MGR) + PM
  //    يرون فقط مشاريع الإشراف (SUPERVISION + BOTH)
  if (role === 'SUP_MGR' || role === 'PM') {
    return 'SUPERVISION,BOTH';
  }

  // ✅ المحاسب: يرى كل المشاريع (للأغراض المالية)
  if (role === 'ACCOUNTANT') {
    return '';  // لا restriction
  }

  // باقي المستخدمين — الباك-إند يتعامل معهم في get_queryset
  return '';
}

/**
 * دالة مساعدة: هل يمكن للمستخدم رؤية مشاريع قسم معين؟
 */
export function canSeeScope(user, scope) {
  const restriction = getScopeRestriction(user);
  if (!restriction) return true;
  return restriction.split(',').includes(scope);
}
