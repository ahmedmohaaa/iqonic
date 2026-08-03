import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, User } from 'lucide-react';
import apiClient from '../api/axios';

const PriorityHistory = ({ projectId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get(`projects/${projectId}/priority-history/`)
      .then(res => setHistory(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [projectId]);

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (history.length === 0) return <div className="text-center py-4 text-gray-500">No priority changes recorded</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <TrendingUp className="mr-2 text-primary" size={20} />
        Priority History
      </h3>

      <div className="space-y-3">
        {history.map((record, idx) => (
          <div key={idx} className="border-l-4 border-primary pl-4 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(record.priority)}`}>
                {record.priority}
              </span>
              <span className="text-xs text-gray-500 flex items-center">
                <Calendar size={12} className="mr-1" />
                {new Date(record.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-1">{record.reason}</p>
            <p className="text-xs text-gray-500 flex items-center">
              <User size={12} className="mr-1" />
              Updated by: {record.updated_by_name || record.updated_by_username}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriorityHistory;