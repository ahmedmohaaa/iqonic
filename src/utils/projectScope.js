/**
 * projectScope.js
 * يحدد نطاق المشاريع التي يمكن للمستخدم رؤيتها حسب دوره وقسمه
 * هذه الدالة هي المصدر الوحيد للحقيقة للفلترة حسب الصلاحيات
 */

export function getScopeRestriction(user) {
  if (!user) return '';

  const { role, department } = user;

  // ═══════════════════════════════════════════════════════════
  // 1. الإدارة العليا ومديرو التصميم
  // ═══════════════════════════════════════════════════════════
  if (role === 'GM' || role === 'AGM' || role === 'DESIGN_MGR') {
    return 'DESIGN,BOTH';
  }

  // ═══════════════════════════════════════════════════════════
  // 2. مديرو الإشراف
  // ═══════════════════════════════════════════════════════════
  if (role === 'SUP_MGR' || role === 'PM') {
    return 'SUPERVISION,BOTH';
  }

  // ═══════════════════════════════════════════════════════════
  // 3. السكرتيرات (حسب القسم)
  // ═══════════════════════════════════════════════════════════
  if (role === 'SECRETARY') {
    if (department === 'Design') return 'DESIGN,BOTH';
    if (department === 'Supervision') return 'SUPERVISION,BOTH';
    return '';  // سكرتيرة الإدارة ترى الكل
  }

  // ═══════════════════════════════════════════════════════════
  // 4. المحاسب — يرى كل المشاريع
  // ═══════════════════════════════════════════════════════════
  if (role === 'ACCOUNTANT') {
    return '';
  }

  // ═══════════════════════════════════════════════════════════
  // 5. ✅ المهندسون والرسامون حسب القسم (وليس حسب المهام المسندة)
  //    مهندس التصميم → DESIGN + BOTH
  //    مهندس الإشراف → SUPERVISION + BOTH
  // ═══════════════════════════════════════════════════════════
  if (['ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN', 'SITE_ENGINEER', 'DESIGN_ENGINEER'].includes(role)) {
    if (department === 'Design') return 'DESIGN,BOTH';
    if (department === 'Supervision') return 'SUPERVISION,BOTH';
    return '';
  }

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

/**
 * دالة مساعدة: الحصول على قائمة النطاقات المسموح بها للمستخدم
 */
export function getAllowedScopes(user) {
  const restriction = getScopeRestriction(user);
  if (!restriction) return ['DESIGN', 'SUPERVISION', 'BOTH'];
  return restriction.split(',');
}
