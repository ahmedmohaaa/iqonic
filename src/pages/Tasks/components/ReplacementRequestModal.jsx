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
          <h2 className="text-lg font-bold text-gray-900">Request Replacement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Task: <span className="font-bold">{task.title || task.discipline_name}</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Suggest Engineer *
            </label>
            <select 
              value={suggestedEngineer} 
              onChange={(e) => setSuggestedEngineer(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select an engineer...</option>
              {engineers.map(eng => (
                <option key={eng.id} value={eng.id}>
                  {eng.first_name} {eng.last_name} ({eng.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Reason for Replacement *
            </label>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              rows="3"
              placeholder="Explain why you need a replacement..."
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded text-gray-800 bg-gray-50 hover:bg-gray-100 font-medium transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 disabled:opacity-50 font-medium transition"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplacementRequestModal;
