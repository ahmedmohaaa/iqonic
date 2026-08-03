import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectDetails } from '../../api/services/projectDetails';
import apiClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ChangeOrdersPanel from './components/ChangeOrdersPanel';
import InvoiceConsole from '../../pages/Financials/InvoiceConsole';
import InternalDesignReviewPanel from './components/InternalDesignReviewPanel';
import {
  ArrowLeft, Hash, Building2, Calendar, MapPin, Clock, Flag, Lock, FileText,
  Upload, StickyNote, Send, AtSign, CheckCircle2, Circle, AlertTriangle,
  Hammer, Wrench, Pencil, X, DollarSign, Layers, Activity, ChevronRight,
  Workflow, Sparkles, Link2,Zap
} from 'lucide-react';
import { activateInternalReview } from '../../api/services/internalReview';
/* ═══════════════════════════════════════════════════════════════
   خريطة الحالات → لون/تسمية (مصدر واحد للواجهة كلها)
   ═══════════════════════════════════════════════════════════════ */
const SM = {
  NOT_STARTED:    { c: 'slate',   t: 'لم يبدأ' },
  PENDING:        { c: 'slate',   t: 'معلّق' },
  UPCOMING:       { c: 'slate',   t: 'قادم' },
  IN_PROGRESS:    { c: 'amber',   t: 'قيد التنفيذ' },
  ON_GOING:       { c: 'amber',   t: 'جارٍ' },
  COMPLETED:      { c: 'emerald', t: 'مكتمل' },
  ACHIEVED:       { c: 'emerald', t: 'مُنجَز' },
  APPROVED:       { c: 'emerald', t: 'معتمَد' },
  PAID:           { c: 'emerald', t: 'مسدّد' },
  PARTIALLY_PAID: { c: 'amber',   t: 'مسدّد جزئياً' },
  ISSUED:         { c: 'sky',     t: 'مُصدَر' },
  DRAFT:          { c: 'slate',   t: 'مسوّدة' },
  OVERDUE:        { c: 'rose',    t: 'متأخر' },
  ON_HOLD:        { c: 'rose',    t: 'موقوف' },
};
const meta = (s) => SM[s] || { c: 'slate', t: s || '—' };

/* ── صلاحيات الصفحة (مطابقة لـ permissions.py حرفياً) ─────── */
function usePerms(user, project) {
  const r = user?.role, u = user?.username, d = user?.department;
  const isMgmt = r === 'GM' || r === 'AGM';
  const isDMgr = r === 'DESIGN_MGR';
  const isAcc = r === 'ACCOUNTANT';
  const isSec = r === 'SECRETARY';
  const designMgrs = isMgmt || isDMgr; 
const isSupMgr = r === 'SUP_MGR' || r === 'PM';
return {
    canManageOffer: ['GM','AGM','DESIGN_MGR'].includes(r) || (isSec && (d === 'Design' || d === 'Management')),
    canEditInfo:     designMgrs || (isSec && (d === 'Design' || d === 'Management')),
    canEditLifecycle:r === 'DESIGN_MGR' || r === 'AGM' || r === 'GM',
    canEditTender:   r === 'AGM',                       // نسرين فقط
    canEditPriority: designMgrs,
    canSeeContract:  isMgmt || isAcc,
    canSeeNumbers:   isMgmt || isAcc || isDMgr || r === 'SUP_MGR' || r === 'PM',
    canAddInvoice:   isMgmt || isAcc,
    canEditStruct:   u === 'mohammad.mostafa' || isMgmt || isDMgr,
    canEditIFC:      u === 'shaaban.karam' || isMgmt || isDMgr,
canManageChangeOrder: isMgmt || isDMgr || isSupMgr || (isSec && (d === 'Design' || d === 'Management' || d === 'Supervision')),
canConfirmChangeOrder: isMgmt || isDMgr,

    canActivateReview: ['SUP_MGR', 'PM', 'GM', 'AGM'].includes(r),
  };
}

/* ── خطّافات حيّة ─────────────────────────────────────────── */
function CountUp({ value, dec = 0, suffix = '' }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const to = Number(value) || 0, start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900), e = 1 - Math.pow(1 - p, 3);
      setN((to) * e); if (p < 1) raf = requestAnimationFrame(tick);
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

/* ═══════════════════════════════════════════════════════════════ */
export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const wrap = useReveal([p]);

  // حالات محلية للنوافذ
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [prioOpen, setPrioOpen] = useState(false);
  const [prioForm, setPrioForm] = useState({ priority: 'MEDIUM', reason: '' });
  const [note, setNote] = useState('');
  const [contractFile, setContractFile] = useState(null);

  const P = usePerms(user, p);

  const load = () => {
    setLoading(true);
    getProjectDetails(id).then((r) => setP(r.data)).catch(() => setP(null)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="pd-root"><style>{CSS}</style><div className="pd-load"><Layers className="pd-spin" /> جارٍ تحميل المشروع…</div></div>;
  if (!p) return <div className="pd-root"><style>{CSS}</style><div className="pd-load">المشروع غير موجود</div></div>;

  /* ── حساب حالات الأزرار الأربعة ─────────────────────── */
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

  /* ── أفعال ──────────────────────────────────────────── */
  const cycleStruct = () => {
    const order = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    const next = order[Math.min(order.indexOf(structState) + 1, 2)];
    if (next === structState) return;
    apiClient.patch(`projects/${id}/structural-status/`, { status: next }).then(load);
  };
  const cycleOffer = () => {
    const order = ['NOT_SUBMITTED', 'SUBMITTED', 'APPROVED'];
    const next = order[Math.min(order.indexOf(p.offer_status) + 1, 2)];
    apiClient.patch(`projects/${id}/offer-status/`, { offer_status: next }).then(load);
  };
  const cycleContract = () => {
    const order = ['NOT_SUBMITTED', 'SUBMITTED', 'APPROVED'];
    const next = order[Math.min(order.indexOf(p.contract_status) + 1, 2)];
    apiClient.patch(`projects/${id}/offer-status/`, { contract_status: next }).then(load);
  };
  const holdStruct = () => {
    if (!holdReason.trim()) return;
    apiClient.patch(`projects/${id}/structural-status/`, { status: 'ON_HOLD', hold_reason: holdReason })
      .then(() => { setHoldOpen(false); setHoldReason(''); load(); });
  };
  const resumeStruct = () => apiClient.patch(`projects/${id}/structural-status/`, { status: 'IN_PROGRESS' }).then(load);
  const cycleIFC = () => {
    const order = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    const next = order[Math.min(order.indexOf(ifcState) + 1, 2)];
    if (next === ifcState) return;
    apiClient.patch(`projects/${id}/ifc-status/`, { status: next }).then(load);
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
    ['GM', 'AGM', 'ACCOUNTANT'].includes(user?.role);
  
  return (
    <div ref={wrap} className="pd-root" dir="rtl">
      <style>{CSS}</style>
      <div className="pd-ambient" aria-hidden />

      <div className="pd-shell">
        {/* ── الرأس ─────────────────────────────────── */}
        <header className="rv pd-head">
          <Link to="/projects" className="pd-back"><ArrowLeft size={18} /></Link>
          <div className="pd-head-main">
            <div className="pd-pno"><Hash size={13} /> {p.project_no} <i className="pd-dotsep" /> {p.scope}</div>
            <h1 className="pd-title">{p.name}</h1>
            <div className="pd-meta">
              <span><Building2 size={13} /> {p.client_name || '—'}</span>
              {p.location && <span><MapPin size={13} /> {p.location}</span>}
              <span><Calendar size={13} /> {p.start_date || 'لم يبدأ'}</span>
              {p.duration_days > 0 && <span><Clock size={13} /> {p.duration_days} يوم</span>}
            </div>
          </div>
          <div className="pd-head-right">
            <Badge c={overall === 'ACTIVE' ? 'emerald' : 'slate'} pulse={overall === 'ACTIVE'}>
              {overall === 'ACTIVE' ? 'نشط' : 'مغلق'}
            </Badge>
            <div className="pd-ring-wrap">
              <Ring pct={pct} />
              <div className="pd-ring-txt"><CountUp value={pct} suffix="%" /><span>إنجاز</span></div>
            </div>
          </div>
        </header>

        {/* ── ألواح المؤشرات (غير متساوية) ─────────── */}
        <div className="rv pd-slabs">
          <Slab label="العميل" v={p.client_name || '—'} />
          <Slab label="البداية الفعلية" v={p.start_date || 'مرهونة بأول دفعة'} mono />
          <Slab label="الموقع" v={p.location || '—'} />
          {P.canSeeNumbers && (
            <Slab accent label="قيمة العقد" v={<CountUp value={p.contract_value} dec={0} />} money />
          )}
        </div>

        {/* ── التخطيط: محتوى + أزرار عائمة ─────────── */}
        <div className="pd-grid">
          <div className="pd-main">

            {/* دورة الحياة */}
            <Block rv tag="LIFECYCLE" title="دورة حياة المشروع"
              action={P.canEditLifecycle ? <span className="pd-editable">قابل للتحديث</span> : <span className="pd-readonly">للعرض</span>}>
              <LifecycleRibbon
                stages={stages}
                canEdit={P.canEditLifecycle}
                onReload={load}
                projectId={id}
              />
            </Block>

            {/* الأزرار الأربعة */}
            <Block rv tag="FLAGS" title="أزرار الحالة والتخصصات">
              <div className="pd-flags">
                <FlagCard label="DC1" accent="sky" state={dc1State} pct={dc1Pct}
                  sub={`${dc1.completed || 0}/${dc1.total || 0} تخصص`} />
                <FlagCard label="DC2" accent="violet" state={dc2State} pct={dc2Pct}
                  sub={`${dc2.completed || 0}/${dc2.total || 0} تخصص`} />
                <FlagCard label="Structural" accent="amber" state={structState} icon={<Hammer size={15} />}
                  interactive={P.canEditStruct} onCycle={cycleStruct}
                  hold={structState === 'ON_HOLD'} holdInfo={struct}
                  onHold={() => setHoldOpen(true)} onResume={resumeStruct} />
                <FlagCard label="IFC Package" accent="emerald" state={ifcState} icon={<Wrench size={15} />}
                  interactive={P.canEditIFC} onCycle={cycleIFC} />
           </div>
         </Block>

         {/* ── Change Orders / Revisions ── */}
         <Block rv tag="CHANGE ORDERS" title="أوامر التغيير / المراجعات (Revisions)"
           action={P.canManageChangeOrder
             ? <span className="pd-editable">إدارة مفعّلة</span>
             : <span className="pd-readonly">للعرض</span>}>
           <ChangeOrdersPanel
             parentId={id}
             parent={p}
             canManage={P.canManageChangeOrder}
             canConfirm={P.canConfirmChangeOrder}
             onReload={load}
           />
         </Block>

        {p.scope === 'SUPERVISION' && (
          <Block rv tag="INTERNAL REVIEW" title="المراجعة التصميمية الداخلية"
            action={p.internal_design_review_required
              ? <span className="pd-editable">مفعّلة</span>
              : <span className="pd-readonly">غير مفعّلة</span>}>
            {p.internal_design_review_required
              ? <InternalDesignReviewPanel project={p} onReload={load} />
              : <ActivateReviewCard projectId={id} canActivate={P.canActivateReview} onDone={load} />}
          </Block>
        )}

            {/* الأولوية */}
            <Block rv tag="PRIORITY" title="أولوية المشروع"
              action={P.canEditPriority
                ? <button className="pd-mini" onClick={() => { setPrioForm({ priority: p.priority, reason: '' }); setPrioOpen(true); }}><Pencil size={13} /> تعديل</button>
                : <span className="pd-readonly">معروضة للجميع</span>}>
              <PriorityView priority={p.priority} history={p.priority_history} />
            </Block>

            {/* المناقصات */}
            <Block rv tag="TENDERING" title="بلوك المناقصات"
              action={P.canEditTender ? <span className="pd-editable">تحرّره نسرين</span> : <span className="pd-readonly">للعرض</span>}>
              <Tendering t={p.tendering} canEdit={P.canEditTender} onChanged={load} pid={id} />
            </Block>

            {/* الحالة المالية — أرقام للمخوّلين، أسماء+نسب للجميع */}
            <Block rv tag="FINANCE" title="الحالة المالية"
              action={P.canSeeNumbers ? <span className="pd-editable">أرقام كاملة</span> : <span className="pd-readonly">الأسماء والنسب فقط</span>}>
              <FinanceStrip invoices={p.invoices} seeNumbers={P.canSeeNumbers} />
            </Block>
            
            {canViewFinancials && <InvoiceConsole projectId={id} />}

            {/* العقد + العرض */}
            <Block rv tag="OFFER / CONTRACT" title="حالة العرض والعقد">
              <div className="pd-offer">
                <div className="pd-srow">
                  <span>حالة العرض</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`pd-badge t-${meta(p.offer_status).c}`}>{meta(p.offer_status).t}</span>
                    {P.canManageOffer && (
                      <button className="pd-mini" onClick={cycleOffer} title="تبديل حالة العرض">
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </span>
                </div>
                <div className="pd-srow">
                  <span>حالة العقد</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`pd-badge t-${meta(p.contract_status).c}`}>{meta(p.contract_status).t}</span>
                    {P.canManageOffer && (
                      <button className="pd-mini" onClick={cycleContract} title="تبديل حالة العقد">
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </span>
                </div>
              </div>
              <ContractSlot existingFile={p.contract_file} canSee={P.canSeeContract}
                canUpload={P.canSeeContract} selectedFile={contractFile} setFile={setContractFile} onUpload={uploadContract} />
            </Block>

            {/* الملاحظات */}
            <Block rv tag="NOTES" title="ملاحظات المشروع" sub="اكتب @all لتنبيه الجميع">
              <NotesBlock notes={p.notes} note={note} setNote={setNote} onAdd={submitNote} />
            </Block>
          </div>

          {/* ── الأزرار العائمة الجانبية (DC1 / DC2) ── */}
          <aside className="pd-float">
            <FloatBtn label="DC1" accent="sky" state={dc1State} pct={dc1Pct} />
            <FloatBtn label="DC2" accent="violet" state={dc2State} pct={dc2Pct} />
          </aside>
        </div>
      </div>

      {/* ── نافذة سبب الإيقاف (Structural) ──────────── */}
      {holdOpen && (
        <Modal title="إيقاف الزرّ الإنشائي" onClose={() => setHoldOpen(false)}>
          <label className="pd-lbl">سبب الإيقاف <b>*</b></label>
          <textarea className="pd-ta" rows={3} value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)} placeholder="لماذا أُوقف الزرّ؟" />
          <div className="pd-modal-foot">
            <button className="pd-ghost" onClick={() => setHoldOpen(false)}>إلغاء</button>
            <button className="pd-solid rose" onClick={holdStruct} disabled={!holdReason.trim()}>تأكيد الإيقاف</button>
          </div>
        </Modal>
      )}

      {/* ── نافذة تعديل الأولوية ───────────────────── */}
      {prioOpen && (
        <Modal title="تعديل أولوية المشروع" onClose={() => setPrioOpen(false)}>
          <label className="pd-lbl">الأولوية</label>
          <div className="pd-prio-pick">
            {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((x) => (
              <button key={x} type="button"
                className={`pd-prio-opt ${prioForm.priority === x ? 'on' : ''} t-${meta(x).c}`}
                onClick={() => setPrioForm({ ...prioForm, priority: x })}>{meta(x).t}</button>
            ))}
          </div>
          <label className="pd-lbl">سبب التعديل <b>*</b></label>
          <textarea className="pd-ta" rows={2} value={prioForm.reason}
            onChange={(e) => setPrioForm({ ...prioForm, reason: e.target.value })} />
          <div className="pd-modal-foot">
            <button className="pd-ghost" onClick={() => setPrioOpen(false)}>إلغاء</button>
            <button className="pd-solid" onClick={submitPrio} disabled={!prioForm.reason.trim()}>حفظ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   المكوّنات الفرعية
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
    OFFER: 'RFQ', CONTRACT_SUBMITTED: 'رفع العقد', CONTRACT_SIGNED: 'توقيع العقد',
    CONCEPT: 'الفكرة', DC1: 'DC1', DC2: 'DC2', TENDER: 'المناقصة',
    COLLECTION: 'الاستلام', CLOSED: 'الإغلاق', DESIGN_PHASE: 'التصميم',
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
           <span className="pd-editable">قابل للتحديث</span>
           <button className="pd-mini" onClick={achieveAll} disabled={busy === 'all'}>
            ⚡ إنجاز الكل بالترتيب (اختبار سريع)
          </button>
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
                {s.planned_date && <span>م:{s.planned_date}</span>}
                {s.actual_date && <span>ف:{s.actual_date}</span>}
              </span>
              
              {canEdit && !done && (
                <button className="pd-mini" style={{ marginTop: 6 }}
                  onClick={() => achieve(s)} disabled={busy === s.id}>
                  {busy === s.id ? '…' : 'إنجاز'}
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

function FlagCard({ label, accent, state, pct, sub, icon, interactive, onCycle, hold, holdInfo, onHold, onResume }) {
  const m = meta(state);
  return (
    <div className={`pd-flag acc-${accent} ${hold ? 'held' : ''}`}>
      <div className="pd-flag-top">
        <span className="pd-flag-ic">{icon || <Flag size={14} />}</span>
        <span className="pd-flag-label">{label}</span>
        <span className={`pd-badge t-${hold ? 'rose' : m.c}`}>{hold ? 'موقوف' : m.t}</span>
      </div>
      {pct != null && (
        <div className="pd-bar"><span style={{ width: `${pct}%` }} /><em>{pct}%</em></div>
      )}
      {sub && <p className="pd-flag-sub">{sub}</p>}

      {hold ? (
        <div className="pd-hold">
          <span className="pd-hold-flag"><AlertTriangle size={12} /> {holdInfo.hold_date}</span>
          {holdInfo.hold_reason && <p className="pd-hold-reason">{holdInfo.hold_reason}</p>}
          {interactive && <button className="pd-mini" onClick={onResume}>استئناف</button>}
        </div>
      ) : (
        interactive && (
          <div className="pd-flag-acts">
            <button className="pd-mini" onClick={onCycle}>تبديل الحالة <ChevronRight size={12} /></button>
            {onHold && <button className="pd-mini rose" onClick={onHold}>إيقاف</button>}
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
              <span className="pd-log-by">{h.updated_by_name} · {new Date(h.created_at).toLocaleDateString('ar')}</span>
            </li>
          ))}
        </ul>
      ) : <p className="pd-empty-mini">لا سجلّ تعديلات بعد.</p>}
    </div>
  );
}

function Tendering({ t, canEdit, onChanged, pid }) {
  const rows = [
    ['boq_status', 'boq_notes', 'BOQ — جدول الكميات'],
    ['specs_status', 'specs_notes', 'Specifications — المواصفات'],
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
              {canEdit && <button className="pd-mini" onClick={() => update(sk, cycle(cur))}>تبديل</button>}
            </div>
            {canEdit
              ? <textarea className="pd-ta mini" rows={1} defaultValue={t?.[nk] || ''}
                  onBlur={(e) => setNotes(nk, e.target.value)} placeholder="ملاحظة تنفيذية…" />
              : (t?.[nk] ? <p className="pd-trow-note">{t[nk]}</p> : null)}
          </div>
        );
      })}
    </div>
  );
}

function FinanceStrip({ invoices, seeNumbers }) {
  const list = invoices || [];
  if (!list.length) return <p className="pd-empty-mini">لا فواتير بعد.</p>;
  return (
    <ul className="pd-fin">
      {list.map((iv) => {
        // للمخوّلين: احسب من الأرقام الفعلية
        // للمهندسين: استخدم النسبة المعقّمة من الباك‑إند
        const pct = seeNumbers
          ? (Number(iv.total_amount) > 0
              ? Math.min(100, Math.round(
                  ((iv.payments || []).reduce((s, x) => s + Number(x.amount_paid || 0), 0)
                   / Number(iv.total_amount)) * 100))
              : 0)
          : (iv.payment_progress_percentage || 0);
        const m = meta(iv.status);
        return (
          <li key={iv.id} className={`pd-fin-row ${iv.status === 'OVERDUE' ? 'over' : ''}`}>
            <div className="pd-fin-main">
              <span className="pd-fin-title">{iv.title}</span>
              <span className="pd-fin-ms">{iv.milestone_type_display}</span>
            </div>
            <div className="pd-fin-bar"><span style={{ width: `${pct}%` }} /><em>{pct}%</em></div>
            {seeNumbers && (
              <div className="pd-fin-nums">
                <span>م: <CountUp value={iv.total_amount} /></span>
                <span>ح: <CountUp value={(iv.payments || []).reduce((s, x) => s + Number(x.amount_paid || 0), 0)} /></span>
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
  if (!canSee && !canUpload) return <p className="pd-empty-mini">ملف العقد مرئي للإدارة والمحاسب فقط.</p>;
  return (
    <div className="pd-contract">
      <div className="pd-contract-now">
        {existingFile ? <><FileText size={15} /> <a href={existingFile} target="_blank" rel="noreferrer">عرض ملف العقد</a></>
                : <><Lock size={14} /> لا ملف مرفوع</>}
      </div>
      {canUpload && (
        <div className="pd-contract-up">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button className="pd-mini" onClick={onUpload} disabled={!selectedFile}><Upload size={12} /> رفع</button>
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
              <span className="pd-note-date">{new Date(n.created_at).toLocaleString('ar')}</span>
            </div>
            <p className="pd-note-body">{n.content}</p>
          </li>
        ))}
        {!list.length && <p className="pd-empty-mini">لا ملاحظات بعد.</p>}
      </ul>
      <div className="pd-note-add">
        <AtSign size={14} />
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="اكتب ملاحظة… استخدم @all لتنبيه الجميع" />
        <button className="pd-solid" onClick={onAdd} disabled={!note.trim()}><Send size={14} /></button>
      </div>
    </div>
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
        <div className="pd-modal-h"><h3>{title}</h3><button onClick={onClose}><X size={18} /></button></div>
        <div className="pd-modal-b">{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   الأنماط — لوحة حبرية هندسية، ألواح ورقية، عناصر حيّة
   ═══════════════════════════════════════════════════════════════ */
   /* ═══════════════════════════════════════════════════════════════
   ActivateReviewCard — بطاقة تفعيل جسر المراجعة (حالة required=false)
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
      setTimeout(() => onDone?.(), 650);   // ومضة نجاح ثم إعادة الجلب
    } catch (e) {
      setErr(e.response?.data?.detail || 'تعذّر تفعيل المراجعة.');
    } finally { setBusy(false); }
  };

  return (
    <section className={`arc ${done ? 'arc-done' : ''}`}>
      <style>{ARC_CSS}</style>
      <div className="arc-ambient" aria-hidden />

      <div className="arc-orb"><Workflow size={22} /></div>
      <div className="arc-body">
        <span className="arc-kicker">INTERNAL DESIGN REVIEW · جسر الإشراف ↔ التصميم</span>
        <h3 className="arc-title">المراجعة التصميمية الداخلية غير مفعّلة</h3>
        <p className="arc-sub">
          هذا المشروع لم يُفتح فيه جسر المراجعة بعد. عند التفعيل، يظهر لمهندسي التصميم
          المعيَّنين ليقيّموا المخططات عبر خمس مراحل (Design Criteria → IFC Package)،
          وتنعكس نتائجهم هنا، ويُنبَّه مدير الإشراف عند الاعتماد الكامل.
        </p>

        {err && <div className="arc-err"><AlertTriangle size={14} /> {err}</div>}

        {canActivate ? (
          <button className="arc-cta" onClick={activate} disabled={busy || done}>
            <span className="arc-cta-shine" aria-hidden />
            {done ? <><CheckCircle2 size={16} /> تم التفعيل</>
              : busy ? <><Sparkles size={15} className="arc-spin" /> جارٍ التفعيل…</>
              : <><Zap size={16} /> تفعيل المراجعة التصميمية</>}
          </button>
        ) : (
          <span className="arc-lock"><Lock size={13} /> يُفعّلها مدير الإشراف / PM عند الحاجة.</span>
        )}
      </div>

      <span className="arc-bridge" aria-hidden><Link2 size={40} /></span>
    </section>
  );
}

const ARC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.arc{ position:relative; overflow:hidden; display:flex; gap:18px; align-items:flex-start;
  padding:22px; border:1.5px dashed rgba(139,92,246,.45); border-radius:16px;
  background:linear-gradient(135deg, rgba(139,92,246,.08), rgba(14,165,233,.03) 60%, transparent);
  animation:arc-rise .55s cubic-bezier(.2,.7,.2,1) both; transition:border-color .4s, background .4s; }
@keyframes arc-rise{ from{ opacity:0; transform:translateY(12px);} to{ opacity:1; transform:none;} }
.arc-done{ border-style:solid; border-color:rgba(16,185,129,.55);
  background:linear-gradient(135deg, rgba(16,185,129,.10), transparent 70%); }
.arc-ambient{ position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(60% 80% at 100% 0%, rgba(139,92,246,.12), transparent 60%),
    linear-gradient(rgba(139,92,246,.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(139,92,246,.05) 1px,transparent 1px);
  background-size:auto,34px 34px,34px 34px; }
.arc > *:not(.arc-ambient){ position:relative; }
.arc-orb{ flex:none; width:52px; height:52px; border-radius:14px; display:grid; place-items:center;
  background:linear-gradient(145deg, rgba(139,92,246,.22), rgba(139,92,246,.08));
  color:var(--violet,#8b5cf6); border:1px solid rgba(139,92,246,.4);
  animation:arc-pulse 2.6s ease-in-out infinite; }
@keyframes arc-pulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(139,92,246,.35);} 50%{ box-shadow:0 0 0 8px rgba(139,92,246,0);} }
.arc-done .arc-orb{ background:linear-gradient(145deg, rgba(16,185,129,.22), rgba(16,185,129,.08));
  color:var(--emerald,#10b981); border-color:rgba(16,185,129,.4); animation:none; }
.arc-body{ flex:1; min-width:0; }
.arc-kicker{ font-family:'Space Grotesk'; font-size:10px; letter-spacing:.26em; color:var(--violet,#8b5cf6); }
.arc-done .arc-kicker{ color:var(--emerald,#10b981); }
.arc-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:18px; font-weight:700; margin:5px 0 7px; color:var(--paper,#0f172a); }
.arc-sub{ font-size:12.5px; line-height:1.7; color:var(--mut,#64748b); margin:0 0 14px; max-width:62ch; }
.arc-err{ display:flex; align-items:center; gap:7px; font-size:12px; color:var(--rose,#ef4444);
  background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.35); border-radius:9px; padding:8px 11px; margin-bottom:12px; }
.arc-cta{ position:relative; overflow:hidden; display:inline-flex; align-items:center; gap:8px;
  font-family:inherit; font-size:13px; font-weight:700; color:#ffffff; cursor:pointer; border:none;
  padding:10px 20px; border-radius:11px; background:linear-gradient(120deg,#8b5cf6,#7c3aed);
  box-shadow:0 12px 28px -14px rgba(124,58,237,.85); transition:transform .25s, filter .25s; }
.arc-cta:hover:not(:disabled){ transform:translateY(-2px); filter:brightness(1.06); }
.arc-cta:disabled{ cursor:default; }
.arc-done .arc-cta{ background:linear-gradient(120deg,#10b981,#059669); color:#ffffff; box-shadow:0 12px 28px -14px rgba(5,150,105,.8); }
.arc-cta-shine{ position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent); transform:translateX(-130%); }
.arc-cta:hover:not(:disabled) .arc-cta-shine{ animation:arc-shine .8s ease; }
@keyframes arc-shine{ to{ transform:translateX(130%);} }
.arc-spin{ animation:arc-spin .8s linear infinite; } @keyframes arc-spin{ to{ transform:rotate(360deg);} }
.arc-lock{ display:inline-flex; align-items:center; gap:7px; font-size:12px; color:var(--mut,#64748b);
  background:rgba(0,0,0,.03); border:1px solid var(--line,#e2e8f0); border-radius:9px; padding:8px 12px; }
.arc-bridge{ position:absolute; inset-inline-end:14px; bottom:8px; color:rgba(139,92,246,.12); transform:rotate(-12deg); pointer-events:none; }
@media (max-width:560px){ .arc{ flex-direction:column; } .arc-bridge{ display:none; } }
`;

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

/* الرأس */
.pd-head{ display:flex; align-items:flex-start; gap:16px; padding-bottom:20px; border-bottom:1px solid var(--line); }
.pd-back{ display:grid; place-items:center; width:38px; height:38px; border:1px solid var(--line); border-radius:11px; color:var(--mut); background:var(--surf); transition:.25s; flex:none; box-shadow:0 1px 3px rgba(0,0,0,.02); }
.pd-back:hover{ color:var(--sky); border-color:var(--sky); transform:translateX(3px); background:rgba(14,165,233,.05); }
.pd-head-main{ flex:1; min-width:0; }
.pd-pno{ display:flex; align-items:center; gap:7px; font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.18em; color:#d97706; font-weight:700;}
.pd-dotsep{ width:4px; height:4px; border-radius:50%; background:var(--line); display:inline-block; }
.pd-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(28px,4.6vw,52px); font-weight:700; line-height:1.02; letter-spacing:-.02em; margin:6px 0 8px; color:var(--paper); }
.pd-meta{ display:flex; flex-wrap:wrap; gap:14px; color:var(--mut); font-size:12.5px; font-weight:500;}
.pd-meta span{ display:inline-flex; align-items:center; gap:5px; }
.pd-head-right{ display:flex; flex-direction:column; align-items:flex-end; gap:12px; flex:none; }
.pd-ring-wrap{ display:flex; align-items:center; gap:10px; }
.pd-ring{ width:52px; height:52px; }
.pd-ring circle:nth-child(1) { stroke: rgba(0,0,0,.08) !important; }
.pd-ring-txt{ display:flex; flex-direction:column; align-items:flex-start; }
.pd-ring-txt{ font-family:'Space Grotesk'; font-size:24px; font-weight:700; line-height:1; color:var(--paper); }
.pd-ring-txt span{ font-family:'IBM Plex Sans Arabic'; font-size:10px; color:var(--mut); letter-spacing:.1em; font-weight:600;}

/* الشارات والألوان */
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

/* الألواح */
.pd-slabs{ display:grid; grid-template-columns:1.4fr 1.4fr 1fr 1fr; gap:12px; margin-top:18px; }
.pd-slab{ background:var(--surf); border:1px solid var(--line); border-radius:14px; padding:13px 15px; transition:.3s; box-shadow:0 2px 8px rgba(0,0,0,.02); }
.pd-slab:hover{ border-color:#cbd5e1; transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,.04); }
.pd-slab.acc{ border-color:rgba(245,158,11,.3); background:linear-gradient(135deg,rgba(245,158,11,.05),var(--surf)); }
.pd-slab-l{ display:block; font-size:10.5px; letter-spacing:.1em; color:var(--mut); font-weight:600; }
.pd-slab-v{ display:flex; align-items:center; gap:5px; font-size:15px; font-weight:700; margin-top:5px; color:var(--paper); }
.pd-slab-v.mono{ font-family:'JetBrains Mono',monospace; font-size:13px; color:#d97706; }

/* التخطيط */
.pd-grid{ display:grid; grid-template-columns:1fr 70px; gap:16px; margin-top:18px; align-items:start; }
.pd-main{ display:flex; flex-direction:column; gap:16px; min-width:0; }
@media(max-width:900px){ .pd-slabs{ grid-template-columns:1fr 1fr; } .pd-grid{ grid-template-columns:1fr; } .pd-float{ display:none; } }

/* البلوكات */
.pd-block{ background:var(--surf); border:1px solid var(--line); border-radius:16px; padding:18px; transition:.3s; box-shadow:0 2px 10px rgba(0,0,0,.02); }
.pd-block:hover{ border-color:#cbd5e1; }
.pd-block-h{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; }
.pd-tag{ font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:.22em; color:var(--mut); font-weight:600;}
.pd-block-t{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:18px; font-weight:700; margin-top:3px; color:var(--paper); }
.pd-block-sub{ font-size:11px; color:var(--mut); font-weight:500;}
.pd-editable{ font-size:10.5px; color:#059669; background:rgba(16,185,129,.12); padding:3px 9px; border-radius:999px; font-weight:600;}
.pd-readonly{ font-size:10.5px; color:var(--mut); font-weight:600;}
.pd-empty-mini{ font-size:12.5px; color:var(--mut); padding:8px 0; font-weight:500;}

/* دورة الحياة */
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

/* الأزرار الأربعة */
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

/* الأزرار الصغيرة */
.pd-mini{ display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:#0284c7; background:rgba(14,165,233,.1); border:1px solid rgba(14,165,233,.2); padding:4px 9px; border-radius:8px; cursor:pointer; transition:.2s; font-family:inherit; }
.pd-mini:hover{ background:rgba(14,165,233,.2); }
.pd-mini.rose{ color:#dc2626; background:rgba(239,68,68,.1); border-color:rgba(239,68,68,.2); }
.pd-mini:disabled{ opacity:.5; cursor:not-allowed; }

/* الأولوية */
.pd-prio-now{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.pd-prio-log{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.pd-prio-log li{ display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid var(--line); }
.pd-log-reason{ flex:1; font-size:12px; color:var(--paper); font-weight:500;}
.pd-log-by{ font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--mut); white-space:nowrap; font-weight:600;}
.pd-prio-pick{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:6px 0 14px; }
.pd-prio-opt{ padding:8px; border-radius:9px; border:1px solid var(--line); background:var(--surf2); cursor:pointer; font-family:inherit; font-size:12px; font-weight:700; transition:.2s; color:var(--mut); }
.pd-prio-opt.on{ outline:2px solid currentColor; background:var(--surf); color:var(--paper); }

/* المناقصات */
.pd-tender{ display:flex; flex-direction:column; gap:12px; }
.pd-trow{ border:1px solid var(--line); border-radius:12px; padding:12px; background:var(--surf); }
.pd-trow-h{ display:flex; align-items:center; gap:8px; }
.pd-trow-label{ flex:1; font-size:13px; font-weight:700; color:var(--paper); }
.pd-trow-note{ font-size:11.5px; color:var(--mut); margin-top:6px; font-weight:500;}

/* المالية */
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
@media(max-width:640px){ .pd-fin-row{ grid-template-columns:1fr auto; } .pd-fin-bar,.pd-fin-nums{ display:none; } }

/* العرض/العقد */
.pd-offer{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
.pd-srow{ display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid var(--line); border-radius:11px; background:var(--surf); }
.pd-srow span:first-child{ font-size:12px; color:var(--mut); font-weight:600;}
.pd-contract{ border:1px dashed var(--line); border-radius:12px; padding:12px; background:var(--surf2); }
.pd-contract-now{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:var(--mut); }
.pd-contract-now a{ color:var(--sky); text-decoration:none; }
.pd-contract-now a:hover{ text-decoration:underline; }
.pd-contract-up{ display:flex; gap:8px; align-items:center; margin-top:10px; }
.pd-contract-up input{ font-size:12px; color:var(--paper); }

/* الملاحظات */
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

/* الأزرار العائمة */
.pd-float{ position:sticky; top:24px; display:flex; flex-direction:column; gap:12px; }
.pd-fbtn{ display:flex; flex-direction:column; align-items:center; gap:5px; padding:12px 8px; border:1px solid var(--line); border-radius:14px; background:var(--surf); transition:.3s; cursor:default; box-shadow:0 2px 10px rgba(0,0,0,.02); }
.pd-fbtn:hover{ transform:scale(1.05); box-shadow:0 6px 16px rgba(0,0,0,.05); }
.pd-fbtn.acc-sky{ border-color:rgba(14,165,233,.3); } .pd-fbtn.acc-violet{ border-color:rgba(139,92,246,.3); }
.pd-fbtn-dot{ width:11px; height:11px; border-radius:50%; background:var(--slate); box-shadow:0 0 0 2px var(--surf); }
.pd-fbtn-dot.done{ background:var(--emerald); } .pd-fbtn-dot.live{ background:var(--amber); animation:pdping2 1.8s infinite; }
.pd-fbtn-l{ font-family:'Space Grotesk'; font-weight:700; font-size:13px; color:var(--paper); }
.pd-fbtn-p{ font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--mut); font-weight:600;}

/* الحقول والنوافذ */
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
`;