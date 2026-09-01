import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectDetails } from '../../api/services/projectDetails';
import apiClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import InvoiceConsole from '../../pages/Financials/InvoiceConsole';
import InternalDesignReviewPanel from './components/InternalDesignReviewPanel';
import SupervisionFinancialBlock from './components/SupervisionFinancialBlock';
import {
  ArrowLeft, Hash, Building2, Calendar, MapPin, Clock, Flag, Lock, FileText,
  Upload, StickyNote, Send, AtSign, CheckCircle2, Circle, AlertTriangle,
  Hammer, Wrench, Pencil, X, DollarSign, Layers, Activity, ChevronRight,
  Workflow, Sparkles, Link2, Zap, User,ExternalLink
} from 'lucide-react';
import { activateInternalReview } from '../../api/services/internalReview';

const APP_TYPE_LABELS = {
  NEW_PERMIT: 'New Permit',
  MODIFICATION_PERMIT: 'Modification Permit',
  COMPLETION_CERTIFICATE: 'Completion Certificate',
  MAINTENANCE_DEMOLITION: 'Maintenance and Demolition',
};

/* ═══════════════════════════════════════════════════════════════
Status map → color/label (single source of truth for the whole UI)
═══════════════════════════════════════════════════════════════ */
const SM = {
  NOT_STARTED:    { c: 'slate',   t: 'Not Started' },
  PENDING:        { c: 'slate',   t: 'Pending' },
  UPCOMING:       { c: 'slate',   t: 'Upcoming' },
  IN_PROGRESS:    { c: 'amber',   t: 'In Progress' },
  ON_GOING:       { c: 'amber',   t: 'On Going' },
  COMPLETED:      { c: 'emerald', t: 'Completed' },
  ACHIEVED:       { c: 'emerald', t: 'Achieved' },
  APPROVED:       { c: 'emerald', t: 'Approved' },
  PAID:           { c: 'emerald', t: 'Paid' },
  PARTIALLY_PAID: { c: 'amber',   t: 'Partially Paid' },
  ISSUED:         { c: 'sky',     t: 'Issued' },
  DRAFT:          { c: 'slate',   t: 'Draft' },
  OVERDUE:        { c: 'rose',    t: 'Overdue' },
  ON_HOLD:        { c: 'rose',    t: 'On Hold' },
  /* ✅ التعديل 5: حالات Offer/Contract الجديدة */
  NOT_SUBMITTED:          { c: 'slate',   t: 'Not Submitted' },
  SUBMITTED:              { c: 'sky',     t: 'Submitted' },
  PENDING_BY_CLIENT:      { c: 'amber',   t: 'Pending by Client' },
  PREPARATION:            { c: 'amber',   t: 'Preparation' },
  APPROVED_SIGNED_BY_CLIENT: { c: 'emerald', t: 'Approved & Signed by Client' },
  DECLINED_BY_CLIENT:     { c: 'rose',    t: 'Declined by Client' },
};
const meta = (s) => SM[s] || { c: 'slate', t: s || '—' };

/* ── Page permissions (mirror permissions.py literally) ─────── */
function usePerms(user, project) {
  const r = user?.role;
  const u = user?.username;
  const d = user?.department;
  const isMgmt = r === 'GM' || r === 'AGM';
  const isDMgr = r === 'DESIGN_MGR';
  const isAcc = r === 'ACCOUNTANT';
  const isSec = r === 'SECRETARY';
  const isManagementSecretary = isSec && d === 'Management';
  const designMgrs = isMgmt || isDMgr;
  const isSupMgr = r === 'SUP_MGR' || r === 'PM';
  
  return {
    canEditInfo: designMgrs || isManagementSecretary,
    canEditLifecycle: r === 'DESIGN_MGR' || r === 'AGM' || r === 'GM',
    canEditTender: r === 'AGM',
    canEditPriority: designMgrs,
    canSeeContract: isMgmt || isAcc || isManagementSecretary,
    canManageOffer: isManagementSecretary,
    canUploadContract: isManagementSecretary,
    canSeeNumbers: isMgmt || isAcc || isDMgr || isSupMgr,
    canAddInvoice: isMgmt || isAcc,
    /* ✅ التعديل 4: شعبان + إسراء (عدّل username إسراء حسب المسجل بالنظام) */
    canEditIFC: ['shaaban.karam', 'israa.omran'].includes(u) || isMgmt || isDMgr,
    canManageChangeOrder:
      isMgmt || isDMgr || isSupMgr ||
      (isSec && ['Design', 'Management', 'Supervision'].includes(d)),
    canConfirmChangeOrder: isMgmt || isDMgr,
    canActivateReview: ['SUP_MGR', 'PM', 'GM', 'AGM'].includes(r),
    canEditStruct: user?.username === 'mohammad.mostafa',
  };
}

/* ── Live hooks ─────────────────────────────────────────── */
function CountUp({ value, dec = 0, suffix = '' }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const to = Number(value) || 0, start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900), e = 1 - Math.pow(1 - p, 3);
      setN(to * e); if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{dec ? n.toFixed(dec) : Math.round(n).toLocaleString('en-US')}{suffix}</>;
}

function useReveal(deps) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.08 });
    el.querySelectorAll('.rv').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, deps);
  return ref;
}

