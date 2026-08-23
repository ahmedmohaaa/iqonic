import { useState, useEffect } from 'react';
import {
  getMyTasks,
  getMyInternalReviews,
  getMyChangeOrders,
  selfAssignTask
} from '../../api/services/tasks';
import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import { showChangeOrderInMyTasks } from './taskPermissions';
import { useAuth } from '../../context/AuthContext';
import {
  CheckSquare,
  FileText,
  UserPlus,
  AlertCircle,
  Loader,
  CornerDownRight,
  Layers,
  Flag,
  Filter
} from 'lucide-react';
import TaskStatusModal from './components/TaskStatusModal';
import ReplacementRequestModal from './components/ReplacementRequestModal';
import InternalReviewsSection from './components/InternalReviewsSection';
import { useNavigate } from 'react-router-dom';
// ═══════════════════════════════════════════════════════════════
//  TaskCard Meta & Config
// ═══════════════════════════════════════════════════════════════

const TYPE_META = {
  MAIN_DESIGN: {
    label: 'تصميم أساسي',
    edge: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-700 ring-sky-200',
    bar: 'from-sky-400 to-sky-600'
  },
  CHANGE_ORDER: {
    label: 'أمر تغيير',
    edge: 'bg-violet-500',
    chip: 'bg-violet-50 text-violet-700 ring-violet-200',
    bar: 'from-violet-400 to-fuchsia-500'
  },
  INTERNAL_REVIEW: {
    label: 'مراجعة داخلية',
    edge: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    bar: 'from-emerald-400 to-teal-500'
  }
};

const STATUS_META = {
  UNCHARTED: { t: 'Uncharted', c: 'bg-gray-100 text-gray-700 ring-gray-200' },
  UNDER_STUDY: { t: 'Under Study', c: 'bg-blue-50 text-blue-700 ring-blue-200' },
  COMMENT: { t: 'Comment', c: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  ON_GOING: { t: 'On Going', c: 'bg-amber-50 text-amber-700 ring-amber-200' },
  COMPLETED: { t: 'Completed', c: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  APPROVED: { t: 'Approved', c: 'bg-teal-50 text-teal-700 ring-teal-200' },
  ON_HOLD: { t: 'On Hold', c: 'bg-rose-50 text-rose-700 ring-rose-200' }
};

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'On Going', value: 'ON_GOING' },
  { label: 'Under Study', value: 'UNDER_STUDY' },
  { label: 'Comment', value: 'COMMENT' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'On Hold', value: 'ON_HOLD' }
];

const getAssignedToId = (task) => {
  const rawAssignedTo = task?.assigned_to;

  if (rawAssignedTo == null) {
    return task?.assigned_to_id ?? null;
  }

  if (typeof rawAssignedTo === 'number' || typeof rawAssignedTo === 'string') {
    return rawAssignedTo;
  }

  return (
    rawAssignedTo.id ??
    rawAssignedTo.user_id ??
    task?.assigned_to_id ??
    null
  );
};

const isSameId = (firstId, secondId) => {
  return (
    firstId != null &&
    secondId != null &&
    String(firstId) === String(secondId)
  );
};

const isTaskOnHold = (task) => {
  return Boolean(task?.is_on_hold) || task?.status === 'ON_HOLD';
};

const TaskCard = ({
  task,
  index = 0,
  currentUser,
  onUpdateStatus,
  onRequestReplacement,
  onSelfAssign,
  onOpenDetails
}) => {
  const assignedToId = getAssignedToId(task);

  const isUnassigned = assignedToId == null;
  const isAssignedToMe = isSameId(assignedToId, currentUser?.id);

  const isCO = Boolean(task.is_change_order);

  const tm = TYPE_META[task.task_type] || TYPE_META.MAIN_DESIGN;
  const sm = STATUS_META[task.status] || STATUS_META.UNCHARTED;

  const pct = Math.max(0, Math.min(100, Number(task.progress_percentage) || 0));

  return (
    <div
      className="tk-rise tk-card relative bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      {/* شريط جانبي ملوّن حسب نوع المهمة */}
      <span className={`absolute inset-y-0 start-0 w-1 ${tm.edge}`} aria-hidden />

      <div className="p-5 ps-6 flex flex-col gap-3 flex-1">
        {/* الرأس: العنوان + شارة النوع + شارة الحالة */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ${tm.chip}`}
              >
                {task.task_type === 'CHANGE_ORDER' ? (
                  <GitBranch size={11} />
                ) : (
                  <Flag size={11} />
                )}
                {tm.label}
              </span>
            </div>

            <h3
              className="font-bold text-gray-800 leading-snug truncate"
              title={task.title || task.discipline_name}
            >
              {task.title || task.discipline_name}
            </h3>
          </div>

          <span
            className={`shrink-0 inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-full ring-1 ${sm.c}`}
          >
            {sm.t}
          </span>
        </div>

        {/* سياق المشروع: أمر تغيير ⇒ Revision · الأب ، وإلا الاسم العادي */}
        {isCO ? (
          <div className="rounded-lg bg-violet-50 ring-1 ring-violet-200 px-3 py-2 flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700">
              <GitBranch size={12} />
              Revision · {task.project_no}
            </span>

            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-violet-500/90">
              <CornerDownRight size={11} className="opacity-70" />
              الأب: {task.parent_project_no}
              {task.parent_project_name ? ` · ${task.parent_project_name}` : ''}
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
            <Layers size={12} className="opacity-60" />
            {task.project_name} ({task.project_no})
          </p>
        )}

        {/* الأولوية + التقدّم */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Priority</span>

            <span
              className={`font-semibold ${
                task.priority === 'URGENT' ? 'text-rose-600' : 'text-gray-800'
              }`}
            >
              {task.priority}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-gray-500 mb-1">
              <span>Progress</span>
              <span className="font-mono font-semibold text-gray-700">{pct}%</span>
            </div>

            <div className="tk-bar h-1.5 rounded-full bg-gray-100">
              <span
                className={`block h-full rounded-full bg-gradient-to-r ${tm.bar} transition-[width] duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {task.is_on_hold && (
            <div className="bg-rose-50 ring-1 ring-rose-200 p-2 rounded-md text-xs text-rose-700 flex items-start gap-1.5">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>On Hold: {task.hold_reason}</span>
            </div>
          )}
        </div>

        {/* الأفعال */}
<div className="flex flex-wrap gap-2 pt-3 mt-auto border-t border-gray-100">
  <button
    type="button"
    onClick={onOpenDetails}
    className="flex-1 inline-flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
  >
    Details
  </button>

  {isUnassigned && (
            <button
              onClick={() => onSelfAssign(task.id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              <UserPlus size={14} /> Self‑Assign
            </button>
          )}

{isAssignedToMe && task.status !== 'APPROVED' && (
  <>
    <button
      onClick={onUpdateStatus}
      className="flex-1 inline-flex items-center justify-center bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
    >
      Update Status
    </button>
    <button
      onClick={onRequestReplacement}
      className="flex-1 inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
    >
      Replacement
    </button>
  </>
)}

{/* ✅ Change Order يظهر حتى لو المهمة APPROVED */}
{showChangeOrderInMyTasks(currentUser, task) && (
  <Link
    to={`/projects/${task.project}/change-order`}
    className="flex-1 inline-flex items-center justify-center gap-1 bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
  >
    <GitBranch size={14} /> Change Order
  </Link>
)}
        </div>
      </div>
    </div>
  );
};

const MyTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('main');
  const [statusFilter, setStatusFilter] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);

  const tabs = [
    { id: 'main', label: 'Main Tasks', icon: CheckSquare, fetchFn: getMyTasks },
    { id: 'internal', label: 'Internal Design Reviews', icon: FileText, fetchFn: getMyInternalReviews },
    { id: 'change', label: 'Change Orders', icon: GitBranch, fetchFn: getMyChangeOrders }
  ];

  const fetchTasks = () => {
    if (activeTab === 'internal') {
      setTasks([]);
      setLoading(false);
      return;
    }

    const currentTab = tabs.find((tab) => tab.id === activeTab);

    if (!currentTab) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    /*
      مهم:
      الباك إند الحالي لا يقبل status=ON_HOLD داخل /api/tasks/my-tasks/
      لذلك عند اختيار ON Hold لا نرسلها كفلتر status إلى الباك إند،
      بل نجلب المهام ثم نفلترها من الفرونت إند عبر is_on_hold أو status.
    */
    const filterOnHoldLocally = statusFilter === 'ON_HOLD';

    const params =
      statusFilter && !filterOnHoldLocally
        ? { status: statusFilter }
        : {};

    currentTab
      .fetchFn(params)
      .then((res) => {
        const data = res.data.results || res.data || [];

        if (filterOnHoldLocally) {
          setTasks(data.filter(isTaskOnHold));
          return;
        }

        setTasks(data);
      })
      .catch((err) => {
        console.error(err);
        setTasks([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, [activeTab, statusFilter]);

  const handleSelfAssign = async (taskId) => {
    if (window.confirm('Are you sure you want to self-assign this task?')) {
      await selfAssignTask(taskId);
      fetchTasks();
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes tk-rise {
          to {
            opacity: 1;
            transform: none;
          }
        }

        .tk-rise {
          opacity: 0;
          transform: translateY(12px);
          animation: tk-rise .5s cubic-bezier(.2,.7,.2,1) forwards;
        }

        .tk-card {
          transition: transform .32s cubic-bezier(.2,.7,.2,1), box-shadow .32s, border-color .32s;
        }

        .tk-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 42px -24px rgba(15,23,42,.4);
        }

        .tk-bar {
          position: relative;
          overflow: hidden;
        }

        .tk-bar > span::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent);
          transform: translateX(-100%);
          animation: tk-shim 2.6s ease-in-out infinite;
        }

        @keyframes tk-shim {
          60%, 100% {
            transform: translateX(240%);
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>

        {activeTab !== 'internal' && (
          <div className="flex items-center gap-1.5 overflow-x-auto bg-gray-100 p-1.5 rounded-xl">
            <Filter size={15} className="text-gray-400 mx-1 shrink-0" />

            {STATUS_FILTERS.map((filterItem) => (
              <button
                key={filterItem.value}
                onClick={() => setStatusFilter(filterItem.value)}
                className={`whitespace-nowrap px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === filterItem.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
                }`}
              >
                {filterItem.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setStatusFilter('');
              }}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={18} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tasks List */}
      {activeTab === 'internal' ? (
        <InternalReviewsSection />
      ) : loading ? (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-12">
              No tasks found in this section.
            </p>
          ) : (
            tasks.map((task, index) => (
<TaskCard
  key={task.id}
  index={index}
  task={task}
  currentUser={user}
  onUpdateStatus={() => {
    setSelectedTask(task);
    setShowStatusModal(true);
  }}
  onRequestReplacement={() => {
    setSelectedTask(task);
    setShowReplacementModal(true);
  }}
  onSelfAssign={handleSelfAssign}
  onOpenDetails={() => navigate(`/tasks/${task.id}`)}
/>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showStatusModal && selectedTask && (
        <TaskStatusModal
          task={selectedTask}
          permission="executor"
          onClose={() => setShowStatusModal(false)}
          onSuccess={() => {
            setShowStatusModal(false);
            fetchTasks();
          }}
        />
      )}

      {showReplacementModal && selectedTask && (
        <ReplacementRequestModal
          task={selectedTask}
          onClose={() => setShowReplacementModal(false)}
          onSuccess={() => {
            setShowReplacementModal(false);
            alert('Replacement request sent to managers.');
          }}
        />
      )}
    </div>
  );
};

export default MyTasks;

