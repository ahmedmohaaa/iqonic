import apiClient from '../../../api/axios';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getInternalReview } from '../../../api/services/internalReview';
import {
  CheckCircle2, Circle, ShieldCheck, Clock, Sparkles, Eye, AlertTriangle, Lock,
} from 'lucide-react';

const STAGE_ICON = { 1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤' };
const STATUS_TONE = { PENDING: 'slate', UNDER_REVIEW: 'amber', APPROVED: 'emerald' };
const STATUS_AR = { PENDING: 'قيد الانتظار', UNDER_REVIEW: 'قيد المراجعة', APPROVED: 'معتمَد' };

export default function InternalDesignReviewPanel({ project }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reveal, setReveal] = useState(false);
  const [errStatus, setErrStatus] = useState(null);
  const rootRef = useRef(null);

  const load = () => {
    setLoading(true); setErrStatus(null);
    getInternalReview(project.id)
      .then((r) => setData(r.data))
      .catch((e) => { setData(null); setErrStatus(e.response?.status || 0); })
      .finally(() => setLoading(false));
  };
    // ✅ صلاحية زر الإنجاز: أحمد زبادي أو سكرتيرة الإشراف فقط
  const canComplete =
    user?.username === 'ahmed.zabady' ||
    (user?.role === 'SECRETARY' && user?.department === 'Supervision');

  const [busyId, setBusyId] = useState(null);

  const completeStage = async (s) => {
    if (!window.confirm(`إنجاز واعتماد مرحلة «${s.stage_name_display}» نهائيًا؟`)) return;
    setBusyId(s.id);
    try {
      await apiClient.patch(`internal-review/stages/${s.id}/`, { status: 'APPROVED' });
      load();
    } catch (e) {
      alert(e.response?.data?.detail || 'تعذّر إنجاز المرحلة.');
    } finally {
      setBusyId(null);
    }
  };
  useEffect(() => { load(); }, [project.id]);
  useEffect(() => { const t = setTimeout(() => setReveal(true), 60); return () => clearTimeout(t); }, []);

  const stages = data?.stages || [];
  const assignees = data?.assignees || [];
  const prog = data?.progress || { approved: 0, total: 0, percentage: 0, all_approved: false };

  if (loading) return <div className="rvp rvp-load"><Sparkles className="spin" size={20} /> جارٍ تحميل المراجعة الداخلية…</div>;

  if (!data) {
    const forbidden = errStatus === 403;
    const missing = errStatus === 404 || errStatus === 0;
    const tone = forbidden ? '#e6ab4c' : '#e3707e';
    return (
      <section className="rvp rvp-in">
        <style>{CSS}</style>
        <div className="rvp-ambient" aria-hidden />
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 18, border: `1px solid ${tone}55`, borderRadius: 14, background: `linear-gradient(135deg, ${tone}14, transparent 70%)` }}>
          <span style={{ flex: 'none', width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: `${tone}22`, color: tone, border: `1px solid ${tone}55` }}>
            {forbidden ? <Lock size={18} /> : <AlertTriangle size={18} />}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 700, color: '#e9eff5' }}>
              {forbidden ? 'ليست لك صلاحية عرض هذه المراجعة' : missing ? 'تعذّر الوصول لبيانات المراجعة' : 'تعذّر تحميل المراجعة التصميمية'}
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: '#8694a4' }}>
              {forbidden
                ? 'تظهر المراجعة لمهندسي التصميم المعيَّنين ولمدير الإشراف والإدارة فقط.'
                : missing
                ? 'مسار المراجعة الداخلية غير متاح في الخادم بعد. تأكّد من المسارات ثم أعد تشغيل السيرفر.'
                : `استجابة الخادم: ${errStatus}. راجع سجلّ السيرفر للتفاصيل.`}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={rootRef} className={`rvp ${reveal ? 'rvp-in' : ''}`}>
      <style>{CSS}</style>
      <div className="rvp-ambient" aria-hidden />

      <header className="rvp-head">
        <div>
          <span className="rvp-kicker">INTERNAL DESIGN REVIEW · جسر الإشراف ↔ التصميم</span>
          <h2 className="rvp-title">المراجعة التصميمية الداخلية</h2>
          <p className="rvp-sub">
            <Eye size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> وضع القراءة فقط —
            حالات المراحل تتحدّث تلقائياً عند إنجاز مهام المراجعة من صفحة «إنشاء مهمة» (Internal Review).
          </p>
        </div>
        <div className="rvp-gauge">
          <svg viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" className="rvp-ring-bg" />
            <circle cx="22" cy="22" r="18" className="rvp-ring-fg"
              strokeDasharray={`${(prog.percentage / 100) * 113.1} 113.1`} />
          </svg>
          <div className="rvp-gauge-t"><b>{prog.approved}</b><i>/{prog.total}</i></div>
        </div>
      </header>

      {prog.all_approved && (
        <div className="rvp-done"><ShieldCheck size={16} /> كل المراحل معتمَدة — التصميم جاهز للموقع.</div>
      )}

      {/* المعيّنون — للعرض فقط */}
      <div className="rvp-assignees">
        <span className="rvp-assignees-h">مهندسو التصميم على هذه المراجعة</span>
        <div className="rvp-chips">
          {assignees.length === 0
            ? <span className="rvp-none">لم يُكلَّف أحد بعد — يتم التكليف عند إنشاء مهمة مراجعة.</span>
            : assignees.map((a) => (
              <span key={a.id} className="rvp-chip">{a.full_name || `${a.first_name} ${a.last_name}`}<em>{a.role}</em></span>
            ))}
        </div>
      </div>

      {/* الخط الزمني — حالات للعرض فقط (بلا أزرار تدوير) */}
   <ol className="rvp-track">
     {stages.map((s, i) => {
       const tone = STATUS_TONE[s.status];
       const prevOk = i === 0 || stages[i - 1].status === 'APPROVED';
       return (
         <li key={s.id} className={`rvp-stage t-${tone}`} style={{ '--i': i }}>
           {i > 0 && <span className={`rvp-line ${stages[i - 1].status === 'APPROVED' ? 'lit' : ''}`} />}
           <span className="rvp-node">{STAGE_ICON[s.sequence_order]}</span>
           <div className="rvp-stage-body">
             <span className="rvp-stage-name">{s.stage_name_display}</span>
             <span className="rvp-stage-meta">
               {s.updated_by_name ? <>حدّثها {s.updated_by_name}</> : 'لم تُحدَّث بعد'}
               {s.updated_at && <> · {new Date(s.updated_at).toLocaleDateString('ar-EG')}</>}
             </span>
           </div>
           <span className={`rvp-status t-${tone}`} title="حالة للقراءة فقط">
             {s.status === 'APPROVED' ? <CheckCircle2 size={13} /> : s.status === 'UNDER_REVIEW' ? <Clock size={13} /> : <Circle size={13} />}
             {STATUS_AR[s.status]}
           </span>
           {/* ✅ زر الإنجاز — يظهر فقط لأحمد زبادي وسكرتيرة الإشراف */}
           {canComplete && s.status !== 'APPROVED' && prevOk && (
             <button
               type="button"
               className="rvp-done-btn"
               disabled={busyId === s.id}
               onClick={() => completeStage(s)}
             >
               {busyId === s.id ? '…' : 'إنجاز'}
             </button>
           )}
         </li>
       );
     })}
   </ol>
    </section>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.rvp{ --ink:#0c141d; --surf:#131c27; --line:#26323f; --paper:#e9eff5; --mut:#8694a4;
--amber:#e6ab4c; --emerald:#3fb286; --sky:#5cc6ef; --rose:#e3707e; --slate:#5d6b7a; --violet:#a18cf2;
position:relative; overflow:hidden; border:1px solid var(--line); border-radius:18px; padding:22px;
color:var(--paper); font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
background:linear-gradient(180deg,rgba(255,255,255,.025),transparent), var(--surf);
opacity:0; transform:translateY(14px); transition:opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1); }
.rvp-in{ opacity:1; transform:none; }
.rvp-ambient{ position:absolute; inset:0; pointer-events:none;
background:radial-gradient(54% 46% at 96% -8%, rgba(161,140,242,.10), transparent 60%),
radial-gradient(46% 42% at -4% 108%, rgba(92,198,239,.08), transparent 60%),
linear-gradient(rgba(161,140,242,.04) 1px,transparent 1px), linear-gradient(90deg,rgba(161,140,242,.04) 1px,transparent 1px);
background-size:auto,auto,40px 40px,40px 40px; }
.rvp > *:not(.rvp-ambient){ position:relative; }
.rvp-load{ display:flex; align-items:center; gap:9px; color:var(--mut); padding:18px; }
.spin{ animation:rvpspin .8s linear infinite; } @keyframes rvpspin{ to{ transform:rotate(360deg); } }
.rvp-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
.rvp-kicker{ font-family:'Space Grotesk'; font-size:10px; letter-spacing:.28em; color:var(--violet); }
.rvp-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(20px,3vw,28px); font-weight:700; margin:4px 0 5px; letter-spacing:-.01em; }
.rvp-sub{ display:flex; align-items:center; gap:6px; color:var(--mut); font-size:12.5px; max-width:60ch; margin:0; }
.rvp-gauge{ position:relative; width:56px; height:56px; flex:none; }
.rvp-gauge svg{ width:56px; height:56px; transform:rotate(-90deg); }
.rvp-ring-bg{ fill:none; stroke:rgba(255,255,255,.08); stroke-width:5; }
.rvp-ring-fg{ fill:none; stroke:var(--emerald); stroke-width:5; stroke-linecap:round; transition:stroke-dasharray 1s cubic-bezier(.2,.7,.2,1); }
.rvp-gauge-t{ position:absolute; inset:0; display:flex; align-items:baseline; justify-content:center; font-family:'Space Grotesk'; font-weight:700; font-size:15px; }
.rvp-gauge-t i{ font-style:normal; font-size:10px; color:var(--mut); }
.rvp-done{ display:flex; align-items:center; gap:9px; margin-top:14px; padding:11px 14px; border-radius:11px;
background:rgba(63,178,134,.1); border:1px solid rgba(63,178,134,.4); color:var(--emerald); font-size:12.5px; font-weight:600;
animation:rvppop .4s cubic-bezier(.2,.8,.2,1); }
@keyframes rvppop{ from{ opacity:0; transform:scale(.97);} to{ opacity:1; transform:none;} }
.rvp-assignees{ margin-top:16px; padding:13px 14px; border:1px solid var(--line); border-radius:13px; background:rgba(255,255,255,.02); }
.rvp-assignees-h{ display:block; font-size:11.5px; font-weight:600; color:var(--mut); margin-bottom:9px; }
.rvp-chips{ display:flex; flex-wrap:wrap; gap:7px; align-items:center; }
.rvp-none{ font-size:12px; color:var(--mut); }
.rvp-chip{ display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:var(--paper);
background:rgba(161,140,242,.12); border:1px solid rgba(161,140,242,.3); padding:4px 10px; border-radius:99px; }
.rvp-chip em{ font-style:normal; font-size:9.5px; color:var(--violet); background:rgba(161,140,242,.18); padding:1px 6px; border-radius:99px; }
.rvp-track{ list-style:none; margin:18px 0 0; padding:0; position:relative; }
.rvp-stage{ position:relative; display:flex; align-items:center; gap:13px; padding:0 0 4px 44px; min-height:58px;
opacity:0; transform:translateX(-8px); animation:rvprise .45s ease forwards; animation-delay:calc(var(--i) * 60ms + .1s); }
@keyframes rvprise{ to{ opacity:1; transform:none; } }
.rvp-line{ position:absolute; top:-6px; bottom:6px; inset-inline-start:15px; width:2px; background:var(--line); }
.rvp-line.lit{ background:linear-gradient(180deg,var(--emerald),rgba(63,178,134,.4)); }
.rvp-node{ position:absolute; inset-inline-start:0; top:14px; width:32px; height:32px; border-radius:50%; display:grid; place-items:center;
font-family:'Space Grotesk'; font-weight:700; font-size:14px; background:var(--ink); border:2px solid var(--line); color:var(--mut); z-index:1; transition:.3s; }
.rvp-stage.t-emerald .rvp-node{ background:var(--emerald); border-color:var(--emerald); color:#04130c; box-shadow:0 0 0 4px rgba(63,178,134,.16); }
.rvp-stage.t-amber .rvp-node{ border-color:var(--amber); color:var(--amber); }
.rvp-stage-body{ flex:1; min-width:0; }
.rvp-stage-name{ display:block; font-size:14px; font-weight:600; }
.rvp-stage-meta{ display:block; font-size:10.5px; color:var(--mut); font-family:'JetBrains Mono'; margin-top:2px; }
.rvp-status{ display:inline-flex; align-items:center; gap:6px; font-family:inherit; font-size:11px; font-weight:600;
padding:5px 11px; border-radius:99px; border:1px solid transparent; white-space:nowrap; }
.rvp-status.t-slate{ background:rgba(93,107,122,.18); color:#aeb9c5; }
.rvp-status.t-amber{ background:rgba(230,171,76,.16); color:var(--amber); }
.rvp-status.t-emerald{ background:rgba(63,178,134,.16); color:var(--emerald); }
 .rvp-done-btn{ margin-inline-start:8px; flex:none; font-family:inherit; font-size:11px; font-weight:700; color:#06140e; background:var(--emerald); border:none; border-radius:99px; padding:6px 13px; cursor:pointer; transition:filter .2s, transform .2s; } .rvp-done-btn:hover{ filter:brightness(1.08); transform:translateY(-1px); } .rvp-done-btn:disabled{ opacity:.5; cursor:not-allowed; }
`;