/* ═══════════════════════════════════════════════════════════════
Project Tasks by Stage & Department
═══════════════════════════════════════════════════════════════ */
function CompletedTasksSection({ tasks, user, onReload }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  // The update button is hidden from everyone (not needed)
  const canEdit = false;
  const stages = [
    { key: 'CONCEPT', label: 'Concept Design' },
    { key: 'DC1',     label: 'DC1' },
    { key: 'DC2',     label: 'DC2' },
  ];
  const deptMeta = {
    ARCH:   { label: 'Architectural', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
    ELEC:   { label: 'Electrical',    color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    MECH:   { label: 'Mechanical',    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
    STRUCT: { label: 'Structural',    color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  };
  const statusMeta = {
    UNCHARTED:   { label: 'Uncharted',   dot: 'bg-gray-400' },
    UNDER_STUDY: { label: 'Under Study', dot: 'bg-blue-400' },
    COMMENT:     { label: 'Comment',     dot: 'bg-indigo-400' },
    ON_GOING:    { label: 'On Going',    dot: 'bg-amber-400' },
    COMPLETED:   { label: 'Completed',   dot: 'bg-emerald-500' },
    APPROVED:    { label: 'Approved',    dot: 'bg-emerald-600' },
    ON_HOLD:     { label: 'On Hold',     dot: 'bg-rose-500' },
  };

  const openUpdate = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };
  const submitStatus = async (newStatus) => {
    if (!selectedTask) return;
    try {
      await apiClient.patch(`tasks/${selectedTask.id}/status/`, { status: newStatus });
      setShowModal(false);
      onReload?.();
    } catch (err) {
      alert('Failed to update status');
    }
  };
  return (
    <div className="space-y-5">
      {stages.map(({ key, label }) => {
        // All tasks of the stage (regardless of status)
        const stageTasks = (tasks || []).filter(t => t.stage === key);
        if (stageTasks.length === 0) return null;
        // Group by department (ARCH / ELEC / MECH / STRUCT)
        const byDept = {};
        stageTasks.forEach(t => {
          const dept = t.discipline_code || 'GENERAL';
          if (!byDept[dept]) byDept[dept] = [];
          byDept[dept].push(t);
        });
        return (
          <div key={key} className="border border-gray-200 rounded-xl p-4 bg-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{label}</h4>
            <div className="space-y-4">
              {Object.entries(byDept).map(([dept, deptTasks]) => {
                const dm = deptMeta[dept] || { label: dept, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
                return (
                  <div key={dept} className={`rounded-lg border ${dm.border} ${dm.bg} p-3`}>
                    <h5 className={`text-xs font-bold mb-2 ${dm.color}`}>{dm.label}</h5>
                    <div className="space-y-2">
                      {deptTasks.map(task => {
                        const sm = statusMeta[task.status] || statusMeta.UNCHARTED;
                        return (
                          <div key={task.id} className="flex items-start justify-between gap-3 p-2.5 rounded-md bg-white border border-gray-100">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">
                                {task.title || task.discipline_name}
                              </p>
                              {/* ✅ اسم الـ Discipline لكل مهمة (بلون قسمها) */}
                              {task.discipline_name && task.title && (
                                <p className={`mt-0.5 text-xs font-semibold`}>
                                  {task.discipline_name}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-600">
                                <span className="inline-flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${sm.dot}`} />
                                  <span className="font-medium">{sm.label}</span>
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <User size={12} /> {task.assigned_to_name || '—'}
                                </span>
                                {task.work_type_display && (
                                  <span className="text-sky-600 font-medium">{task.work_type_display}</span>
                                )}
                              </div>
                            </div>
                            {canEdit && (
                              <button onClick={() => openUpdate(task)} className="pd-mini shrink-0">
                                <Pencil size={12} className="mr-1" /> Update
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {showModal && selectedTask && (
        <Modal title="Update Task Status" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-2">
              Task: <b>{selectedTask.title || selectedTask.discipline_name}</b>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['UNCHARTED', 'UNDER_STUDY', 'COMMENT', 'ON_GOING', 'COMPLETED', 'APPROVED', 'ON_HOLD'].map(st => (
                <button
                  key={st}
                  className="pd-mini w-full justify-center"
                  onClick={() => submitStatus(st)}
                >
                  {statusMeta[st]?.label || st}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function ProjectDetails() {
  const { id } = useParams();
  const { user, canViewSupervisionFinance } = useAuth();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const wrap = useReveal([p]);
  // Local modal states
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [prioOpen, setPrioOpen] = useState(false);
  const [prioForm, setPrioForm] = useState({ priority: 'MEDIUM', reason: '' });
  const [note, setNote] = useState('');
  const [contractFile, setContractFile] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const P = usePerms(user, p);
  // Internal Review action button: Ahmed Zabady (Supervision Mgr) or Supervision Secretary ONLY
  const canReviewAction =
    user?.username === 'ahmed.zabady' ||
    (user?.role === 'SECRETARY' && user?.department === 'Supervision');
  const canEditTasks = false;
  const load = () => {
    setLoading(true);
    getProjectDetails(id).then((r) => setP(r.data)).catch(() => setP(null)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);
  if (loading) return <div className="pd-root"><style>{CSS}</style><div className="pd-load"><Layers className="pd-spin" /> Loading project…</div></div>;
  if (!p) return <div className="pd-root"><style>{CSS}</style><div className="pd-load">Project not found</div></div>;

  /* ── Compute the four flag states ─────────────────────── */
  const lc = (name) => (p.lifecycle_stages || []).find((s) => s.stage_name === name);
  const dc1 = p.dc1_status || {}, dc2 = p.dc2_status || {};
  const dc1Approved = lc('DC1')?.status === 'ACHIEVED';
  const dc2Approved = lc('DC2')?.status === 'ACHIEVED';
  const dc1State = dc1Approved ? 'APPROVED' : (dc1.status === 'COMPLETED' ? 'COMPLETED' : dc1.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_STARTED');
  const dc2State = dc2Approved ? 'APPROVED' : (dc2.status === 'COMPLETED' ? 'COMPLETED' : dc2.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_STARTED');
  const dc1Pct = dc1.total ? Math.round((dc1.completed / dc1.total) * 100) : 0;
  const dc2Pct = dc2.total ? Math.round((dc2.completed / dc2.total) * 100) : 0;
  const struct = p.structural_status || {}, ifc = p.ifc_status || {};
  const structState = struct.status || 'PENDING';
  const ifcState = ifc.status || 'NOT_STARTED';
  const overall = p.is_active ? 'ACTIVE' : 'CLOSED';
  const stages = [...(p.lifecycle_stages || [])].sort((a, b) => a.sequence_order - b.sequence_order);
  const done = stages.filter((s) => s.status === 'ACHIEVED' || s.status === 'APPROVED').length;
  const pct = stages.length ? Math.round((done / stages.length) * 100) : 0;
  const isDesign = p.scope !== 'SUPERVISION';

  /* ── Actions ──────────────────────────────────────────── */
  // ✅ حالات الـ Structural (قائمة اختيار — مصدر واحد)
const STRUCT_OPTIONS = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
const IFC_OPTIONS = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
  const setStructStatus = (status) => {
    apiClient.patch(`projects/${id}/structural-status/`, { status }).then(load);
  };
  /* ✅ التعديل 5: مراحل العرض/العقد الجديدة (سكرتيرة الإدارة) */
  const OFFER_STAGES = [
    'NOT_SUBMITTED',
    'SUBMITTED',
    'PENDING_BY_CLIENT',
    'PREPARATION',
    'APPROVED_SIGNED_BY_CLIENT',
    'DECLINED_BY_CLIENT',
  ];
  const patchOfferContract = (payload) =>
    apiClient.patch(`projects/${id}/offer-status/`, payload).then(load);

  const holdStruct = () => {
    if (!holdReason.trim()) return;
    apiClient.patch(`projects/${id}/structural-status/`, { status: 'ON_HOLD', hold_reason: holdReason })
      .then(() => { setHoldOpen(false); setHoldReason(''); load(); });
  };
  const resumeStruct = () => apiClient.patch(`projects/${id}/structural-status/`, { status: 'IN_PROGRESS' }).then(load);
const setIfcStatus = (status) => {
  apiClient.patch(`projects/${id}/ifc-status/`, { status }).then(load);
};
  const submitPrio = () => {
    apiClient.patch(`projects/${id}/priority/`, prioForm).then(() => { setPrioOpen(false); load(); });
  };
  const submitNote = () => {
    if (!note.trim()) return;
    apiClient.post(`projects/${id}/notes/add/`, { content: note, mention_all: note.includes('@all') })
      .then(() => setNote('')).then(load);
  };
  const uploadContract = () => {
    if (!contractFile) return;
    const fd = new FormData(); fd.append('contract_file', contractFile);
    apiClient.post(`projects/${id}/contract-file/upload/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => setContractFile(null)).then(load);
  };
  const canViewFinancials = () =>
    p?.scope === 'SUPERVISION'
      ? (user?.username === 'ahmed.zabady' || user?.role === 'ACCOUNTANT')
      : ['GM', 'AGM', 'ACCOUNTANT'].includes(user?.role);

  return (
    <div ref={wrap} className="pd-root" dir="ltr">
      <style>{CSS}</style>
      <div className="pd-ambient" aria-hidden />
      <div className="pd-shell">
        {/* ── Header ────────────────────────────────── */}
        <header className="rv pd-head">
          <Link to="/projects" className="pd-back"><ArrowLeft size={18} /></Link>
          <div className="pd-head-main">
            <div className="pd-pno"><Hash size={13} /> {p.project_no} <i className="pd-dotsep" /> {p.scope}</div>
            <h1 className="pd-title">{p.name}</h1>
            <div className="pd-meta">
              <span><Building2 size={13} /> {p.client_name || '—'}</span>
              {p.location && <span><MapPin size={13} /> {p.location}</span>}
              {/* ✅ التعديل 1: زر Project Details بجوار Location */}
              <button
                onClick={() => setInfoOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0b1f3c] text-white text-xs font-bold hover:bg-[#16305a] transition shadow-sm"
                title="View full project details"
              >
                <FileText size={13} /> Project Details
              </button>
              <span><Calendar size={13} /> Start: {p.start_date || 'Not started'}</span>
              {/* ✅ التعديل 2: عرض End Date الذي تم إدخاله */}
              {p.end_date && (
                <span><Calendar size={13} /> End: {p.end_date}</span>
              )}
              {p.duration_days > 0 && <span><Clock size={13} /> {p.duration_days} days</span>}
            </div>
          </div>
          <div className="pd-head-right">
            <Badge c={overall === 'ACTIVE' ? 'emerald' : 'slate'} pulse={overall === 'ACTIVE'}>
              {overall === 'ACTIVE' ? 'Active' : 'Closed'}
            </Badge>
            <div className="pd-ring-wrap">
              <Ring pct={pct} />
              <div className="pd-ring-txt"><CountUp value={pct} suffix="%" /><span>Done</span></div>
            </div>
          </div>
        </header>

        {/* ── Indicator slabs ─────────── */}
        <div className="rv pd-slabs">
          <Slab label="Client" v={p.client_name || '—'} />
          <Slab label="Actual Start" v={p.start_date || 'Tied to first payment'} mono />
          <Slab label="Location" v={p.location || '—'} />
          {/* ✅ التعديل 2: Slab للـ End Date */}
          <Slab label="End Date" v={p.end_date || '—'} mono />
          {P.canSeeNumbers && (
            <Slab accent label="Contract Value" v={<CountUp value={p.contract_value} dec={0} />} money />
          )}
        </div>

        {/* ── Layout: content + floating buttons ─────────── */}
        <div className="pd-grid">
          <div className="pd-main">
            {/* Lifecycle */}
            <Block rv tag="LIFECYCLE" title="Project Lifecycle"
              action={P.canEditLifecycle ? <span className="pd-editable">Editable</span> : <span className="pd-readonly">Read-only</span>}>
              <LifecycleRibbon
                stages={stages}
                canEdit={user?.username === 'mohammad.fahmy' || user?.role === 'DESIGN_MGR' || (p.scope === 'DESIGN' && user?.role === 'SECRETARY' && user?.department === 'Design')}
                onReload={load}
                projectId={id}
              />
            </Block>

            {/* The four flags */}
            {isDesign && (
              <Block rv tag="FLAGS" title="Status & Discipline Flags">
                <div className="pd-flags">
                  <FlagCard label="DC1" accent="sky" state={dc1State} pct={dc1Pct}
                    sub={`${dc1.completed || 0}/${dc1.total || 0} tasks`} />
                  <FlagCard label="DC2" accent="violet" state={dc2State} pct={dc2Pct}
                    sub={`${dc2.completed || 0}/${dc2.total || 0} tasks`} />
                  <FlagCard label="Structural" accent="amber" state={structState} icon={<Hammer size={15} />}
                    interactive={P.canEditStruct} options={STRUCT_OPTIONS} onSelect={setStructStatus}
                    hold={structState === 'ON_HOLD'} holdInfo={struct}
                    onHold={() => setHoldOpen(true)} onResume={resumeStruct} />
<FlagCard label="IFC Package" accent="emerald" state={ifcState} icon={<Wrench size={15} />}
  interactive={P.canEditIFC} options={IFC_OPTIONS} onSelect={setIfcStatus} />
                </div>
              </Block>
            )}

            {/* Project tasks by stage & department */}
            <Block rv tag="TASKS" title="Project Tasks"
              action={canEditTasks
                ? <span className="pd-editable">Updates Enabled</span>
                : <span className="pd-readonly">Read-only</span>}>
              {/* ✅ التعديل 3: سكرول داخلي لقسم المهام فقط */}
              <div className="pd-tasks-scroll">
                <CompletedTasksSection
                  tasks={p.tasks || []}
                  user={user}
                  onReload={load}
                />
              </div>
            </Block>

            {p.scope === 'SUPERVISION' && (
              <Block rv tag="INTERNAL REVIEW" title="Internal Design Review"
                action={p.internal_design_review_required
                  ? <span className="pd-editable">Active</span>
                  : <span className="pd-readonly">Not activated</span>}>
                {p.internal_design_review_required
                  ? <InternalDesignReviewPanel project={p} onReload={load} />
                  : <ActivateReviewCard projectId={id} canActivate={canReviewAction} onDone={load} />}
              </Block>
            )}

            {/* Priority */}
            <Block rv tag="PRIORITY" title="Project Priority"
              action={P.canEditPriority
                ? <button className="pd-mini" onClick={() => { setPrioForm({ priority: p.priority, reason: '' }); setPrioOpen(true); }}><Pencil size={13} /> Edit</button>
                : <span className="pd-readonly">Visible to all</span>}>
              <PriorityView priority={p.priority} history={p.priority_history} />
            </Block>

            {/* Tendering */}
            {p.scope !== 'SUPERVISION' && (
              <Block rv tag="TENDERING" title="Tendering"
                action={P.canEditTender ? <span className="pd-editable">Edited by Nisreen</span> : <span className="pd-readonly">Read-only</span>}>
                <Tendering t={p.tendering} canEdit={P.canEditTender} onChanged={load} pid={id} />
              </Block>
            )}

            {/* Financial status — figures for authorized, names+percentages for all */}
            <Block rv tag="FINANCE" title="Financial Status"
              action={P.canSeeNumbers ? <span className="pd-editable">Full figures</span> : <span className="pd-readonly">Percentages only</span>}>
              <FinanceStrip invoices={p.invoices} seeNumbers={P.canSeeNumbers} />
            </Block>
            
            {p.scope !== 'SUPERVISION' && canViewFinancials() && <InvoiceConsole projectId={id} />}

            {canViewSupervisionFinance?.() && p.scope === 'SUPERVISION' && (
              <Block rv tag="SUPERVISION FINANCE" title="Supervision Financials"
                action={<span className="pd-readonly">Restricted</span>}>
                <SupervisionFinancialBlock projectId={id} />
              </Block>
            )}

            {/* Offer + Contract */}
            <Block rv tag="OFFER / CONTRACT" title="Offer & Contract Status">
              <div className="pd-offer">
                <div className="pd-srow">
                  <span>Offer Status</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`pd-badge t-${meta(p.offer_status).c}`}>{meta(p.offer_status).t}</span>
                    {P.canManageOffer && (
                      <select
                        className="pd-select"
                        value={p.offer_status}
                        onChange={(e) => patchOfferContract({ offer_status: e.target.value })}
                        title="Offer status"
                      >
                        {OFFER_STAGES.map((s) => (
                          <option key={s} value={s}>{meta(s).t}</option>
                        ))}
                      </select>
                    )}
                  </span>
                </div>
                <div className="pd-srow">
                  <span>Contract Status</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`pd-badge t-${meta(p.contract_status).c}`}>{meta(p.contract_status).t}</span>
                    {P.canManageOffer && (
                      <select
                        className="pd-select"
                        value={p.contract_status}
                        onChange={(e) => patchOfferContract({ contract_status: e.target.value })}
                        title="Contract status"
                      >
                        {OFFER_STAGES.map((s) => (
                          <option key={s} value={s}>{meta(s).t}</option>
                        ))}
                      </select>
                    )}
                  </span>
                </div>
              </div>
              <ContractSlot
                existingFile={p.contract_file}
                canSee={P.canSeeContract}
                canUpload={P.canUploadContract}
                selectedFile={contractFile}
                setFile={setContractFile}
                onUpload={uploadContract}
              />
            </Block>

            {/* Notes */}
            <Block rv tag="NOTES" title="Project Notes">
              <NotesBlock notes={p.notes} note={note} setNote={setNote} onAdd={submitNote} />
            </Block>

            {/* ✅ External Logs — سجلات هذا المشروع فقط */}
            <Block rv tag="EXTERNAL LOGS" title="External Logs">
              <ExternalLogsBlock logs={p.external_logs} />
            </Block>
          </div>

          {/* ── Floating side buttons (DC1 / DC2) — design projects only ── */}
          {isDesign && (
            <aside className="pd-float">
              <FloatBtn label="DC1" accent="sky" state={dc1State} pct={dc1Pct} />
              <FloatBtn label="DC2" accent="violet" state={dc2State} pct={dc2Pct} />
            </aside>
          )}
        </div>
      </div>

      {/* ── Structural hold reason modal ──────────── */}
      {holdOpen && (
        <Modal title="Hold Structural Button" onClose={() => setHoldOpen(false)}>
          <label className="pd-lbl">Hold Reason <b>*</b></label>
          <textarea className="pd-ta" rows={3} value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)} placeholder="Why was the button held?" />
          <div className="pd-modal-foot">
            <button className="pd-ghost" onClick={() => setHoldOpen(false)}>Cancel</button>
            <button className="pd-solid rose" onClick={holdStruct} disabled={!holdReason.trim()}>Confirm Hold</button>
          </div>
        </Modal>
      )}

      {/* ── Edit priority modal ───────────────────── */}
      {prioOpen && (
        <Modal title="Edit Project Priority" onClose={() => setPrioOpen(false)}>
          <label className="pd-lbl">Priority</label>
          <div className="pd-prio-pick">
            {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((x) => (
              <button key={x} type="button"
                className={`pd-prio-opt ${prioForm.priority === x ? 'on' : ''} t-${meta(x).c}`}
                onClick={() => setPrioForm({ ...prioForm, priority: x })}>{meta(x).t}</button>
            ))}
          </div>
          <label className="pd-lbl">Reason for Change <b>*</b></label>
          <textarea className="pd-ta" rows={2} value={prioForm.reason}
            onChange={(e) => setPrioForm({ ...prioForm, reason: e.target.value })} />
          <div className="pd-modal-foot">
            <button className="pd-ghost" onClick={() => setPrioOpen(false)}>Cancel</button>
            <button className="pd-solid" onClick={submitPrio} disabled={!prioForm.reason.trim()}>Save</button>
          </div>
        </Modal>
      )}

      {infoOpen && p && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInfoOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-4 bg-[#0b1f3c]">
              <h3 className="text-white font-bold flex items-center gap-2">
                <FileText size={18} /> Project Details
              </h3>
              <button onClick={() => setInfoOpen(false)} className="text-gray-300 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Description', p.description],
                    ['Project Name', p.name],
                    ['Project Number', p.project_no],
                    ['Client', p.client_name],
                    ['Location', p.location],
                    ['Start Date', p.start_date],
                    ['Duration (Days)', p.duration_days],
                    ['Application Type', APP_TYPE_LABELS[p.application_type] || p.application_type],
                    ['End Date (Auto)', p.end_date],
                    ['Priority', p.priority],
                    ['Building Type', p.building_type],
                    ['Floors', p.floors],
                    ['Plot Area', p.plot_area],
                    ['BUA (M²)', p.bua],
                    ['Apartments', p.apartments],
                    ['Shops', p.shops],
                    ['Parking', p.parking],
                    ['Application No.', p.application_no],
                    ['PIN No.', p.pin_no],
                    ['Owner', p.owner],
                    ['Supervision Consultant', p.supervision_consultant],
                    ['Permit No.', p.permit_no],
                    ['Permit Date', p.permit_date],
                    ['Permit Deadline', p.permit_deadline],
                    ['Permit Status', p.permit_status],
                    ['Contractor', p.contractor_details?.name],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 pe-4 font-semibold text-gray-500 w-44 whitespace-nowrap">{label}</td>
                      <td className="py-2.5 font-semibold text-gray-900">{value || value === 0 ? value : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
Sub-components
═══════════════════════════════════════════════════════════════ */
function Badge({ c, pulse, children }) {
  return <span className={`pd-badge t-${c}`}>{pulse && <i className="pd-pulse" />}{children}</span>;
}

function Ring({ pct }) {
  const r = 22, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <svg className="pd-ring" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--emerald)" strokeWidth="5"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform="rotate(-90 26 26)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

function Slab({ label, v, mono, accent, money }) {
  return (
    <div className={`pd-slab ${accent ? 'acc' : ''}`}>
      <span className="pd-slab-l">{label}</span>
      <span className={`pd-slab-v ${mono ? 'mono' : ''}`}>
        {money && <DollarSign size={13} />}{v}
      </span>
    </div>
  );
}

function Block({ rv, tag, title, sub, action, children }) {
  return (
    <section className={`${rv ? 'rv' : ''} pd-block`}>
      <div className="pd-block-h">
        <div>
          <span className="pd-tag">{tag}</span>
          <h2 className="pd-block-t">{title}</h2>
          {sub && <span className="pd-block-sub">{sub}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusRow({ label, v }) {
  const m = meta(v);
  return (
    <div className="pd-srow">
      <span>{label}</span>
      <span className={`pd-badge t-${m.c}`}>{m.t}</span>
    </div>
  );
}

function LifecycleRibbon({ stages, canEdit, onReload, projectId }) {
  const [busy, setBusy] = useState(null);
  const SHORT = {
    OFFER: 'RFQ', CONTRACT_SUBMITTED: 'Contract Sub.', CONTRACT_SIGNED: 'Contract Signed',
    CONCEPT: 'Concept', DC1: 'DC1', DC2: 'DC2', TENDER: 'Tender',
    COLLECTION: 'Collection', CLOSED: 'Closed', DESIGN_PHASE: 'Design',
  };
  const firstPending = (stages.find((s) => s.status !== 'ACHIEVED' && s.status !== 'APPROVED') || {}).sequence_order;
  const today = () => new Date().toISOString().split('T')[0];
  const achieveAll = async () => {
    setBusy('all');
    const ordered = [...stages].sort((a, b) => a.sequence_order - b.sequence_order);
    for (const s of ordered) {
      if (s.status === 'ACHIEVED' || s.status === 'APPROVED') continue;
      try {
        await apiClient.patch(`lifecycle/${s.id}/update/`, { actual_date: today() });
      } catch {
        break;
      }
    }
    setBusy(null);
    onReload?.();
  };
  const achieve = async (s) => {
    setBusy(s.id);
    try {
      await apiClient.patch(`lifecycle/${s.id}/update/`, { actual_date: today() });
    } catch (err) {
      console.error(err);
    }
    setBusy(null);
    onReload?.();
  };
  return (
    <div>
      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="pd-editable">Editable</span>
        </div>
      )}
      <ol className="pd-lc">
        {stages.map((s, i) => {
          const m = meta(s.status);
          const done = s.status === 'ACHIEVED' || s.status === 'APPROVED';
          const live = !done && s.sequence_order === firstPending;
          return (
            <li key={s.id} className={`pd-lc-node ${done ? 'done' : ''} ${live ? 'live' : ''} t-${m.c}`}>
              {i > 0 && <span className={`pd-lc-line ${stages[i - 1].status === 'ACHIEVED' ? 'lit done' : ''}`} />}
              <span className={`pd-lc-dot ${done ? 'done' : live ? 'live' : s.status === 'OVERDUE' ? 'over' : ''}`} />
              <span className="pd-lc-name" title={s.stage_name}>{SHORT[s.stage_name] || s.stage_name}</span>
              <span className="pd-lc-st">{m.t}</span>
              <span className="pd-lc-dates">
                {s.planned_date && <span>P:{s.planned_date}</span>}
                {s.actual_date && <span>A:{s.actual_date}</span>}
              </span>
              {canEdit && !done && (
                <button className="pd-mini" style={{ marginTop: 6 }}
                  onClick={() => achieve(s)} disabled={busy === s.id}>
                  {busy === s.id ? '…' : 'Achieve'}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <style>{`
        .pd-lc-node{ min-width:84px; transition:transform .25s; }
        .pd-lc-node:hover{ transform:translateY(-3px); }
        .pd-lc-name{ font-size:10.5px; font-weight:600; line-height:1.25; text-align:center;
          white-space:normal; word-break:break-word; max-width:92px; }
        .pd-lc-node.live .pd-lc-dot{ box-shadow:0 0 0 4px rgba(230,171,76,.22); }
        .pd-lc-node.live{ background:linear-gradient(180deg, rgba(230,171,76,.10), transparent);
          border-radius:10px 10px 0 0; }
        .pd-lc-line.lit{ background:linear-gradient(90deg,var(--emerald),rgba(63,178,134,.4)); position:relative; overflow:hidden; }
        .pd-lc-line.lit::after{ content:""; position:absolute; inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);
          transform:translateX(-100%); animation:lcshim 2.4s ease-in-out infinite; }
        @keyframes lcshim{ 60%,100%{ transform:translateX(220%); } }
      `}</style>
    </div>
  );
}

function FlagCard({ label, accent, state, pct, sub, icon, interactive, onCycle, onSelect, options, hold, holdInfo, onHold, onResume }) {
  const m = meta(state);
  return (
    <div className={`pd-flag acc-${accent} ${hold ? 'held' : ''}`}>
      <div className="pd-flag-top">
        <span className="pd-flag-ic">{icon || <Flag size={14} />}</span>
        <span className="pd-flag-label">{label}</span>
        <span className={`pd-badge t-${hold ? 'rose' : m.c}`}>{hold ? 'On Hold' : m.t}</span>
      </div>
      {pct != null && (
        <div className="pd-bar"> <span style={{ width: `${pct}%` }} /> <em>{pct}%</em> </div>
      )}
      {sub && <p className="pd-flag-sub">{sub}</p>}
      {hold ? (
        <div className="pd-hold">
          <span className="pd-hold-flag"><AlertTriangle size={12} /> {holdInfo.hold_date}</span>
          {holdInfo.hold_reason && <p className="pd-hold-reason">{holdInfo.hold_reason}</p>}
          {interactive && <button className="pd-mini" onClick={onResume}>Resume</button>}
        </div>
      ) : (
        interactive && (
          <div className="pd-flag-acts">
            {options?.length ? (
              <select
                className="pd-select"
                value={state}
                onChange={(e) => onSelect(e.target.value)}
              >
                {options.map((o) => (
                  <option key={o} value={o}>{meta(o).t}</option>
                ))}
              </select>
            ) : (
              <button className="pd-mini" onClick={onCycle}>Toggle Status <ChevronRight size={12} /></button>
            )}
            {onHold && <button className="pd-mini rose" onClick={onHold}>Hold</button>}
          </div>
        )
      )}
    </div>
  );
}

function PriorityView({ priority, history }) {
  const m = meta(priority);
  return (
    <div>
      <div className="pd-prio-now">
        <Flag size={16} /> <span className={`pd-badge t-${m.c} big`}>{m.t}</span>
      </div>
      {history && history.length > 0 ? (
        <ul className="pd-prio-log">
          {history.slice(0, 4).map((h, i) => (
            <li key={i}>
              <span className={`pd-badge t-${meta(h.priority).c}`}>{meta(h.priority).t}</span>
              <span className="pd-log-reason">{h.reason}</span>
              <span className="pd-log-by">{h.updated_by_name} · {new Date(h.created_at).toLocaleDateString('en-GB')}</span>
            </li>
          ))}
        </ul>
      ) : <p className="pd-empty-mini">No priority history yet.</p>}
    </div>
  );
}

function Tendering({ t, canEdit, onChanged, pid }) {
  const rows = [
    ['boq_status', 'boq_notes', 'BOQ — Bill of Quantities'],
    ['specs_status', 'specs_notes', 'Specifications'],
    ['conditions_status', 'conditions_notes', 'Conditions of Contract'],
  ];
  const cycle = (cur) => { const o = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']; return o[Math.min(o.indexOf(cur) + 1, 2)]; };
  const update = (sk, nk) => apiClient.patch(`projects/${pid}/tendering/update/`, { [sk]: nk }).then(onChanged);
  const setNotes = (nk, v) => apiClient.patch(`projects/${pid}/tendering/update/`, { [nk]: v }).then(onChanged);
  return (
    <div className="pd-tender">
      {rows.map(([sk, nk, label]) => {
        const cur = t?.[sk] || 'NOT_STARTED'; const m = meta(cur);
        return (
          <div key={sk} className="pd-trow">
            <div className="pd-trow-h">
              <span className="pd-trow-label">{label}</span>
              <span className={`pd-badge t-${m.c}`}>{m.t}</span>
              {canEdit && <button className="pd-mini" onClick={() => update(sk, cycle(cur))}>Toggle</button>}
            </div>
            {canEdit
              ? <textarea className="pd-ta mini" rows={1} defaultValue={t?.[nk] || ''}
                  onBlur={(e) => setNotes(nk, e.target.value)} placeholder="Executive note…" />
              : (t?.[nk] ? <p className="pd-trow-note">{t[nk]}</p> : null)}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
✅ FinanceStrip — تم التعديل هنا:
   - المديرون (seeNumbers=true): يشوفوا الأرقام الكاملة + النسبة
   - الموظفون (seeNumbers=false): يشوفوا النسبة المئوية فقط بشكل صريح وواضح
   - تم إضافة حماية ?? للتعامل مع كلا الاسمين من الباك-إند
═══════════════════════════════════════════════════════════════ */
function FinanceStrip({ invoices, seeNumbers }) {
  const list = invoices || [];
  if (!list.length) return <p className="pd-empty-mini">No invoices yet.</p>;
  return (
    <ul className="pd-fin">
      {list.map((iv) => {
        // ✅ حماية مزدوجة: الباك-إند قد يرسل collection_percentage (الجديد) أو payment_progress_percentage (القديم)
        const pct = seeNumbers
          ? (Number(iv.total_amount) > 0
            ? Math.min(100, Math.round(
              ((iv.payments || []).reduce((s, x) => s + Number(x.amount_paid || 0), 0)
                / Number(iv.total_amount)) * 100))
            : 0)
          : (iv.collection_percentage ?? iv.payment_progress_percentage ?? 0);
        const m = meta(iv.status);
        return (
          <li key={iv.id} className={`pd-fin-row ${iv.status === 'OVERDUE' ? 'over' : ''}`}>
            <div className="pd-fin-main">
              <span className="pd-fin-title">{iv.title}</span>
              <span className="pd-fin-ms">{iv.milestone_type_display}</span>
            </div>
            <div className="pd-fin-bar"> <span style={{ width: `${pct}%` }} /> <em>{pct}%</em> </div>
            {seeNumbers ? (
              <div className="pd-fin-nums">
                <span>Total: <CountUp value={iv.total_amount} /></span>
                <span>Paid: <CountUp value={(iv.payments || []).reduce((s, x) => s + Number(x.amount_paid || 0), 0)} /></span>
              </div>
            ) : (
              /* ✅ عرض النسبة المئوية بشكل صريح وواضح للموظفين */
              <div className="pd-fin-pct">
                <span className="pd-fin-pct-label">Paid</span>
                <span className="pd-fin-pct-value">{pct}%</span>
              </div>
            )}
            <span className={`pd-badge t-${m.c}`}>{m.t}</span>
          </li>
        );
      })}
    </ul>
  );
}

function ContractSlot({ existingFile, canSee, canUpload, selectedFile, setFile, onUpload }) {
  if (!canSee && !canUpload) {
    return (
      <p className="pd-empty-mini">
        Contract file is available to management, the accountant, and the management secretary.
      </p>
    );
  }
  return (
    <div className="pd-contract">
      <div className="pd-contract-now">
        {existingFile ? (
          <>
            <FileText size={15} />
            <a href={existingFile} target="_blank" rel="noreferrer">
              View contract file
            </a>
          </>
        ) : (
          <>
            <Lock size={14} />
            No file uploaded
          </>
        )}
      </div>
      {canUpload && (
        <div className="pd-contract-up">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button
            className="pd-mini"
            onClick={onUpload}
            disabled={!selectedFile}
          >
            <Upload size={12} />
            Upload
          </button>
        </div>
      )}
    </div>
  );
}

function NotesBlock({ notes, note, setNote, onAdd }) {
  const list = notes || [];
  return (
    <div>
      <ul className="pd-notes">
        {list.map((n) => (
          <li key={n.id} className={n.is_pinned ? 'pinned' : ''}>
            <div className="pd-note-h">
              <span className="pd-note-by">{n.user_name}</span>
              <span className="pd-note-date">{new Date(n.created_at).toLocaleString('en-GB')}</span>
            </div>
            <p className="pd-note-body">{n.content}</p>
          </li>
        ))}
        {!list.length && <p className="pd-empty-mini">No notes yet.</p>}
      </ul>
      <div className="pd-note-add">
        <AtSign size={14} />
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Write a note…" />
        <button className="pd-solid" onClick={onAdd} disabled={!note.trim()}> <Send size={14} /> </button>
      </div>
    </div>
  );
}

function ExternalLogsBlock({ logs }) {
  const list = logs || [];
  if (!list.length) return <p className="pd-empty-mini">No external logs yet.</p>;
  return (
    <ul className="pd-extlogs">
      {list.map((l) => (
        <li key={l.id} className="pd-extlog">
          <div className="pd-extlog-main">
            <span className={`pd-badge t-${l.sub_type === 'CRITICAL' ? 'rose' : 'amber'}`}>
              {l.sub_type_display}
            </span>
            <span className="pd-extlog-type">{l.log_type}</span>
          </div>
          {l.description && <p className="pd-extlog-desc">{l.description}</p>}
          <div className="pd-extlog-foot">
            <span className="pd-extlog-date">
              {l.created_at ? new Date(l.created_at).toLocaleDateString('en-GB') : ''}
            </span>
            {l.url && (
              <a className="pd-extlog-link" href={l.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} /> View
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function FloatBtn({ label, accent, state, pct }) {
  const m = meta(state);
  return (
    <div className={`pd-fbtn acc-${accent} t-${m.c}`}>
      <span className={`pd-fbtn-dot ${state === 'APPROVED' || state === 'COMPLETED' ? 'done' : state === 'IN_PROGRESS' ? 'live' : ''}`} />
      <span className="pd-fbtn-l">{label}</span>
      <span className="pd-fbtn-p">{pct}%</span>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="pd-mask" onClick={onClose}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-h"> <h3>{title}</h3> <button onClick={onClose}><X size={18} /></button> </div>
        <div className="pd-modal-b">{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
ActivateReviewCard — review bridge activation card (required=false case)
═══════════════════════════════════════════════════════════════ */
function ActivateReviewCard({ projectId, canActivate, onDone }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const activate = async () => {
    setBusy(true); setErr('');
    try {
      await activateInternalReview(projectId);
      setDone(true);
      setTimeout(() => onDone?.(), 650);   // success flash then reload
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to activate the review.');
    } finally { setBusy(false); }
  };
  return (
    <section className={`arc ${done ? 'arc-done' : ''}`}>
      <style>{ARC_CSS}</style>
      <div className="arc-ambient" aria-hidden />
      <div className="arc-orb"><Workflow size={22} /></div>
      <div className="arc-body">
        <span className="arc-kicker">INTERNAL DESIGN REVIEW · SUPERVISION ↔ DESIGN BRIDGE</span>
        <h3 className="arc-title">Internal Design Review is not activated</h3>
        <p className="arc-sub">
          This project has no review bridge yet. Once activated, it appears to the assigned
          design engineers so they can evaluate the drawings through five stages
          (Design Criteria → IFC Package); their results reflect here, and the
          supervision manager is notified upon full approval.
        </p>
        {err && <div className="arc-err"><AlertTriangle size={14} /> {err}</div>}
        {canActivate ? (
          <button className="arc-cta" onClick={activate} disabled={busy || done}>
            <span className="arc-cta-shine" aria-hidden />
            {done ? <><CheckCircle2 size={16} /> Activated</>
              : busy ? <><Sparkles size={15} className="arc-spin" /> Activating…</>
                : <><Zap size={16} /> Activate Design Review</>}
          </button>
        ) : (
          <span className="arc-lock"><Lock size={13} /> Activated by the Supervision Manager / PM when needed.</span>
        )}
      </div>
      <span className="arc-bridge" aria-hidden><Link2 size={40} /></span>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
Styles — engineering ink board, paper slabs, living elements
═══════════════════════════════════════════════════════════════ */
const ARC_CSS = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap'); .arc{ position:relative; overflow:hidden; display:flex; gap:18px; align-items:flex-start; padding:22px; border:1.5px dashed rgba(139,92,246,.45); border-radius:16px; background:linear-gradient(135deg, rgba(139,92,246,.08), rgba(14,165,233,.03) 60%, transparent); animation:arc-rise .55s cubic-bezier(.2,.7,.2,1) both; transition:border-color .4s, background .4s; } @keyframes arc-rise{ from{ opacity:0; transform:translateY(12px);} to{ opacity:1; transform:none;} } .arc-done{ border-style:solid; border-color:rgba(16,185,129,.55); background:linear-gradient(135deg, rgba(16,185,129,.10), transparent 70%); } .arc-ambient{ position:absolute; inset:0; pointer-events:none; background:radial-gradient(60% 80% at 100% 0%, rgba(139,92,246,.12), transparent 60%), linear-gradient(rgba(139,92,246,.05) 1px,transparent 1px), linear-gradient(90deg,rgba(139,92,246,.05) 1px,transparent 1px); background-size:auto,34px 34px,34px 34px; } .arc > *:not(.arc-ambient){ position:relative; } .arc-orb{ flex:none; width:52px; height:52px; border-radius:14px; display:grid; place-items:center; background:linear-gradient(145deg, rgba(139,92,246,.22), rgba(139,92,246,.08)); color:var(--violet,#8b5cf6); border:1px solid rgba(139,92,246,.4); animation:arc-pulse 2.6s ease-in-out infinite; } @keyframes arc-pulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(139,92,246,.35);} 50%{ box-shadow:0 0 0 8px rgba(139,92,246,0);} } .arc-done .arc-orb{ background:linear-gradient(145deg, rgba(16,185,129,.22), rgba(16,185,129,.08)); color:var(--emerald,#10b981); border-color:rgba(16,185,129,.4); animation:none; } .arc-body{ flex:1; min-width:0; } .arc-kicker{ font-family:'Space Grotesk'; font-size:10px; letter-spacing:.26em; color:var(--violet,#8b5cf6); } .arc-done .arc-kicker{ color:var(--emerald,#10b981); } .arc-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:18px; font-weight:700; margin:5px 0 7px; color:var(--paper,#0f172a); } .arc-sub{ font-size:12.5px; line-height:1.7; color:var(--mut,#64748b); margin:0 0 14px; max-width:62ch; } .arc-err{ display:flex; align-items:center; gap:7px; font-size:12px; color:var(--rose,#ef4444); background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.35); border-radius:9px; padding:8px 11px; margin-bottom:12px; } .arc-cta{ position:relative; overflow:hidden; display:inline-flex; align-items:center; gap:8px; font-family:inherit; font-size:13px; font-weight:700; color:#ffffff; cursor:pointer; border:none; padding:10px 20px; border-radius:11px; background:linear-gradient(120deg,#8b5cf6,#7c3aed); box-shadow:0 12px 28px -14px rgba(124,58,237,.85); transition:transform .25s, filter .25s; } .arc-cta:hover:not(:disabled){ transform:translateY(-2px); filter:brightness(1.06); } .arc-cta:disabled{ cursor:default; } .arc-done .arc-cta{ background:linear-gradient(120deg,#10b981,#059669); color:#ffffff; box-shadow:0 12px 28px -14px rgba(5,150,105,.8); } .arc-cta-shine{ position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent); transform:translateX(-130%); } .arc-cta:hover:not(:disabled) .arc-cta-shine{ animation:arc-shine .8s ease; } @keyframes arc-shine{ to{ transform:translateX(130%);} } .arc-spin{ animation:arc-spin .8s linear infinite; } @keyframes arc-spin{ to{ transform:rotate(360deg);} } .arc-lock{ display:inline-flex; align-items:center; gap:7px; font-size:12px; color:var(--mut,#64748b); background:rgba(0,0,0,.03); border:1px solid var(--line,#e2e8f0); border-radius:9px; padding:8px 12px; } .arc-bridge{ position:absolute; inset-inline-end:14px; bottom:8px; color:rgba(139,92,246,.12); transform:rotate(-12deg); pointer-events:none; } @media (max-width:560px){ .arc{ flex-direction:column; } .arc-bridge{ display:none; } }`;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.pd-root{
--ink:#ffffff; --ink2:#f8fafc; --surf:#ffffff; --surf2:#f1f5f9; --line:#e2e8f0;
--paper:#0f172a; --mut:#64748b; --amber:#f59e0b; --emerald:#10b981; --sky:#0ea5e9;
--rose:#ef4444; --violet:#8b5cf6; --slate:#64748b;
position:relative; min-height:100vh; color:var(--paper);
font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
background:linear-gradient(180deg,#f8fafc,#f1f5f9);
}
.pd-ambient{ position:absolute; inset:0; pointer-events:none;
background:
radial-gradient(58% 44% at 92% -6%, rgba(245,158,11,.08), transparent 60%),
radial-gradient(50% 42% at -4% 104%, rgba(14,165,233,.06), transparent 60%),
linear-gradient(rgba(14,165,233,.03) 1px, transparent 1px),
linear-gradient(90deg, rgba(14,165,233,.03) 1px, transparent 1px);
background-size:auto,auto,46px 46px,46px 46px;
-webkit-mask-image:radial-gradient(125% 100% at 50% 0%,#000,transparent 88%);
mask-image:radial-gradient(125% 100% at 50% 0%,#000,transparent 88%);
}
.pd-shell{ position:relative; max-width:1180px; margin:0 auto; padding:26px clamp(16px,3vw,34px) 70px; }
.pd-load{ display:flex; align-items:center; justify-content:center; gap:10px; min-height:60vh; color:var(--mut); }
.pd-spin{ animation:pdspin .9s linear infinite; } @keyframes pdspin{ to{ transform:rotate(360deg); } }
.rv{ opacity:0; transform:translateY(16px); transition:opacity .65s ease, transform .65s cubic-bezier(.2,.7,.2,1); }
.rv.in{ opacity:1; transform:none; }
/* Header */
.pd-head{ display:flex; align-items:flex-start; gap:16px; padding-bottom:20px; border-bottom:1px solid var(--line); }
.pd-back{ display:grid; place-items:center; width:38px; height:38px; border:1px solid var(--line); border-radius:11px; color:var(--mut); background:var(--surf); transition:.25s; flex:none; box-shadow:0 1px 3px rgba(0,0,0,.02); }
.pd-back:hover{ color:var(--sky); border-color:var(--sky); transform:translateX(3px); background:rgba(14,165,233,.05); }
.pd-head-main{ flex:1; min-width:0; }
.pd-pno{ display:flex; align-items:center; gap:7px; font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.18em; color:#d97706; font-weight:700;}
.pd-dotsep{ width:4px; height:4px; border-radius:50%; background:var(--line); display:inline-block; }
.pd-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(28px,4.6vw,52px); font-weight:700; line-height:1.02; letter-spacing:-.02em; margin:6px 0 8px; color:var(--paper); }
.pd-meta{ display:flex; flex-wrap:wrap; gap:10px; color:var(--mut); font-size:12.5px; font-weight:500; align-items:center;}
.pd-meta span{ display:inline-flex; align-items:center; gap:5px; }
.pd-head-right{ display:flex; flex-direction:column; align-items:flex-end; gap:12px; flex:none; }
.pd-ring-wrap{ display:flex; align-items:center; gap:10px; }
.pd-ring{ width:52px; height:52px; }
.pd-ring circle:nth-child(1) { stroke: rgba(0,0,0,.08) !important; }
.pd-ring-txt{ display:flex; flex-direction:column; align-items:flex-start; }
.pd-ring-txt{ font-family:'Space Grotesk'; font-size:24px; font-weight:700; line-height:1; color:var(--paper); }
.pd-ring-txt span{ font-family:'IBM Plex Sans Arabic'; font-size:10px; color:var(--mut); letter-spacing:.1em; font-weight:600;}
/* Badges & colors */
.pd-badge{ display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:600; white-space:nowrap; }
.pd-badge.big{ font-size:13px; padding:5px 13px; }
.t-slate{ background:rgba(100,116,139,.12); color:#475569; }
.t-amber{ background:rgba(245,158,11,.12); color:#d97706; }
.t-emerald{ background:rgba(16,185,129,.12); color:#059669; }
.t-sky{ background:rgba(14,165,233,.12); color:#0284c7; }
.t-rose{ background:rgba(239,68,68,.12); color:#dc2626; }
.t-violet{ background:rgba(139,92,246,.12); color:#7c3aed; }
.pd-pulse{ width:7px; height:7px; border-radius:50%; background:currentColor; position:relative; }
.pd-pulse::after{ content:""; position:absolute; inset:-3px; border-radius:50%; background:currentColor; opacity:.4; animation:pdping 1.8s infinite; }
@keyframes pdping{ 70%,100%{ transform:scale(2.4); opacity:0; } }
/* Slabs */
.pd-slabs{ display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-top:18px; }
.pd-slab{ background:var(--surf); border:1px solid var(--line); border-radius:14px; padding:13px 15px; transition:.3s; box-shadow:0 2px 8px rgba(0,0,0,.02); }
.pd-slab:hover{ border-color:#cbd5e1; transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,.04); }
.pd-slab.acc{ border-color:rgba(245,158,11,.3); background:linear-gradient(135deg,rgba(245,158,11,.05),var(--surf)); }
.pd-slab-l{ display:block; font-size:10.5px; letter-spacing:.1em; color:var(--mut); font-weight:600; }
.pd-slab-v{ display:flex; align-items:center; gap:5px; font-size:15px; font-weight:700; margin-top:5px; color:var(--paper); }
.pd-slab-v.mono{ font-family:'JetBrains Mono',monospace; font-size:13px; color:#d97706; }
/* Layout */
.pd-grid{ display:grid; grid-template-columns:1fr 70px; gap:16px; margin-top:18px; align-items:start; }
.pd-main{ display:flex; flex-direction:column; gap:16px; min-width:0; }
@media(max-width:900px){ .pd-slabs{ grid-template-columns:1fr 1fr; } .pd-grid{ grid-template-columns:1fr; } .pd-float{ display:none; } }
/* Blocks */
.pd-block{ background:var(--surf); border:1px solid var(--line); border-radius:16px; padding:18px; transition:.3s; box-shadow:0 2px 10px rgba(0,0,0,.02); }
.pd-block:hover{ border-color:#cbd5e1; }
.pd-block-h{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; }
.pd-tag{ font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:.22em; color:var(--mut); font-weight:600;}
.pd-block-t{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:18px; font-weight:700; margin-top:3px; color:var(--paper); }
.pd-block-sub{ font-size:11px; color:var(--mut); font-weight:500;}
.pd-editable{ font-size:10.5px; color:#059669; background:rgba(16,185,129,.12); padding:3px 9px; border-radius:999px; font-weight:600;}
.pd-readonly{ font-size:10.5px; color:var(--mut); font-weight:600;}
.pd-empty-mini{ font-size:12.5px; color:var(--mut); padding:8px 0; font-weight:500;}
/* ✅ التعديل 3: سكرول داخلي لقسم المهام */
.pd-tasks-scroll{ max-height:600px; overflow-y:auto; padding-right:6px; }
.pd-tasks-scroll::-webkit-scrollbar{ width:8px; }
.pd-tasks-scroll::-webkit-scrollbar-track{ background:rgba(0,0,0,.03); border-radius:10px; }
.pd-tasks-scroll::-webkit-scrollbar-thumb{ background:rgba(14,165,233,.3); border-radius:10px; }
.pd-tasks-scroll::-webkit-scrollbar-thumb:hover{ background:rgba(14,165,233,.5); }
/* Lifecycle */
.pd-lc{ list-style:none; margin:0; padding:0; display:flex; gap:0; overflow-x:auto; padding-bottom:6px; }
.pd-lc-node{ position:relative; flex:1; min-width:108px; display:flex; flex-direction:column; align-items:center; gap:6px; padding-top:18px; }
.pd-lc-line{ position:absolute; top:24px; right:50%; width:100%; height:2px; background:var(--line); }
.pd-lc-dot{ position:relative; z-index:1; width:14px; height:14px; border-radius:50%; background:var(--slate); border:3px solid var(--surf); box-shadow:0 0 0 1px var(--line); }
.pd-lc-dot.done{ background:var(--emerald); box-shadow:0 0 0 1px var(--emerald); }
.pd-lc-dot.live{ background:var(--amber); animation:pdping2 1.8s infinite; box-shadow:0 0 0 1px var(--amber); }
.pd-lc-dot.over{ background:var(--rose); box-shadow:0 0 0 1px var(--rose); }
@keyframes pdping2{ 0%,100%{ box-shadow:0 0 0 0 rgba(245,158,11,.4);} 70%{ box-shadow:0 0 0 8px rgba(245,158,11,0);} }
.pd-lc-name{ font-size:12px; font-weight:700; color:var(--paper); }
.pd-lc-st{ font-size:10px; font-weight:600;}
.pd-lc-dates{ display:flex; flex-direction:column; align-items:center; font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--mut); gap:1px; font-weight:600;}
/* The four flags */
.pd-flags{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media(max-width:560px){ .pd-flags{ grid-template-columns:1fr; } }
.pd-flag{ border:1px solid var(--line); border-radius:14px; padding:14px; border-top:3px solid var(--slate); transition:.3s; background:var(--surf); }
.pd-flag:hover{ transform:translateY(-3px); box-shadow:0 4px 12px rgba(0,0,0,.03); }
.pd-flag.acc-sky{ border-top-color:var(--sky); } .pd-flag.acc-violet{ border-top-color:var(--violet); }
.pd-flag.acc-amber{ border-top-color:var(--amber); } .pd-flag.acc-emerald{ border-top-color:var(--emerald); }
.pd-flag.held{ border-color:rgba(239,68,68,.3); background:rgba(239,68,68,.04); }
.pd-flag-top{ display:flex; align-items:center; gap:8px; }
.pd-flag-ic{ display:grid; place-items:center; width:28px; height:28px; border-radius:8px; background:rgba(0,0,0,.04); color:var(--paper); }
.pd-flag-label{ font-weight:700; flex:1; color:var(--paper); }
.pd-bar{ position:relative; height:6px; border-radius:99px; background:rgba(0,0,0,.06); margin:12px 0 4px; }
.pd-bar span{ position:absolute; inset-inline-start:0; top:0; height:100%; border-radius:99px; background:linear-gradient(90deg,var(--sky),var(--emerald)); transition:width .8s ease; }
.pd-bar em{ position:absolute; inset-inline-end:0; top:-16px; font-style:normal; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--mut); font-weight:600;}
.pd-flag-sub{ font-size:11px; color:var(--mut); font-weight:500;}
.pd-flag-acts{ display:flex; gap:6px; margin-top:10px; }
.pd-hold{ margin-top:10px; }
.pd-hold-flag{ display:inline-flex; align-items:center; gap:5px; font-size:10.5px; color:#dc2626; background:rgba(239,68,68,.1); padding:3px 8px; border-radius:999px; font-weight:600;}
.pd-hold-reason{ font-size:11.5px; color:var(--paper); margin:6px 0; font-weight:500;}
/* Small buttons */
.pd-mini{ display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:#0284c7; background:rgba(14,165,233,.1); border:1px solid rgba(14,165,233,.2); padding:4px 9px; border-radius:8px; cursor:pointer; transition:.2s; font-family:inherit; }
.pd-mini:hover{ background:rgba(14,165,233,.2); }
.pd-mini.rose{ color:#dc2626; background:rgba(239,68,68,.1); border-color:rgba(239,68,68,.2); }
.pd-mini:disabled{ opacity:.5; cursor:not-allowed; }
/* Priority */
.pd-prio-now{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.pd-prio-log{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.pd-prio-log li{ display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid var(--line); }
.pd-log-reason{ flex:1; font-size:12px; color:var(--paper); font-weight:500;}
.pd-log-by{ font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--mut); white-space:nowrap; font-weight:600;}
.pd-prio-pick{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:6px 0 14px; }
.pd-prio-opt{ padding:8px; border-radius:9px; border:1px solid var(--line); background:var(--surf2); cursor:pointer; font-family:inherit; font-size:12px; font-weight:700; transition:.2s; color:var(--mut); }
.pd-prio-opt.on{ outline:2px solid currentColor; background:var(--surf); color:var(--paper); }
/* Tendering */
.pd-tender{ display:flex; flex-direction:column; gap:12px; }
.pd-trow{ border:1px solid var(--line); border-radius:12px; padding:12px; background:var(--surf); }
.pd-trow-h{ display:flex; align-items:center; gap:8px; }
.pd-trow-label{ flex:1; font-size:13px; font-weight:700; color:var(--paper); }
.pd-trow-note{ font-size:11.5px; color:var(--mut); margin-top:6px; font-weight:500;}
/* Finance */
.pd-fin{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:9px; }
.pd-fin-row{ display:grid; grid-template-columns:1.4fr 1fr auto auto; align-items:center; gap:12px; padding:10px 12px; border:1px solid var(--line); border-radius:11px; transition:.25s; background:var(--surf); }
.pd-fin-row:hover{ border-color:#cbd5e1; transform:translateX(-2px); box-shadow:0 2px 8px rgba(0,0,0,.03); }
.pd-fin-row.over{ border-color:rgba(239,68,68,.3); background:rgba(239,68,68,.03); }
.pd-fin-title{ font-size:13px; font-weight:700; display:block; color:var(--paper); }
.pd-fin-ms{ font-size:10px; color:var(--mut); font-weight:600;}
.pd-fin-bar{ position:relative; height:5px; border-radius:99px; background:rgba(0,0,0,.06); }
.pd-fin-bar span{ position:absolute; inset-inline-start:0; top:0; height:100%; border-radius:99px; background:var(--emerald); transition:width .8s ease; }
.pd-fin-bar em{ position:absolute; inset-inline-end:0; top:-14px; font-style:normal; font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--mut); font-weight:600;}
.pd-fin-nums{ display:flex; flex-direction:column; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--mut); text-align:end; font-weight:600;}
/* ✅ التعديل الجديد: عرض النسبة المئوية الصريحة للموظفين */
.pd-fin-pct{ display:flex; flex-direction:column; align-items:flex-end; font-family:'JetBrains Mono',monospace; min-width:60px; }
.pd-fin-pct-label{ font-size:9px; color:var(--mut); font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
.pd-fin-pct-value{ font-size:16px; font-weight:700; color:var(--emerald); line-height:1.1; }
@media(max-width:640px){ .pd-fin-row{ grid-template-columns:1fr auto; } .pd-fin-bar,.pd-fin-nums{ display:none; } }
/* Offer / Contract */
.pd-offer{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
.pd-srow{ display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid var(--line); border-radius:11px; background:var(--surf); }
.pd-srow span:first-child{ font-size:12px; color:var(--mut); font-weight:600;}
.pd-contract{ border:1px dashed var(--line); border-radius:12px; padding:12px; background:var(--surf2); }
.pd-contract-now{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:var(--mut); }
.pd-contract-now a{ color:var(--sky); text-decoration:none; }
.pd-contract-now a:hover{ text-decoration:underline; }
.pd-contract-up{ display:flex; gap:8px; align-items:center; margin-top:10px; }
.pd-contract-up input{ font-size:12px; color:var(--paper); }
/* Notes */
.pd-notes{ list-style:none; margin:0 0 12px; padding:0; display:flex; flex-direction:column; gap:9px; max-height:280px; overflow-y:auto; }
.pd-notes li{ border-inline-start:3px solid var(--line); padding:8px 12px; background:var(--surf2); border-radius:0 10px 10px 0; }
.pd-notes li.pinned{ border-inline-start-color:var(--amber); background:rgba(245,158,11,.05); }
.pd-note-h{ display:flex; justify-content:space-between; margin-bottom:4px; }
.pd-note-by{ font-size:12px; font-weight:700; color:var(--paper); }
.pd-note-date{ font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--mut); font-weight:600;}
.pd-note-body{ font-size:12.5px; line-height:1.6; color:var(--paper); font-weight:500;}
.pd-note-add{ display:flex; gap:8px; align-items:flex-start; border:1px solid var(--line); border-radius:12px; padding:8px; background:var(--surf); transition:.2s; }
.pd-note-add:focus-within{ border-color:var(--sky); box-shadow:0 0 0 3px rgba(14,165,233,.1); }
.pd-note-add svg{ margin-top:8px; color:var(--mut); flex:none; }
.pd-note-add textarea{ flex:1; border:none; background:transparent; resize:none; color:var(--paper); font-family:inherit; font-size:13px; outline:none; font-weight:500;}
.pd-note-add textarea::placeholder{ color:#94a3b8; }
/* Floating buttons */
.pd-float{ position:sticky; top:24px; display:flex; flex-direction:column; gap:12px; }
.pd-fbtn{ display:flex; flex-direction:column; align-items:center; gap:5px; padding:12px 8px; border:1px solid var(--line); border-radius:14px; background:var(--surf); transition:.3s; cursor:default; box-shadow:0 2px 10px rgba(0,0,0,.02); }
.pd-fbtn:hover{ transform:scale(1.05); box-shadow:0 6px 16px rgba(0,0,0,.05); }
.pd-fbtn.acc-sky{ border-color:rgba(14,165,233,.3); } .pd-fbtn.acc-violet{ border-color:rgba(139,92,246,.3); }
.pd-fbtn-dot{ width:11px; height:11px; border-radius:50%; background:var(--slate); box-shadow:0 0 0 2px var(--surf); }
.pd-fbtn-dot.done{ background:var(--emerald); } .pd-fbtn-dot.live{ background:var(--amber); animation:pdping2 1.8s infinite; }
.pd-fbtn-l{ font-family:'Space Grotesk'; font-weight:700; font-size:13px; color:var(--paper); }
.pd-fbtn-p{ font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--mut); font-weight:600;}
/* Fields & modals */
.pd-lbl{ display:block; font-size:12px; color:var(--mut); margin:4px 0 6px; font-weight:600;}
.pd-lbl b{ color:var(--rose); }
.pd-ta{ width:100%; border:1px solid var(--line); border-radius:10px; background:var(--surf); color:var(--paper); padding:9px 11px; font-family:inherit; font-size:13px; resize:vertical; outline:none; font-weight:500; transition:.2s; }
.pd-ta:focus{ border-color:var(--sky); box-shadow:0 0 0 3px rgba(14,165,233,.1); }
.pd-ta.mini{ min-height:34px; }
.pd-mask{ position:fixed; inset:0; z-index:60; display:grid; place-items:center; padding:18px; background:rgba(15,23,42,.4); backdrop-filter:blur(3px); }
.pd-modal{ width:min(440px,100%); background:var(--surf); border:1px solid var(--line); border-radius:16px; overflow:hidden; animation:pdpop .25s ease; box-shadow:0 20px 40px -10px rgba(0,0,0,.15); }
@keyframes pdpop{ from{ opacity:0; transform:scale(.95) translateY(8px);} to{ opacity:1; transform:none; } }
.pd-modal-h{ display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid var(--line); background:var(--surf2); }
.pd-modal-h h3{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:16px; font-weight:700; color:var(--paper); }
.pd-modal-h button{ background:none; border:none; color:var(--mut); cursor:pointer; transition:.2s; }
.pd-modal-h button:hover{ color:var(--rose); }
.pd-modal-b{ padding:16px; display:flex; flex-direction:column; gap:6px; }
.pd-modal-foot{ display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
.pd-ghost{ padding:8px 14px; border:1px solid var(--line); border-radius:9px; background:transparent; color:var(--mut); cursor:pointer; font-family:inherit; font-size:13px; font-weight:700; transition:.2s; }
.pd-ghost:hover{ background:var(--surf2); color:var(--paper); }
.pd-solid{ display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border:none; border-radius:9px; background:var(--emerald); color:#ffffff; font-weight:700; cursor:pointer; font-family:inherit; font-size:13px; transition:.2s; box-shadow:0 4px 10px -2px rgba(16,185,129,.4); }
.pd-solid:hover{ filter:brightness(1.08); transform:translateY(-1px); } .pd-solid:disabled{ opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; }
.pd-solid.rose{ background:var(--rose); color:#ffffff; box-shadow:0 4px 10px -2px rgba(239,68,68,.4); }

/* External Logs */
.pd-extlogs{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:9px; }
.pd-extlog{ border:1px solid var(--line); border-radius:12px; padding:10px 12px; background:var(--surf); transition:.25s; }
.pd-extlog:hover{ border-color:#cbd5e1; transform:translateX(-2px); }
.pd-extlog-main{ display:flex; align-items:center; gap:8px; }
.pd-extlog-type{ font-size:13px; font-weight:700; color:var(--paper); }
.pd-extlog-desc{ font-size:12px; color:var(--mut); margin:6px 0 0; line-height:1.6; }
.pd-extlog-foot{ display:flex; justify-content:space-between; align-items:center; margin-top:8px; }
.pd-extlog-date{ font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--mut); }
.pd-extlog-link{ display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:700; color:var(--sky); text-decoration:none; }
.pd-extlog-link:hover{ text-decoration:underline; }
.pd-select{ flex:1; border:1px solid var(--line); border-radius:8px; background:var(--surf); color:var(--paper); font-family:inherit; font-size:12px; font-weight:600; padding:5px 8px; outline:none; transition:border-color .2s; }
.pd-select:focus{ border-color:var(--amber); }
`;

 
