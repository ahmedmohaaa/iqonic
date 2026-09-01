import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { updateTask, getTaskDetails, getTaskFormOptions } from '../../api/services/tasks';
import { getProjects, getGlobalFilterProjects } from '../../api/services/projects';
import { getUsersList } from '../../api/services/audit';
import { getDisciplineItems } from '../../api/services/disciplines';
import { getActiveChangeOrders } from '../../api/services/changeOrders';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Loader,
  GitBranch,
  Layers,
  FileText,
  Sparkles,
  ShieldCheck,
  PauseCircle,
  Search,
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
 /* CHANGE_ORDER: {
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
  },*/
};

const SUBMIT_TONE = {
  MAIN_DESIGN: 'from-sky-500 to-sky-600',
  SUPERVISION: 'from-emerald-500 to-teal-600',
  CHANGE_ORDER: 'from-violet-500 to-fuchsia-600',
  INTERNAL_REVIEW: 'from-teal-500 to-emerald-600',
};

const INTERNAL_REVIEW_STAGES = [
  { value: 'DC1', label: 'DC1' },
  { value: 'DC2', label: 'DC2' },
  { value: 'DESIGN_CRITERIA', label: 'Design Criteria' },
  { value: 'CONCEPT_DESIGN', label: 'Concept Design' },
  { value: 'SCHEMATIC_DESIGN', label: 'Schematic Design' },
  { value: 'DETAILED_DESIGN', label: 'Detailed Design' },
  { value: 'IFC_PACKAGE', label: 'IFC Package' },
  { value: 'OTHER', label: 'Other' },
];

const EXTRA_ASSIGN = {
  'mohammad.mostafa': ['vicky.jr', 'mohammad.alqadi', 'ahmad.alqadi', 'mohammad.mostafa'],
};

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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
      end_date: '',
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [allowedTaskTypes, setAllowedTaskTypes] = useState(
    ['MAIN_DESIGN', 'SUPERVISION', 'CHANGE_ORDER', 'INTERNAL_REVIEW']
  );

  const [supervisionReviewProjects, setSupervisionReviewProjects] = useState([]);

  const [supervisionProjectSearch, setSupervisionProjectSearch] = useState('');
  const [mainProjectSearch, setMainProjectSearch] = useState('');
  const [optionBProjectSearch, setOptionBProjectSearch] = useState('');

  useEffect(() => {
    getGlobalFilterProjects({ scope: 'SUPERVISION', internal_review: 'true', is_active: 'true' })
      .then((res) => setSupervisionReviewProjects(res?.data?.results || res?.data || []))
      .catch(() => setSupervisionReviewProjects([]));
  }, []);

  const taskType = watch('task_type');
  const selectedStage = watch('stage');
  const selectedReviewStage = watch('internal_review_stage');
  const selectedProject = watch('project');
  const isOnHold = watch('is_on_hold');
  const holdDateValue = watch('hold_date');
  const startDateValue = watch('start_date');
  const durationDaysValue = watch('duration_days');

  const selectedSupervisionProject = watch('supervision_project');
  const selectedOptionBReviewStage = watch('review_stage');

  const computedEndDate = useMemo(() => {
    if (!startDateValue || !durationDaysValue || Number(durationDaysValue) <= 0) return '';
    const start = new Date(startDateValue + 'T00:00:00');
    start.setDate(start.getDate() + Number(durationDaysValue));
    return start.toISOString().slice(0, 10);
  }, [startDateValue, durationDaysValue]);

  const isMain = taskType === 'MAIN_DESIGN';
  const isSupervision = taskType === 'SUPERVISION';
  const isCO = taskType === 'CHANGE_ORDER';
  const isInternal = taskType === 'INTERNAL_REVIEW';

  const isEngineerOrDraftsman =
    user?.role === 'ENGINEER' || user?.role === 'DRAFTSMAN';

  const projectOptions = isCO ? changeOrders : typedProjects;

  // ✅ تم إزالة شرط internal_design_review_required من هنا لكي تظهر مشاريع الإشراف العادية أيضاً
  const filteredSupervisionProjects = projectOptions.filter(p => 
    p.name?.toLowerCase().includes(supervisionProjectSearch.toLowerCase()) || 
    p.project_no?.toLowerCase().includes(supervisionProjectSearch.toLowerCase())
  );

  const filteredMainProjects = projectOptions.filter(p => 
    p.name?.toLowerCase().includes(mainProjectSearch.toLowerCase()) || 
    p.project_no?.toLowerCase().includes(mainProjectSearch.toLowerCase()) ||
    (p.parent_project_no && p.parent_project_no.toLowerCase().includes(mainProjectSearch.toLowerCase()))
  );

  const filteredOptionBProjects = supervisionReviewProjects.filter(p => 
    p.name?.toLowerCase().includes(optionBProjectSearch.toLowerCase()) || 
    p.project_no?.toLowerCase().includes(optionBProjectSearch.toLowerCase())
  );

  const extraAssignees = isMain
    ? (EXTRA_ASSIGN[user?.username] || [])
        .map((uname) => legacyEngineers.find((e) => e.username === uname))
        .filter(Boolean)
    : [];

  const assigneeOptions =
    isMain || isSupervision || isInternal
      ? [
          ...filteredEngineers,
          ...extraAssignees.filter((e) => !filteredEngineers.some((f) => f.id === e.id)),
        ]
      : legacyEngineers;

  const showAssignSelect =
    isMain || isSupervision || isInternal
      ? canAssignOthers || extraAssignees.length > 0
      : !isEngineerOrDraftsman;

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
      getTaskDetails(id),
    ])
      .then(([projRes, usersRes, coRes, taskRes]) => {
        const projData = projRes?.data?.results || projRes?.data || [];
        const usersData = usersRes?.data?.results || usersRes?.data || [];
        const coData = coRes?.data?.results || coRes?.data || [];
        const taskData = taskRes?.data || taskRes;

        setBaseProjects(Array.isArray(projData) ? projData : []);
        setLegacyEngineers(Array.isArray(usersData) ? usersData : []);
        setChangeOrders(Array.isArray(coData) ? coData : []);

        const LEGACY_WORK_TYPE = {
          'Design': 'DESIGN', 'Design Review': 'DESIGN_REVIEW',
          'drafting': 'DRAFTING', 'Drafting': 'DRAFTING',
          'calculation': 'CALCULATION', 'Calculation': 'CALCULATION',
          'Report': 'REPORT', '3D rendering': 'RENDERING_3D',
          '3D Rendering': 'RENDERING_3D', 'presentation': 'PRESENTATION',
          'Presentation': 'PRESENTATION', 'printing': 'PRINTING', 'Printing': 'PRINTING',
        };

        let reviewStageVal = '';
        if (taskData.internal_review_stage) {
            if (typeof taskData.internal_review_stage === 'object') {
                reviewStageVal = taskData.internal_review_stage.stage_name || taskData.internal_review_stage.id;
            } else {
                reviewStageVal = taskData.internal_review_stage;
            }
        } else if (taskData.internal_review_stage_name) {
            reviewStageVal = taskData.internal_review_stage_name;
        }

        const resetData = {
          ...taskData,
          work_type: LEGACY_WORK_TYPE[taskData.work_type] || taskData.work_type || '',
          project: taskData.project_id || taskData.project,
          assigned_to: taskData.assigned_to_id || taskData.assigned_to,
          discipline: taskData.discipline_id || taskData.discipline,
          internal_review_stage: reviewStageVal,
          start_date: taskData.start_date || '',
          hold_date: taskData.hold_date || '',
          end_date: taskData.end_date || '',
        };

        if (taskData.task_type === 'MAIN_DESIGN' && reviewStageVal) {
            resetData.supervision_project = resetData.project;
            resetData.review_stage = reviewStageVal;
            resetData.project = '';
            resetData.stage = '';
        }
        
        reset(resetData);
        setLoading(false); // ✅ الإصلاح الجوهري: إخفاء مؤشر التحميل بعد جلب البيانات
        setTimeout(() => setIsInitialLoad(false), 100);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load task data.');
        setLoading(false);
      });
  }, [id, reset]);

  useEffect(() => {
    if (isInitialLoad) return;
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
    setValue('end_date', '');
    setValue('supervision_project', '');
    setValue('review_stage', '');
    setDisciplines([]);
    setSupervisionProjectSearch('');
    setMainProjectSearch('');
    setOptionBProjectSearch('');
  }, [taskType, setValue, isInitialLoad]);

  useEffect(() => {
    if (!isMain) return;
    if (selectedProject || selectedStage) {
      if (selectedSupervisionProject) setValue('supervision_project', '');
      if (selectedOptionBReviewStage) setValue('review_stage', '');
    }
  }, [selectedProject, selectedStage, isMain, selectedSupervisionProject, selectedOptionBReviewStage, setValue]);

  useEffect(() => {
    if (!isMain) return;
    if (selectedSupervisionProject || selectedOptionBReviewStage) {
      if (selectedProject) setValue('project', '');
      if (selectedStage) setValue('stage', '');
    }
  }, [selectedSupervisionProject, selectedOptionBReviewStage, isMain, selectedProject, selectedStage, setValue]);

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
  }, [taskType, selectedProject, isMain, isSupervision, isInternal, setValue, isInitialLoad]);

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
    if (isSupervision || isInternal) return;
    if (!selectedStage || selectedStage === 'OTHER') return;

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

    const hasA = !!(data.project || data.stage);
    const hasB = !!(data.supervision_project || data.review_stage);
    
    if (isMain) {
      if (data.project && !data.stage) return setError('Stage is required when Project Number is selected.');
      if (data.stage && !data.project) return setError('Project Number is required when Stage is selected.');
      if (data.supervision_project && !data.review_stage) return setError('Review Stage is required when Supervision Project is selected.');
      if (data.review_stage && !data.supervision_project) return setError('Supervision Project is required when Review Stage is selected.');
      if (hasA && hasB) return setError('Please use either Project Number + Stage OR Supervision Project + Review Stage, not both.');
      if (!hasA && !hasB) return setError('Please provide either Project Number + Stage OR Supervision Project + Review Stage.');
    }

    const payload = { ...data };

    if (computedEndDate) {
      payload.end_date = computedEndDate;
    }

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

    if (!payload.project) delete payload.project;
    if (!payload.stage) delete payload.stage;
    if (!payload.supervision_project) delete payload.supervision_project;
    if (!payload.review_stage) delete payload.review_stage;
    if (!payload.end_date) delete payload.end_date;

    if (!showAssignSelect && user?.id) {
      payload.assigned_to = user.id;
    }

    try {
      await updateTask(id, payload);
      navigate(`/tasks/${id}`);
    } catch (err) {
      const backendError =
        err.response?.data?.detail ||
        err.response?.data?.assigned_to?.[0] ||
        err.response?.data?.project?.[0] ||
        err.response?.data?.hold_reason?.[0] ||
        'Failed to update task. Please check your inputs.';

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
        Please log in to edit tasks.
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
              Edit Task
            </span>

            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Update Task
            </h1>
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
          <div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Supervision Project *
                  </label>

                  <div className="relative mb-1.5">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={supervisionProjectSearch}
                      onChange={(e) => setSupervisionProjectSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition"
                    />
                  </div>

                  <select
                    {...register('project', { required: !isMain })}
                    disabled={optionsLoading}
                    className="w-full border border-emerald-300 bg-emerald-50/30 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none transition"
                  >
                    <option value="">— Select Supervision Project —</option>

                    {filteredSupervisionProjects.length === 0 ? (
                      <option value="" disabled>
                        No projects found
                      </option>
                    ) : (
                      filteredSupervisionProjects.map((project) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {isCO
                      ? 'Change Order Target (Sub‑Project) *'
                      : isInternal
                        ? 'Supervision Project *'
                        : 'Project Number *'}
                  </label>

                  <div className="relative mb-1.5">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={mainProjectSearch}
                      onChange={(e) => setMainProjectSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:ring-2 focus:ring-violet-200 focus:border-violet-300 outline-none transition"
                    />
                  </div>

                  <select
                    {...register('project', { required: !isMain })}
                    disabled={optionsLoading && (isMain || isSupervision || isInternal)}
                    className={`w-full border rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none transition ${
                      isCO ? 'border-violet-300 bg-violet-50/40' : 'border-gray-300'
                    }`}
                  >
                    <option value="">
                      {isCO ? '— Select Revision —' : '— Select Project Number —'}
                    </option>

                    {filteredMainProjects.length === 0 ? (
                      <option value="" disabled>No projects found</option>
                    ) : (
                      filteredMainProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {isCO
                            ? `${project.project_no} ${
                                project.revision_number ? `(${project.revision_number})` : ''
                              } ← parent: ${project.parent_project_no || 'N/A'}`
                            : isInternal
                              ? `${project.project_no} — ${project.name}`
                              : `${project.project_no}${
                                  project.application_no ? ` · App:${project.application_no}` : ''
                                }${project.pin_no ? ` · PIN:${project.pin_no}` : ''}`}
                        </option>
                      ))
                    )}
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
                      {...register('stage', { required: !isMain })}
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

              {isMain && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Design Review Project</label>
                    
                    <div className="relative mb-1.5">
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={optionBProjectSearch}
                        onChange={(e) => setOptionBProjectSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:ring-2 focus:ring-sky-200 focus:border-sky-300 outline-none transition"
                      />
                    </div>

                    <select {...register('supervision_project')}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none">
                      <option value="">— Select Supervision Project —</option>
                      {filteredOptionBProjects.length === 0 ? (
                        <option value="" disabled>No projects found</option>
                      ) : (
                        filteredOptionBProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.project_no} · {p.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Review Stage</label>
                    <select {...register('review_stage')}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none">
                      <option value="">— Select Review Stage —</option>
                      {INTERNAL_REVIEW_STAGES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

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

              {isCO && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Task Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the change order scope, reason and expected impact..."
                    {...register('description')}
                    className="w-full border border-violet-300 bg-violet-50/30 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-violet-300 outline-none transition"
                  />
                </div>
              )}

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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    End Date (Auto)
                  </label>
                  <input
                    type="date"
                    value={computedEndDate || ''}
                    readOnly
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-gray-100 text-gray-600 font-semibold focus:outline-none cursor-not-allowed"
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
              className={`px-6 py-2.5 rounded-xl text-white font-bold inline-flex items-center gap-2 shadow-md bg-gradient-to-r ${SUBMIT_TONE[taskType] || 'from-sky-500 to-sky-600'} hover:brightness-105 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0`}
            >
              <Save size={18} />
              {isSubmitting ? 'Updating...' : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTask;
