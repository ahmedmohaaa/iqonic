import { useState, useMemo, useRef, useEffect } from 'react';
import apiClient from '../../../api/axios';
import {
  CheckCircle2, Circle, Clock, AlertTriangle, Lock, LockOpen,
  Calendar, Flag, Hammer, Wrench, PenLine, X, Zap, Route,
  ChevronRight, Sparkles,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
LifecycleRibbon  —  Final Unified Lifecycle Ribbon
Builds the ribbon from all sources of truth together so the buttons always match,
and closes the cycle (closing) in one push from the front-end.
props: project, canEditLifecycle, canEditStruct, canEditIFC, onReload
═══════════════════════════════════════════════════════════════ */
// Normalize any raw status into a standard status
const norm = (s) => {
  const u = String(s || '').toUpperCase();
  if (['ACHIEVED', 'APPROVED'].includes(u)) return 'ACHIEVED';
  if (u === 'COMPLETED') return 'COMPLETED';
  if (['IN_PROGRESS', 'ON_GOING', 'UNDER_REVIEW', 'STARTED'].includes(u)) return 'IN_PROGRESS';
  if (u === 'OVERDUE') return 'OVERDUE';
  if (u === 'ON_HOLD') return 'ON_HOLD';
  return 'UPCOMING';
};
// Visual tone: done (achieved by date) / done2 (disciplines completed only) / live / over / hold / up
const toneOf = (st) =>
  ({ ACHIEVED: 'done', COMPLETED: 'done2', IN_PROGRESS: 'live', OVERDUE: 'over', ON_HOLD: 'hold' }[st] || 'up');
const isDoneTone = (t) => t === 'done' || t === 'done2';
const pctOf = (o) => (o && o.total ? Math.round(((o.completed || 0) / o.total) * 100) : null);
// Achievement variance vs planned (for administrative stages that own both dates)
const variance = (src) => {
  if (!src?.planned_date || !src?.actual_date) return null;
  const d = Math.round((new Date(src.actual_date) - new Date(src.planned_date)) / 86400000);
  if (d < 0) return { kind: 'early', txt: `Early by ${-d}d` };
  if (d > 0) return { kind: 'late', txt: `Late by ${d}d` };
  return { kind: 'ontime', txt: 'On time' };
};
export default function LifecycleRibbon({
  project, canEditLifecycle, canEditStruct, canEditIFC, onReload,
}) {
  const [dateModal, setDateModal] = useState(null);   // { key, label, id }
  const [dateVal, setDateVal] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => setReveal(true), 60);
    return () => clearTimeout(t);
  }, []);
  const lc = project?.lifecycle_stages || [];
  const findLc = (name) => lc.find((s) => s.stage_name === name);
  const dc1 = project?.dc1_status || {};
  const dc2 = project?.dc2_status || {};
  const struct = project?.structural_status || {};
  const ifc = project?.ifc_status || {};
  const isDesign = project?.scope !== 'SUPERVISION';
  // Documented derivation: Concept is done once DC1 has started; Tender is done once IFC is completed
  const conceptSt = (dc1.status && dc1.status !== 'NOT_STARTED') ? 'ACHIEVED' : norm(findLc('CONCEPT')?.status);
  const tenderSt = (['COMPLETED', 'APPROVED'].includes(String(ifc.status || '').toUpperCase()))
    ? 'ACHIEVED' : norm(findLc('TENDER')?.status);
  const nodes = useMemo(() => (isDesign ? [
    { key: 'OFFER', label: 'RFQ / Offer', st: norm(findLc('OFFER')?.status), src: findLc('OFFER'), kind: 'admin', Icon: Flag },
    { key: 'CONTRACT_SUBMITTED', label: 'Contract Submitted', st: norm(findLc('CONTRACT_SUBMITTED')?.status), src: findLc('CONTRACT_SUBMITTED'), kind: 'admin', Icon: PenLine },
    { key: 'CONTRACT_SIGNED', label: 'Contract Signed', st: norm(findLc('CONTRACT_SIGNED')?.status), src: findLc('CONTRACT_SIGNED'), kind: 'admin', Icon: Lock },
    { key: 'CONCEPT', label: 'Concept', st: norm(conceptSt), kind: 'derived', Icon: Sparkles },
    { key: 'DC1', label: 'DC1', st: norm(dc1.status), pct: pctOf(dc1), kind: 'flag', Icon: Flag },
    { key: 'DC2', label: 'DC2', st: norm(dc2.status), pct: pctOf(dc2), kind: 'flag', Icon: Flag },
    { key: 'STRUCTURAL', label: 'Structural', st: norm(struct.status), kind: 'flag', Icon: Hammer },
    { key: 'IFC', label: 'IFC Package', st: norm(ifc.status), kind: 'flag', Icon: Wrench },
    { key: 'TENDER', label: 'Tender', st: norm(tenderSt), kind: 'derived', Icon: Route },
  ] : [
    { key: 'OFFER', label: 'Offer', st: norm(findLc('OFFER')?.status), src: findLc('OFFER'), kind: 'admin', Icon: Flag },
    { key: 'CONTRACT_SUBMITTED', label: 'Contract Submit', st: norm(findLc('CONTRACT_SUBMITTED')?.status), src: findLc('CONTRACT_SUBMITTED'), kind: 'admin', Icon: PenLine },
    { key: 'CONTRACT_SIGNED', label: 'Signed', st: norm(findLc('CONTRACT_SIGNED')?.status), src: findLc('CONTRACT_SIGNED'), kind: 'admin', Icon: Lock },
    { key: 'COLLECTION', label: 'Collection', st: norm(findLc('COLLECTION')?.status), src: findLc('COLLECTION'), kind: 'admin', Icon: Calendar },
    { key: 'CLOSED', label: 'Closed', st: norm(findLc('CLOSED')?.status), src: findLc('CLOSED'), kind: 'admin', Icon: LockOpen },
  ]), [project, lc, dc1, dc2, struct, ifc, isDesign]);
  const doneCount = nodes.filter((n) => isDoneTone(toneOf(n.st))).length;
  const overallPct = nodes.length ? Math.round((doneCount / nodes.length) * 100) : 0;
  const allDone = nodes.length > 0 && nodes.every((n) => isDoneTone(toneOf(n.st)));
  const overdueCount = nodes.filter((n) => toneOf(n.st) === 'over').length;
  // Closure readiness checklist
  const checklist = useMemo(() => [
    { ok: doneCount === nodes.length, txt: `All stages achieved (${doneCount}/${nodes.length})` },
    { ok: overdueCount === 0, txt: overdueCount === 0 ? 'No overdue stages' : `${overdueCount} overdue stages` },
    { ok: !project?.is_active || allDone, txt: project?.is_active ? 'Project is still active' : 'Project is closed' },
  ], [doneCount, nodes.length, overdueCount, project?.is_active, allDone]);
  const canClose = canEditLifecycle && allDone && project?.is_active;
  // Enter an actual date for an administrative node
  const submitDate = async () => {
    if (!dateModal?.id || !dateVal) return;
    setBusy(true);
    try {
      await apiClient.patch(`lifecycle/${dateModal.id}/update/`, { actual_date: dateVal });
      setDateModal(null); setDateVal('');
      onReload?.();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to update the stage');
    } finally { setBusy(false); }
  };
  // Close the cycle in one push: achieve all un-achieved administrative stages
  const confirmClose = async () => {
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const pending = lc.filter((s) => !['ACHIEVED', 'APPROVED'].includes(String(s.status).toUpperCase()));
      for (const s of pending) {
        await apiClient.patch(`lifecycle/${s.id}/update/`, { actual_date: today });
      }
      setCloseOpen(false);
      onReload?.();
    } catch (e) {
      alert('Failed to close the cycle: ' + (e.response?.data?.detail || e.message));
    } finally { setBusy(false); }
  };
  const onNodeClick = (n) => {
    if (n.kind === 'admin' && canEditLifecycle && !isDoneTone(toneOf(n.st)) && n.src?.id) {
      setDateModal({ key: n.key, label: n.label, id: n.src.id });
      setDateVal('');
    }
  };
  return (
    <section ref={rootRef} className={`lcx ${reveal ? 'lcx-in' : ''}`}>
      <style>{CSS}</style>
      <div className="lcx-ambient" aria-hidden />
      {/* Fixed floating DC1 / DC2 buttons on the side of the ribbon */}
      {isDesign && (
        <aside className="lcx-float" aria-label="DC1 & DC2 indicators">
          {[['DC1', dc1, 'sky'], ['DC2', dc2, 'violet']].map(([k, o, c]) => {
            const t = toneOf(norm(o.status));
            return (
              <div key={k} className={`lcx-fbtn c-${c} t-${t}`} title={`${k} — ${norm(o.status)}`}>
                <span className="lcx-fdot" />
                <span className="lcx-fl">{k}</span>
                <span className="lcx-fp">{pctOf(o) ?? 0}%</span>
              </div>
            );
          })}
        </aside>
      )}
      {/* Header + overall progress bar */}
      <header className="lcx-head">
        <div>
          <span className="lcx-kicker">LIFECYCLE · Project Lifecycle</span>
          <h2 className="lcx-title">
            {isDesign ? 'Integrated Design Track' : 'Supervision Track'}
          </h2>
        </div>
        <div className="lcx-gauge">
          <svg viewBox="0 0 44 44" className="lcx-ring">
            <circle cx="22" cy="22" r="18" className="lcx-ring-bg" />
            <circle cx="22" cy="22" r="18" className="lcx-ring-fg"
              strokeDasharray={`${(overallPct / 100) * 113.1} 113.1`} />
          </svg>
          <div className="lcx-gauge-t"><b>{overallPct}</b><i>%</i></div>
        </div>
      </header>
      <div className="lcx-bar"><span style={{ width: `${overallPct}%` }} /></div>
      {/* Unified horizontal ribbon */}
      <ol className="lcx-track">
        {nodes.map((n, i) => {
          const t = toneOf(n.st);
          const v = n.src ? variance(n.src) : null;
          const clickable = n.kind === 'admin' && canEditLifecycle && !isDoneTone(t) && n.src?.id;
          return (
            <li key={n.key} className={`lcx-node t-${t}`} style={{ '--i': i }}>
              {i > 0 && <span className={`lcx-line ${isDoneTone(toneOf(nodes[i - 1].st)) ? 'lit' : ''}`} />}
              <button
                type="button"
                className={`lcx-dot ${clickable ? 'click' : ''}`}
                onClick={() => onNodeClick(n)}
                disabled={!clickable}
                title={clickable ? 'Enter the actual achievement date' : n.label}
              >
                {t === 'done' ? <CheckCircle2 size={15} />
                  : t === 'over' ? <AlertTriangle size={14} />
                  : t === 'live' || t === 'hold' ? <Clock size={14} />
                  : <Circle size={14} />}
              </button>
              <span className="lcx-name">{n.label}</span>
              <span className="lcx-st">{
                { done: 'Achieved', done2: 'Completed', live: 'In Progress', over: 'Overdue', hold: 'On Hold', up: 'Upcoming' }[t]
              }</span>
              {n.pct != null && <span className="lcx-pct">{n.pct}%</span>}
              {v && <span className={`lcx-var v-${v.kind}`}>{v.txt}</span>}
              {n.src?.actual_date && <span className="lcx-date">{n.src.actual_date}</span>}
            </li>
          );
        })}
      </ol>
      {/* Closure readiness panel */}
      <div className={`lcx-ready ${allDone ? 'ok' : ''}`}>
        <div className="lcx-ready-h">
          <Route size={16} />
          <span>Closure Readiness</span>
          {canClose && (
            <button className="lcx-close-btn" onClick={() => setCloseOpen(true)} disabled={busy}>
              <LockOpen size={14} /> Close Project
            </button>
          )}
        </div>
        <ul className="lcx-check">
          {checklist.map((c, i) => (
            <li key={i} className={c.ok ? 'ok' : 'no'}>
              {c.ok ? <CheckCircle2 size={14} /> : <Circle size={14} />} {c.txt}
            </li>
          ))}
        </ul>
      </div>
      {/* Actual date entry modal */}
      {dateModal && (
        <div className="lcx-mask" onClick={() => setDateModal(null)}>
          <div className="lcx-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lcx-modal-h">
              <h3>Record achievement of “{dateModal.label}”</h3>
              <button onClick={() => setDateModal(null)}><X size={18} /></button>
            </div>
            <p className="lcx-modal-p">Enter the actual date on which this stage was achieved; the variance will be calculated automatically.</p>
            <input type="date" value={dateVal} onChange={(e) => setDateVal(e.target.value)} className="lcx-date-in" />
            <div className="lcx-modal-f">
              <button className="lcx-ghost" onClick={() => setDateModal(null)}>Cancel</button>
              <button className="lcx-solid" onClick={submitDate} disabled={busy || !dateVal}>
                {busy ? 'Saving…' : 'Confirm Achievement'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Close confirmation modal */}
      {closeOpen && (
        <div className="lcx-mask" onClick={() => setCloseOpen(false)}>
          <div className="lcx-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lcx-modal-h">
              <h3>Close Lifecycle</h3>
              <button onClick={() => setCloseOpen(false)}><X size={18} /></button>
            </div>
            <p className="lcx-modal-p">
              All remaining administrative stages will be achieved with today's date, then the project
              will be closed and moved to “Closed Projects”. This cannot be undone.
            </p>
            <div className="lcx-modal-f">
              <button className="lcx-ghost" onClick={() => setCloseOpen(false)}>Cancel</button>
              <button className="lcx-solid danger" onClick={confirmClose} disabled={busy}>
                {busy ? 'Closing…' : 'Yes, close the project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
/* ═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.lcx{ position:relative; overflow:hidden; border:1px solid var(--line,#26323f); border-radius:18px;
padding:22px 22px 18px; color:var(--paper,#e9eff5);
font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,0)), var(--surf,#131c27);
opacity:0; transform:translateY(14px); transition:opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1); }
.lcx-in{ opacity:1; transform:none; }
.lcx-ambient{ position:absolute; inset:0; pointer-events:none;
background:
radial-gradient(54% 46% at 92% -8%, rgba(230,171,76,.10), transparent 60%),
radial-gradient(48% 42% at -4% 108%, rgba(92,198,239,.09), transparent 60%),
linear-gradient(rgba(92,198,239,.045) 1px,transparent 1px),
linear-gradient(90deg,rgba(92,198,239,.045) 1px,transparent 1px);
background-size:auto,auto,42px 42px,42px 42px;
-webkit-mask-image:radial-gradient(120% 100% at 50% 0%,#000,transparent 86%);
mask-image:radial-gradient(120% 100% at 50% 0%,#000,transparent 86%); }
.lcx > *:not(.lcx-ambient){ position:relative; }
/* Fixed floating buttons on the side of the ribbon */
.lcx-float{ position:absolute; top:18px; inset-inline-end:18px; display:flex; flex-direction:column; gap:10px; z-index:3; }
.lcx-fbtn{ display:flex; flex-direction:column; align-items:center; gap:3px; padding:10px 9px; min-width:54px;
border-radius:13px; border:1px solid var(--line,#26323f); background:rgba(10,15,22,.6); backdrop-filter:blur(4px);
transition:transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s, border-color .3s; }
.lcx-fbtn:hover{ transform:translateY(-3px) scale(1.04); }
.lcx-fbtn.c-sky{ border-color:rgba(92,198,239,.4); } .lcx-fbtn.c-violet{ border-color:rgba(161,140,242,.4); }
.lcx-fbtn.t-done,.lcx-fbtn.t-done2{ box-shadow:0 0 0 1px rgba(63,178,134,.4), 0 8px 22px -12px rgba(63,178,134,.6); }
.lcx-fdot{ width:10px; height:10px; border-radius:50%; background:var(--slate,#5d6b7a); }
.lcx-fbtn.t-done .lcx-fdot,.lcx-fbtn.t-done2 .lcx-fdot{ background:var(--emerald,#3fb286); }
.lcx-fbtn.t-live .lcx-fdot{ background:var(--amber,#e6ab4c); animation:lcxping 1.8s infinite; }
.lcx-fbtn.t-over .lcx-fdot{ background:var(--rose,#e3707e); animation:lcxping 1.4s infinite; }
@keyframes lcxping{ 0%,100%{ box-shadow:0 0 0 0 currentColor; } 70%{ box-shadow:0 0 0 7px transparent; } }
.lcx-fl{ font-family:'Space Grotesk'; font-weight:700; font-size:12px; }
.lcx-fp{ font-family:'JetBrains Mono'; font-size:10px; color:var(--mut,#8694a4); }
/* Header */
.lcx-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding-inline-end:74px; }
.lcx-kicker{ font-family:'Space Grotesk'; font-size:10px; letter-spacing:.3em; color:var(--amber,#e6ab4c); }
.lcx-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(20px,3vw,30px); font-weight:700; margin:4px 0 0; letter-spacing:-.01em; }
.lcx-gauge{ position:relative; width:58px; height:58px; flex:none; }
.lcx-ring{ width:58px; height:58px; transform:rotate(-90deg); }
.lcx-ring-bg{ fill:none; stroke:rgba(255,255,255,.08); stroke-width:5; }
.lcx-ring-fg{ fill:none; stroke:var(--emerald,#3fb286); stroke-width:5; stroke-linecap:round; transition:stroke-dasharray 1s cubic-bezier(.2,.7,.2,1); }
.lcx-gauge-t{ position:absolute; inset:0; display:flex; align-items:baseline; justify-content:center; }
.lcx-gauge-t b{ font-family:'Space Grotesk'; font-size:18px; font-weight:700; }
.lcx-gauge-t i{ font-style:normal; font-size:10px; color:var(--mut,#8694a4); }
/* Overall progress bar */
.lcx-bar{ height:7px; border-radius:99px; background:rgba(255,255,255,.07); margin:16px 0 4px; overflow:hidden; }
.lcx-bar span{ display:block; height:100%; border-radius:99px; position:relative;
background:linear-gradient(90deg,var(--sky,#5cc6ef),var(--emerald,#3fb286)); transition:width 1s cubic-bezier(.2,.7,.2,1); }
.lcx-bar span::after{ content:""; position:absolute; inset:0;
background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);
transform:translateX(-100%); animation:lcxshim 2.6s ease-in-out infinite; }
@keyframes lcxshim{ 60%,100%{ transform:translateX(240%); } }
/* Horizontal ribbon */
.lcx-track{ list-style:none; margin:18px 0 0; padding:0; display:flex; gap:0; overflow-x:auto; padding-bottom:8px; }
.lcx-node{ position:relative; flex:1; min-width:96px; display:flex; flex-direction:column; align-items:center; gap:5px; padding-top:16px;
opacity:0; transform:translateY(10px); animation:lcxrise .5s cubic-bezier(.2,.7,.2,1) forwards; animation-delay:calc(var(--i) * 55ms + .15s); }
@keyframes lcxrise{ to{ opacity:1; transform:none; } }
.lcx-line{ position:absolute; top:23px; inset-inline-start:-50%; width:100%; height:2px; background:var(--line,#26323f); transition:background .6s; }
.lcx-line.lit{ background:linear-gradient(90deg,var(--emerald,#3fb286),rgba(63,178,134,.4)); }
.lcx-dot{ position:relative; z-index:1; width:30px; height:30px; border-radius:50%; display:grid; place-items:center;
border:3px solid var(--ink2,#0f1620); background:var(--slate,#5d6b7a); color:#fff; transition:transform .25s, box-shadow .25s; }
.lcx-dot.click{ cursor:pointer; } .lcx-dot.click:hover{ transform:scale(1.18); box-shadow:0 0 0 5px rgba(92,198,239,.2); }
.lcx-dot:disabled{ cursor:default; }
.lcx-node.t-done .lcx-dot{ background:var(--emerald,#3fb286); box-shadow:0 0 0 4px rgba(63,178,134,.18); }
.lcx-node.t-done2 .lcx-dot{ background:repeating-linear-gradient(45deg,var(--emerald,#3fb286) 0 4px,#2c8a68 4px 8px); box-shadow:0 0 0 4px rgba(63,178,134,.14); }
.lcx-node.t-live .lcx-dot{ background:var(--amber,#e6ab4c); color:#1a1206; animation:lcxping 1.8s infinite; }
.lcx-node.t-over .lcx-dot{ background:var(--rose,#e3707e); animation:lcxping 1.4s infinite; }
.lcx-node.t-hold .lcx-dot{ background:var(--rose,#e3707e); }
.lcx-name{ font-size:11.5px; font-weight:600; text-align:center; line-height:1.2; }
.lcx-st{ font-size:9.5px; color:var(--mut,#8694a4); }
.lcx-node.t-done .lcx-st{ color:var(--emerald,#3fb286); } .lcx-node.t-over .lcx-st{ color:var(--rose,#e3707e); }
.lcx-pct{ font-family:'JetBrains Mono'; font-size:9.5px; color:var(--sky,#5cc6ef); }
.lcx-var{ font-family:'JetBrains Mono'; font-size:8.5px; padding:1px 6px; border-radius:99px; }
.lcx-var.v-early{ background:rgba(63,178,134,.16); color:var(--emerald,#3fb286); }
.lcx-var.v-late{ background:rgba(227,112,126,.16); color:var(--rose,#e3707e); }
.lcx-var.v-ontime{ background:rgba(92,198,239,.16); color:var(--sky,#5cc6ef); }
.lcx-date{ font-family:'JetBrains Mono'; font-size:8.5px; color:var(--mut,#8694a4); }
/* Readiness panel */
.lcx-ready{ margin-top:18px; border:1px solid var(--line,#26323f); border-radius:14px; padding:14px 16px;
background:rgba(255,255,255,.02); transition:border-color .4s, background .4s; }
.lcx-ready.ok{ border-color:rgba(63,178,134,.45); background:rgba(63,178,134,.06); }
.lcx-ready-h{ display:flex; align-items:center; gap:8px; font-weight:600; font-size:13px; }
.lcx-ready-h > svg{ color:var(--amber,#e6ab4c); } .lcx-ready.ok .lcx-ready-h > svg{ color:var(--emerald,#3fb286); }
.lcx-close-btn{ margin-inline-start:auto; display:inline-flex; align-items:center; gap:6px; font-family:inherit;
font-size:12px; font-weight:700; color:#06140e; background:var(--emerald,#3fb286); border:none; border-radius:9px;
padding:7px 13px; cursor:pointer; transition:filter .2s, transform .2s; }
.lcx-close-btn:hover{ filter:brightness(1.08); transform:translateY(-1px); } .lcx-close-btn:disabled{ opacity:.5; }
.lcx-check{ list-style:none; margin:12px 0 0; padding:0; display:flex; flex-wrap:wrap; gap:8px 18px; }
.lcx-check li{ display:flex; align-items:center; gap:6px; font-size:12px; color:var(--mut,#8694a4); }
.lcx-check li.ok{ color:var(--emerald,#3fb286); } .lcx-check li.no{ color:var(--rose,#e3707e); }
/* Modals */
.lcx-mask{ position:fixed; inset:0; z-index:60; display:grid; place-items:center; padding:18px;
background:rgba(6,10,15,.74); backdrop-filter:blur(3px); animation:lcxfade .2s ease; }
@keyframes lcxfade{ from{ opacity:0; } to{ opacity:1; } }
.lcx-modal{ width:min(420px,100%); background:var(--surf,#131c27); border:1px solid var(--line,#26323f);
border-radius:16px; overflow:hidden; animation:lcxpop .25s cubic-bezier(.2,.8,.2,1); }
@keyframes lcxpop{ from{ opacity:0; transform:scale(.95) translateY(8px); } to{ opacity:1; transform:none; } }
.lcx-modal-h{ display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid var(--line,#26323f); }
.lcx-modal-h h3{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:16px; margin:0; }
.lcx-modal-h button{ background:none; border:none; color:var(--mut,#8694a4); cursor:pointer; }
.lcx-modal-p{ padding:14px 16px 0; font-size:12.5px; color:var(--mut,#8694a4); line-height:1.6; margin:0; }
.lcx-date-in{ margin:14px 16px 0; width:calc(100% - 32px); background:var(--ink2,#0f1620); border:1px solid var(--line,#26323f);
border-radius:10px; padding:10px 12px; color:var(--paper,#e9eff5); font-family:'JetBrains Mono'; font-size:13px; }
.lcx-modal-f{ display:flex; justify-content:flex-end; gap:8px; padding:16px; }
.lcx-ghost{ padding:8px 14px; border:1px solid var(--line,#26323f); border-radius:9px; background:transparent;
color:var(--mut,#8694a4); cursor:pointer; font-family:inherit; font-size:13px; }
.lcx-solid{ display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border:none; border-radius:9px;
background:var(--emerald,#3fb286); color:#06140e; font-weight:700; cursor:pointer; font-family:inherit; font-size:13px; }
.lcx-solid:disabled{ opacity:.5; cursor:not-allowed; } .lcx-solid.danger{ background:var(--rose,#e3707e); color:#1a0608; }
@media (max-width:640px){
.lcx-float{ position:static; flex-direction:row; justify-content:center; margin-bottom:12px; }
.lcx-head{ padding-inline-end:0; }
}
`;