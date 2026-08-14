import { useState, useEffect } from 'react';
import { assignEngineer, updateAssignment } from '../../../api/services/supervision';
import { getUsersList } from '../../../api/services/audit';
import { X, AlertTriangle, Shield } from 'lucide-react';

const DAYS_OF_WEEK = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// ═══ مصدر واحد للأدوار والأقسام — لا تكرار ═══
const ROLE_OPTIONS = [
  { value: 'ENGINEER',   label: 'Engineer' },
  { value: 'SENIOR_ENG', label: 'Senior Engineer' },
  { value: 'PM',         label: 'Project Manager' },
  { value: 'SUP_MGR',    label: 'Supervision Manager' },
];

const DEPARTMENT_OPTIONS = [
  { value: 'Civil',        label: 'Civil' },
  { value: 'Electrical',   label: 'Electrical' },
  { value: 'Mechanical',   label: 'Mechanical' },
  { value: 'Architecture', label: 'Architecture' },
  { value: 'Planning',     label: 'Planning' },
  { value: 'DC',           label: 'DC' },
];

const AssignEngineerModal = ({ projectId, projects, assignment, onClose, onSuccess }) => {
  const isEdit = !!assignment;

  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  const [formData, setFormData] = useState({
    engineer: '',
    role: 'ENGINEER',
    department: 'Civil',
    is_pm: false,
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
      const engs = (res.data.results || res.data).filter(u =>
        ['ENGINEER', 'SENIOR_ENG', 'PM', 'SUP_MGR'].includes(u.role)
      );
      setEngineers(engs);
    });

    if (isEdit) {
      setFormData({
        engineer: assignment.engineer,
        role: assignment.role || 'ENGINEER',
        department: assignment.department || 'Civil',
        is_pm: assignment.is_pm || false,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Edit' : 'Assign'} Engineer
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
              <AlertTriangle size={16} className="mr-2" /> {error}
            </div>
          )}

          {/* ── Project Selection ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              disabled={isEdit}
              className="w-full border rounded-lg p-2 text-sm bg-white disabled:bg-gray-100"
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

          {/* ── Engineer + Role + Department + PM ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engineer *</label>
              <select
                value={formData.engineer}
                onChange={e => setField('engineer', e.target.value)}
                disabled={isEdit}
                className="w-full border rounded-lg p-2 text-sm bg-white disabled:bg-gray-100"
                required
              >
                <option value="">Select Engineer...</option>
                {engineers.map(eng => (
                  <option key={eng.id} value={eng.id}>
                    {eng.first_name} {eng.last_name} ({eng.department || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={e => setField('role', e.target.value)}
                className="w-full border rounded-lg p-2 text-sm bg-white"
                required
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={e => setField('department', e.target.value)}
                className="w-full border rounded-lg p-2 text-sm bg-white"
                required
              >
                {DEPARTMENT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* ── PM Checkbox ── */}
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.is_pm}
                  onChange={e => setField('is_pm', e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Shield size={14} className="text-blue-500" />
                  Is PM
                </span>
              </label>
            </div>
          </div>

          {/* ── Work Schedule ── */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Work Schedule</h3>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Days of Week *</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      formData.days_of_week.includes(day)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time From</label>
                <input
                  type="time"
                  value={formData.time_from}
                  onChange={e => setField('time_from', e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time To</label>
                <input
                  type="time"
                  value={formData.time_to}
                  onChange={e => setField('time_to', e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.assignment_started_at}
                  onChange={e => setField('assignment_started_at', e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* ── Percentages ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-100">
              <label className="block text-sm font-semibold text-blue-800 mb-1">Contract %</label>
              <p className="text-xs text-blue-600 mb-2">Official agreed percentage.</p>
              <input
                type="number"
                min="0" max="100"
                value={formData.contract_percentage}
                onChange={e => setField('contract_percentage', parseFloat(e.target.value) || 0)}
                className="w-full border border-blue-200 rounded-lg p-2 text-sm bg-white"
              />
            </div>
            <div className="border rounded-lg p-4 bg-purple-50 border-purple-100">
              <label className="block text-sm font-semibold text-purple-800 mb-1">Actual %</label>
              <p className="text-xs text-purple-600 mb-2">Actual workload for this project.</p>
              <input
                type="number"
                min="0" max="100"
                value={formData.actual_percentage}
                onChange={e => setField('actual_percentage', parseFloat(e.target.value) || 0)}
                className="w-full border border-purple-200 rounded-lg p-2 text-sm bg-white"
              />
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600 bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-800 text-white rounded disabled:opacity-50">
              {loading ? 'Saving...' : (isEdit ? 'Update Assignment' : 'Assign Engineer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignEngineerModal;