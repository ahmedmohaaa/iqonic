import { useState, useEffect } from 'react';
import { updateTaskStatus } from '../../../api/services/tasks';
import { X, AlertTriangle } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'UNCHARTED',   label: 'Uncharted' },
  { value: 'UNDER_STUDY', label: 'Under Study' },
  { value: 'COMMENT',     label: 'Comment' },
  { value: 'ON_GOING',    label: 'On Going' },
  { value: 'ON_HOLD',     label: 'On Hold' },
  { value: 'COMPLETED',   label: 'Completed' },
  { value: 'APPROVED',    label: 'Approved' },
];

// ✅ الحالات النهائية التي تتطلب Progress = 100%
const FINAL_STATUSES = ['COMPLETED', 'APPROVED'];

const TaskStatusModal = ({ task, permission = 'none', onClose, onSuccess }) => {
  const allowedStatuses =
    permission === 'executor'
      ? STATUS_OPTIONS.map((option) => option.value)
      : permission === 'hold-only'
        ? ['ON_HOLD']
        : [];

  const visibleStatuses = STATUS_OPTIONS.filter((option) =>
    allowedStatuses.includes(option.value)
  );

  const initialStatus = allowedStatuses.includes(task?.status)
    ? task.status
    : allowedStatuses[0] || '';

  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(task?.progress_percentage ?? 0);
  const [holdReason, setHoldReason] = useState(task?.hold_reason || '');
  const [expectedResume, setExpectedResume] = useState(task?.expected_resume_date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ الإصلاح الجذري: عند اختيار COMPLETED أو APPROVED، اجعل Progress = 100% تلقائياً
  useEffect(() => {
    if (FINAL_STATUSES.includes(status)) {
      setProgress(100);
    }
  }, [status]);

  const isFinalStatus = FINAL_STATUSES.includes(status);

  const safeProgress = Math.min(
    100,
    Math.max(0, Number.isFinite(Number(progress)) ? Number(progress) : 0)
  );

  if (!task || visibleStatuses.length === 0) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allowedStatuses.includes(status)) {
      setError('You are not allowed to update this status.');
      return;
    }

    if (status === 'ON_HOLD' && !holdReason.trim()) {
      setError('Hold Reason is required.');
      return;
    }

    if (status === 'APPROVED') {
      const confirmed = window.confirm(
        'Approving this task will finalize and close it.\nThis action cannot be undone.\nConfirm approval?'
      );

      if (!confirmed) {
        return;
      }
    }

    setLoading(true);
    setError('');

    // ✅ ضمان إضافي: إذا كانت الحالة نهائية، Progress دائماً 100%
    const finalProgress = isFinalStatus ? 100 : safeProgress;

    const payload = {
      status,
      progress_percentage: finalProgress,
      is_on_hold: status === 'ON_HOLD',
      hold_reason: status === 'ON_HOLD' ? holdReason : null,
      expected_resume_date: status === 'ON_HOLD' ? expectedResume : null,
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
          <h2 className="text-lg font-bold text-gray-900">
            {permission === 'hold-only' ? 'Set Task On Hold' : 'Update Task Status'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
              <AlertTriangle size={16} className="mr-2" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={visibleStatuses.length === 1}
            >
              {visibleStatuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Progress
            </label>

            {/* ✅ رسالة توضيحية عند اختيار حالة نهائية */}
            {isFinalStatus && (
              <div className="mb-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-md">
                ✓ Progress is automatically set to 100% for {status === 'APPROVED' ? 'Approved' : 'Completed'} tasks.
              </div>
            )}

            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={safeProgress}
                onChange={(e) => setProgress(e.target.value)}
                disabled={isFinalStatus}
                className={`w-full accent-blue-600 ${isFinalStatus ? 'opacity-60 cursor-not-allowed' : ''}`}
              />

              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFinalStatus ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${safeProgress}%` }}
                  />
                </div>

                <span className={`w-12 text-center text-xs font-bold ${
                  isFinalStatus ? 'text-emerald-700' : 'text-gray-900'
                }`}>
                  {safeProgress}%
                </span>
              </div>

              <input
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                disabled={isFinalStatus}
                className={`w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  isFinalStatus ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="0"
              />
            </div>
          </div>

          {status === 'ON_HOLD' && (
            <div className="space-y-3 bg-red-50 p-3 rounded-lg border border-red-200">
              <div>
                <label className="block text-sm font-semibold text-red-900 mb-1">
                  Hold Reason *
                </label>

                <textarea
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full border border-red-300 rounded p-2 text-sm text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  rows="2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-red-900 mb-1">
                  Expected Resume Date (Optional)
                </label>

                <input
                  type="date"
                  value={expectedResume}
                  onChange={(e) => setExpectedResume(e.target.value)}
                  className="w-full border border-red-300 rounded p-2 text-sm text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-800 bg-gray-50 hover:bg-gray-100 font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskStatusModal;
