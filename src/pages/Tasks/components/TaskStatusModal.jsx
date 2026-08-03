import { useState } from 'react';
import { updateTaskStatus } from '../../../api/services/tasks';
import { X, AlertTriangle } from 'lucide-react';

const TaskStatusModal = ({ task, onClose, onSuccess }) => {
  const [status, setStatus] = useState(task.status);
  const [progress, setProgress] = useState(task.progress_percentage);
  const [holdReason, setHoldReason] = useState(task.hold_reason || '');
  const [expectedResume, setExpectedResume] = useState(task.expected_resume_date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for On-Hold
    if (status === 'ON_HOLD' && !holdReason.trim()) {
      setError('Hold Reason is required.');
      return;
    }

    // Confirmation Alerts (as per PDF)
    if (status === 'COMPLETED') {
      if (!window.confirm('You are marking this task as Completed.\nThis will set the completion date to today and notify the manager.\nDo you want to continue?')) {
        return;
      }
    } else if (status === 'APPROVED') {
      if (!window.confirm('Approving this task may update the linked discipline status.\nConfirm approval?')) {
        return;
      }
    }

    setLoading(true);
    setError('');

    const payload = {
      status,
      progress_percentage: parseInt(progress),
      is_on_hold: status === 'ON_HOLD',
      hold_reason: status === 'ON_HOLD' ? holdReason : null,
      expected_resume_date: status === 'ON_HOLD' ? expectedResume : null
    };

    try {
      await updateTaskStatus(task.id, payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Update Task Status</h2>
          <button onClick={onClose} className="text-gray-400 text-gray-600"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
              <AlertTriangle size={16} className="mr-2" /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="UNCHARTED">Uncharted</option>
              <option value="UNDER_STUDY">Under Study</option>
              <option value="ON_GOING">On Going</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>

          

          {/* On-Hold Fields */}
          {status === 'ON_HOLD' && (
            <div className="space-y-3 bg-red-50 p-3 rounded-lg border border-red-100">
              <div>
                <label className="block text-sm font-medium text-red-800 mb-1">Hold Reason *</label>
                <textarea 
                  value={holdReason} 
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full border border-red-200 rounded p-2 text-sm"
                  rows="2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-800 mb-1">Expected Resume Date (Optional)</label>
                <input 
                  type="date" 
                  value={expectedResume} 
                  onChange={(e) => setExpectedResume(e.target.value)}
                  className="w-full border border-red-200 rounded p-2 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600 bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded bg-blue-800 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskStatusModal;
