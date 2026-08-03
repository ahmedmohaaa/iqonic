import { useState, useEffect } from 'react';
import { getExternalLogs } from '../../api/services/admin';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, ExternalLink, Search, Filter, 
  AlertCircle, Clock, Loader, Plus
} from 'lucide-react';
import AddExternalLogModal from './AddExternalLogModal';
const ExternalLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const isSupervisionStaff = ['SUP_MGR', 'PM', 'ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN', 'SECRETARY'].includes(user?.role);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.log_type = filterType;
      if (filterProject) params.project = filterProject;
      
      const res = await getExternalLogs(params);
      setLogs(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch external logs', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getSubTypeColor = (subType) => {
    const colors = {
      PENDING_DOCUMENTS: 'bg-yellow-100 text-yellow-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return colors[subType] || 'bg-gray-100 text-gray-800';
  };

  const getSubTypeIcon = (subType) => {
    if (subType === 'CRITICAL') return <AlertCircle size={16} className="text-red-500" />;
    return <Clock size={16} className="text-yellow-500" />;
  };

return (
    <div className="space-y-6">
      {/* 3. تعديل زر الإضافة ليقوم بفتح النافذة */}
      <div className="flex items-center justify-between">
        {/* ... (عنوان الصفحة) */}
        {isSupervisionStaff && (
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center"
          >
            <Plus size={18} className="mr-1" /> Add External Log
          </button>
        )}
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FileText className="mr-2 text-primary" size={28} />
            External Logs
          </h1>
          <p className="text-sm text-gray-500">Track external documents and critical issues</p>
        </div>
{isSupervisionStaff && (
  <button
    onClick={() => setIsAddModalOpen(true)}
    className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center"
  >
    <Plus size={18} className="mr-1" /> Add External Log
  </button>
)}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 uppercase">Pending Documents</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">
            {logs.filter(l => l.sub_type === 'PENDING_DOCUMENTS').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-500">
          <p className="text-xs text-gray-500 uppercase">Critical Issues</p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {logs.filter(l => l.sub_type === 'CRITICAL').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase">Total Logs</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{logs.length}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search logs..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">All Types</option>
            <option value="PENDING_DOCUMENTS">Pending Documents</option>
            <option value="CRITICAL">Critical Issues</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <FileText className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No external logs found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map(log => (
            <div key={log.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getSubTypeIcon(log.sub_type)}
                  <div>
                    <h3 className="font-semibold text-gray-800">{log.log_type || 'External Log'}</h3>
                    <p className="text-xs text-gray-500">
                      Project: {log.project_name || log.project_id || 'N/A'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSubTypeColor(log.sub_type)}`}>
                  {log.sub_type === 'PENDING_DOCUMENTS' ? 'Pending' : 'Critical'}
                </span>
              </div>
              
              {log.description && (
                <p className="text-sm text-gray-600 mb-3">{log.description}</p>
              )}
              
              {log.url && (
                <a 
                  href={log.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-primary text-blue-800 font-semibold"
                >
                  <ExternalLink size={14} className="mr-1" /> View Document
                </a>
              )}
              
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                Created: {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
    
<AddExternalLogModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onLogAdded={fetchLogs} 
      />
    </div>
  );
};

export default ExternalLogs;