import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTaskDetails, getAssignmentHistory } from '../../api/services/tasks';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  User,
  Calendar,
  Flag,
  Clock,
  AlertCircle,
  CheckCircle,
  PauseCircle,
  Edit,
  History,
  GitBranch
} from 'lucide-react';
import TaskStatusModal from './components/TaskStatusModal';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
    fetchAssignmentHistory();
  }, [id]);

  const fetchTaskDetails = async () => {
    setLoading(true);

    try {
      const res = await getTaskDetails(id);
      setTask(res.data);
    } catch (err) {
      console.error('Failed to fetch task', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentHistory = async () => {
    try {
      const res = await getAssignmentHistory(id);
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const assignedToId =
    task?.assigned_to?.id ??
    task?.assigned_to?.user_id ??
    task?.assigned_to_id ??
    (typeof task?.assigned_to === 'number' || typeof task?.assigned_to === 'string'
      ? task.assigned_to
      : null);

  const isTaskExecutor = Boolean(
    user?.id &&
    assignedToId != null &&
    String(assignedToId) === String(user.id)
  );

  const canHoldByRole = [
    'GM',
    'AGM',
    'DESIGN_MGR',
    'SUP_MGR',
    'PM',
    'SENIOR_ENG'
  ].includes(user?.role);

  const statusPermission = !task
    ? 'none'
    : isTaskExecutor
      ? 'executor'
      : canHoldByRole
        ? 'hold-only'
        : 'none';

  const canEdit = statusPermission !== 'none';

  const getStatusColor = (status) => {
    const colors = {
      UNCHARTED: 'bg-gray-100 text-gray-800',
      UNDER_STUDY: 'bg-blue-100 text-blue-800',
      COMMENT: 'bg-yellow-100 text-yellow-800',
      ON_GOING: 'bg-indigo-100 text-indigo-800',
      ON_HOLD: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-green-100 text-green-800',
      APPROVED: 'bg-purple-100 text-purple-800',
    };

    return colors[status] || 'bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-green-100 text-green-800 border-green-200',
    };

    return colors[priority] || 'bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20 text-red-500">
        Task not found
      </div>
    );
  }

  const progressValue = Math.min(
    100,
    Math.max(0, Number(task.progress_percentage) || 0)
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">
                {task.title || task.discipline_name}
              </h1>

              {task.updated_at &&
                task.created_at &&
                new Date(task.updated_at).getTime() !== new Date(task.created_at).getTime() && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ring-1 ring-blue-200">
                    Updated
                  </span>
                )}
            </div>

            <p className="text-sm text-gray-500">
              Task #{task.id} • {task.task_type_display || task.task_type}
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center"
          >
            <Edit size={18} className="mr-2" />
            {statusPermission === 'hold-only' ? 'On Hold' : 'Update Status'}
          </button>
        )}
      </div>

      {/* Task Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Project */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase">Project</p>

          <Link
            to={`/projects/${task.project_id}`}
            className="font-semibold text-gray-800 text-primary"
          >
            {task.project_name}
          </Link>

          <p className="text-xs text-gray-500 font-mono">{task.project_no}</p>
        </div>

        {/* Assigned To */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase">Assigned To</p>

          <div className="flex items-center space-x-2 mt-1">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>

            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {task.assigned_to_name || 'Unassigned'}
              </p>

              <p className="text-xs text-gray-500">
                {task.assigned_to_department || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase">Status</p>

          <span
            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusColor(task.status)}`}
          >
            {task.status === 'COMPLETED' || task.status === 'APPROVED' ? (
              <CheckCircle size={12} />
            ) : task.status === 'ON_HOLD' ? (
              <PauseCircle size={12} />
            ) : task.status === 'ON_GOING' ? (
              <Clock size={12} />
            ) : (
              <AlertCircle size={12} />
            )}

            <span>{task.status?.replace('_', ' ') || 'Unknown'}</span>
          </span>

          {task.status_date && (
            <p className="text-xs text-gray-500 mt-1">
              Since: {task.status_date}
            </p>
          )}
        </div>

        {/* Priority */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
          <p className="text-xs text-gray-500 uppercase">Priority</p>

          <span
            className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-semibold mt-1 border ${getPriorityColor(task.priority)}`}
          >
            <Flag size={12} />
            <span>{task.priority}</span>
          </span>
        </div>
      </div>

      {/* Progress & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Progress
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Completion</span>
                <span className="font-bold text-primary">{progressValue}%</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressValue}%` }}
                ></div>
              </div>
            </div>

            {/* Timeline Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-500">Start Date</p>

                <p className="text-sm font-semibold text-gray-800 flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {task.start_date || 'Not set'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Duration</p>

                <p className="text-sm font-semibold text-gray-800">
                  {task.duration_days ?? 0} days
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">End Date</p>

                <p className="text-sm font-semibold text-gray-800 flex items-center">
                  <CheckCircle size={14} className="mr-1" />
                  {task.end_date || 'Not completed'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Approval Date</p>

                <p className="text-sm font-semibold text-gray-800 flex items-center">
                  <CheckCircle size={14} className="mr-1" />
                  {task.approval_date || 'Not approved'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* On Hold Status */}
        {task.is_on_hold && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
              <PauseCircle className="mr-2" size={20} />
              On Hold
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-red-600">Hold Date</p>
                <p className="text-sm font-semibold text-red-800">
                  {task.hold_date}
                </p>
              </div>

              <div>
                <p className="text-xs text-red-600">Reason</p>
                <p className="text-sm text-red-800">
                  {task.hold_reason}
                </p>
              </div>

              {task.expected_resume_date && (
                <div>
                  <p className="text-xs text-red-600">Expected Resume</p>
                  <p className="text-sm font-semibold text-red-800">
                    {task.expected_resume_date}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
{/* Description */}
{task.description?.trim() && (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h2 className="text-lg font-semibold text-gray-800 mb-3">
      Description
    </h2>
    <p
      dir="auto"
      className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
    >
      {task.description}
    </p>
  </div>
)}
      {/* Assignment History */}
      {history.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <History className="mr-2 text-gray-600" size={20} />
            Assignment History
          </h2>

          <div className="space-y-3">
            {history.map((record, idx) => (
              <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <GitBranch size={14} className="text-gray-400" />

                    <span className="text-sm font-semibold text-gray-800">
                      {record.old_engineer_name} → {record.new_engineer_name}
                    </span>
                  </div>

                  <span className="text-xs text-gray-500">
                    {record.created_at}
                  </span>
                </div>

                <p className="text-sm text-gray-600">
                  {record.reason_for_change}
                </p>

                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                  <span>Days worked: {record.days_worked}</span>
                  <span>Status at handover: {record.status_at_handover}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && canEdit && (
        <TaskStatusModal
          task={task}
          permission={statusPermission}
          onClose={() => setShowStatusModal(false)}
          onSuccess={() => {
            setShowStatusModal(false);
            fetchTaskDetails();
          }}
        />
      )}
    </div>
  );
};

export default TaskDetails;


{/* Assignment History */}
