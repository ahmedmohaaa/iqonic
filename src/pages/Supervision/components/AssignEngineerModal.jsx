import { useState, useEffect } from 'react';
import { assignEngineer, updateAssignment } from '../../../api/services/supervision';
import { getUsersList } from '../../../api/services/audit';
import { X, AlertTriangle, Shield } from 'lucide-react';

const DAYS_OF_WEEK = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// ✅ خيارات Role الجديدة (مستقلة عن دور المستخدم الأصلي في النظام)
const ASSIGNMENT_ROLES = [
  { value: 'PM', label: 'PM' },
  { value: 'SITE_ENGINEER', label: 'Site Engineer' },
  { value: 'COORDINATOR', label: 'Coordinator' },
  { value: 'INSPECTOR', label: 'Inspector' },
  { value: 'SENIOR_ENGINEER', label: 'Senior Engineer' },
];

const AssignEngineerModal = ({ projectId, projects, assignment, onClose, onSuccess }) => {
  const isEdit = !!assignment;

  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [formData, setFormData] = useState({
    engineer: '',
    role: 'PM',
    department: 'Supervision',
    is_pm: true,
    days_of_week: [],
    time_from: '08:00',
    time_to: '17:00',
    contract_percentage: 0,
    actual_percentage: 0,
    assignment_started_at: new Date().toISOString().split('T')[0],
  });

  // ═══ تحميل المهندسين + بيانات التعديل ═══
  useEffect(() => {
    getUsersList().then(res => {
      // ✅ فلترة: فقط قسم الإشراف (Supervision) - بدون التصميم
      const engs = (res.data.results || res.data).filter(u =>
        ['ENGINEER', 'SENIOR_ENG', 'PM', 'SUP_MGR', 'SITE_ENGINEER', 'COORDINATOR', 'INSPECTOR'].includes(u.role) &&
        u.department === 'Supervision'
      );
      setEngineers(engs);
    });

    if (isEdit) {
      setFormData({
        engineer: assignment.engineer,
        role: assignment.role || 'PM',
        department: assignment.department || 'Supervision',
        is_pm: assignment.is_pm || assignment.role === 'PM',
        days_of_week: assignment.days_of_week || [],
        time_from: assignment.time_from?.substring(0, 5) || '08:00',
        time_to: assignment.time_to?.substring(0, 5) || '17:00',
        contract_percentage: assignment.contract_percentage,
        actual_percentage: assignment.actual_percentage,
        assignment_started_at: assignment.assignment_started_at || new Date().toISOString().split('T')[0],
      });
      if (assignment.project) setSelectedProjectId(assignment.project);
    }
  }, [assignment]);

  // ═══ تحديث حقل واحد ═══
  const setField = (key, value) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  // ✅ المهندس المختار (للعرض فقط)
  const selectedEngineer = engineers.find((u) => String(u.id) === String(formData.engineer));

  const handleEngineerChange = (e) => {
    const id = e.target.value;
    const eng = engineers.find((u) => String(u.id) === String(id));
    setFormData((prev) => ({
      ...prev,
      engineer: id,
      // ✅ لا نغير الـ role تلقائياً - المستخدم يختار Role من الـ select
      department: eng?.department || prev.department,
    }));
  };

  // ✅ معالج تغيير Role: يعيّن is_pm تلقائياً
  const handleRoleChange = (newRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      is_pm: newRole === 'PM',
    }));
  };

  const handleDayToggle = (day) =>
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day],
    }));

  // ═══ الإرسال ═══
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return setError('Please select a project.');
    if (!formData.engineer) return setError('Please select an engineer.');
    if (formData.days_of_week.length === 0) return setError('Please select at least one working day.');
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await updateAssignment(assignment.id, formData);
      } else {
        await assignEngineer(selectedProjectId, formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save assignment.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ كلاس مشترك للحقول (نص أسود + حدود واضحة)
  const inputClass = "w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
  const selectClass = "w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100";
  const labelClass = "block text-sm font-semibold text-gray-900 mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit' : 'Assign'} Engineer
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center font-medium">
              <AlertTriangle size={16} className="mr-2" /> {error}
            </div>
          )}

          {/* ── Project Selection ── */}
          <div>
            <label className={labelClass}>Project *</label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              disabled={isEdit}
              className={selectClass}
              required
            >
              <option value="">Select Project...</option>
              {projects?.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.project_no} - {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── Assign to + Role ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ✅ Assign to (بدل Engineer) */}
            <div>
              <label className={labelClass}>Assign to *</label>
              <select
                value={formData.engineer}
                onChange={handleEngineerChange}
                disabled={isEdit}
                className={selectClass}
                required
              >
                <option value="">Select Engineer...</option>
                {engineers.length === 0 ? (
                  <option value="" disabled>No supervision engineers available</option>
                ) : (
                  engineers.map(eng => (
                    <option key={eng.id} value={eng.id}>
                      {eng.first_name} {eng.last_name} ({eng.department || 'Supervision'})
                    </option>
                  ))
                )}
              </select>
              {selectedEngineer && (
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  {selectedEngineer.role} · {selectedEngineer.department || 'Supervision'}
                </p>
              )}
            </div>

            {/* ✅ Role الجديد (بدل checkbox Is PM) */}
            <div>
              <label className={labelClass}>Role *</label>
              <select
                value={formData.role}
                onChange={e => handleRoleChange(e.target.value)}
                className={selectClass}
                required
              >
                {ASSIGNMENT_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {formData.role === 'PM' && (
                <p className="text-xs text-blue-700 mt-1 font-medium flex items-center gap-1">
                  <Shield size={12} /> Project Manager — full project oversight
                </p>
              )}
            </div>
          </div>

          {/* ── Working Days ── */}
          <div>
            <label className={labelClass}>Working Days *</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                    formData.days_of_week.includes(day)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* ── Times + Start Date ── */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Time From</label>
              <input
                type="time"
                value={formData.time_from}
                onChange={e => setField('time_from', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Time To</label>
              <input
                type="time"
                value={formData.time_to}
                onChange={e => setField('time_to', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.assignment_started_at}
                onChange={e => setField('assignment_started_at', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* ── Percentages ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <label className="block text-sm font-bold text-blue-900 mb-1">Contract %</label>
              <p className="text-xs text-blue-700 mb-2 font-medium">Official agreed percentage.</p>
              <input
                type="number"
                min="0" max="100"
                value={formData.contract_percentage}
                onChange={e => setField('contract_percentage', parseFloat(e.target.value) || 0)}
                className="w-full border border-blue-300 rounded-lg p-2 text-sm text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <label className="block text-sm font-bold text-purple-900 mb-1">Actual %</label>
              <p className="text-xs text-purple-700 mb-2 font-medium">Real effort set by the manager.</p>
              <input
                type="number"
                min="0" max="100"
                value={formData.actual_percentage}
                onChange={e => setField('actual_percentage', parseFloat(e.target.value) || 0)}
                className="w-full border border-purple-300 rounded-lg p-2 text-sm text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded text-gray-800 bg-gray-50 font-semibold hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-blue-800 text-white rounded font-bold disabled:opacity-50 hover:bg-blue-900 transition"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Assignment' : 'Assign Engineer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignEngineerModal;
