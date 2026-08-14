import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getTaskDetails, updateTask } from '../../api/services/tasks';
import { getProjects } from '../../api/services/projects';
import { getUsersList } from '../../api/services/audit';
import { getDisciplineItems } from '../../api/services/disciplines';
import { getActiveChangeOrders } from '../../api/services/changeOrders';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Save, AlertCircle, Loader, GitBranch, Layers, FileText,
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

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();

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

        setProjects(Array.isArray(projData) ? projData : []);
        setChangeOrders(Array.isArray(coData) ? coData : []);
        setEngineers(Array.isArray(usersData) ? usersData : []);

        reset({
          ...taskData,
          project: taskData.project_id || taskData.project,
          assigned_to: taskData.assigned_to_id || taskData.assigned_to,
          discipline: taskData.discipline_id || taskData.discipline,
          internal_review_stage: taskData.internal_review_stage_id || taskData.internal_review_stage,
        });
      })
      .catch((err) => { setError('Failed to load task data'); console.error(err); })
      .finally(() => setLoading(false));
  }, [id, reset]);

  useEffect(() => {
    setDisciplines([]);
    if (isInternal) {
      if (!selectedReviewStage) return;
      getDisciplineItems({ stage: 'DC1' })
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

  const canEdit = !!user;

  const onSubmit = async (data) => {
    if (!canEdit) { setError('You do not have permission to update tasks'); return; }
    setError('');
    try {
      await updateTask(id, data);
      navigate(`/tasks/${id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update task.');
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
  if (!canEdit) {
    return <div className="text-center py-20 text-rose-500">Please log in to edit tasks.</div>;
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
        <div className="flex items-center gap-4 mb-7 ct-rise">
          <button type="button" onClick={() => navigate(-1)}
            className="p-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:-translate-x-0.5 transition shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[.2em] text-violet-500">Edit Task</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Update Task</h1>
            <p className="text-sm text-gray-500">Modify task details and re-submit.</p>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2.5">Task Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(TYPE_META).map(([value, m]) => {
                const on = taskType === value;
                return (
                  <label key={value} className="relative cursor-pointer">
                    <input type="radio" value={value} {...register('task_type', { required: true })} className="peer sr-only" />
                    <div className={`ct-type p-4 rounded-xl border-2 bg-white flex items-center gap-3
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {isCO ? 'Change Order Target *' : isInternal ? 'Supervision Project *' : 'Project Number *'}
              </label>
              <select {...register('project', { required: true })}
                className={`w-full border rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-violet-300 outline-none transition
                  ${isCO ? 'border-violet-300 bg-violet-50/40' : 'border-gray-300'}`}>
                <option value="">{isCO ? '— Select Revision —' : '— Select Project Number —'}</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isCO
                      ? `${p.project_no} ${p.revision_number ? `(${p.revision_number})` : ''} ← parent: ${p.parent_project_no}`
                      : `${p.project_no}${p.application_no ? ` · App:${p.application_no}` : ''}${p.pin_no ? ` · PIN:${p.pin_no}` : ''}`
                    }
                  </option>
                ))}
              </select>
              {errors.project && <span className="text-rose-500 text-xs">Required</span>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {isInternal ? 'Review Stage *' : 'Stage *'}
              </label>
              {isInternal ? (
                <select {...register('internal_review_stage', { required: isInternal })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-300 outline-none">
                  <option value="">— Select Review Stage —</option>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Work Type *</label>
            <select {...register('work_type', { required: true })}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none">
              <option value="">— Select Work Type —</option>
              <option value="Design">Design</option>
              <option value="Design Review">Design Review</option>
              <option value="drafting">drafting</option>
              <option value="calculation">calculation</option>
              <option value="Report">Report</option>
              <option value="3D rendering">3D rendering</option>
              <option value="presentation">presentation</option>
              <option value="printing">printing</option>
            </select>
            {errors.work_type && <span className="text-rose-500 text-xs">Required</span>}
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Title</label>
              <input {...register('title')}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-300 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign To *</label>
              <select {...register('assigned_to', { required: true })}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-sky-300 outline-none">
                <option value="">— Select Engineer —</option>
                {Array.isArray(engineers) && engineers.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.first_name} {eng.last_name} ({eng.department || 'General'}) {eng.role ? `[${eng.role}]` : ''}
                  </option>
                ))}
              </select>
              {errors.assigned_to && <span className="text-rose-500 text-xs">Required</span>}
            </div>
          </div>

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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 bg-gray-50 hover:bg-gray-100 transition font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-white font-bold inline-flex items-center gap-2 shadow-md bg-gradient-to-r ${SUBMIT_TONE[taskType] || 'from-gray-500 to-gray-600'} hover:brightness-105 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0`}>
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