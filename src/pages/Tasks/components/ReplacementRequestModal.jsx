import { useState, useEffect } from 'react';
import { createReplacementRequest } from '../../../api/services/tasks';
import apiClient from '../../../api/axios';
import { X } from 'lucide-react';

const ReplacementRequestModal = ({ task, onClose, onSuccess }) => {
  const [engineers, setEngineers] = useState([]);
  const [suggestedEngineer, setSuggestedEngineer] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch list of engineers for replacement
    apiClient.get('users/?role=ENGINEER&role=SENIOR_ENG&role=DRAFTSMAN')
      .then(res => setEngineers(res.data.results || res.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!suggestedEngineer || !reason.trim()) return;

    setLoading(true);
    try {
      await createReplacementRequest(task.id, {
        suggested_engineer: suggestedEngineer,
        reason: reason
      });
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Request Replacement</h2>
          <button onClick={onClose} className="text-gray-400 text-gray-600"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task: {task.title || task.discipline_name}</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suggest Engineer *</label>
            <select 
              value={suggestedEngineer} 
              onChange={(e) => setSuggestedEngineer(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              required
            >
              <option value="">Select an engineer...</option>
              {engineers.map(eng => (
                <option key={eng.id} value={eng.id}>{eng.first_name} {eng.last_name} ({eng.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Replacement *</label>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              rows="3"
              placeholder="Explain why you need a replacement..."
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600 bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded bg-blue-800 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplacementRequestModal;
