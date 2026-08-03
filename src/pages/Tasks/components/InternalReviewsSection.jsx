import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  getMyInternalReviewsList, getMyInternalReviews, updateReviewStage,
} from '../../../api/services/internalReview';
import apiClient from '../../../api/axios';
import {
  Target, CheckCircle2, Circle, Clock, ShieldCheck, ExternalLink,
  RefreshCw, Sparkles, ClipboardList, Workflow, Link2, User as UserIcon,
  Calendar, Timer, ChevronRight, X, AlertTriangle, Flag, Hash, Loader2,
} from 'lucide-react';
const CYCLE = ['PENDING', 'UNDER_REVIEW', 'APPROVED'];
const STAGE_TONE = { PENDING: 'slate', UNDER_REVIEW: 'amber', APPROVED: 'emerald' };
const STAGE_AR = { PENDING: 'قيد الانتظار', UNDER_REVIEW: 'قيد المراجعة', APPROVED: 'معتمَد' };
const TASK_TONE = {
  UNCHARTED: 'slate', UNDER_STUDY: 'sky', COMMENT: 'sky',
  ON_GOING: 'amber', COMPLETED: 'emerald', APPROVED: 'emerald', ON_HOLD: 'rose',
};

export default function InternalReviewsSection() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reveal, setReveal] = useState(false);
  const rootRef = useRef(null);
  const [activeTask, setActiveTask] = useState(null);
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getMyInternalReviewsList(), getMyInternalReviews()])
      .then(([pr, tk]) => {
        setProjects(pr.data.results || pr.data || []);
        setMyTasks(tk.data.results || tk.data || []);
      })
      .catch(() => { setProjects([]); setMyTasks([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => setReveal(true), 60);
    return () => clearTimeout(t);
  }, []);
  // فتح تفاصيل المهمة
  const openTask = (meta) => setActiveTask(meta);

  // إنجاز المهمة + أتمتة اعتماد المرحلة إن اكتملت كل مهامها
  const completeTask = async (status) => {
    const { task, stageId, stageTasks } = activeTask;
    // ١) تحديث حالة المهمة (يرمي الخطأ ليظهره المودال)
    await apiClient.patch(`tasks/${task.id}/status/`, { status });
    // ٢) إن اكتملت كل مهام هذه المرحلة ⇒ اعتمدها تلقائياً
    if ((status === 'COMPLETED' || status === 'APPROVED') && stageId) {
      const allDone = (stageTasks || []).every(
        (t) => t.id === task.id || ['COMPLETED', 'APPROVED'].includes(t.status)
      );
      if (allDone) {
        try { await updateReviewStage(stageId, { status: 'APPROVED' }); } catch {}
      }
    }
    // ٣) تحديث الواجهة
    load();
  };

  // ربط المهام الفردية بالمراحل عبر (project + stage id)
  const tasksIndex = useMemo(() => {
    const map = new Map();
    myTasks.forEach((t) => {
      const key = `${t.project}__${t.internal_review_stage}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    });
    return map;
  }, [myTasks]);

  // إشارات الجسر الكلية
  const bridge = useMemo(() => {
    let active = 0, reviewing = 0, approved = 0, total = 0;
    projects.forEach((p) => (p.review_stages || []).forEach((s) => {
      total++;
      if (s.status === 'APPROVED') approved++;
      else if (s.status === 'UNDER_REVIEW') reviewing++;
      else active++;
    }));
    return { active, reviewing, approved, total };
  }, [projects]);

  return (
    <section ref={rootRef} className={`irs ${reveal ? 'irs-in' : ''}`} dir="rtl">
  <style>{CSS}</style>
  <style>{RTM_CSS}</style>
  <div className="irs-ambient" aria-hidden />
  <span className="irs-bridge-glyph" aria-hidden><Link2 size={120} /></span>

      {/* ── الرأس: عنوان الجسر + إشاراته + العدّاد ── */}
      <header className="irs-head">
        <div className="irs-head-txt">
          <span className="irs-kicker">INTERNAL DESIGN REVIEW · جسر الإشراف ↔ التصميم</span>
          <h2 className="irs-title">مراجعاتي التصميمية</h2>
          <p className="irs-sub">
            المشاريع التي عيّنك مدير الإشراف لمراجعة مخططاتها. حدّث مراحلها بدورها —
            تنعكس فورًا في صفحة مشروع الإشراف، ويُخطَر المدير عند الاعتماد الكامل.
          </p>
          <div className="irs-signals">
            <Signal tone="slate"   n={bridge.active}    label="قيد الانتظار" />
            <Signal tone="amber"   n={bridge.reviewing} label="قيد المراجعة" pulse />
            <Signal tone="emerald" n={bridge.approved}  label="معتمَدة" />
          </div>
        </div>
        <div className="irs-meter">
          <svg viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" className="irs-ring-bg" />
            <circle cx="48" cy="48" r="40" className="irs-ring-fg"
              strokeDasharray={`${(bridge.total ? (bridge.approved / bridge.total) * 251.3 : 0)} 251.3`} />
          </svg>
          <div className="irs-meter-t">
            <b>{bridge.approved}</b><i>/ {bridge.total}</i>
            <span>مرحلة معتمَدة</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="irs-state"><Sparkles className="spin" size={22} /> جارٍ تحميل مراجعاتك…</div>
      ) : projects.length === 0 ? (
        <div className="irs-state irs-empty">
          <ClipboardList size={30} />
          <p>لا مشاريع مراجعة مُعيّنة لك حاليًا.</p>
          <span>ستظهر هنا بمجرد أن يُعيّنك مدير الإشراف على مشروع إشراف يحتاج مراجعة تصميمية.</span>
        </div>
      ) : (
<div className="irs-grid">
  {projects.map((p, idx) => (
    <ReviewProjectCard
      key={p.id} 
      project={p} 
      index={idx}
      tasksIndex={tasksIndex} 
      onChanged={load}
      onOpenTask={openTask}  
    />
  ))}
</div>
      )}

      {activeTask && (
        <ReviewTaskModal
          meta={activeTask}
          onClose={() => setActiveTask(null)}
          onComplete={completeTask}
        />
      )}
    </section>
  );
}

/* ── إشارة عدّاد في الرأس ─────────────────────────────── */
function Signal({ tone, n, label, pulse }) {
  return (
    <div className={`irs-sig t-${tone} ${pulse && n > 0 ? 'pulse' : ''}`}>
      <span className="irs-sig-n">{n}</span>
      <span className="irs-sig-l">{label}</span>
    </div>
  );
}

/* ── بطاقة مشروع واحد ─────────────────────────────────── */
function ReviewProjectCard({ project, index, tasksIndex, onChanged, onOpenTask }) {
  const stages = [...(project.review_stages || [])].sort((a, b) => a.sequence_order - b.sequence_order);
  const prog = project.progress || { approved: 0, total: 0, percentage: 0, all_approved: false };

  return (
    <article className={`irs-card ${prog.all_approved ? 'sealed' : ''}`} style={{ '--i': index }}>
      <span className="irs-card-edge" aria-hidden />
      <span className="irs-card-watermark" aria-hidden>{String(project.id).padStart(2, '0')}</span>

      <div className="irs-card-top">
        <div className="irs-card-id">
          <span className="irs-no"><Target size={13} /> {project.project_no}</span>
          <h3 className="irs-name">{project.name}</h3>
          {project.requested_by_name && (
            <span className="irs-by">بطلب من {project.requested_by_name}</span>
          )}
        </div>
        <div className={`irs-gauge ${prog.all_approved ? 'ok' : ''}`}>
          <svg viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="17" className="irs-g-bg" />
            <circle cx="22" cy="22" r="17" className="irs-g-fg"
              strokeDasharray={`${(prog.percentage / 100) * 106.8} 106.8`} />
          </svg>
          <span className="irs-g-t">{prog.percentage}<i>%</i></span>
        </div>
      </div>

      {prog.all_approved && (
        <div className="irs-sealed-bar"><ShieldCheck size={14} /> اكتملت المراجعة — التصميم جاهز للموقع</div>
      )}

      {/* الخط الزمني العمودي للمراحل الخمس */}
      <ol className="irs-timeline">
        {stages.map((s, i) => (
       <StageRow
         key={s.id} stage={s} index={i}
         prevDone={i === 0 || stages[i - 1].status === 'APPROVED'}
         tasks={tasksIndex.get(`${project.id}__${s.id}`) || []}
         onChanged={onChanged}
         onOpenTask={(t) => onOpenTask({
           task: t, stageId: s.id,
           stageTasks: tasksIndex.get(`${project.id}__${s.id}`) || [],
           projectName: project.name, projectNo: project.project_no,
         })}
       />
        ))}
      </ol>

      <div className="irs-card-foot">
        <span className="irs-foot-hint">انقر وسم المرحلة لتدوير حالتها</span>
        <Link to={`/projects/${project.id}`} className="irs-open">
          فتح المشروع <ExternalLink size={13} />
        </Link>
      </div>
    </article>
  );
}

/* ── صف مرحلة واحدة + مهامها المعلقة ──────────────────── */
function StageRow({ stage, index, prevDone, tasks, onChanged, onOpenTask }) {
    const [busy, setBusy] = useState(false);
  const tone = STAGE_TONE[stage.status];
  const isLive = stage.status === 'UNDER_REVIEW';
  const canCycle = prevDone; // لا تدوير قبل اعتماد السابقة

  const cycle = async () => {
    if (!canCycle) return;
    setBusy(true);
    const next = CYCLE[(CYCLE.indexOf(stage.status) + 1) % CYCLE.length];
    try { await updateReviewStage(stage.id, { status: next }); onChanged(); }
    catch (e) { alert(e.response?.data?.detail || 'تعذّر تحديث المرحلة'); }
    finally { setBusy(false); }
  };

  return (
    <li className={`irs-step t-${tone} ${isLive ? 'live' : ''}`} style={{ '--j': index }}>
      {index > 0 && <span className={`irs-line ${stage.status !== 'PENDING' || prevDone ? 'lit' : ''}`} />}
      <span className="irs-dot">{stage.sequence_order}</span>

      <div className="irs-step-body">
        <div className="irs-step-head">
          <span className="irs-step-name">{stage.stage_name_display}</span>
          <button
            className={`irs-pill t-${tone} ${canCycle ? 'click' : 'locked'} ${busy ? 'busy' : ''}`}
            onClick={cycle} disabled={!canCycle || busy}
            title={canCycle ? 'انقر لتدوير الحالة' : 'اعتمد المرحلة السابقة أولاً'}
          >
            {busy ? <RefreshCw size={11} className="spin" />
              : stage.status === 'APPROVED' ? <CheckCircle2 size={12} />
              : stage.status === 'UNDER_REVIEW' ? <Clock size={12} />
              : <Circle size={12} />}
            {STAGE_AR[stage.status]}
          </button>
        </div>

        {/* المهام الفردية المعلقة على المهندس في هذه المرحلة */}
        {tasks.length > 0 && (
          <div className="irs-step-tasks">
            {tasks.map((t) => (
                 <button
             key={t.id}
             type="button"
             className={`irs-chip t-${TASK_TONE[t.status] || 'slate'}`}
             onClick={() => onOpenTask(t)}
             title="افتح تفاصيل المهمة وأنجزها"
           >
             <Workflow size={11} />
             <span className="irs-chip-title">{t.title || t.discipline_name}</span>
             <em>{(t.status || '').replace('_', ' ')}</em>
           </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.irs{ --ink:#ffffff; --ink2:#f8fafc; --surf:#f1f5f9; --line:#e2e8f0; --paper:#0f172a; --mut:#64748b;
  --amber:#d97706; --emerald:#059669; --sky:#0284c7; --rose:#e11d48; --violet:#7c3aed; --slate:#64748b;
  position:relative; overflow:hidden; margin-top:4px; padding:28px clamp(16px,3vw,32px) 32px;
  border:1px solid var(--line); border-radius:22px; color:var(--paper);
  font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
  background:#ffffff;
  opacity:0; transform:translateY(14px); transition:opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1); }
.irs-in{ opacity:1; transform:none; }
.irs-ambient{ position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(52% 46% at 96% -8%, rgba(124,58,237,.08), transparent 60%),
    radial-gradient(46% 42% at -4% 108%, rgba(2,132,199,.06), transparent 60%),
    linear-gradient(rgba(124,58,237,.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(124,58,237,.03) 1px,transparent 1px);
  background-size:auto,auto,40px 40px,40px 40px;
  -webkit-mask-image:radial-gradient(120% 100% at 50% 0%,#000,transparent 88%);
          mask-image:radial-gradient(120% 100% at 50% 0%,#000,transparent 88%); }
.irs-bridge-glyph{ position:absolute; inset-inline-end:-26px; bottom:-30px; color:rgba(124,58,237,.04); transform:rotate(-14deg); pointer-events:none; }
.irs > *:not(.irs-ambient):not(.irs-bridge-glyph){ position:relative; }
.spin{ animation:irsspin .8s linear infinite; } @keyframes irsspin{ to{ transform:rotate(360deg); } }

/* الرأس */
.irs-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:22px; padding-bottom:22px; border-bottom:1px solid var(--line); flex-wrap:wrap; }
.irs-kicker{ font-family:'Space Grotesk'; font-size:10px; letter-spacing:.28em; color:var(--violet); }
.irs-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(24px,3.6vw,36px); font-weight:700; margin:5px 0 7px; letter-spacing:-.01em; line-height:1.05; }
.irs-sub{ color:var(--mut); font-size:12.5px; line-height:1.7; max-width:58ch; margin:0 0 14px; }
.irs-signals{ display:flex; gap:10px; flex-wrap:wrap; }
.irs-sig{ display:flex; align-items:baseline; gap:7px; padding:7px 13px; border-radius:11px; border:1px solid var(--line); background:rgba(0,0,0,.02); transition:transform .25s, border-color .25s; }
.irs-sig:hover{ transform:translateY(-2px); }
.irs-sig-n{ font-family:'Space Grotesk'; font-size:20px; font-weight:700; line-height:1; }
.irs-sig-l{ font-size:10.5px; color:var(--mut); }
.irs-sig.t-slate .irs-sig-n{ color:var(--paper); } .irs-sig.t-amber .irs-sig-n{ color:var(--amber); } .irs-sig.t-emerald .irs-sig-n{ color:var(--emerald); }
.irs-sig.t-amber{ border-color:rgba(217,119,6,.35); background:rgba(217,119,6,.05); } 
.irs-sig.t-emerald{ border-color:rgba(5,150,105,.35); background:rgba(5,150,105,.05); }
.irs-sig.pulse{ animation:irspulse 2.2s ease-in-out infinite; }
@keyframes irspulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(217,119,6,0);} 50%{ box-shadow:0 0 0 4px rgba(217,119,6,.14);} }

.irs-meter{ position:relative; width:96px; height:96px; flex:none; }
.irs-meter svg{ width:96px; height:96px; transform:rotate(-90deg); }
.irs-ring-bg{ fill:none; stroke:rgba(0,0,0,.08); stroke-width:7; }
.irs-ring-fg{ fill:none; stroke:var(--violet); stroke-width:7; stroke-linecap:round; transition:stroke-dasharray 1.1s cubic-bezier(.2,.7,.2,1); }
.irs-meter-t{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.irs-meter-t b{ font-family:'Space Grotesk'; font-weight:700; font-size:24px; line-height:1; }
.irs-meter-t i{ font-style:normal; font-size:12px; color:var(--mut); }
.irs-meter-t span{ font-size:8.5px; color:var(--mut); margin-top:2px; }

.irs-state{ display:flex; flex-direction:column; align-items:center; gap:10px; padding:54px 20px; text-align:center; color:var(--mut); }
.irs-state svg{ color:var(--violet); }
.irs-empty p{ font-size:15px; font-weight:600; color:var(--paper); margin:4px 0 0; }
.irs-empty span{ font-size:12.5px; max-width:46ch; line-height:1.7; }

/* شبكة البطاقات */
.irs-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); gap:18px; margin-top:24px; }

.irs-card{ position:relative; overflow:hidden; display:flex; flex-direction:column; gap:14px; padding:20px 20px 16px;
  border:1px solid var(--line); border-radius:18px; background:#ffffff;
  opacity:0; transform:translateY(14px); animation:irsrise .55s cubic-bezier(.2,.7,.2,1) forwards; animation-delay:calc(var(--i) * 80ms + .12s);
  transition:transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s, border-color .35s; }
@keyframes irsrise{ to{ opacity:1; transform:none; } }
.irs-card:hover{ transform:translateY(-5px); box-shadow:0 26px 50px -28px rgba(0,0,0,.15); border-color:#cbd5e1; }
.irs-card.sealed{ border-color:rgba(5,150,105,.42); background:#f0fdf4; }
.irs-card-edge{ position:absolute; top:0; inset-inline-start:0; inset-inline-end:0; height:3px; background:linear-gradient(90deg,var(--violet),var(--sky)); }
.irs-card.sealed .irs-card-edge{ background:linear-gradient(90deg,var(--emerald),#047857); }
.irs-card-watermark{ position:absolute; inset-inline-end:14px; top:6px; font-family:'Space Grotesk'; font-weight:700; font-size:64px; line-height:1; color:rgba(0,0,0,.03); pointer-events:none; }

.irs-card-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
.irs-no{ display:inline-flex; align-items:center; gap:6px; font-family:'JetBrains Mono'; font-size:11px; letter-spacing:.06em; color:var(--amber); }
.irs-name{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:17px; font-weight:700; margin:5px 0 4px; line-height:1.25; }
.irs-by{ font-size:11px; color:var(--mut); }
.irs-gauge{ position:relative; width:48px; height:48px; flex:none; }
.irs-gauge svg{ width:48px; height:48px; transform:rotate(-90deg); }
.irs-g-bg{ fill:none; stroke:rgba(0,0,0,.08); stroke-width:4; }
.irs-g-fg{ fill:none; stroke:var(--violet); stroke-width:4; stroke-linecap:round; transition:stroke-dasharray .9s cubic-bezier(.2,.7,.2,1); }
.irs-gauge.ok .irs-g-fg{ stroke:var(--emerald); }
.irs-g-t{ position:absolute; inset:0; display:flex; align-items:baseline; justify-content:center; font-family:'Space Grotesk'; font-weight:700; font-size:13px; }
.irs-g-t i{ font-style:normal; font-size:8px; color:var(--mut); }

.irs-sealed-bar{ display:flex; align-items:center; gap:8px; font-size:11.5px; font-weight:600; color:var(--emerald);
  background:rgba(5,150,105,.1); border:1px solid rgba(5,150,105,.35); border-radius:10px; padding:8px 12px; animation:irspop .4s cubic-bezier(.2,.8,.2,1); }
@keyframes irspop{ from{ opacity:0; transform:scale(.97);} to{ opacity:1; transform:none;} }

/* الخط الزمني */
.irs-timeline{ list-style:none; margin:0; padding:0; position:relative; display:flex; flex-direction:column; }
.irs-step{ position:relative; display:flex; gap:13px; padding:0 0 6px 40px; min-height:46px;
  opacity:0; transform:translateX(-6px); animation:irstep .4s ease forwards; animation-delay:calc(var(--j) * 50ms + .3s); }
@keyframes irstep{ to{ opacity:1; transform:none; } }
.irs-line{ position:absolute; top:-4px; bottom:6px; inset-inline-start:13px; width:2px; background:var(--line); transition:background .5s; }
.irs-line.lit{ background:linear-gradient(180deg,var(--emerald),rgba(5,150,105,.35)); }
.irs-dot{ position:absolute; inset-inline-start:0; top:2px; width:28px; height:28px; border-radius:50%; display:grid; place-items:center;
  font-family:'Space Grotesk'; font-weight:700; font-size:12px; background:#ffffff; border:2px solid var(--line); color:var(--mut); z-index:1; transition:.3s; }
.irs-step.t-emerald .irs-dot{ background:var(--emerald); border-color:var(--emerald); color:#ffffff; box-shadow:0 0 0 4px rgba(5,150,105,.16); }
.irs-step.t-amber .irs-dot{ border-color:var(--amber); color:var(--amber); }
.irs-step.live .irs-dot{ animation:irdotpulse 1.9s infinite; }
@keyframes irdotpulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(217,119,6,.45);} 50%{ box-shadow:0 0 0 7px rgba(217,119,6,0);} }

.irs-step-body{ flex:1; min-width:0; display:flex; flex-direction:column; gap:7px; }
.irs-step-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.irs-step-name{ font-size:13.5px; font-weight:600; }
.irs-pill{ display:inline-flex; align-items:center; gap:5px; font-family:inherit; font-size:10.5px; font-weight:600;
  padding:4px 11px; border-radius:99px; border:1px solid transparent; white-space:nowrap; transition:.2s; position:relative; overflow:hidden; }
.irs-pill.t-slate{ background:var(--surf); color:var(--mut); border-color:var(--line); }
.irs-pill.t-amber{ background:rgba(217,119,6,.12); color:var(--amber); }
.irs-pill.t-emerald{ background:rgba(5,150,105,.12); color:var(--emerald); }
.irs-pill.click{ cursor:pointer; } .irs-pill.click:hover{ filter:brightness(0.95); transform:translateY(-1px); }
.irs-pill.click::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent); transform:translateX(-130%); }
.irs-pill.click:hover::after{ animation:irssh .7s ease; }
@keyframes irssh{ to{ transform:translateX(130%);} }
.irs-pill.locked{ opacity:.5; cursor:not-allowed; }
.irs-pill.busy{ opacity:.7; cursor:wait; }

/* رقائق المهام تحت المرحلة */
.irs-step-tasks{ display:flex; flex-wrap:wrap; gap:6px; }
.irs-chip{ display:inline-flex; align-items:center; gap:5px; max-width:100%; font-size:10px; font-weight:600;
  padding:3px 9px; border-radius:8px; border-inline-start-width:3px; background:#ffffff; border:1px solid var(--line); transition:transform .2s, background .2s; }
.irs-chip:hover{ transform:translateY(-1px); background:var(--surf); }
.irs-chip-title{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px; color:var(--paper); }
.irs-chip em{ font-style:normal; font-size:8.5px; color:var(--mut); }
.irs-chip.t-slate{ border-inline-start-color:var(--slate); } .irs-chip.t-sky{ border-inline-start-color:var(--sky); }
.irs-chip.t-amber{ border-inline-start-color:var(--amber); } .irs-chip.t-emerald{ border-inline-start-color:var(--emerald); }
.irs-chip.t-rose{ border-inline-start-color:var(--rose); }

.irs-card-foot{ display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px dashed var(--line); }
.irs-foot-hint{ font-size:10px; color:var(--mut); }
.irs-open{ display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:var(--sky); text-decoration:none; transition:.2s; }
.irs-open:hover{ color:var(--paper); gap:8px; }
@media (max-width:480px){ .irs-grid{ grid-template-columns:1fr; } .irs-head{ flex-direction:column; } }
`;


/* ═══════════════════════════════════════════════════════════════
   مودال تفاصيل/إنجاز مهمة المراجعة الداخلية
   ═══════════════════════════════════════════════════════════════ */
const TASK_META = {
  UNCHARTED:   { t: 'غير مخططة',   c: 'slate' },
  UNDER_STUDY: { t: 'قيد الدراسة', c: 'sky' },
  COMMENT:     { t: 'تعليق',       c: 'sky' },
  ON_GOING:    { t: 'قيد التنفيذ', c: 'amber' },
  COMPLETED:   { t: 'مكتملة',      c: 'emerald' },
  APPROVED:    { t: 'معتمدة',      c: 'emerald' },
  ON_HOLD:     { t: 'موقوفة',      c: 'rose' },
};
const PRIORITY_META = {
  URGENT: { t: 'عاجلة',   c: 'rose' },
  HIGH:   { t: 'مرتفعة',  c: 'amber' },
  MEDIUM: { t: 'متوسطة',  c: 'sky' },
  LOW:    { t: 'منخفضة',  c: 'slate' },
};

function ReviewTaskModal({ meta, onClose, onComplete }) {
  const { task, projectName, projectNo } = meta;
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState('');

  const st = task.status;
  const done = st === 'COMPLETED' || st === 'APPROVED';
  const sm = TASK_META[st] || TASK_META.UNCHARTED;
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM;
  const prog = Number(task.progress_percentage || 0);

  const run = async (status) => {
    setBusy(true); setErr('');
    try { await onComplete(status); onClose(); }
    catch (e) { setErr(e?.response?.data?.detail || e?.message || 'تعذّر تحديث المهمة.'); }
    finally { setBusy(false); setConfirming(false); }
  };

  return (
    <div className="rtm-mask" onClick={() => !busy && onClose()}>
      <div className={`rtm st-${sm.c}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <span className="rtm-glow" aria-hidden />
        <button className="rtm-close" onClick={() => !busy && onClose()} aria-label="إغلاق"><X size={18} /></button>

        <header className="rtm-head">
          <span className="rtm-kicker">INTERNAL REVIEW TASK · مهمة مراجعة</span>
          <h3 className="rtm-title">{task.title || task.discipline_name || 'مهمة مراجعة'}</h3>
          <div className="rtm-badges">
            <span className={`rtm-badge t-${sm.c}`}><span className="rtm-dot" />{sm.t}</span>
            <span className={`rtm-badge t-${pm.c}`}><Flag size={11} />{pm.t}</span>
            {task.is_on_hold && <span className="rtm-badge t-rose"><AlertTriangle size={11} />موقوفة</span>}
          </div>
        </header>

        <div className="rtm-grid">
          <Cell Icon={Hash} label="المشروع" value={`${projectName || '—'}${projectNo ? ` · ${projectNo}` : ''}`} />
          <Cell Icon={Workflow} label="المرحلة" value={task.internal_review_stage_name || '—'} />
          <Cell Icon={Workflow} label="التخصص" value={task.discipline_name || '—'} />
          <Cell Icon={UserIcon} label="المكلَّف" value={task.assigned_to_name || '—'} />
          <Cell Icon={Calendar} label="تاريخ البدء" value={task.start_date || '—'} />
          <Cell Icon={Clock} label="المدة (يوم)" value={task.duration_days || '—'} />
        </div>

        <div className="rtm-prog">
          <div className="rtm-prog-h"><span>نسبة التقدّم</span><b>{prog}%</b></div>
          <div className="rtm-prog-bar"><span style={{ width: `${prog}%` }} /></div>
        </div>

        {task.is_on_hold && task.hold_reason && (
          <div className="rtm-hold">
            <AlertTriangle size={14} />
            <div><b>سبب الإيقاف</b><p>{task.hold_reason}</p></div>
          </div>
        )}

        {err && <div className="rtm-err"><AlertTriangle size={14} />{err}</div>}

        <div className="rtm-foot">
          {done ? (
            <div className="rtm-done">
              <CheckCircle2 size={18} />
              <span>تم إنجاز هذه المهمة — سُجّل الإنجاز في النظام وأُخطر المدير.</span>
            </div>
          ) : confirming ? (
            <div className="rtm-confirm">
              <p><AlertTriangle size={15} />سيتم تعليم المهمة <b>مكتملة</b> بتاريخ اليوم وإخطار المدير. هل تريد المتابعة؟</p>
              <div className="rtm-confirm-acts">
                <button className="rtm-btn ghost" disabled={busy} onClick={() => setConfirming(false)}>إلغاء</button>
                <button className="rtm-btn primary" disabled={busy} onClick={() => run('COMPLETED')}>
                  {busy ? <><Loader2 size={14} className="rtm-spin" />جارٍ…</> : <><CheckCircle2 size={14} />نعم، أنجزها</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="rtm-actions">
              {st !== 'ON_GOING' && (
                <button className="rtm-btn ghost" disabled={busy} onClick={() => run('ON_GOING')}>
                  <Clock size={14} />بدء / متابعة التنفيذ
                </button>
              )}
              <button className="rtm-btn primary" onClick={() => setConfirming(true)}>
                <CheckCircle2 size={15} />تعليم كمُنجَزة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Cell({ Icon, label, value }) {
  return (
    <div className="rtm-cell">
      <span className="rtm-cell-ic"><Icon size={13} /></span>
      <span>
        <span className="rtm-cell-l">{label}</span>
        <span className="rtm-cell-v">{value}</span>
      </span>
    </div>
  );
}
const RTM_CSS = `
.rtm-mask{ position:fixed; inset:0; z-index:80; display:grid; place-items:center; padding:18px;
  background:rgba(15,23,42,.4); backdrop-filter:blur(5px); animation:rtm-fade .22s ease; }
@keyframes rtm-fade{ from{opacity:0} to{opacity:1} }
.rtm{ --ink:#ffffff; --ink2:#f8fafc; --surf:#f1f5f9; --line:#e2e8f0; --paper:#0f172a; --mut:#64748b;
  --amber:#d97706; --emerald:#059669; --sky:#0284c7; --rose:#e11d48; --violet:#7c3aed; --slate:#64748b;
  position:relative; width:min(540px,96vw); max-height:92vh; overflow:auto;
  background:#ffffff; color:var(--paper);
  border:1px solid var(--line); border-top:4px solid var(--slate); border-radius:20px;
  padding:24px 24px 22px; box-shadow:0 40px 90px -30px rgba(0,0,0,.2);
  font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
  animation:rtm-pop .3s cubic-bezier(.2,.85,.25,1); }
@keyframes rtm-pop{ from{opacity:0; transform:translateY(14px) scale(.97)} to{opacity:1; transform:none} }
.rtm.st-emerald{ border-top-color:var(--emerald); } .rtm.st-amber{ border-top-color:var(--amber); }
.rtm.st-sky{ border-top-color:var(--sky); } .rtm.st-rose{ border-top-color:var(--rose); }
.rtm.st-violet{ border-top-color:var(--violet); } .rtm.st-slate{ border-top-color:var(--slate); }
.rtm-glow{ position:absolute; inset:0; pointer-events:none; border-radius:20px;
  background:radial-gradient(80% 50% at 100% 0%, rgba(124,58,237,.08), transparent 60%); }
.rtm.st-emerald .rtm-glow{ background:radial-gradient(80% 50% at 100% 0%, rgba(5,150,105,.08), transparent 60%); }
.rtm.st-amber .rtm-glow{ background:radial-gradient(80% 50% at 100% 0%, rgba(217,119,6,.08), transparent 60%); }
.rtm.st-rose .rtm-glow{ background:radial-gradient(80% 50% at 100% 0%, rgba(225,29,72,.08), transparent 60%); }
.rtm-close{ position:absolute; top:14px; inset-inline-end:14px; width:34px; height:34px; border-radius:10px;
  display:grid; place-items:center; background:rgba(0,0,0,.04); border:1px solid transparent;
  color:var(--mut); cursor:pointer; transition:.25s; z-index:2; }
.rtm-close:hover{ color:var(--rose); background:rgba(225,29,72,.1); transform:rotate(90deg); }
.rtm-head{ position:relative; margin-bottom:18px; }
.rtm-kicker{ font-family:'Space Grotesk'; font-size:10px; letter-spacing:.3em; color:var(--violet); }
.rtm-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(20px,3.4vw,28px); font-weight:700;
  line-height:1.15; margin:6px 40px 12px 0; letter-spacing:-.01em; }
.rtm-badges{ display:flex; flex-wrap:wrap; gap:7px; }
.rtm-badge{ display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:600;
  padding:4px 11px; border-radius:99px; border:1px solid transparent; }
.rtm-badge.t-emerald{ background:rgba(5,150,105,.1); color:var(--emerald); border-color:rgba(5,150,105,.25); }
.rtm-badge.t-amber{ background:rgba(217,119,6,.1); color:var(--amber); border-color:rgba(217,119,6,.25); }
.rtm-badge.t-sky{ background:rgba(2,132,199,.1); color:var(--sky); border-color:rgba(2,132,199,.25); }
.rtm-badge.t-rose{ background:rgba(225,29,72,.1); color:var(--rose); border-color:rgba(225,29,72,.25); }
.rtm-badge.t-slate{ background:var(--surf); color:var(--mut); border-color:var(--line); }
.rtm-dot{ width:7px; height:7px; border-radius:50%; background:currentColor; position:relative; }
.rtm-badge.t-amber .rtm-dot::after, .rtm-badge.t-rose .rtm-dot::after{ content:""; position:absolute; inset:-3px; border-radius:50%; background:currentColor; opacity:.5; animation:rtm-pulse 1.6s infinite; }
@keyframes rtm-pulse{ 70%,100%{ transform:scale(2.4); opacity:0 } }
.rtm-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media(max-width:460px){ .rtm-grid{ grid-template-columns:1fr; } }
.rtm-cell{ display:flex; align-items:center; gap:9px; padding:10px 12px; border:1px solid var(--line);
  border-radius:12px; background:#f8fafc; transition:.2s; }
.rtm-cell:hover{ border-color:#cbd5e1; background:#f1f5f9; transform:translateY(-1px); }
.rtm-cell-ic{ display:grid; place-items:center; width:28px; height:28px; border-radius:8px;
  background:rgba(0,0,0,.05); color:var(--mut); flex:none; }
.rtm-cell-l{ display:block; font-size:9.5px; letter-spacing:.04em; color:var(--mut); }
.rtm-cell-v{ display:block; font-size:12.5px; font-weight:600; color:var(--paper); margin-top:1px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.rtm-prog{ margin-top:14px; }
.rtm-prog-h{ display:flex; justify-content:space-between; font-size:11px; color:var(--mut); margin-bottom:7px; }
.rtm-prog-h b{ font-family:'JetBrains Mono'; color:var(--paper); }
.rtm-prog-bar{ height:8px; border-radius:99px; background:rgba(0,0,0,.07); overflow:hidden; }
.rtm-prog-bar span{ display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,var(--sky),var(--emerald)); position:relative; transition:width .8s cubic-bezier(.2,.7,.2,1); }
.rtm-prog-bar span::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-100%); animation:rtm-shim 2.4s ease-in-out infinite; }
@keyframes rtm-shim{ 60%,100%{ transform:translateX(240%) } }
.rtm-hold{ display:flex; gap:10px; margin-top:14px; padding:11px 13px; border-radius:12px;
  background:rgba(225,29,72,.08); border:1px solid rgba(225,29,72,.25); color:var(--rose); }
.rtm-hold svg{ flex:none; margin-top:1px; }
.rtm-hold b{ display:block; font-size:11px; margin-bottom:3px; }
.rtm-hold p{ margin:0; font-size:12px; color:var(--paper); line-height:1.5; }
.rtm-err{ display:flex; align-items:center; gap:8px; margin-top:14px; padding:10px 12px; border-radius:11px;
  background:rgba(225,29,72,.08); border:1px solid rgba(225,29,72,.25); color:var(--rose); font-size:12.5px; }
.rtm-foot{ margin-top:18px; padding-top:16px; border-top:1px dashed var(--line); }
.rtm-actions{ display:flex; gap:10px; flex-wrap:wrap; }
.rtm-btn{ display:inline-flex; align-items:center; justify-content:center; gap:7px; font-family:inherit;
  font-size:13px; font-weight:700; padding:11px 18px; border-radius:11px; cursor:pointer; transition:.2s; border:1px solid transparent; }
.rtm-btn:disabled{ opacity:.55; cursor:not-allowed; }
.rtm-btn.primary{ position:relative; overflow:hidden; background:var(--emerald); color:#ffffff; border-color:var(--emerald);
  box-shadow:0 8px 20px -10px rgba(5,150,105,.5); flex:1; }
.rtm-btn.primary:hover:not(:disabled){ filter:brightness(1.07); transform:translateY(-1px); }
.rtm-btn.primary::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent); transform:translateX(-130%); }
.rtm-btn.primary:hover:not(:disabled)::after{ animation:rtm-shim .8s ease; }
.rtm-btn.ghost{ background:rgba(0,0,0,.03); color:var(--paper); border-color:var(--line); }
.rtm-btn.ghost:hover:not(:disabled){ border-color:var(--sky); color:var(--sky); background:#ffffff; }
.rtm-confirm{ animation:rtm-fade .2s ease; }
.rtm-confirm p{ display:flex; align-items:flex-start; gap:9px; margin:0 0 13px; font-size:13px; line-height:1.6; color:var(--paper); }
.rtm-confirm p svg{ flex:none; margin-top:2px; color:var(--amber); }
.rtm-confirm-acts{ display:flex; gap:10px; }
.rtm-confirm-acts .rtm-btn{ flex:1; }
.rtm-done{ display:flex; align-items:center; gap:11px; padding:13px 15px; border-radius:12px;
  background:rgba(5,150,105,.1); border:1px solid rgba(5,150,105,.25); color:var(--emerald); font-size:13px; line-height:1.5;
  animation:rtm-pop .35s cubic-bezier(.2,.85,.25,1); }
.rtm-done svg{ flex:none; }
.rtm-spin{ animation:rtm-spin .8s linear infinite; }
@keyframes rtm-spin{ to{ transform:rotate(360deg) } }
button.irs-chip{ cursor:pointer; font-family:inherit; text-align:start; }
button.irs-chip:hover{ transform:translateY(-2px); background:#f1f5f9; box-shadow:0 4px 12px -8px rgba(0,0,0,.2); }
button.irs-chip:focus-visible{ outline:2px solid var(--sky); outline-offset:2px; }
`;