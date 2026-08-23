// مصدر حقيقة واحد لصلاحيات Change Order (يستخدم في AllTasks و MyTasks)
export const isDesignManager = (u) => ['GM', 'AGM', 'DESIGN_MGR'].includes(u?.role);

export const isSupervisionManager = (u) =>
  u?.username === 'ahmed.zabady' || ['SUP_MGR', 'PM'].includes(u?.role);

export const isEngineerOrDraftsman = (u) =>
  ['ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN'].includes(u?.role);

// صلاحية المدير حسب نطاق المشروع
export const canManagerChangeOrder = (u, t) => {
  const s = t?.scope;
  if (isDesignManager(u)) return s === 'DESIGN' || s === 'BOTH';
  if (isSupervisionManager(u)) return s === 'SUPERVISION' || s === 'BOTH';
  return false;
};

// صفحة كل المهام: المديرين فقط (يختفي للمهندسين والرسامين)
export const showChangeOrderInAllTasks = (u, t) => canManagerChangeOrder(u, t);

// صفحة مهامي: صاحب المهمة فقط + المديرين حسب النطاق
export const showChangeOrderInMyTasks = (u, t) => {
  const aid = t?.assigned_to ?? t?.assigned_to_id;
  const mine = aid != null && String(aid) === String(u?.id);
  return mine || canManagerChangeOrder(u, t);
};