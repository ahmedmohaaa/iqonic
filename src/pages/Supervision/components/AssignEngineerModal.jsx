import { useState, useEffect } from 'react';
import { assignEngineer, updateAssignment } from '../../../api/services/supervision';
import { getUsersList } from '../../../api/services/audit'; 
import { X, AlertTriangle } from 'lucide-react';

const DAYS_OF_WEEK = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// لاحظ أننا أضفنا projects ضمن الـ Props
const AssignEngineerModal = ({ projectId, projects, assignment, onClose, onSuccess }) => {
  const isEdit = !!assignment;
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // حالة جديدة لحفظ المشروع الذي تم اختياره من القائمة (ونعطيه المشروع الحالي كقيمة افتراضية)
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  const [formData, setFormData] = useState({
    engineer: '',
    role: 'Civil Engineer',
    days_of_week: [],
    time_from: '08:00',
    time_to: '17:00',
    contract_percentage: 0,
    actual_percentage: 0,
    assignment_started_at: new Date().toISOString().split('T')[0],
  });

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
        role: assignment.role,
        days_of_week: assignment.days_of_week || [],
        time_from: assignment.time_from?.substring(0, 5) || '08:00',
        time_to: assignment.time_to?.substring(0, 5) || '17:00',
        contract_percentage: assignment.contract_percentage,
        actual_percentage: assignment.actual_percentage,
        assignment_started_at: assignment.assignment_started_at || new Date().toISOString().split('T')[0],
      });
      // في حالة التعديل، نجعل المشروع المختار هو مشروع الـ assignment إذا كان متوفراً
      if (assignment.project) setSelectedProjectId(assignment.project);
    }
  }, [assignment]);

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // تحقق من اختيار المشروع
    if (!selectedProjectId) {
      setError('Please select a project.');
      return;
    }
    if (!formData.engineer) {
      setError('Please select an engineer.');
      return;
    }
    if (formData.days_of_week.length === 0) {
      setError('Please select at least one working day.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await updateAssignment(assignment.id, formData);
      } else {
        // نستخدم selectedProjectId بدلاً من projectId السابق
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
          <h2 className="text-lg font-bold text-gray-800">{isEdit ? 'Edit' : 'Assign'} Engineer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
              <AlertTriangle size={16} className="mr-2" /> {error}
            </div>
          )}

          {/* Project Selection (تمت الإضافة هنا) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
            <select 
              value={selectedProjectId} 
              onChange={e => setSelectedProjectId(e.target.value)}
              disabled={isEdit} // لا يمكن تغيير المشروع عند التعديل، يجب أن يكون معطلاً
              className="w-full border rounded-lg p-2 text-sm bg-white disabled:bg-gray-100"
              required
            >
              <option value="">Select Project...</option>
              {projects && projects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.project_no} - {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Engineer & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engineer *</label>
              <select 
                value={formData.engineer} 
                onChange={e => setFormData({...formData, engineer: e.target.value})}
                disabled={isEdit}
                className="w-full border rounded-lg p-2 text-sm bg-white disabled:bg-gray-100"
                required
              >
                <option value="">Select Engineer...</option>
                {engineers.map(eng => (
                  <option key={eng.id} value={eng.id}>{eng.first_name} {eng.last_name} ({eng.department || 'General'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role / Title *</label>
              <input 
                type="text" 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})}
                placeholder="e.g. Civil Engineer, Planner"
                className="w-full border rounded-lg p-2 text-sm"
                required
              />
            </div>
          </div>

          {/* Schedule: Days & Time */}
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
                        ? 'bg-primary text-white border-primary bg-blue-600' // أضفت bg-blue-600 مؤقتاً لضمان اللون
                        : 'bg-white text-gray-600 border-gray-300'
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
                  onChange={e => setFormData({...formData, time_from: e.target.value})}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time To</label>
                <input 
                  type="time" 
                  value={formData.time_to} 
                  onChange={e => setFormData({...formData, time_to: e.target.value})}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={formData.assignment_started_at} 
                  onChange={e => setFormData({...formData, assignment_started_at: e.target.value})}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Workload Percentages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-100">
              <label className="block text-sm font-semibold text-blue-800 mb-1">Contract %</label>
              <p className="text-xs text-blue-600 mb-2">Official agreed percentage in the contract.</p>
              <input 
                type="number" 
                min="0" max="100"
                value={formData.contract_percentage} 
                onChange={e => setFormData({...formData, contract_percentage: parseFloat(e.target.value)})}
                className="w-full border border-blue-200 rounded-lg p-2 text-sm bg-white"
              />
            </div>
            <div className="border rounded-lg p-4 bg-purple-50 border-purple-100">
              <label className="block text-sm font-semibold text-purple-800 mb-1">Actual %</label>
              <p className="text-xs text-purple-600 mb-2">Actual workload required for this project.</p>
              <input 
                type="number" 
                min="0" max="100"
                value={formData.actual_percentage} 
                onChange={e => setFormData({...formData, actual_percentage: parseFloat(e.target.value)})}
                className="w-full border border-purple-200 rounded-lg p-2 text-sm bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600 bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded bg-blue-800 disabled:opacity-50">
              {loading ? 'Saving...' : (isEdit ? 'Update Assignment' : 'Assign Engineer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignEngineerModal;