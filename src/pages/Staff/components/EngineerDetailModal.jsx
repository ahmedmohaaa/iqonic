import { useState, useEffect, useRef } from 'react';
import { getEngineerKPIDetail } from '../../../api/services/staff';
import {
  X, Loader2, Calendar, Briefcase, CheckCircle2, Clock, RefreshCw,
  ListChecks, CircleDot, Activity, Award, ClipboardList, History,
} from 'lucide-react';

function useCountUp(target, duration = 800) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const from = ref.current, to = Number(target) || 0, start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration), e = 1 - Math.pow(1 - t, 3);
      const cur = from + (to - from) * e; setV(cur); ref.current = cur;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return Math.round(v);
}
const Num = ({ value }) => <>{useCountUp(value)}</>;

const STATUS_TONE = {
  UNCHARTED: 'slate', UNDER_STUDY: 'sky', COMMENT: 'amber',
  ON_GOING: 'amber', COMPLETED: 'emerald', APPROVED: 'emerald',
};
const STATUS_AR = {
  UNCHARTED: 'غير مخطط', UNDER_STUDY: 'قيد الدراسة', COMMENT: 'تعليق',
  ON_GOING: 'جارٍ', COMPLETED: 'مكتمل', APPROVED: 'معتمَد',
};

export default function EngineerDetailModal({ engineer, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [shown, setShown] = useState(false);

  useEffect(() => {
    getEngineerKPIDetail(engineer.id)
      .then((res) => setDetails(res.data))
      .catch(() => setDetails(engineer))
      .finally(() => { setLoading(false); setTimeout(() => setShown(true), 40); });
  }, [engineer.id, engineer]);

  const d = details || engineer;
  const total = d.total_tasks || 0;
  const completed = d.completed_tasks || 0;
  const onHold = d.on_hold_tasks || 0;
  const handovers = d.handover_count || 0;
  const days = d.total_days_worked || 0;
  const activeCount = d.active_tasks_count ?? (d.active_tasks ? d.active_tasks.length : 0);
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const initials = ((d.first_name?.[0] || '') + (d.last_name?.[0] || '') || d.username?.[0] || '?').toUpperCase();

  const tabs = [
    { id: 'active', label: 'النشطة', count: activeCount, Icon: Activity },
    { id: 'completed', label: 'المكتملة', count: completed, Icon: CheckCircle2 },
    { id: 'history', label: 'سجل التسليم', count: handovers, Icon: History },
  ];

  return (
    <div className={`skm-mask ${shown ? 'in' : ''}`} onClick={onClose}>
      <style>{CSS}</style>
      <div className="skm" onClick={(e) => e.stopPropagation()}>
        <div className="skm-ambient" aria-hidden />

        <header className="skm-head">
          <div className="skm-id">
            <div className="skm-av">{initials}</div>
            <div className="skm-id-txt">
              <h2>{d.first_name} {d.last_name}</h2>
              <p>
                <span className="skm-role">{d.role_display || d.role}</span>
                <span className="skm-sep">·</span>
                <span>{d.department || 'General'}</span>
                {d.username === 'salman.saeed' && <span className="skm-multi">Multi-Dept</span>}
              </p>
            </div>
          </div>
          <div className="skm-head-right">
            <div className="skm-ring">
              <svg viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" className="skm-ring-bg" />
                <circle cx="22" cy="22" r="18" className="skm-ring-fg"
                  strokeDasharray={`${(rate / 100) * 113.1} 113.1`} />
              </svg>
              <div className="skm-ring-t"><Num value={rate} /><i>%</i></div>
            </div>
            <button className="skm-x" onClick={onClose}><X size={18} /></button>
          </div>
        </header>

        {loading ? (
          <div className="skm-load"><Loader2 className="spin" size={26} /> جارٍ تحميل التفاصيل…</div>
        ) : (
          <>
            <div className="skm-stats">
              <Stat icon={<ListChecks size={16} />} label="إجمالي المهام" value={total} tone="sky" />
              <Stat icon={<CheckCircle2 size={16} />} label="مكتملة" value={completed} tone="emerald" pulse={completed > 0} />
              <Stat icon={<Activity size={16} />} label="نشطة" value={activeCount} tone="amber" />
              <Stat icon={<CircleDot size={16} />} label="موقوفة" value={onHold} tone="rose" />
              <Stat icon={<Clock size={16} />} label="أيام عمل" value={days} tone="violet" />
              <Stat icon={<RefreshCw size={16} />} label="تسليمات" value={handovers} tone="slate" />
            </div>

            <div className="skm-prog">
              <div className="skm-prog-h"><span>معدل الإنجاز</span><span className="skm-prog-v"><Num value={rate} />%</span></div>
              <div className="skm-prog-bar"><span style={{ width: `${rate}%` }} /></div>
            </div>

            <div className="skm-tabs">
              {tabs.map((t) => (
                <button key={t.id} className={`skm-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
                  <t.Icon size={14} /> {t.label} <em>{t.count}</em>
                </button>
              ))}
            </div>

            <div className="skm-body">
              {tab === 'active' && <TaskList items={d.active_tasks} emptyIcon={<Activity size={26} />} emptyText="لا توجد مهام نشطة حالياً." kind="active" />}
              {tab === 'completed' && <TaskList items={d.completed_tasks_list} emptyIcon={<Award size={26} />} emptyText="لا توجد مهام مكتملة بعد." kind="completed" />}
              {tab === 'history' && <HistoryList items={d.handover_logs} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone, pulse }) {
  return (
    <div className={`skm-stat t-${tone} ${pulse ? 'pulse' : ''}`}>
      <span className="skm-stat-ic">{icon}</span>
      <div><span className="skm-stat-v"><Num value={value} /></span><span className="skm-stat-l">{label}</span></div>
    </div>
  );
}

function TaskList({ items, emptyIcon, emptyText, kind }) {
  if (!items || items.length === 0) return <div className="skm-empty">{emptyIcon}<p>{emptyText}</p></div>;
  return (
    <ul className="skm-list">
      {items.map((t, i) => {
        const tone = STATUS_TONE[t.status] || 'slate';
        return (
          <li key={t.id || i} className={`skm-item t-${tone}`} style={{ '--i': i }}>
            <span className="skm-item-dot" />
            <div className="skm-item-main">
              <span className="skm-item-title">{t.title}</span>
              <span className="skm-item-sub">{t.project_name} {t.project_no ? `(${t.project_no})` : ''} · {t.discipline_name}</span>
            </div>
            <div className="skm-item-right">
              {kind === 'active' && <span className="skm-item-pct">{t.progress_percentage || 0}%</span>}
              {kind === 'completed' && t.approval_date && <span className="skm-item-date">{t.approval_date}</span>}
              <span className={`skm-badge t-${tone}`}>{STATUS_AR[t.status] || t.status}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function HistoryList({ items }) {
  if (!items || items.length === 0) return <div className="skm-empty"><ClipboardList size={26} /><p>لا سجلّ تسليم أو استبدال.</p></div>;
  return (
    <ul className="skm-list">
      {items.map((h, i) => (
        <li key={i} className="skm-item t-slate" style={{ '--i': i }}>
          <span className="skm-item-dot" />
          <div className="skm-item-main">
            <span className="skm-item-title">{h.task_title || h.task_discipline}</span>
            <span className="skm-item-sub">{h.project_name} · {h.days_worked} يوم عمل</span>
          </div>
          <div className="skm-item-right">
            <span className="skm-item-date"><Calendar size={11} /> {h.handover_date}</span>
            <span className={`skm-badge t-${STATUS_TONE[h.status_at_handover] || 'slate'}`}>{STATUS_AR[h.status_at_handover] || h.status_at_handover}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.skm-mask{ position:fixed; inset:0; z-index:60; display:grid; place-items:center; padding:18px; background:rgba(8,12,20,.66); backdrop-filter:blur(4px); opacity:0; transition:opacity .25s; }
.skm-mask.in{ opacity:1; }
.skm{ position:relative; width:min(720px,100%); max-height:90vh; overflow-y:auto; overflow-x:hidden; background:linear-gradient(180deg,#131c27,#0d141d); border:1px solid #26323f; border-radius:20px; color:#e9eff5; font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif; transform:scale(.96) translateY(10px); transition:transform .3s cubic-bezier(.2,.8,.2,1); box-shadow:0 40px 80px -30px rgba(0,0,0,.8); }
.skm-mask.in .skm{ transform:none; }
.skm-ambient{ position:absolute; inset:0; pointer-events:none; background:radial-gradient(60% 40% at 100% 0%, rgba(92,198,239,.10), transparent 60%), radial-gradient(50% 40% at 0% 100%, rgba(230,171,76,.08), transparent 60%), linear-gradient(rgba(92,198,239,.04) 1px,transparent 1px), linear-gradient(90deg,rgba(92,198,239,.04) 1px,transparent 1px); background-size:auto,auto,40px 40px,40px 40px; }
.skm > *:not(.skm-ambient){ position:relative; }
.skm-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:14px; padding:22px 24px 18px; border-bottom:1px solid #26323f; }
.skm-id{ display:flex; align-items:center; gap:13px; min-width:0; }
.skm-av{ width:52px; height:52px; flex:none; border-radius:14px; display:grid; place-items:center; background:linear-gradient(145deg,#5cc6ef,#2f8fc0); color:#04121c; font-family:'Space Grotesk'; font-weight:700; font-size:18px; }
.skm-id-txt h2{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:21px; font-weight:700; margin:0; line-height:1.15; }
.skm-id-txt p{ display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin:4px 0 0; font-size:12px; color:#8694a4; }
.skm-role{ color:#5cc6ef; font-weight:600; } .skm-sep{ opacity:.4; }
.skm-multi{ font-size:9px; font-weight:700; background:rgba(230,171,76,.16); color:#e6ab4c; padding:2px 7px; border-radius:99px; }
.skm-head-right{ display:flex; align-items:center; gap:12px; flex:none; }
.skm-ring{ position:relative; width:52px; height:52px; }
.skm-ring svg{ width:52px; height:52px; transform:rotate(-90deg); }
.skm-ring-bg{ fill:none; stroke:rgba(255,255,255,.08); stroke-width:5; }
.skm-ring-fg{ fill:none; stroke:#3fb286; stroke-width:5; stroke-linecap:round; transition:stroke-dasharray 1s cubic-bezier(.2,.7,.2,1); }
.skm-ring-t{ position:absolute; inset:0; display:flex; align-items:baseline; justify-content:center; font-family:'Space Grotesk'; font-weight:700; font-size:15px; }
.skm-ring-t i{ font-style:normal; font-size:9px; color:#8694a4; }
.skm-x{ width:34px; height:34px; border-radius:9px; display:grid; place-items:center; background:rgba(255,255,255,.05); border:1px solid #26323f; color:#8694a4; cursor:pointer; transition:.2s; }
.skm-x:hover{ color:#fff; background:rgba(227,112,126,.15); border-color:rgba(227,112,126,.4); }
.skm-load{ display:flex; align-items:center; justify-content:center; gap:10px; padding:60px; color:#8694a4; }
.spin{ animation:skm-spin .8s linear infinite; } @keyframes skm-spin{ to{ transform:rotate(360deg); } }
.skm-stats{ display:grid; grid-template-columns:repeat(6,1fr); gap:10px; padding:18px 24px 4px; }
@media(max-width:640px){ .skm-stats{ grid-template-columns:repeat(3,1fr); } }
.skm-stat{ display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 6px; border:1px solid #26323f; border-radius:12px; background:rgba(255,255,255,.02); transition:transform .25s, border-color .25s; }
.skm-stat:hover{ transform:translateY(-3px); }
.skm-stat-ic{ width:30px; height:30px; border-radius:9px; display:grid; place-items:center; }
.skm-stat-v{ font-family:'Space Grotesk'; font-size:21px; font-weight:700; line-height:1; }
.skm-stat-l{ font-size:9.5px; color:#8694a4; text-align:center; }
.skm-stat.t-sky .skm-stat-ic{ background:rgba(92,198,239,.14); color:#5cc6ef; } .skm-stat.t-sky .skm-stat-v{ color:#5cc6ef; }
.skm-stat.t-emerald .skm-stat-ic{ background:rgba(63,178,134,.14); color:#3fb286; } .skm-stat.t-emerald .skm-stat-v{ color:#3fb286; }
.skm-stat.t-amber .skm-stat-ic{ background:rgba(230,171,76,.14); color:#e6ab4c; } .skm-stat.t-amber .skm-stat-v{ color:#e6ab4c; }
.skm-stat.t-rose .skm-stat-ic{ background:rgba(227,112,126,.14); color:#e3707e; } .skm-stat.t-rose .skm-stat-v{ color:#e3707e; }
.skm-stat.t-violet .skm-stat-ic{ background:rgba(161,140,242,.14); color:#a18cf2; } .skm-stat.t-violet .skm-stat-v{ color:#a18cf2; }
.skm-stat.t-slate .skm-stat-ic{ background:rgba(255,255,255,.06); color:#8694a4; } .skm-stat.t-slate .skm-stat-v{ color:#cdd6dd; }
.skm-stat.pulse{ animation:skm-pulse 2.4s ease-in-out infinite; }
@keyframes skm-pulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(63,178,134,0); } 50%{ box-shadow:0 0 0 3px rgba(63,178,134,.18); } }
.skm-prog{ padding:14px 24px 4px; }
.skm-prog-h{ display:flex; justify-content:space-between; font-size:12px; color:#8694a4; margin-bottom:7px; }
.skm-prog-v{ font-family:'JetBrains Mono'; font-weight:700; color:#3fb286; }
.skm-prog-bar{ height:9px; border-radius:99px; background:rgba(255,255,255,.07); overflow:hidden; }
.skm-prog-bar span{ display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,#5cc6ef,#3fb286); position:relative; transition:width 1s cubic-bezier(.2,.7,.2,1); }
.skm-prog-bar span::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-100%); animation:skm-shim 2.6s ease-in-out infinite; }
@keyframes skm-shim{ 60%,100%{ transform:translateX(240%); } }
.skm-tabs{ display:flex; gap:6px; padding:16px 24px 0; border-bottom:1px solid #26323f; }
.skm-tab{ display:inline-flex; align-items:center; gap:6px; padding:9px 13px; background:none; border:none; border-bottom:2px solid transparent; color:#8694a4; font-family:inherit; font-size:12.5px; font-weight:600; cursor:pointer; transition:.2s; }
.skm-tab em{ font-style:normal; font-family:'JetBrains Mono'; font-size:10px; background:rgba(255,255,255,.06); padding:1px 6px; border-radius:99px; }
.skm-tab:hover{ color:#cdd6dd; }
.skm-tab.on{ color:#fff; border-bottom-color:#5cc6ef; } .skm-tab.on em{ background:rgba(92,198,239,.2); color:#5cc6ef; }
.skm-body{ padding:16px 24px 24px; }
.skm-empty{ display:flex; flex-direction:column; align-items:center; gap:10px; padding:36px; color:#5d6b7a; text-align:center; border:1px dashed #26323f; border-radius:13px; }
.skm-empty p{ margin:0; font-size:12.5px; }
.skm-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.skm-item{ display:flex; align-items:center; gap:12px; padding:11px 13px; border:1px solid #26323f; border-inline-start-width:3px; border-radius:11px; background:rgba(255,255,255,.02); opacity:0; transform:translateX(-8px); animation:skm-rise .4s ease forwards; animation-delay:calc(var(--i) * 45ms); transition:border-color .25s, background .25s, transform .25s; }
@keyframes skm-rise{ to{ opacity:1; transform:none; } }
.skm-item:hover{ background:rgba(255,255,255,.04); transform:translateX(3px); }
.skm-item.t-emerald{ border-inline-start-color:#3fb286; } .skm-item.t-sky{ border-inline-start-color:#5cc6ef; }
.skm-item.t-amber{ border-inline-start-color:#e6ab4c; } .skm-item.t-rose{ border-inline-start-color:#e3707e; } .skm-item.t-slate{ border-inline-start-color:#5d6b7a; }
.skm-item-dot{ width:8px; height:8px; border-radius:50%; flex:none; background:#5d6b7a; }
.skm-item.t-emerald .skm-item-dot{ background:#3fb286; } .skm-item.t-sky .skm-item-dot{ background:#5cc6ef; }
.skm-item.t-amber .skm-item-dot{ background:#e6ab4c; } .skm-item.t-rose .skm-item-dot{ background:#e3707e; }
.skm-item-main{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.skm-item-title{ font-size:13px; font-weight:600; color:#e9eff5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.skm-item-sub{ font-size:10.5px; color:#8694a4; font-family:'JetBrains Mono'; }
.skm-item-right{ display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex:none; }
.skm-item-pct{ font-family:'JetBrains Mono'; font-weight:700; font-size:13px; color:#5cc6ef; }
.skm-item-date{ display:inline-flex; align-items:center; gap:4px; font-family:'JetBrains Mono'; font-size:10px; color:#8694a4; }
.skm-badge{ font-size:10px; font-weight:600; padding:2px 9px; border-radius:99px; white-space:nowrap; }
.skm-badge.t-emerald{ background:rgba(63,178,134,.16); color:#3fb286; } .skm-badge.t-sky{ background:rgba(92,198,239,.16); color:#5cc6ef; }
.skm-badge.t-amber{ background:rgba(230,171,76,.16); color:#e6ab4c; } .skm-badge.t-rose{ background:rgba(227,112,126,.16); color:#e3707e; } .skm-badge.t-slate{ background:rgba(255,255,255,.08); color:#aeb9c5; }
`;