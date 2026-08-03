import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectDetails, updateProjectPriority, getPriorityHistory } from '../../api/services/projects';
import { useAuth } from '../../context/AuthContext';
import { Flag, History, AlertCircle, Loader, Save } from 'lucide-react';
import { format } from 'date-fns';

const PriorityEdit = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [history, setHistory] = useState([]);
  const [newPriority, setNewPriority] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canEdit = ['GM', 'AGM', 'DESIGN_MGR'].includes(user?.role);

  useEffect(() => {
    Promise.all([
      getProjectDetails(id),
      getPriorityHistory(id)
    ]).then(([projRes, histRes]) => {
      setProject(projRes.data);
      setNewPriority(projRes.data.priority);
      setHistory(histRes.data);
    }).catch(err => {
      setError('Failed to load data');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!reason.trim()) {
      setError('Reason is required for priority change');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateProjectPriority(id, { priority: newPriority, reason });
      // Refresh data
      const [projRes, histRes] = await Promise.all([
        getProjectDetails(id),
        getPriorityHistory(id)
      ]);
      setProject(projRes.data);
      setHistory(histRes.data);
      setReason('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update priority');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-20 text-red-500">Project not found</div>;
  }

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Flag className="mr-2 text-primary" size={28} />
            Priority Management
          </h1>
          <p className="text-sm text-gray-500">{project.name} - {project.project_no}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border ${getPriorityColor(project.priority)}`}>
          <span className="font-bold">{project.priority}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center">
          <AlertCircle className="text-red-500 mr-2" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Edit Priority Section */}
      {canEdit ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Priority</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Priority Level</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(priority => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setNewPriority(priority)}
                    className={`p-3 rounded-lg border-2 transition ${
                      newPriority === priority
                        ? `${getPriorityColor(priority)} border-current`
                        : 'border-gray-200 border-gray-300'
                    }`}
                  >
                    <span className="font-bold text-sm">{priority}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="3"
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="Explain why the priority is being changed..."
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || newPriority === project.priority}
                className="px-6 py-2 bg-primary text-white rounded-lg bg-blue-800 flex items-center disabled:opacity-50"
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Saving...' : 'Save Priority'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
          You don't have permission to change priority.
        </div>
      )}

      {/* Priority History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <History className="mr-2 text-gray-600" size={20} />
          Priority History
        </h2>
        {history.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No priority changes recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((record, index) => (
              <div key={record.id} className="border-l-4 border-primary pl-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(record.priority)}`}>
                    {record.priority}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(record.created_at), 'dd MMM yyyy, hh:mm a')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{record.reason}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Updated by: {record.updated_by_name || record.updated_by_username || 'System'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriorityEdit;
