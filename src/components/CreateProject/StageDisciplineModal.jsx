import { useState, useEffect } from 'react';
import { 
  X, Save, Loader, AlertCircle, CheckCircle, Layers
} from 'lucide-react';
import { getDisciplineItem } from '../../api/services/disciplines';
import CheckboxTree from './CheckboxTree';

/**
 * StageDisciplineModal - Modal اختيار المراحل والتخصصات للمشروع
 * 
 * يُستخدم في صفحة إنشاء المشروع لسكرتيرة التصميم
 * لاختيار الـ Stages والـ Disciplines المطلوبة
 * 
 * ملاحظة مهمة: هذا الـ Modal لا يحفظ مباشرة في الـ API،
 * بل يعيد الاختيارات للصفحة الأم (CreateProject) التي تحفظها
 * مع بيانات المشروع عند الإنشاء.
 */

const StageDisciplineModal = ({
  isOpen,
  onClose,
  selectedItems = [],
  onSave,
  projectId = null, // اختياري - إذا كان المشروع موجوداً بالفعل
}) => {
  // ═══════════════════════════════════════════════════════════
  //  الحالة (State)
  // ═══════════════════════════════════════════════════════════
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localSelection, setLocalSelection] = useState(selectedItems);
  const [saving, setSaving] = useState(false);

  // ═══════════════════════════════════════════════════════════
  //  جلب الـ Disciplines عند فتح الـ Modal
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isOpen) {
      fetchDisciplines();
      // مزامنة الاختيارات المحلية مع الاختيارات المُمررة
      setLocalSelection(selectedItems);
      setError('');
    }
  }, [isOpen]);

  const fetchDisciplines = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDisciplineItem({ is_active: true });
      const data = res.data?.results || res.data || [];
      setDisciplines(data);
    } catch (err) {
      console.error('Failed to fetch disciplines:', err);
      setError('Failed to load disciplines. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  دوال التفاعل
  // ═══════════════════════════════════════════════════════════

  const handleSelectionChange = (newSelection) => {
    setLocalSelection(newSelection);
  };

  const handleSave = () => {
    setSaving(true);
    try {
      // إعادة الاختيارات للصفحة الأم
      onSave(localSelection);
      onClose();
    } catch (err) {
      console.error('Failed to save selection:', err);
      setError('Failed to save selection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // إعادة الاختيارات الأصلية عند الإغلاق بدون حفظ
    setLocalSelection(selectedItems);
    onClose();
  };

  // ═══════════════════════════════════════════════════════════
  //  إحصائيات الاختيار الحالي
  // ═══════════════════════════════════════════════════════════
  const selectedStages = [...new Set(localSelection.map(item => item.stage))];
  const totalSelected = localSelection.length;

  // ═══════════════════════════════════════════════════════════
  //  عدم العرض إذا كان الـ Modal مغلقاً
  // ═══════════════════════════════════════════════════════════
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* الخلفية المعتمة */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* بطاقة الـ Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layers size={22} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Configure Project Stages
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Select the stages and disciplines required for this project
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ═══ رسائل الخطأ ═══ */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ═══ Body ═══ */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            /* حالة التحميل */
            <div className="flex flex-col items-center justify-center py-16">
              <Loader className="animate-spin text-blue-600 mb-3" size={36} />
              <p className="text-sm text-gray-500">Loading disciplines...</p>
            </div>
          ) : disciplines.length === 0 ? (
            /* لا توجد disciplines */
            <div className="flex flex-col items-center justify-center py-16">
              <Layers size={48} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-1">No disciplines available</p>
              <p className="text-xs text-gray-400">
                Please add disciplines from the Discipline Management page first
              </p>
            </div>
          ) : (
            /* شجرة الاختيار */
            <CheckboxTree
              disciplines={disciplines}
              selectedItems={localSelection}
              onSelectionChange={handleSelectionChange}
              disabled={saving}
            />
          )}
        </div>

        {/* ═══ ملخص الاختيار ═══ */}
        {totalSelected > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedStages.length} stage(s) · {totalSelected} discipline(s) selected
                </span>
              </div>
              <div className="flex gap-1.5">
                {selectedStages.map(stage => (
                  <span
                    key={stage}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                  >
                    {stage}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Footer ═══ */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          {/* معلومات إضافية */}
          <div className="text-xs text-gray-500">
            {totalSelected === 0 ? (
              <span className="text-amber-600 font-medium">
                ⚠️ No disciplines selected — project will use default settings
              </span>
            ) : (
              <span>
                Selected disciplines will be required for stage completion
              </span>
            )}
          </div>

          {/* الأزرار */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={saving}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Apply Selection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageDisciplineModal;