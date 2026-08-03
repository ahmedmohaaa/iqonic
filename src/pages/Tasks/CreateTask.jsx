import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createTask } from '../../api/services/tasks';
import { getProjects } from '../../api/services/projects';
import { getUsersList } from '../../api/services/audit';
import { getDisciplineItems } from '../../api/services/disciplines';
import { getActiveChangeOrders } from '../../api/services/changeOrders';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Plus, AlertCircle, Loader, GitBranch, Layers, FileText, Sparkles,
} from 'lucide-react';

const TYPE_META = {
  MAIN_DESIGN:     { label: 'Main Design',     Icon: Layers,    ring: 'ring-sky-500',     bg: 'bg-sky-50',     tx: 'text-sky-700',     dot: 'bg-sky-500' },
  CHANGE_ORDER:    { label: 'Change Order',    Icon: GitBranch, ring: 'ring-violet-500',  bg: 'bg-violet-50',  tx: 'text-violet-700',  dot: 'bg-violet-500' },
  INTERNAL_REVIEW: { label: 'Internal Review', Icon: FileText,  ring: 'ring-emerald-500', bg: 'bg-emerald-50', tx: 'text-emerald-700', dot: 'bg-emerald-500' },
};
const SUBMIT_TONE = {
  MAIN_DESIGN: 'from-sky-500 to-sky-600',
  CHANGE_ORDER: 'from-violet-500 to-fuchsia-600',
  INTERNAL_REVIEW: 'from-emerald-500 to-teal-600',
};

const CreateTask = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      task_type: 'MAIN_DESIGN', priority: 'MEDIUM', status: 'UNCHARTED',
      progress_percentage: 0, duration_days: 0,
    },
  });

  const [projects, setProjects] = useState([]);
  const [changeOrders, setChangeOrders] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const taskType = watch('task_type');
  const selectedStage = watch('stage');
  const selectedReviewStage = watch('internal_review_stage');

  const isCO = taskType === 'CHANGE_ORDER';
  const isInternal = taskType === 'INTERNAL_REVIEW';

  // 1) القوائم الأساسية + أوامر التغيير السارية
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
        setProjects(Array.isArray(projData) ? projData : []);
        setChangeOrders(Array.isArray(coData) ? coData : []);
        setEngineers(
          (Array.isArray(usersData) ? usersData : []).filter((u) =>
            ['ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN', 'PM'].includes(u.role)
          )
        );
      })
      .catch((err) => { setError('Failed to load data'); console.error(err); })
      .finally(() => setLoading(false));
  }, []);

  // 2) التخصصات ديناميكياً حسب المرحلة (لـ MAIN و CO) أو مرحلة المراجعة (لـ INTERNAL)
  useEffect(() => {
    setDisciplines([]);
    if (isInternal) {
      if (!selectedReviewStage) return;
      // للمراجعة الداخلية: نفس منطق جلب تخصصات مرحلة المراجعة إن وُجد؛ وإلا اتركها فارغة
      getDisciplineItems({ stage: 'DC1' }) // احتياطي؛ عدّله إن كان لديك فلتر مرحلة مراجعة
        .then((res) => { const it = res?.data?.results || res?.data; setDisciplines(Array.isArray(it) ? it : []); })
        .catch(() => setDisciplines([]));
      return;
    }
    if (selectedStage) {
      getDisciplineItems({ stage: selectedStage })
        .then((res) => {
          const responseData = res?.data || res;
          const items = responseData?.results || responseData;
          setDisciplines(Array.isArray(items) ? items : []);
        })
        .catch(() => setDisciplines([]));
    }
  }, [selectedStage, selectedReviewStage, isInternal]);

  const canCreate = ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'SENIOR_ENG'].includes(user?.role);

  const onSubmit = async (data) => {
    if (!canCreate) { setError('You do not have permission to create tasks'); return; }
    setError('');
    try {
      // data.task_type يحمل الاختيار (MAIN / CHANGE_ORDER / INTERNAL)
      // عند CO: data.project = id الـ Sub‑Project المختار
      const response = await createTask(data);
      navigate(`/tasks/${response?.data?.id || response?.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task. Please check your inputs.');
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
  if (!canCreate) {
    return <div className="text-center py-20 text-rose-500">You don't have permission to create tasks.</div>;
  }

  const projectOptions = isCO ? changeOrders : projects;
  const showDiscipline = isInternal ? !!selectedReviewStage : !!selectedStage;

  return (
    <div className="relative min-h-screen bg-[#f6f7f9] text-gray-800 overflow-hidden">
      <style>{`
        .ct-ambient{position:absolute;inset:0;pointer-events:none;
          background:
            radial-gradient(40% 30% at 88% -4%, rgba(124,58,237,.10), transparent 60%),
            radial-gradient(36% 28% at -2% 102%, rgba(14,165,233,.08), transparent 60%),
            linear-gradient(rgba(15,23,42,.035) 1px,transparent 1px),
            linear-gradient(90deg,rgba(15,23,42,.035) 1px,transparent 1px);
          background-size:auto,auto,40px 40px,40px 40px;
          -webkit-mask-image:radial-gradient(120% 90% at 50% 0%,#000,transparent 88%);
                  mask-image:radial-gradient(120% 90% at 50% 0%,#000,transparent 88%);}
        .ct-rise{opacity:0;transform:translateY(14px);animation:ct-rise .55s cubic-bezier(.2,.7,.2,1) forwards}
        @keyframes ct-rise{to{opacity:1;transform:none}}
        .ct-type{transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s,border-color .25s,background .25s}
        .ct-type:hover{transform:translateY(-3px)}
      `}</style>
      <div className="ct-ambient" aria-hidden />

      <div className="relative max-w-4xl mx-auto p-6">
        {/* الرأس */}
        <div className="flex items-center gap-4 mb-7 ct-rise">
          <button type="button" onClick={() => navigate(-1)}
            className="p-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:-translate-x-0.5 transition shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[.2em] text-violet-500">New Task</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Create New Task</h1>
            <p className="text-sm text-gray-500">Assign a task to an engineer — design, change order, or internal review.</p>
          </div>
        </div>

        {error && (
          <div className="ct-rise mb-5 bg-rose-50 ring-1 ring-rose-200 p-4 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}
          className="ct-rise bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-7"
          style={{ animationDelay: '.08s' }}>

          {/* نوع المهمة — بطاقات تفاعلية */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2.5">Task Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(TYPE_META).map(([value, m]) => {
                const on = taskType === value;
                return (
                  <label key={value} className="relative cursor-pointer">
                    <input type="radio" value={value} {...register('task_type', { required: true })} className="peer sr-only" />
                    <div className={`ct-type ct-type p-4 rounded-xl border-2 bg-white flex items-center gap-3
                      ${on ? `${m.ring} ${m.bg} shadow-md` : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className={`grid place-items-center w-9 h-9 rounded-lg ${on ? m.bg : 'bg-gray-100'} ${on ? m.tx : 'text-gray-400'}`}>
                        <m.Icon size={18} />
                      </span>
                      <span className={`text-sm font-bold ${on ? m.tx : 'text-gray-600'}`}>{m.label}</span>
                      {on && <span className={`ms-auto w-2 h-2 rounded-full ${m.dot} animate-pulse`} />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* المشروع / هدف أمر التغيير */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {isCO ? 'Change Order Target (Sub‑Project) *' : isInternal ? 'Supervision Project *' : 'Project *'}
              </label>
              <select {...register('project', { required: true })}
                className={`w-full border rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none transition
                  ${isCO ? 'border-violet-300 bg-violet-50/40' : 'border-gray-300'}`}>
                <option value="">{isCO ? '— Select Revision —' : '— Select Project —'}</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isCO
                      ? `${p.project_no} ${p.revision_number ? `(${p.revision_number})` : ''} ← parent: ${p.parent_project_no}`
                      : `${p.project_no} - ${p.name}`}
                  </option>
                ))}
              </select>
              {errors.project && <span className="text-rose-500 text-xs">Required</span>}
              {isCO && changeOrders.length === 0 && (
                <p className="mt-1.5 text-amber-600 text-xs inline-flex items-center gap-1">
                  <Sparkles size={12} /> No active change orders yet.
                </p>
              )}
              {isCO && (
                <p className="mt-1.5 text-violet-500/80 text-[11px] inline-flex items-center gap-1">
                  <GitBranch size={11} /> The task will be linked to the selected Revision.
                </p>
              )}
            </div>

            {/* المرحلة */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {isInternal ? 'Review Stage *' : 'Stage *'}
              </label>
              {isInternal ? (
                <select {...register('internal_review_stage', { required: isInternal })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-300 outline-none">
                  <option value="">— Select Review Stage —</option>
                  {/* إن كان لديك قائمة مراحل مراجعة من الباك، املأها هنا */}
                </select>
              ) : (
                <select {...register('stage', { required: !isInternal })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none">
                  <option value="">— Select Stage —</option>
                  <option value="CONCEPT">Concept Design</option>
                  <option value="DC1">DC1</option>
                  <option value="DC2">DC2</option>
                  <option value="TENDER">Tender Documents</option>
                </select>
              )}
              {((isInternal && errors.internal_review_stage) || (!isInternal && errors.stage)) && (
                <span className="text-rose-500 text-xs">Required</span>
              )}
            </div>
          </div>

          {/* التخصص */}
          {showDiscipline && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discipline *</label>
              <select {...register('discipline', { required: true })}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none">
                <option value="">— Select Discipline —</option>
                {Array.isArray(disciplines) && disciplines.length > 0 ? (
                  disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}{d.department_display ? ` - ${d.department_display}` : ''}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No disciplines found</option>
                )}
              </select>
              {errors.discipline && <span className="text-rose-500 text-xs">Required</span>}
            </div>
          )}

          {/* العنوان + المكلَّف */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Title</label>
              <input {...register('title')} placeholder="e.g. Revise Electrical Layout — Rev1"
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-300 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign To *</label>
              <select {...register('assigned_to', { required: true })}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none">
                <option value="">— Select Engineer —</option>
                {Array.isArray(engineers) && engineers.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.first_name} {eng.last_name} ({eng.department || 'General'})
                  </option>
                ))}
              </select>
              {errors.assigned_to && <span className="text-rose-500 text-xs">Required</span>}
            </div>
          </div>

          {/* الأولوية + التواريخ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority *</label>
              <select {...register('priority', { required: true })}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none">
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
              <input type="date" {...register('start_date')}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-300 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (Days)</label>
              <input type="number" {...register('duration_days')}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-300 outline-none" />
            </div>
          </div>

          {/* الأفعال */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 bg-gray-50 hover:bg-gray-100 transition font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-white font-bold inline-flex items-center gap-2 shadow-md bg-gradient-to-r ${SUBMIT_TONE[taskType]} hover:brightness-105 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0`}>
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