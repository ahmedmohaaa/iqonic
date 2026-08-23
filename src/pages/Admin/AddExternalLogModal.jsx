import { useState, useEffect } from 'react';
import { X, Loader, Layers, Tag, FileText, Link2, AlignLeft } from 'lucide-react';
import apiClient from '../../api/axios';
import { createExternalLog } from '../../api/services/admin';
import { useAuth } from '../../context/AuthContext';

/* ستايل موحّد لكل الحقول (بدون تكرار) */
const FIELD_CLS =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ' +
  'transition disabled:bg-gray-100 disabled:text-gray-400';

const LABEL_CLS = 'flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5';

const AddExternalLogModal = ({ isOpen, onClose, onLogAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [formData, setFormData] = useState({
    project: '',
    log_type: '',
    sub_type: 'PENDING_DOCUMENTS',
    url: '',
    description: ''
  });

  // ✅ فلترة الليسته حسب المستخدم:
  // التصميم (ناصر / نسرين / فهمي) → مشاريع التصميم فقط
  // الإشراف (زبادي) → مشاريع الإشراف فقط
  // (مشاريع BOTH تظهر للطرفين لأنها مشتركة بين الاتنين)
  const isDesignSide = ['GM', 'AGM', 'DESIGN_MGR'].includes(user?.role);
  const allowedScopes = isDesignSide ? ['DESIGN', 'BOTH'] : ['SUPERVISION', 'BOTH'];
  const visibleProjects = projects.filter((p) => allowedScopes.includes(p.scope));

  // جلب كل المشاريع (كل الصفحات) مرة واحدة عند فتح النافذة
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setProjectsLoading(true);
      try {
        let all = [];
        let next = 'projects/?page_size=100';
        while (next) {
          const res = await apiClient.get(next);
          all = all.concat(res.data?.results || []);
          next = res.data?.next || null;
        }
        if (!cancelled) setProjects(all);
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createExternalLog(formData);
      onLogAdded();
      onClose();
    } catch (error) {
      console.error('Failed to create external log', error);
      alert(error.response?.data?.detail || 'Failed to add external log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Add External Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ✅ Project — الليسته متفلترة حسب المستخدم */}
          <div>
            <label className={LABEL_CLS}>
              <Layers size={15} className="text-blue-600" /> Project
            </label>
            <select
              required
              name="project"
              value={formData.project}
              onChange={handleChange}
              disabled={projectsLoading}
              className={FIELD_CLS}
            >
              <option value="">
                {projectsLoading ? 'Loading projects…' : '— Select Project —'}
              </option>
              {visibleProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.application_no || p.project_no} — {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Log Type */}
          <div>
            <label className={LABEL_CLS}>
              <Tag size={15} className="text-blue-600" /> Log Type
            </label>
            <input
              required
              type="text"
              name="log_type"
              value={formData.log_type}
              onChange={handleChange}
              className={FIELD_CLS}
              placeholder="e.g., Design Review, Contractor Update"
            />
          </div>

          {/* Sub Type */}
          <div>
            <label className={LABEL_CLS}>
              <FileText size={15} className="text-blue-600" /> Sub Type
            </label>
            <select
              name="sub_type"
              value={formData.sub_type}
              onChange={handleChange}
              className={FIELD_CLS}
            >
              <option value="PENDING_DOCUMENTS">Pending Documents</option>
              <option value="CRITICAL">Critical Issue</option>
            </select>
          </div>

          {/* URL */}
          <div>
            <label className={LABEL_CLS}>
              <Link2 size={15} className="text-blue-600" /> URL (Optional)
            </label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className={FIELD_CLS}
              placeholder="https://..."
            />
          </div>

          {/* Description */}
          <div>
            <label className={LABEL_CLS}>
              <AlignLeft size={15} className="text-blue-600" /> Description
            </label>
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={FIELD_CLS + ' resize-none'}
              placeholder="Enter details..."
            ></textarea>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-700 rounded-lg hover:bg-blue-800 flex items-center disabled:opacity-70 transition"
            >
              {loading ? <Loader size={18} className="animate-spin mr-2" /> : null}
              {loading ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExternalLogModal;