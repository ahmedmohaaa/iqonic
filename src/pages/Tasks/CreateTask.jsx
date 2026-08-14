import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createTask, getTaskFormOptions } from '../../api/services/tasks';
import { getProjects } from '../../api/services/projects';
import { getUsersList } from '../../api/services/audit';
import { getDisciplineItems } from '../../api/services/disciplines';
import { getActiveChangeOrders } from '../../api/services/changeOrders';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Plus,
  AlertCircle,
  Loader,
  GitBranch,
  Layers,
  FileText,
  Sparkles,
  ShieldCheck,
  PauseCircle,
} from 'lucide-react';

const TYPE_META = {
  MAIN_DESIGN: {
    label: 'Main Design',
    Icon: Layers,
    ring: 'ring-sky-500',
    bg: 'bg-sky-50',
    tx: 'text-sky-700',
    dot: 'bg-sky-500',
  },
  SUPERVISION: {
    label: 'Supervision',
    Icon: ShieldCheck,
    ring: 'ring-emerald-500',
    bg: 'bg-emerald-50',
    tx: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  CHANGE_ORDER: {
    label: 'Change Order',
    Icon: GitBranch,
    ring: 'ring-violet-500',
    bg: 'bg-violet-50',
    tx: 'text-violet-700',
    dot: 'bg-violet-500',
  },
  INTERNAL_REVIEW: {
    label: 'Internal Review',
    Icon: FileText,
    ring: 'ring-teal-500',
    bg: 'bg-teal-50',
    tx: 'text-teal-700',
    dot: 'bg-teal-500',
  },
};
const SUBMIT_TONE = {
  MAIN_DESIGN: 'from-sky-500 to-sky-600',
  SUPERVISION: 'from-emerald-500 to-teal-600',
  CHANGE_ORDER: 'from-violet-500 to-fuchsia-600',
  INTERNAL_REVIEW: 'from-teal-500 to-emerald-600',
};
const INTERNAL_REVIEW_STAGES = [
  { value: 'DESIGN_CRITERIA', label: 'Design Criteria' },
  { value: 'CONCEPT_DESIGN', label: 'Concept Design' },
  { value: 'SCHEMATIC_DESIGN', label: 'Schematic Design' },
  { value: 'DETAILED_DESIGN', label: 'Detailed Design' },
  { value: 'IFC_PACKAGE', label: 'IFC Package' },
  { value: 'OTHER', label: 'Other' },
];
const CreateTask = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

const {
  register,
  handleSubmit,
  watch,
  setValue,
  unregister,
  formState: { errors, isSubmitting },
} = useForm({
    defaultValues: {
      task_type: 'MAIN_DESIGN',
      priority: 'MEDIUM',
      status: 'UNCHARTED',
      progress_percentage: 0,
      duration_days: 0,
      title: '',
      description: '',
      is_on_hold: false,
      hold_reason: '',
      hold_date: '',
    },
  });

  const [baseProjects, setBaseProjects] = useState([]);
  const [changeOrders, setChangeOrders] = useState([]);
  const [legacyEngineers, setLegacyEngineers] = useState([]);

  const [typedProjects, setTypedProjects] = useState([]);
  const [filteredEngineers, setFilteredEngineers] = useState([]);
  const [canAssignOthers, setCanAssignOthers] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
const [allowedTaskTypes, setAllowedTaskTypes] = useState(
  ['MAIN_DESIGN', 'SUPERVISION', 'CHANGE_ORDER', 'INTERNAL_REVIEW']
);
  const taskType = watch('task_type');
  const selectedStage = watch('stage');
  const selectedReviewStage = watch('internal_review_stage');
  const selectedProject = watch('project');
  const isOnHold = watch('is_on_hold');
  const holdDateValue = watch('hold_date');

  const isMain = taskType === 'MAIN_DESIGN';
  const isSupervision = taskType === 'SUPERVISION';
  const isCO = taskType === 'CHANGE_ORDER';
  const isInternal = taskType === 'INTERNAL_REVIEW';

  const isEngineerOrDraftsman =
    user?.role === 'ENGINEER' || user?.role === 'DRAFTSMAN';

const projectOptions = isCO ? changeOrders : typedProjects;

const assigneeOptions =
  isMain || isSupervision || isInternal ? filteredEngineers : legacyEngineers;

const showAssignSelect =
  isMain || isSupervision || isInternal ? canAssignOthers : !isEngineerOrDraftsman;

const shouldSelfAssign =
  isMain || isSupervision || isInternal ? !canAssignOthers : isEngineerOrDraftsman;

const showDiscipline =
  !isSupervision &&
  !isInternal &&
  Boolean(selectedStage) &&
  selectedStage !== 'OTHER';

  useEffect(() => {
    Promise.all([
      getProjects({ is_active: 'true' }),
      getUsersList(),
      getActiveChangeOrders(),
    ])
      .then(([projRes, usersRes, coRes]) => {
        const projData = projRes?.data?.results || projRes?.data || [];
        const usersData = usersRes?.data?.results || usersRes?.data || [];
        const coData = coRes?.data?.results || coRes?.data || [];

        setBaseProjects(Array.isArray(projData) ? projData : []);
        setLegacyEngineers(Array.isArray(usersData) ? usersData : []);
        setChangeOrders(Array.isArray(coData) ? coData : []);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load initial data.');
      })
      .finally(() => setLoading(false));
  }, []);

useEffect(() => {
  setValue('project', '');
  setValue('assigned_to', '');
  setValue('stage', '');
  setValue('discipline', '');
  setValue('internal_review_stage', '');
  setValue('work_type', '');
  setValue('title', '');
  setValue('description', '');
  setValue('is_on_hold', false);
  setValue('hold_reason', '');
  setValue('hold_date', '');
  setDisciplines([]);
}, [taskType, setValue]);

useEffect(() => {
  if (!showDiscipline) {
    unregister('discipline');
  }
}, [showDiscipline, unregister]);

useEffect(() => {
  if (!isMain && !isSupervision && !isInternal) {
    setTypedProjects([]);
    setFilteredEngineers([]);
    setCanAssignOthers(false);
    return;
  }

  const params = { task_type: taskType };

  if ((isSupervision || isInternal) && selectedProject) {
    params.project_id = selectedProject;
  }

  setOptionsLoading(true);

  getTaskFormOptions(params)
    .then((res) => {
      setTypedProjects(res.data.projects || []);
      setFilteredEngineers(res.data.engineers || []);
      setCanAssignOthers(Boolean(res.data.can_assign_others));

      if (res.data.allowed_task_types) {
        setAllowedTaskTypes(res.data.allowed_task_types);

        if (!res.data.allowed_task_types.includes(taskType)) {
          setValue('task_type', res.data.allowed_task_types[0]);
        }
      }
    })
    .catch(() => {
      setTypedProjects([]);
      setFilteredEngineers([]);
      setCanAssignOthers(false);
    })
    .finally(() => setOptionsLoading(false));
}, [taskType, selectedProject, isMain, isSupervision, isInternal, setValue]);
  useEffect(() => {
    if (shouldSelfAssign && user?.id) {
      setValue('assigned_to', user.id);
    } else if (!showAssignSelect && (isMain || isSupervision)) {
      setValue('assigned_to', '');
    }
  }, [shouldSelfAssign, showAssignSelect, user?.id, isMain, isSupervision, setValue]);

useEffect(() => {
  if ((isSupervision || isInternal) && canAssignOthers) {
    setValue('assigned_to', '');
  }
}, [selectedProject, isSupervision, isInternal, canAssignOthers, setValue]);

  useEffect(() => {
    if (isSupervision && isOnHold && !holdDateValue) {
      setValue('hold_date', new Date().toISOString().slice(0, 10));
    }
  }, [isSupervision, isOnHold, holdDateValue, setValue]);

useEffect(() => {
  setDisciplines([]);

  if (isSupervision || isInternal) {
    return;
  }

  if (!selectedStage || selectedStage === 'OTHER') {
    return;
  }

  getDisciplineItems({ stage: selectedStage })
    .then((res) => {
      const responseData = res?.data || res;
      const items = responseData?.results || responseData;
      setDisciplines(Array.isArray(items) ? items : []);
    })
    .catch(() => setDisciplines([]));
}, [selectedStage, isInternal, isSupervision]);

  const onSubmit = async (data) => {
    setError('');

const payload = { ...data };

if (isSupervision) {
  delete payload.stage;
  delete payload.discipline;
  delete payload.internal_review_stage;
  delete payload.work_type;

  payload.is_on_hold = Boolean(payload.is_on_hold);

  if (!payload.is_on_hold) {
    delete payload.hold_reason;
    delete payload.hold_date;
  }
} else {
  delete payload.is_on_hold;
  delete payload.hold_reason;
  delete payload.hold_date;
}
if (isInternal) {
  const reviewStageName = payload.internal_review_stage;

  delete payload.internal_review_stage;
  delete payload.stage;
  delete payload.discipline;

  payload.internal_review_stage_name = reviewStageName || 'OTHER';
}

if (isMain && payload.stage === 'OTHER') {
  delete payload.stage;
  delete payload.discipline;
}
if (!showAssignSelect && user?.id) {
  payload.assigned_to = user.id;
}
    try {
      const response = await createTask(payload);
      navigate(`/tasks/${response?.data?.id || response?.id}`);
    } catch (err) {
      const backendError =
        err.response?.data?.detail ||
        err.response?.data?.assigned_to?.[0] ||
        err.response?.data?.project?.[0] ||
        err.response?.data?.hold_reason?.[0] ||
        'Failed to create task. Please check your inputs.';

      setError(backendError);
      console.error(err.response?.data);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-violet-600" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-rose-500">
        Please log in to create tasks.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f6f7f9] text-gray-800 overflow-hidden">
      <style>{`
        .ct-ambient{
          position:absolute;
          inset:0;
          pointer-events:none;
          background:
            radial-gradient(40% 30% at 88% -4%, rgba(124,58,237,.10), transparent 60%),
            radial-gradient(36% 28% at -2% 102%, rgba(14,165,233,.08), transparent 60%),
            linear-gradient(rgba(15,23,42,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,23,42,.035) 1px, transparent 1px);
          background-size:auto,auto,40px 40px,40px 40px;
        }
        .ct-rise{
          opacity:0;
          transform:translateY(14px);
          animation:ct-rise .55s cubic-bezier(.2,.7,.2,1) forwards;
        }
        @keyframes ct-rise{
          to{
            opacity:1;
            transform:none;
          }
        }
        .ct-type{
          transition:transform .25s cubic-bezier(.2,.7,.2,1), box-shadow .25s, border-color .25s, background .25s;
        }
        .ct-type:hover{
          transform:translateY(-3px);
        }
      `}</style>

      <div className="ct-ambient" aria-hidden />

      <div className="relative max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-7 ct-rise">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:-translate-x-0.5 transition shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-[.2em] text-violet-500">
              New Task
            </span>

            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Create New Task
            </h1>

            <p className="text-sm text-gray-500">
              Create main design, supervision, change order, or internal review tasks.
            </p>
          </div>
        </div>

        {error && (
          <div className="ct-rise mb-5 bg-rose-50 ring-1 ring-rose-200 p-4 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="ct-rise bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-7"
          style={{ animationDelay: '.08s' }}
        >
          {/* Task Type */}
       {/* Task Type — يعرض فقط الأنواع المسموحة للمستخدم */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
    Task Type *
  </label>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {Object.entries(TYPE_META)
      .filter(([value]) => allowedTaskTypes.includes(value))
      .map(([value, meta]) => {
        const active = taskType === value;
        return (
          <label key={value} className="relative cursor-pointer">
            <input
              type="radio"
              value={value}
              {...register('task_type', { required: true })}
              className="peer sr-only"
            />
            <div
              className={`ct-type p-4 rounded-xl border-2 bg-white flex items-center gap-3 ${
                active
                  ? `${meta.ring} ${meta.bg} shadow-md`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span
                className={`grid place-items-center w-9 h-9 rounded-lg ${
                  active ? meta.bg : 'bg-gray-100'
                } ${active ? meta.tx : 'text-gray-400'}`}
              >
                <meta.Icon size={18} />
              </span>
              <span
                className={`text-sm font-bold ${
                  active ? meta.tx : 'text-gray-600'
                }`}
              >
                {meta.label}
              </span>
              {active && (
                <span className={`ms-auto w-2 h-2 rounded-full ${meta.dot} animate-pulse`} />
              )}
            </div>
          </label>
        );
      })}
  </div>
</div>
          {isSupervision ? (
            <>
              {/* Supervision Project + Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Supervision Project *
                  </label>

                  <select
                    {...register('project', { required: true })}
                    disabled={optionsLoading}
                    className="w-full border border-emerald-300 bg-emerald-50/30 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none transition"
                  >
                    <option value="">— Select Supervision Project —</option>

                    {projectOptions.length === 0 ? (
                      <option value="" disabled>
                        No supervision projects available
                      </option>
                    ) : (
                      projectOptions.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project_no} — {project.name}
                        </option>
                      ))
                    )}
                  </select>

                  {errors.project && (
                    <span className="text-rose-500 text-xs">Required</span>
                  )}
                </div>

                {showAssignSelect ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Assign To *
                    </label>

                    <select
                      {...register('assigned_to', { required: true })}
                      disabled={optionsLoading}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-300 outline-none transition"
                    >
                      <option value="">— Select Supervision Engineer —</option>

                      {assigneeOptions.length === 0 ? (
                        <option value="" disabled>
                          No supervision engineers available
                        </option>
                      ) : (
                        assigneeOptions.map((engineer) => (
                          <option key={engineer.id} value={engineer.id}>
                            {engineer.first_name} {engineer.last_name} (
                            {engineer.department || 'General'})
                          </option>
                        ))
                      )}
                    </select>

                    {errors.assigned_to && (
                      <span className="text-rose-500 text-xs">Required</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-end">
                    <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                      Assigned to you automatically
                    </div>
                  </div>
                )}
              </div>

              {/* Task Name + Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Task Name *
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Site inspection for Block A"
                    {...register('title', { required: isSupervision })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-300 outline-none transition"
                  />

                  {errors.title && (
                    <span className="text-rose-500 text-xs">Required</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Priority *
                  </label>

                  <select
                    {...register('priority', { required: true })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-300 outline-none transition"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Task Description
                </label>

                <textarea
                  rows={4}
                  placeholder="Write the supervision task details..."
                  {...register('description')}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-300 outline-none transition"
                />
              </div>

              {/* Start Date + On Hold */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Start Date
                  </label>

                  <input
                    type="date"
                    {...register('start_date')}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-300 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Hold Status
                  </label>

                  <label className="flex items-center gap-3 border border-gray-300 rounded-xl p-2.5 cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="checkbox"
                      {...register('is_on_hold')}
                      className="w-4 h-4 accent-emerald-600"
                    />

                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <PauseCircle size={16} className="text-rose-500" />
                      On Hold
                    </span>
                  </label>
                </div>
              </div>

              {/* Hold Reason + Hold Date */}
              {isOnHold && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                  <div>
                    <label className="block text-sm font-semibold text-rose-700 mb-1.5">
                      Hold Reason *
                    </label>

                    <textarea
                      rows={2}
                      placeholder="Why is this task on hold?"
                      {...register('hold_reason', {
                        required: isSupervision && isOnHold,
                      })}
                      className="w-full border border-rose-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-300 outline-none transition"
                    />

                    {errors.hold_reason && (
                      <span className="text-rose-500 text-xs">Required</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-rose-700 mb-1.5">
                      Hold Date *
                    </label>

                    <input
                      type="date"
                      {...register('hold_date', {
                        required: isSupervision && isOnHold,
                      })}
                      className="w-full border border-rose-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-300 outline-none transition"
                    />

                    {errors.hold_date && (
                      <span className="text-rose-500 text-xs">Required</span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Project + Stage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {isCO
                      ? 'Change Order Target (Sub‑Project) *'
                      : isInternal
                        ? 'Supervision Project *'
                        : 'Project Number *'}
                  </label>

                  <select
                    {...register('project', { required: true })}
                    disabled={optionsLoading && (isMain || isSupervision || isInternal)}
                    className={`w-full border rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none transition ${
                      isCO ? 'border-violet-300 bg-violet-50/40' : 'border-gray-300'
                    }`}
                  >
                    <option value="">
                      {isCO ? '— Select Revision —' : '— Select Project Number —'}
                    </option>

{projectOptions.map((project) => (
  <option key={project.id} value={project.id}>
    {isCO
      ? `${project.project_no} ${
          project.revision_number ? `(${project.revision_number})` : ''
        } ← parent: ${project.parent_project_no}`
      : isInternal
        ? `${project.project_no} — ${project.name}`
        : `${project.project_no}${
            project.application_no ? ` · App:${project.application_no}` : ''
          }${project.pin_no ? ` · PIN:${project.pin_no}` : ''}`}
  </option>

                    ))}
                  </select>

                  {errors.project && (
                    <span className="text-rose-500 text-xs">Required</span>
                  )}

                  {isCO && changeOrders.length === 0 && (
                    <p className="mt-1.5 text-amber-600 text-xs inline-flex items-center gap-1">
                      <Sparkles size={12} /> No active change orders yet.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {isInternal ? 'Review Stage *' : 'Stage *'}
                  </label>

                  {isInternal ? (
                    <select
  {...register('internal_review_stage', {
    required: isInternal,
  })}
  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-300 outline-none transition"
>
  <option value="">— Select Review Stage —</option>

  {INTERNAL_REVIEW_STAGES.map((stage) => (
    <option key={stage.value} value={stage.value}>
      {stage.label}
    </option>
  ))}
</select>
                  ) : (
<select
  {...register('stage', { required: !isInternal })}
  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none transition"
>
  <option value="">— Select Stage —</option>
  <option value="CONCEPT">Concept Design</option>
  <option value="DC1">DC1</option>
  <option value="DC2">DC2</option>
  <option value="TENDER">Tender Documents</option>

  {isMain && (
    <option value="OTHER">Other</option>
  )}
</select>
                  )}

                  {((isInternal && errors.internal_review_stage) ||
                    (!isInternal && errors.stage)) && (
                    <span className="text-rose-500 text-xs">Required</span>
                  )}
                </div>
              </div>

              {/* Title + Work Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Task Title
                  </label>

                  <input
                    {...register('title')}
                    placeholder="e.g. Revise Electrical Layout — Rev1"
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-300 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Work Type
                  </label>

                  <select
                    {...register('work_type')}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none transition"
                  >
                    <option value="">— Select Work Type —</option>
                    <option value="DESIGN">Design</option>
                    <option value="DESIGN_REVIEW">Design Review</option>
                    <option value="DRAFTING">Drafting</option>
                    <option value="CALCULATION">Calculation</option>
                    <option value="REPORT">Report</option>
                    <option value="RENDERING_3D">3D Rendering</option>
                    <option value="PRESENTATION">Presentation</option>
                    <option value="PRINTING">Printing</option>
                  </select>
                </div>
              </div>

              {/* Discipline + Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {showDiscipline ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Discipline *
                    </label>

                    <select
                      {...register('discipline', { required: true })}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none transition"
                    >
                      <option value="">— Select Discipline —</option>

                      {Array.isArray(disciplines) && disciplines.length > 0 ? (
                        disciplines.map((discipline) => (
                          <option key={discipline.id} value={discipline.id}>
                            {discipline.name}
                            {discipline.department_display
                              ? ` - ${discipline.department_display}`
                              : ''}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No disciplines found
                        </option>
                      )}
                    </select>

                    {errors.discipline && (
                      <span className="text-rose-500 text-xs">Required</span>
                    )}
                  </div>
                ) : (
                  <div className="hidden md:block" />
                )}

                {showAssignSelect ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Assign To *
                    </label>

                    <select
                      {...register('assigned_to', { required: true })}
                      disabled={optionsLoading && (isMain || isSupervision || isInternal)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none transition"
                    >
                      <option value="">— Select Engineer —</option>

                      {assigneeOptions.map((engineer) => (
                        <option key={engineer.id} value={engineer.id}>
                          {engineer.first_name} {engineer.last_name} (
                          {engineer.department || 'General'}){' '}
                          {engineer.role ? `[${engineer.role}]` : ''}
                        </option>
                      ))}
                    </select>

                    {errors.assigned_to && (
                      <span className="text-rose-500 text-xs">Required</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-end">
                    <div className="w-full rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
                      Assigned to you automatically
                    </div>
                  </div>
                )}
              </div>

              {/* Priority + Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Priority *
                  </label>

                  <select
                    {...register('priority', { required: true })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none transition"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Start Date
                  </label>

                  <input
                    type="date"
                    {...register('start_date')}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-300 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Duration (Days)
                  </label>

                  <input
                    type="number"
                    {...register('duration_days')}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-300 outline-none transition"
                  />
                </div>
              </div>
            </>
          )}
{(isInternal || isMain) && (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      Task Description
    </label>
    <textarea
      rows={4}
      placeholder={
        isInternal
          ? 'Write the internal review task details...'
          : 'Write the main design task details...'
      }
      {...register('description')}
      className={`w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none transition focus:ring-2 ${
        isInternal
          ? 'focus:ring-teal-300'
          : 'focus:ring-sky-300'
      }`}
    />
  </div>
)}
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 bg-gray-50 hover:bg-gray-100 transition font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-white font-bold inline-flex items-center gap-2 shadow-md bg-gradient-to-r ${SUBMIT_TONE[taskType]} hover:brightness-105 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0`}
            >
              <Plus size={18} />
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;

