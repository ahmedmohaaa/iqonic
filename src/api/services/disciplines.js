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