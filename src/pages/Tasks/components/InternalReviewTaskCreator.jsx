import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import apiClient from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import {
  getActiveReviewProjects, getReviewDisciplineItems,
} from '../../../api/services/internalReview';
import {
  ClipboardCheck, CheckCircle2, Circle, Clock, Plus, X, Layers, User as UserIcon,
  Calendar, Timer, Sparkles, ChevronDown, Target, Workflow, AlertTriangle, Search,
} from 'lucide-react';

const STAGE_TONE = { PENDING: 'slate', UNDER_REVIEW: 'amber', APPROVED: 'emerald' };
const STAGE_AR = { PENDING: 'قيد الانتظار', UNDER_REVIEW: 'قيد المراجعة', APPROVED: 'معتمَد' };
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function InternalReviewTaskCreator({ onCreated }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selProject, setSelProject] = useState(null);
  const [selStage, setSelStage] = useState(null);
  const [disciplines, setDisciplines] = useState([]);
  const [discLoading, setDiscLoading] = useState(false);
  const [reviewTasks, setReviewTasks] = useState([]);
  const [reveal, setReveal] = useState(false);
  const rootRef = useRef(null);

  // نموذج الإنشاء
  const [form, setForm] = useState({
    title: '', discipline: '', assigned_to: '', start_date: todayISO(), duration_days: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, us, tk] = await Promise.all([
        getActiveReviewProjects(),
        apiClient.get('users/'),
        apiClient.get('tasks/', { params: { task_type: 'INTERNAL_REVIEW', page_size: 100 } }),
      ]);
      setProjects(pr.data || []);
      const all = us.data.results || us.data || [];
      setEngineers(all.filter((u) => ['ENGINEER', 'SENIOR_ENG', 'DESIGN_MGR'].includes(u.role)));
      setReviewTasks(tk.data.results || tk.data || []);
    } catch { setProjects([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { const t = setTimeout(() => setReveal(true), 60); return () => clearTimeout(t); }, []);

  // جلب Discipline المفلترة عند تغيّر المرحلة (تم التعديل هنا)
  useEffect(() => {
    if (!selStage) { setDisciplines([]); return; }
    setDiscLoading(true);
    getReviewDisciplineItems(selStage.stage_name)
      .then((r) => {
        // استخراج المصفوفة بشكل آمن لتفادي مشكلة الـ Pagination
        const items = r.data?.results || r.data;
        setDisciplines(Array.isArray(items) ? items : []);
      })
      .catch(() => setDisciplines([]))
      .finally(() => setDiscLoading(false));
  }, [selStage]);

  const pickProject = (p) => {
    setSelProject(p);
    setSelStage(p.stages.find((s) => s.status !== 'APPROVED') || p.stages[0] || null);
    setErr('');
  };
  const pickStage = (s) => { setSelStage(s); setForm((f) => ({ ...f, discipline: '' })); setErr(''); };

  const engineerOptions = useMemo(() => {
    const ids = new Set((selProject?.assignees || []).map((a) => a.id));
    const assigned = (selProject?.assignees || [])
      .map((a) => ({ id: a.id, label: `${a.full_name} · ${a.role} (معيَّن)` }));
    const others = engineers
      .filter((e) => !ids.has(e.id))
      .map((e) => ({ id: e.id, label: `${e.first_name} ${e.last_name} · ${e.role_display || e.role}` }));
    return [...assigned, ...others];
  }, [selProject, engineers]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!selProject || !selStage) return setErr('اختر المشروع والمرحلة أولاً.');
    if (!form.title.trim()) return setErr('اسم المهمة مطلوب.');
    if (!form.discipline) return setErr('اختر عنصر التخصص.');
    if (!form.assigned_to) return setErr('اختر المهندس المكلَّف.');
    setBusy(true);
    try {
      const disc = disciplines.find((d) => d.id === Number(form.discipline));
      await apiClient.post('tasks/create/', {
        project: selProject.id,
        task_type: 'INTERNAL_REVIEW',
        internal_review_stage: selStage.id,
        discipline: Number(form.discipline),
        stage: disc?.stage || 'CONCEPT',
        title: form.title.trim(),
        assigned_to: Number(form.assigned_to),
        start_date: form.start_date || todayISO(),
        duration_days: form.duration_days ? Number(form.duration_days) : 0,
        priority: 'MEDIUM',
      });
      setForm({ title: '', discipline: '', assigned_to: '', start_date: todayISO(), duration_days: '' });
      await loadAll();
      onCreated?.();
    } catch (ex) {
      const d = ex.response?.data;
      setErr(d?.detail || (typeof d === 'object' ? JSON.stringify(d) : 'تعذّر إنشاء المهمة.'));
    } finally { setBusy(false); }
  };

  const activeProjectsCount = projects.length;

  return (
    <section ref={rootRef} className={`irc ${reveal ? 'irc-in' : ''}`} dir="rtl">
      <style>{CSS}</style>
      <div className="irc-ambient" aria-hidden />

      <header className="irc-head">
        <div>
          <span className="irc-kicker">INTERNAL DESIGN REVIEW · مهام المراجعة التصميمية</span>
          <h2 className="irc-title">إنشاء مهام المراجعة الداخلية</h2>
          <p className="irc-sub">
            أنشئ مهمة مراجعة مربوطة بمرحلة من الخمس؛ بانجاز كل مهام المرحلة تعتمد تلقائيًا وتنتقل للمرحلة التالية، وينعكس ذلك فورًا في صفحة المشروع.
          </p>
        </div>
        <div className="irc-counter">
          <span className="irc-counter-num">{activeProjectsCount}</span>
          <span className="irc-counter-lbl">مشروع إشراف<br />بمراجعة مفعّلة</span>
        </div>
      </header>

      {loading ? (
        <div className="irc-state"><Sparkles className="spin" size={22} /> جارٍ تحميل مشاريع المراجعة…</div>
      ) : projects.length === 0 ? (
        <div className="irc-state irc-empty">
          <ClipboardCheck size={30} />
          <p>لا مشاريع إشراف مفعّلة للمراجعة الداخلية بعد.</p>
          <span>فعّل «Internal Design Review = Yes» من مشروع إشراف ليظهر هنا.</span>
        </div>
      ) : (
        <div className="irc-layout">
          {/* ── سكة المشاريع ── */}
          <div className="irc-rail">
            <div className="irc-rail-h"><Layers size={15} /> مشاريع الإشراف المفعّلة</div>
            {projects.map((p, i) => {
              const on = selProject?.id === p.id;
              const doneStages = p.stages.filter((s) => s.status === 'APPROVED').length;
              return (
                <button key={p.id} className={`irc-proj ${on ? 'on' : ''}`} style={{ '--i': i }} onClick={() => pickProject(p)}>
                  <span className="irc-proj-no">{p.project_no}</span>
                  <span className="irc-proj-name">{p.name}</span>
                  <ol className="irc-mini-track">
                    {p.stages.map((s) => (
                      <li key={s.id} className={`irc-mini t-${STAGE_TONE[s.status]}`} title={`${s.stage_name_display} — ${STAGE_AR[s.status]}`}>
                        <span className="irc-mini-dot" />
                      </li>
                    ))}
                  </ol>
                  <span className="irc-proj-prog">{doneStages}/{p.stages.length} مرحلة</span>
                </button>
              );
            })}
          </div>

          {/* ── لوحة الإنشاء ── */}
          <div className="irc-panel">
            {!selProject ? (
              <div className="irc-panel-empty">
                <Target size={26} />
                <p>اختر مشروعًا من القائمة لبدء إنشاء مهمة مراجعة.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="irc-form">
                <div className="irc-form-h">
                  <div>
                    <span className="irc-form-proj">{selProject.project_no}</span>
                    <h3>{selProject.name}</h3>
                  </div>
                  <button type="button" className="irc-x" onClick={() => { setSelProject(null); setSelStage(null); }}><X size={16} /></button>
                </div>

                {/* اختيار المرحلة */}
                <label className="irc-lbl">المرحلة <b>*</b></label>
                <div className="irc-stage-pick">
                  {selProject.stages.map((s) => {
                    const on = selStage?.id === s.id;
                    return (
                      <button type="button" key={s.id} className={`irc-stage-btn t-${STAGE_TONE[s.status]} ${on ? 'on' : ''}`} onClick={() => pickStage(s)}>
                        <span className="irc-stage-btn-ic">
                          {s.status === 'APPROVED' ? <CheckCircle2 size={13} /> : s.status === 'UNDER_REVIEW' ? <Clock size={13} /> : <Circle size={13} />}
                        </span>
                        <span className="irc-stage-btn-name">{s.stage_name_display}</span>
                        <span className="irc-stage-btn-meta">{s.done_tasks}/{s.total_tasks}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="irc-grid">
                  <label className="irc-field irc-full">
                    <span>اسم المهمة <b>*</b></span>
                    <input value={form.title} onChange={set('title')} placeholder="مثال: مراجعة مخططات الكهرباء — DC1" required />
                  </label>

                  <label className="irc-field">
                    <span>عنصر التخصص <b>*</b> {discLoading && <em className="irc-loading">…</em>}</span>
                    <select value={form.discipline} onChange={set('discipline')} required disabled={discLoading || !selStage}>
                      <option value="">— اختر —</option>
                      {disciplines.map((d) => (
                        <option key={d.id} value={d.id}>{d.department_display} / {d.name} ({d.stage_display})</option>
                      ))}
                    </select>
                  </label>

                  <label className="irc-field">
                    <span>المهندس المكلَّف <b>*</b></span>
                    <select value={form.assigned_to} onChange={set('assigned_to')} required>
                      <option value="">— اختر —</option>
                      {engineerOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </label>

                  <label className="irc-field">
                    <span><Calendar size={12} /> تاريخ الإنشاء</span>
                    <input type="date" value={form.start_date} onChange={set('start_date')} />
                  </label>

                  <label className="irc-field">
                    <span><Timer size={12} /> مدة الإنهاء (يوم)</span>
                    <input type="number" min="0" value={form.duration_days} onChange={set('duration_days')} placeholder="0" />
                  </label>
                </div>

                {err && <div className="irc-err"><AlertTriangle size={14} /> {err}</div>}

                <button type="submit" className="irc-submit" disabled={busy}>
                  <span className="irc-submit-shine" aria-hidden />
                  {busy ? 'جارٍ الإنشاء…' : <><Plus size={16} /> إنشاء مهمة المراجعة</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── مهام المراجعة الحالية ── */}
      {reviewTasks.length > 0 && (
        <div className="irc-tasks">
          <div className="irc-tasks-h"><Workflow size={16} /> مهام المراجعة الداخلية الحالية <em>{reviewTasks.length}</em></div>
          <div className="irc-tasks-grid">
            {reviewTasks.map((t, i) => {
              const st = t.internal_review_stage_name || '—';
              const done = ['COMPLETED', 'APPROVED'].includes(t.status);
              return (
                <article key={t.id} className={`irc-task ${done ? 'done' : ''}`} style={{ '--i': i }}>
                  <span className="irc-task-edge" />
                  <div className="irc-task-top">
                    <span className="irc-task-stage">{st}</span>
                    <span className={`irc-task-status ${done ? 'ok' : ''}`}>{t.status}</span>
                  </div>
                  <h4 className="irc-task-title">{t.title || t.discipline_name}</h4>
                  <div className="irc-task-meta">
                    <span><UserIcon size={12} /> {t.assigned_to_name || 'غير مكلَّف'}</span>
                    <span><Calendar size={12} /> {t.start_date || '—'}</span>
                    {t.duration_days > 0 && <span><Timer size={12} /> {t.duration_days}ي</span>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.irc{ --ink:#0c141d; --surf:#131c27; --surf2:#18222f; --line:#26323f; --paper:#e9eff5; --mut:#8694a4;
  --amber:#e6ab4c; --emerald:#3fb286; --sky:#5cc6ef; --rose:#e3707e; --violet:#a18cf2; --slate:#5d6b7a;
  position:relative; overflow:hidden; border:1px solid var(--line); border-radius:20px; padding:24px clamp(16px,3vw,28px) 28px;
  color:var(--paper); font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
  background:linear-gradient(180deg,rgba(255,255,255,.025),transparent), var(--surf);
  opacity:0; transform:translateY(14px); transition:opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1); }
.irc-in{ opacity:1; transform:none; }
.irc-ambient{ position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(54% 46% at 96% -8%, rgba(161,140,242,.12), transparent 60%),
    radial-gradient(46% 42% at -4% 108%, rgba(92,198,239,.08), transparent 60%),
    linear-gradient(rgba(161,140,242,.04) 1px,transparent 1px), linear-gradient(90deg,rgba(161,140,242,.04) 1px,transparent 1px);
  background-size:auto,auto,40px 40px,40px 40px; }
.irc > *:not(.irc-ambient){ position:relative; }
.spin{ animation:ircspin .8s linear infinite; } @keyframes ircspin{ to{ transform:rotate(360deg); } }

.irc-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:18px; padding-bottom:18px; border-bottom:1px solid var(--line); }
.irc-kicker{ font-family:'Space Grotesk'; font-size:10px; letter-spacing:.28em; color:var(--violet); }
.irc-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(22px,3.4vw,32px); font-weight:700; margin:5px 0 6px; letter-spacing:-.01em; }
.irc-sub{ color:var(--mut); font-size:12.5px; line-height:1.7; max-width:60ch; margin:0; }
.irc-counter{ flex:none; display:flex; flex-direction:column; align-items:center; gap:2px; padding:12px 18px; border-radius:14px; border:1px solid rgba(161,140,242,.35); background:rgba(161,140,242,.08); }
.irc-counter-num{ font-family:'Space Grotesk'; font-size:34px; font-weight:700; line-height:.9; color:var(--violet); }
.irc-counter-lbl{ font-size:10px; color:var(--mut); text-align:center; line-height:1.3; }

.irc-state{ display:flex; flex-direction:column; align-items:center; gap:10px; padding:46px 20px; text-align:center; color:var(--mut); }
.irc-empty p{ font-size:15px; font-weight:600; color:var(--paper); margin:4px 0 0; }
.irc-empty span{ font-size:12.5px; max-width:46ch; line-height:1.7; }

.irc-layout{ display:grid; grid-template-columns:300px 1fr; gap:18px; margin-top:20px; }
@media(max-width:860px){ .irc-layout{ grid-template-columns:1fr; } }

/* السكة */
.irc-rail{ display:flex; flex-direction:column; gap:10px; max-height:560px; overflow-y:auto; padding-inline-end:4px; }
.irc-rail::-webkit-scrollbar{ width:6px; } .irc-rail::-webkit-scrollbar-thumb{ background:var(--line); border-radius:9px; }
.irc-rail-h{ display:flex; align-items:center; gap:7px; font-size:11.5px; font-weight:600; color:var(--mut); padding-bottom:4px; }
.irc-proj{ position:relative; display:flex; flex-direction:column; gap:8px; text-align:start; padding:13px 14px; border-radius:13px; border:1px solid var(--line); background:rgba(255,255,255,.02); cursor:pointer; transition:.25s;
  opacity:0; transform:translateX(-8px); animation:ircrise .45s ease forwards; animation-delay:calc(var(--i) * 55ms + .1s); }
@keyframes ircrise{ to{ opacity:1; transform:none; } }
.irc-proj:hover{ border-color:#33414f; transform:translateX(3px); background:rgba(255,255,255,.04); }
.irc-proj.on{ border-color:rgba(161,140,242,.55); background:linear-gradient(135deg,rgba(161,140,242,.12),transparent); box-shadow:0 0 0 1px rgba(161,140,242,.25); }
.irc-proj.on::before{ content:""; position:absolute; inset-inline-start:-1px; top:10px; bottom:10px; width:3px; border-radius:0 3px 3px 0; background:var(--violet); box-shadow:0 0 10px rgba(161,140,242,.7); }
.irc-proj-no{ font-family:'JetBrains Mono'; font-size:10.5px; color:var(--amber); letter-spacing:.04em; }
.irc-proj-name{ font-size:13.5px; font-weight:600; line-height:1.3; }
.irc-mini-track{ list-style:none; display:flex; gap:6px; margin:2px 0 0; padding:0; }
.irc-mini{ position:relative; flex:1; height:6px; border-radius:99px; background:rgba(255,255,255,.08); }
.irc-mini-dot{ position:absolute; inset:0; border-radius:99px; }
.irc-mini.t-emerald .irc-mini-dot{ background:var(--emerald); }
.irc-mini.t-amber .irc-mini-dot{ background:var(--amber); animation:ircpulse 1.8s infinite; }
.irc-mini.t-slate .irc-mini-dot{ background:var(--slate); }
@keyframes ircpulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(230,171,76,.5);} 50%{ box-shadow:0 0 0 4px rgba(230,171,76,0);} }
.irc-proj-prog{ font-family:'JetBrains Mono'; font-size:10px; color:var(--mut); }

/* اللوحة */
.irc-panel{ border:1px solid var(--line); border-radius:16px; background:linear-gradient(180deg,rgba(255,255,255,.02),transparent); padding:20px; min-height:340px; }
.irc-panel-empty{ height:100%; min-height:300px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--mut); text-align:center; }
.irc-panel-empty p{ font-size:13px; margin:0; max-width:34ch; }
.irc-form-h{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:16px; padding-bottom:14px; border-bottom:1px dashed var(--line); }
.irc-form-proj{ font-family:'JetBrains Mono'; font-size:10.5px; color:var(--amber); }
.irc-form-h h3{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:18px; font-weight:700; margin:3px 0 0; }
.irc-x{ width:30px; height:30px; border-radius:8px; display:grid; place-items:center; background:rgba(255,255,255,.04); border:1px solid var(--line); color:var(--mut); cursor:pointer; transition:.2s; flex:none; }
.irc-x:hover{ color:var(--rose); border-color:rgba(227,112,126,.4); }

.irc-lbl{ display:block; font-size:11.5px; font-weight:600; color:var(--mut); margin-bottom:8px; }
.irc-lbl b{ color:var(--rose); }
.irc-stage-pick{ display:grid; grid-template-columns:repeat(5,1fr); gap:7px; margin-bottom:18px; }
@media(max-width:680px){ .irc-stage-pick{ grid-template-columns:repeat(2,1fr); } }
.irc-stage-btn{ display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 6px; border-radius:11px; border:1px solid var(--line); background:rgba(255,255,255,.02); cursor:pointer; transition:.2s; }
.irc-stage-btn:hover{ transform:translateY(-2px); }
.irc-stage-btn-ic{ width:26px; height:26px; border-radius:50%; display:grid; place-items:center; background:rgba(255,255,255,.05); color:var(--mut); }
.irc-stage-btn.t-emerald .irc-stage-btn-ic{ background:rgba(63,178,134,.16); color:var(--emerald); }
.irc-stage-btn.t-amber .irc-stage-btn-ic{ background:rgba(230,171,76,.16); color:var(--amber); }
.irc-stage-btn-name{ font-size:10.5px; font-weight:600; text-align:center; line-height:1.25; }
.irc-stage-btn-meta{ font-family:'JetBrains Mono'; font-size:9px; color:var(--mut); }
.irc-stage-btn.on{ border-color:rgba(161,140,242,.6); background:rgba(161,140,242,.12); box-shadow:0 0 0 1px rgba(161,140,242,.3); }
.irc-stage-btn.on .irc-stage-btn-name{ color:var(--violet); }

.irc-grid{ display:grid; grid-template-columns:1fr 1fr; gap:13px; }
.irc-field{ display:flex; flex-direction:column; gap:6px; }
.irc-field.irc-full{ grid-column:1/-1; }
.irc-field > span{ display:flex; align-items:center; gap:5px; font-size:11px; color:var(--mut); }
.irc-field > span b{ color:var(--rose); }
.irc-loading{ color:var(--violet); font-style:normal; }
.irc-field input,.irc-field select{ background:var(--ink); border:1px solid var(--line); border-radius:10px; padding:10px 12px; color:var(--paper); font-family:inherit; font-size:13px; outline:none; transition:.2s; }
.irc-field input:focus,.irc-field select:focus{ border-color:var(--violet); box-shadow:0 0 0 3px rgba(161,140,242,.12); }
.irc-field select:disabled{ opacity:.5; }

.irc-err{ display:flex; align-items:center; gap:8px; margin-top:14px; color:var(--rose); background:rgba(227,112,126,.1); border:1px solid rgba(227,112,126,.35); border-radius:10px; padding:9px 12px; font-size:12.5px; }
.irc-submit{ position:relative; overflow:hidden; margin-top:16px; width:100%; display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-family:inherit; font-size:13.5px; font-weight:700; color:#10081f; cursor:pointer; border:none; padding:12px 20px; border-radius:12px;
  background:linear-gradient(120deg,#bca6f7,#8b6fe6); box-shadow:0 12px 28px -14px rgba(139,111,230,.85); transition:transform .25s, filter .25s; }
.irc-submit:hover:not(:disabled){ transform:translateY(-2px); filter:brightness(1.06); }
.irc-submit:disabled{ opacity:.5; cursor:not-allowed; }
.irc-submit-shine{ position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-130%); }
.irc-submit:hover:not(:disabled) .irc-submit-shine{ animation:ircsh .8s ease; }
@keyframes ircsh{ to{ transform:translateX(130%); } }

/* المهام الحالية */
.irc-tasks{ margin-top:24px; padding-top:20px; border-top:1px solid var(--line); }
.irc-tasks-h{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; margin-bottom:14px; }
.irc-tasks-h em{ font-style:normal; font-family:'JetBrains Mono'; font-size:10px; background:rgba(161,140,242,.18); color:var(--violet); padding:1px 7px; border-radius:99px; }
.irc-tasks-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; }
.irc-task{ position:relative; overflow:hidden; padding:14px 14px 14px 16px; border:1px solid var(--line); border-radius:13px; background:rgba(255,255,255,.02);
  opacity:0; transform:translateY(10px); animation:ircrise .45s ease forwards; animation-delay:calc(var(--i) * 45ms); transition:.3s; }
.irc-task:hover{ transform:translateY(-3px); border-color:#33414f; }
.irc-task.done{ border-color:rgba(63,178,134,.4); }
.irc-task-edge{ position:absolute; inset-inline-start:0; top:0; bottom:0; width:3px; background:var(--violet); }
.irc-task.done .irc-task-edge{ background:var(--emerald); }
.irc-task-top{ display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px; }
.irc-task-stage{ font-size:10px; font-weight:700; color:var(--violet); background:rgba(161,140,242,.14); padding:2px 8px; border-radius:99px; }
.irc-task-status{ font-family:'JetBrains Mono'; font-size:9.5px; color:var(--amber); }
.irc-task-status.ok{ color:var(--emerald); }
.irc-task-title{ font-size:13.5px; font-weight:600; margin:0 0 9px; line-height:1.35; }
.irc-task-meta{ display:flex; flex-wrap:wrap; gap:10px; font-size:10.5px; color:var(--mut); }
.irc-task-meta span{ display:inline-flex; align-items:center; gap:4px; }
`;