import { useState } from 'react';
import { respondToTaskReplacement, respondToSupervisionReplacement } from '../../../api/services/replacements';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const RespondModal = ({ request, type, onClose, onSuccess }) => {
  const [action, setAction] = useState(''); // 'APPROVED' or 'REJECTED'
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!action) {
      setError('Please select Approve or Reject.');
      return;
    }
    if (action === 'REJECTED' && !reason.trim()) {
      setError('Reason is required for rejection.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (type === 'tasks') {
        await respondToTaskReplacement(request.id, {
          status: action,
          response_reason: reason
        });
      } else {
        // للإشراف، الـ Backend يأخذ assignment_id و new_engineer_id
        await respondToSupervisionReplacement(request.id, {
          assignment_id: request.assignment?.id,
          new_engineer_id: request.suggested_engineer?.id,
          status: action,
          response_reason: reason
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Respond to Replacement Request</h2>
          <button onClick={onClose} className="text-gray-400 text-gray-600"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
              <AlertTriangle size={16} className="mr-2" /> {error}
            </div>
          )}

          <div className="bg-gray-50 p-3 rounded text-sm">
            <p><span className="font-semibold">Engineer:</span> {request.requested_by?.first_name} {request.requested_by?.last_name}</p>
            <p><span className="font-semibold">Suggested:</span> {request.suggested_engineer?.first_name} {request.suggested_engineer?.last_name}</p>
            <p className="mt-2 italic text-gray-600">"{request.reason}"</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Decision *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAction('APPROVED')}
                className={`py-3 px-4 rounded border-2 flex items-center justify-center space-x-2 transition ${
                  action === 'APPROVED' 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 text-gray-600 border-gray-300'
                }`}
              >
                <CheckCircle size={18} />
                <span className="font-semibold">Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setAction('REJECTED')}
                className={`py-3 px-4 rounded border-2 flex items-center justify-center space-x-2 transition ${
                  action === 'REJECTED' 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : 'border-gray-200 text-gray-600 border-gray-300'
                }`}
              >
                <XCircle size={18} />
                <span className="font-semibold">Reject</span>
              </button>
            </div>
          </div>

          {action === 'REJECTED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection *</label>
              <textarea 
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm"
                rows="3"
                placeholder="Explain why the request is rejected..."
                required
              />
            </div>
          )}

          {action === 'APPROVED' && (
            <div className="bg-blue-50 border border-blue-100 p-3 rounded text-sm text-blue-800">
              <p className="font-semibold mb-1">Approval Confirmation:</p>
              <p>By approving, the system will automatically:</p>
              <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                <li>Reassign the task/assignment to the suggested engineer.</li>
                <li>Record the handover KPIs for the old engineer.</li>
                <li>Notify both engineers of the change.</li>
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600 bg-gray-50">Cancel</button>
            <button 
              type="submit" 
              disabled={loading || !action} 
              className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
                action === 'APPROVED' ? 'bg-green-600 bg-green-700' : 
                action === 'REJECTED' ? 'bg-red-600 bg-red-700' : 'bg-gray-400'
              }`}
            >
              {loading ? 'Processing...' : 'Submit Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RespondModal;
