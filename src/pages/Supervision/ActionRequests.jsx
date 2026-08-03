import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getActionRequests, createActionRequest, updateActionRequest } from '../../api/services/supervision';
import { useAuth } from '../../context/AuthContext';
import { ClipboardList, Plus, Loader, AlertCircle, CheckCircle, Clock, PauseCircle } from 'lucide-react';

const ActionRequests = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  const isManager = ['SUP_MGR', 'PM', 'GM', 'AGM'].includes(user?.role);

  useEffect(() => {
    fetchRequests();
  }, [id]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getActionRequests(id);
      setRequests(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (requestId, data) => {
    try {
      await updateActionRequest(requestId, data);
      fetchRequests();
      setEditingRequest(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      STARTED: 'bg-blue-100 text-blue-800',
      ON_GOING: 'bg-indigo-100 text-indigo-800',
      ON_HOLD: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100';
  };

  const getStatusIcon = (status) => {
    if (status === 'COMPLETED') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'ON_GOING') return <Clock size={16} className="text-indigo-500" />;
    if (status === 'ON_HOLD') return <PauseCircle size={16} className="text-red-500" />;
    return <AlertCircle size={16} className="text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <ClipboardList className="mr-2 text-primary" size={28} />
            Action Requests
          </h1>
          <p className="text-sm text-gray-500">Track and manage action requests for this project</p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center"
          >
            <Plus size={18} className="mr-1" /> New Request
          </button>
        )}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <ClipboardList className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No action requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(request.status)}
                    <h3 className="font-semibold text-gray-800">{request.title || `Request #${request.id}`}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Created by: {request.created_by_name || request.created_by_username}</span>
                    <span>Assigned to: {request.assigned_to_name || request.assigned_to_username}</span>
                    <span>Progress: {request.progress_percentage}%</span>
                  </div>
                  {request.is_on_hold && request.hold_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <strong>On Hold:</strong> {request.hold_reason}
                    </div>
                  )}
                </div>
              </div>

              {/* Update Form for Assigned Engineer */}
              {request.assigned_to === user?.id && request.status !== 'COMPLETED' && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {['STARTED', 'ON_GOING', 'ON_HOLD', 'COMPLETED'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleUpdate(request.id, { status })}
                        disabled={request.status === status}
                        className={`px-3 py-1.5 rounded text-xs font-semibold ${
                          request.status === status
                            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                            : 'bg-primary text-white bg-blue-800'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  {request.status === 'ON_GOING' && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-600 mb-1">Progress (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={request.progress_percentage}
                        onBlur={(e) => handleUpdate(request.id, { progress_percentage: parseInt(e.target.value) })}
                        className="border rounded p-1 text-sm w-24"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateActionRequestModal
          projectId={id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchRequests(); }}
        />
      )}
    </div>
  );
};

// Create Action Request Modal
const CreateActionRequestModal = ({ projectId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createActionRequest(projectId, formData);
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Create Action Request</h2>
          <button onClick={onClose} className="text-gray-400 text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border rounded-lg p-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              className="w-full border rounded-lg p-2 text-sm"
              required
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
            <input
              type="text"
              value={formData.assigned_to}
              onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
              placeholder="Engineer name or ID"
              className="w-full border rounded-lg p-2 text-sm"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded bg-blue-800 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionRequests;
