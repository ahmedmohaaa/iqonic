import { useState, useEffect } from 'react';
import { showChangeOrderInAllTasks } from './taskPermissions';
import { getAllTasks } from '../../api/services/tasks';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  ListTodo, Search, Filter, Loader, Plus, 
  AlertCircle, CheckCircle, Clock, PauseCircle,
  User, Calendar, Flag, GitBranch
} from 'lucide-react';
import PriorityDragDrop from './components/PriorityDragDrop';

const AllTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    project: '',
    assigned_to: '',
    status: '',
    priority: '',
    stage: '',
    is_on_hold: '',
    department: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [currentPage, setCurrentPage] = useState(1);

  const canManage = !!user;

  useEffect(() => {
    fetchTasks();
  }, [filters, currentPage]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, page_size: 20 };
      
      if (filters.search) params.search = filters.search;
      if (filters.project) params.project = filters.project;
      if (filters.assigned_to) params.assigned_to = filters.assigned_to;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.stage) params.stage = filters.stage;
      if (filters.is_on_hold) params.is_on_hold = filters.is_on_hold;
      if (filters.department) params.department = filters.department;
      const res = await getAllTasks(params);
      setTasks(res.data.results || res.data);
      setPagination({
        count: res.data.count || 0,
        next: res.data.next,
        previous: res.data.previous,
      });
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    const colors = {
      UNCHARTED: 'bg-gray-100 text-gray-800',
      UNDER_STUDY: 'bg-blue-100 text-blue-800',
      COMMENT: 'bg-yellow-100 text-yellow-800',
      ON_GOING: 'bg-indigo-100 text-indigo-800',
      COMPLETED: 'bg-green-100 text-green-800',
      APPROVED: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'text-red-600',
      HIGH: 'text-orange-600',
      MEDIUM: 'text-yellow-600',
      LOW: 'text-green-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const getStatusIcon = (status) => {
    if (status === 'COMPLETED' || status === 'APPROVED') return <CheckCircle size={14} />;
    if (status === 'ON_GOING') return <Clock size={14} />;
    return <AlertCircle size={14} />;
  };

  const isUpdated = (task) => {
    if (!task.updated_at || !task.created_at) return false;
    return new Date(task.updated_at).getTime() !== new Date(task.created_at).getTime();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <ListTodo className="mr-2 text-primary" size={28} />
            All Tasks
          </h1>
          <p className="text-sm text-gray-500">
            {canManage ? 'Manage and monitor all tasks across projects' : 'View all tasks'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-600">Total: </span>
            <span className="font-bold text-gray-800">{pagination.count}</span>
          </div>
          {canManage && (
            <Link 
              to="/tasks/create"
              className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center"
            >
              <Plus size={18} className="mr-1" /> Create Task
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filters Toggle */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-600" size={18} />
            <input
              type="text"
              placeholder="Search by task title, project name, or engineer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border flex items-center ${
              showFilters ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-700'
            }`}
          >
            <Filter size={18} className="mr-2" /> Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="">All Statuses</option>
                <option value="UNCHARTED">Uncharted</option>
                <option value="UNDER_STUDY">Under Study</option>
                <option value="COMMENT">Comment</option>
                <option value="ON_GOING">On Going</option>
                <option value="COMPLETED">Completed</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">Stage</label>
              <select
                value={filters.stage}
                onChange={(e) => handleFilterChange('stage', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="">All Stages</option>
                <option value="CONCEPT">Concept</option>
                <option value="DC1">DC1</option>
                <option value="DC2">DC2</option>
                <option value="TENDER">Tender</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">On Hold</label>
              <select
                value={filters.is_on_hold}
                onChange={(e) => handleFilterChange('is_on_hold', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="">All</option>
                <option value="true">On Hold Only</option>
                <option value="false">Active Only</option>
              </select>
            </div>
                 <div>
          <label className="block text-xs font-semibold text-gray-800 mb-1">Department</label>
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="">All Departments</option>
            <option value="MECH">Mechanical</option>
            <option value="ELEC">Electrical</option>
            <option value="STRUCT">Structural</option>
            <option value="ARCH">Architectural</option>
          </select>
        </div>
        <div className="md:col-span-2 flex items-end">
          <button
            onClick={() => {
              setFilters({
                search: '',
                project: '',
                assigned_to: '',
                status: '',
                priority: '',
                stage: '',
                is_on_hold: '',
                department: '',
              });
              setCurrentPage(1);
            }}
                className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg bg-red-50 text-sm"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

{/* ✅ Priority Drag & Drop — مخفي حاليًا (احذف سطري التعليق لإعادة تفعيله)
{canManage && filters.priority === '' && filters.status === '' && (
<PriorityDragDrop tasks={tasks} onUpdate={fetchTasks} />
)}
*/}

      {/* Tasks Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <ListTodo className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No tasks found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="p-4">Task</th>
                      <th className="p-4">Discipline</th>  

                  <th className="p-4">Project</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Stage</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map(task => (
                  <tr 
                    key={task.id} 
                    className={`bg-gray-50 transition ${task.is_on_hold ? 'bg-red-50' : ''}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {task.is_on_hold && (
                          <PauseCircle size={16} className="text-red-500 flex-shrink-0" />
                        )}
                        <div>
                          <Link 
                            to={`/tasks/${task.id}`}
                            className="font-semibold text-gray-800 text-primary"
                          >
                            {task.title || task.discipline_name}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Created: {new Date(task.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
    {task.discipline_name || '—'}
  </span>
</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-800">{task.project_name}</p>
                        <p className="text-xs text-gray-500 font-mono">{task.project_no}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      {task.assigned_to_name ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                            <User size={14} className="text-primary" />
                          </div>
                          <span className="text-sm text-gray-700">{task.assigned_to_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                        {task.stage}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span>{task.status.replace('_', ' ')}</span>
                        </span>
                        {isUpdated(task) && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ring-1 ring-blue-200">
                            Updated
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1">
                        <Flag size={14} className={getPriorityColor(task.priority)} />
                        <span className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${task.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{task.progress_percentage}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/tasks/${task.id}`}
                          className="text-primary text-blue-800 text-xs font-semibold hover:underline"
                        >
                          View Details →
                        </Link>
                      {showChangeOrderInAllTasks(user, task) && (  <Link 
                          to={`/tasks/${task.id}/edit`}
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-xs font-bold transition shadow-sm"
                        >
                          <GitBranch size={12} />
                          update
                        </Link>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.count > 20 && (
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.count)} of {pagination.count} tasks
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.previous}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!pagination.next}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllTasks;

