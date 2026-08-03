import { useState, useEffect } from 'react';
import { getAuditLogs, getUsersList } from '../../api/services/audit';
import { useAuth } from '../../context/AuthContext';
import { FileText, Filter, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import AuditFilters from './components/AuditFilters';
import AuditTable from './components/AuditTable';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    project: '',
    user: '',
    action_type: '',
    date_from: '',
    date_to: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });

  // قائمة أنواع الإجراءات (Action Types) بناءً على الـ Backend Model
  const actionTypes = [
    { value: 'PROJECT_CREATED', label: 'Project Created' },
    { value: 'PROJECT_UPDATED', label: 'Project Updated' },
    { value: 'REVISION_CREATED', label: 'Revision / Change Order Created' },
    { value: 'TASK_CREATED', label: 'Task Created' },
    { value: 'TASK_ASSIGNED', label: 'Task Assigned' },
    { value: 'TASK_SELF_ASSIGNED', label: 'Task Self Assigned' },
    { value: 'TASK_STATUS_CHANGED', label: 'Task Status Changed' },
    { value: 'TASK_COMPLETED', label: 'Task Completed' },
    { value: 'TASK_APPROVED', label: 'Task Approved' },
    { value: 'PRIORITY_CHANGED', label: 'Priority Changed' },
    { value: 'ON_HOLD_SET', label: 'On Hold Set' },
    { value: 'ON_HOLD_RESUMED', label: 'On Hold Resumed' },
    { value: 'REASSIGNMENT_REQUESTED', label: 'Reassignment Requested' },
    { value: 'REASSIGNMENT_APPROVED', label: 'Reassignment Approved' },
    { value: 'INVOICE_ADDED', label: 'Invoice Added' },
    { value: 'INVOICE_STATUS_CHANGED', label: 'Invoice Status Changed' },
    { value: 'STAGE_ACTUAL_DATE_UPDATED', label: 'Stage Actual Date Updated' },
    { value: 'DISCIPLINE_STATUS_CHANGED', label: 'Discipline Status Changed' },
    { value: 'NOTE_ADDED', label: 'Note Added' },
  ];

  useEffect(() => {
    // جلب قائمة المستخدمين للفلترة
    getUsersList()
      .then(res => setUsers(res.data.results || res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // بناء كائن الفلاتر وإزالة الحقول الفارغة
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.project) params.project = filters.project;
      if (filters.user) params.user = filters.user;
      if (filters.action_type) params.action_type = filters.action_type;
      if (filters.date_from) params.created_at__date__gte = filters.date_from;
      if (filters.date_to) params.created_at__date__lte = filters.date_to;
      params.page = filters.page;

      const res = await getAuditLogs(params);
      setLogs(res.data.results || []);
      setPagination({
        count: res.data.count || 0,
        next: res.data.next,
        previous: res.data.previous,
      });
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 1 })); // إعادة تعيين الصفحة عند تغيير الفلتر
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.count / 20); // 20 هو الـ page_size في الـ Backend

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FileText className="mr-2 text-primary" size={28} />
            System Audit Logs
          </h1>
          <p className="text-sm text-gray-500">Track all system activities, modifications, and user actions.</p>
        </div>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          Total Records: <span className="font-bold">{pagination.count}</span>
        </div>
      </div>

      {/* Filters */}
      <AuditFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        users={users} 
        actionTypes={actionTypes} 
      />

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" size={32} /></div>
      ) : (
        <>
          <AuditTable logs={logs} />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">
                Page {filters.page} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={!pagination.previous}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 flex items-center"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={!pagination.next}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 flex items-center"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogs;