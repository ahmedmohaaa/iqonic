import { useState, useEffect } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import apiClient from '../api/axios';

const OfferStatusForm = ({ projectId, currentStatus, onSuccess }) => {
  const [status, setStatus] = useState(currentStatus || 'NOT_SUBMITTED');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const statusOptions = [
    { value: 'NOT_SUBMITTED', label: 'Not Submitted Yet', color: 'bg-gray-100 text-gray-800' },
    { value: 'SUBMITTED', label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
    { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 text-green-800' },
  ];

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      await apiClient.patch(`projects/${projectId}/offer-status/`, {
        offer_status: status,
      });
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to update offer status', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <FileText className="mr-2 text-primary" size={20} />
        Offer Status
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatus(option.value)}
              className={`p-3 rounded-lg border-2 transition text-sm font-semibold ${
                status === option.value
                  ? `${option.color} border-current`
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center">
            <CheckCircle className="mr-2" size={16} />
            Status updated successfully!
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || status === currentStatus}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Status'}
        </button>
      </div>
    </div>
  );
};

export default OfferStatusForm;