import { useState } from 'react';
import {
  respondToTaskReplacement,
  respondToSupervisionReplacement,
  engineerRespondToReplacement,
} from '../../../api/services/replacements';
import { useAuth } from '../../../context/AuthContext';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const RespondModal = ({ request, type, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSuggestedEngineer = user?.id === request.suggested_engineer?.id;
  const taskName = request.task?.title || request.task?.discipline_name || 'Task';

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
        if (isSuggestedEngineer) {
          // ═══ المهندس المقترح يرد ═══
          await engineerRespondToReplacement(request.id, {
            response: action === 'APPROVED' ? 'APPROVE' : 'DECLINE',
            reason: reason,
          });
        } else {
          // ═══ المدير يرد ═══
          await respondToTaskReplacement(request.id, {
            status: action,
            response_reason: reason,
          });
        }
      } else {
        await respondToSupervisionReplacement(request.id, {
          assignment_id: request.assignment?.id,
          new_engineer_id: request.suggested_engineer?.id,
          status: action,
          response_reason: reason,
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
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Respond to Replacement Request</h2>
          <button onClick={onClose} className="text-gray-700 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-900 p-3 rounded text-sm flex items-center font-medium border border-red-200">
              <AlertTriangle size={16} className="mr-2 text-red-700" /> {error}
            </div>
          )}

          <div className="bg-gray-100 p-3 rounded text-sm text-gray-900">
            <p><span className="font-bold text-black">Task:</span> {taskName}</p>
            <p><span className="font-bold text-black">Engineer:</span> {request.requested_by?.first_name} {request.requested_by?.last_name}</p>
            <p><span className="font-bold text-black">Suggested:</span> {request.suggested_engineer?.first_name} {request.suggested_engineer?.last_name}</p>
            <p className="mt-2 italic text-gray-900 font-medium">"{request.reason}"</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Your Decision *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAction('APPROVED')}
                className={`py-3 px-4 rounded border-2 flex items-center justify-center space-x-2 transition ${
                  action === 'APPROVED'
                    ? 'border-green-600 bg-green-50 text-green-900 font-bold'
                    : 'border-gray-300 text-gray-900 font-semibold hover:border-gray-400'
                }`}
              >
                <CheckCircle size={18} />
                <span className="font-bold">Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setAction('REJECTED')}
                className={`py-3 px-4 rounded border-2 flex items-center justify-center space-x-2 transition ${
                  action === 'REJECTED'
                    ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                    : 'border-gray-300 text-gray-900 font-semibold hover:border-gray-400'
                }`}
              >
                <XCircle size={18} />
                <span className="font-bold">Reject</span>
              </button>
            </div>
          </div>

          {action === 'REJECTED' && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Reason for Rejection *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-400 rounded-lg p-2 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                rows="3"
                placeholder="Explain why the request is rejected..."
                required
              />
            </div>
          )}

          {action === 'APPROVED' && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-950">
              <p className="font-bold mb-1 text-blue-950">Approval Confirmation:</p>
              <p className="font-medium">By approving, the system will automatically:</p>
              <ul className="list-disc list-inside text-xs mt-1 space-y-1 font-medium">
                <li>Reassign the task to the suggested engineer.</li>
                <li>Record the handover KPIs for the old engineer.</li>
                <li>Notify both engineers of the change.</li>
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-900 font-semibold bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !action}
              className={`px-4 py-2 text-white rounded font-bold disabled:opacity-50 ${
                action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700'
                : action === 'REJECTED' ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-500'
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