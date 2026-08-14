import { useState, useEffect, useMemo, useRef } from 'react';
import { getLifecycleHistory } from '../../../api/services/lifecycle';
import {
  PlayCircle, CheckCircle2, BadgeCheck, RotateCcw,
  History, RefreshCw, X,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   LifecycleHistoryTimeline
   دفتر يوميات دورة الحياة — سجلٌّ زمنيٌّ عموديٌّ حيّ
   ═══════════════════════════════════════════════════════════ */

const ACTION_META = {
  STARTED:   { label: 'بدأت المرحلة',  tone: 'sky',     Icon: PlayCircle },
  COMPLETED: { label: 'اكتملت',        tone: 'emerald', Icon: CheckCircle2 },
  APPROVED:  { label: 'اعتماد',        tone: 'amber',   Icon: BadgeCheck },
  REOPENED:  { label: 'إعادة فتح',     tone: 'rose',    Icon: RotateCcw },
};

const FILTERS = [
  { key: 'ALL',       label: 'الكل' },
  { key: 'STARTED',   label: 'بدء' },
  { key: 'COMPLETED', label: 'اكتمال' },
  { key: 'APPROVED',  label: 'اعتماد' },
  { key: 'REOPENED',  label: 'إعادة فتح' },
];

/* وقتٌ نسبيٌّ بالعربية */
function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d} يوم`;
  return new Date(iso).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function absDate(iso) {
  return new Date(iso).toLocaleDateString('ar-EG', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}
function absTime(iso) {
  return new Date(iso).toLocaleTimeString('ar-EG', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function LifecycleHistoryTimeline({ projectId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [drawn, setDrawn] = useState(false);
  const rootRef = useRef(null);

  const load = () => {
    setLoading(true);
    getLifecycleHistory(projectId)
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
        // الأحدث أولاً
        setItems([...arr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [projectId]);

  // رسم الخط العمودي بعد التحميل (أنيميشن النمو)
  useEffect(() => {
    if (!loading && items.length) {
      const t = setTimeout(() => setDrawn(true), 80);
      return () => clearTimeout(t);
    }
    setDrawn(false);
  }, [loading, items.length]);

  // كشفٌ عند التمرير للبطاقات
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    el.querySelectorAll('.lh-row').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [items, activeFilter]);

  const counts = useMemo(() => {
    const c = { STARTED: 0, COMPLETED: 0, APPROVED: 0, REOPENED: 0 };
    items.forEach((i) => { if (c[i.action] != null) c[i.action]++; });
    return c;
  }, [items]);

  const visible = useMemo(
    () => (activeFilter === 'ALL' ? items : items.filter((i) => i.action === activeFilter)),
    [items, activeFilter]
  );

  const completedStages = counts.COMPLETED + counts.APPROVED;

  return (
    <section ref={rootRef} className="lh-root">
      <style>{CSS}</style>
      <div className="lh-ambient" aria-hidden />

      {/* ── الترويسة ─────────────────────────────────── */}
      <header className="lh-head">
        <div className="lh-head-main">
          <span className="lh-kicker">PROJECT JOURNAL · سجلّ الدورة</span>
          <h2 className="lh-title">خطّ الزمن</h2>
          <p className="lh-sub">
            كل انتقالٍ في دورة الحياة مسجَّلٌ هنا — من بدأ، ومتى، ولماذا.
          </p>
        </div>
        <button className="lh-refresh" onClick={load} title="تحديث السجل" aria-label="تحديث">
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>تحديث</span>
        </button>
      </header>

      {/* ── شريط الملخص (نصٌّ عريض + رقاقات، ليس بطاقات متساوية) ── */}
      <div className="lh-summary">
        <div className="lh-summary-fig">
          <span className="lh-summary-num">{items.length}</span>
          <span className="lh-summary-cap">حدثاً مسجَّلاً</span>
        </div>
        <div className="lh-summary-sep" />
        <div className="lh-summary-txt">
          <span><b>{completedStages}</b> مرحلةً أُنجزت أو اعتمدت</span>
          <span className="lh-dot-sep">·</span>
          <span><b>{counts.REOPENED}</b> إعادة فتح</span>
        </div>
      </div>

      {/* ── رقاقات الفلترة ──────────────────────────── */}
      <div className="lh-filters" role="tablist">
        {FILTERS.map((f) => {
          const n = f.key === 'ALL' ? items.length : (counts[f.key] ?? 0);
          const on = activeFilter === f.key;
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={on}
              onClick={() => setActiveFilter(f.key)}
              className={`lh-chip ${on ? 'on' : ''} ${f.key !== 'ALL' ? `t-${(ACTION_META[f.key]?.tone) || 'sky'}` : ''}`}
            >
              <span>{f.label}</span>
              <em>{n}</em>
            </button>
          );
        })}
      </div>

      {/* ── الخط الزمني ─────────────────────────────── */}
      {loading ? (
        <div className="lh-loading">جارٍ قراءة السجل…</div>
      ) : visible.length === 0 ? (
        <div className="lh-empty">
          <History size={26} />
          <p>لا أحداث مطابقة لهذا المرشّح بعد.</p>
        </div>
      ) : (
        <ol className="lh-timeline">
          <span className={`lh-spine ${drawn ? 'drawn' : ''}`} aria-hidden />
          {visible.map((ev, idx) => {
            const meta = ACTION_META[ev.action] || ACTION_META.STARTED;
            const { Icon } = meta;
            const isLatest = idx === 0 && activeFilter === 'ALL';
            return (
              <li
                key={ev.id ?? idx}
                className={`lh-row t-${meta.tone}`}
                style={{ '--i': idx }}
              >
                <span className={`lh-node ${isLatest ? 'pulse' : ''}`} aria-hidden>
                  <Icon size={13} />
                </span>

                <article className="lh-card">
                  <div className="lh-card-top">
                    <span className={`lh-badge t-${meta.tone}`}>
                      <Icon size={12} />
                      <span>{meta.label}</span>
                    </span>
                    <span className="lh-seq" dir="ltr">#{String(items.indexOf(ev) + 1).padStart(2, '0')}</span>
                  </div>

                  <h3 className="lh-stage">{ev.stage_name || ev.stage_name_display || 'مرحلة'}</h3>

                  <div className="lh-meta">
                    <span className="lh-who">{ev.performed_by_name || 'النظام'}</span>
                    <span className="lh-dot-sep">·</span>
                    <span className="lh-when" dir="ltr" title={`${absDate(ev.created_at)} ${absTime(ev.created_at)}`}>
                      {timeAgo(ev.created_at)}
                    </span>
                    <span className="lh-dot-sep">·</span>
                    <span className="lh-abs" dir="ltr">{absTime(ev.created_at)}</span>
                  </div>

                  {ev.notes && (
                    <blockquote className="lh-note">{ev.notes}</blockquote>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   الأنماط — دفتر سجلٍّ حبريّ، عمودٌ ينمو ونقاطٌ تنبض
   ═══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

.lh-root{
  --lh-ink:#0c141d; --lh-surface:#121d28; --lh-line:#22323f;
  --lh-paper:#e9eef2; --lh-muted:#8294a2;
  --lh-sky:#5cc6e6; --lh-emerald:#46c08c; --lh-amber:#e7b04a; --lh-rose:#e07684; --lh-violet:#9d8cf0;
  position:relative; overflow:hidden;
  padding:26px 24px 30px; border:1px solid var(--lh-line); border-radius:20px;
  background:linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,0)), var(--lh-surface);
  color:var(--lh-paper);
  font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
}
.lh-ambient{
  position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(58% 46% at 92% -8%, rgba(231,176,74,.10), transparent 60%),
    radial-gradient(48% 42% at -6% 108%, rgba(92,198,230,.09), transparent 60%),
    linear-gradient(rgba(92,198,230,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(92,198,230,.045) 1px, transparent 1px);
  background-size:auto,auto,40px 40px,40px 40px;
}
.lh-root > *{ position:relative; }

/* الترويسة */
.lh-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
.lh-kicker{ font-family:'Space Grotesk'; font-size:10.5px; letter-spacing:.3em; color:var(--lh-amber); }
.lh-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(26px,4vw,38px); font-weight:700; line-height:1.02; margin:5px 0 6px; letter-spacing:-.02em; }
.lh-sub{ color:var(--lh-muted); font-size:13.5px; max-width:46ch; margin:0; }
.lh-refresh{
  display:inline-flex; align-items:center; gap:7px; flex:none;
  border:1px solid var(--lh-line); background:rgba(255,255,255,.03); color:var(--lh-muted);
  padding:8px 13px; border-radius:11px; font-size:12.5px; cursor:pointer;
  font-family:inherit; transition:border-color .25s, color .25s, background .25s;
}
.lh-refresh:hover{ border-color:var(--lh-sky); color:var(--lh-paper); background:rgba(92,198,230,.08); }
.lh-refresh .spin{ animation:lh-spin .8s linear infinite; }
@keyframes lh-spin{ to{ transform:rotate(360deg); } }

/* الملخص */
.lh-summary{ display:flex; align-items:center; gap:18px; margin:20px 0 4px; flex-wrap:wrap; }
.lh-summary-fig{ display:flex; align-items:baseline; gap:9px; }
.lh-summary-num{ font-family:'Space Grotesk'; font-size:46px; font-weight:700; line-height:.85; color:var(--lh-paper); font-variant-numeric:tabular-nums; }
.lh-summary-cap{ font-size:12px; color:var(--lh-muted); letter-spacing:.02em; }
.lh-summary-sep{ width:1px; align-self:stretch; background:var(--lh-line); margin:2px 0; }
.lh-summary-txt{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:13px; color:var(--lh-muted); }
.lh-summary-txt b{ color:var(--lh-paper); font-weight:700; }
.lh-dot-sep{ color:var(--lh-line); }

/* الفلاتر */
.lh-filters{ display:flex; flex-wrap:wrap; gap:8px; margin:18px 0 6px; }
.lh-chip{
  display:inline-flex; align-items:center; gap:7px; cursor:pointer; font-family:inherit;
  border:1px solid var(--lh-line); background:rgba(255,255,255,.02); color:var(--lh-muted);
  padding:6px 12px; border-radius:999px; font-size:12.5px; transition:all .22s;
}
.lh-chip em{ font-style:normal; font-family:'JetBrains Mono'; font-size:11px; opacity:.7; }
.lh-chip:hover{ color:var(--lh-paper); border-color:rgba(255,255,255,.25); }
.lh-chip.on{ color:var(--lh-ink); background:var(--lh-paper); border-color:var(--lh-paper); }
.lh-chip.on em{ opacity:.6; }
.lh-chip:not(.on).t-sky:hover{ border-color:var(--lh-sky); color:var(--lh-sky); }
.lh-chip:not(.on).t-emerald:hover{ border-color:var(--lh-emerald); color:var(--lh-emerald); }
.lh-chip:not(.on).t-amber:hover{ border-color:var(--lh-amber); color:var(--lh-amber); }
.lh-chip:not(.on).t-rose:hover{ border-color:var(--lh-rose); color:var(--lh-rose); }

/* الخط الزمني */
.lh-timeline{ list-style:none; margin:14px 0 0; padding:0; position:relative; }
.lh-spine{
  position:absolute; inset-inline-start:20px; top:6px; bottom:6px; width:2px;
  background:linear-gradient(180deg, var(--lh-sky), var(--lh-emerald) 55%, var(--lh-amber) 85%, var(--lh-rose));
  border-radius:2px; transform:scaleY(0); transform-origin:top;
  transition:transform 1s cubic-bezier(.2,.7,.2,1);
}
.lh-spine.drawn{ transform:scaleY(1); }

.lh-row{
  position:relative; padding:0 0 18px; padding-inline-start:52px;
  opacity:0; transform:translateY(14px);
  transition:opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1);
  transition-delay:calc(var(--i) * 55ms);
}
.lh-row.in{ opacity:1; transform:none; }
.lh-row:last-child{ padding-bottom:0; }

/* العقدة على العمود */
.lh-node{
  position:absolute; inset-inline-start:13px; top:3px;
  width:16px; height:16px; border-radius:50%;
  display:grid; place-items:center; color:var(--lh-ink);
  border:2px solid var(--lh-surface); z-index:2;
}
.lh-row.t-sky .lh-node{ background:var(--lh-sky); box-shadow:0 0 0 4px rgba(92,198,230,.16); }
.lh-row.t-emerald .lh-node{ background:var(--lh-emerald); box-shadow:0 0 0 4px rgba(70,192,140,.16); }
.lh-row.t-amber .lh-node{ background:var(--lh-amber); box-shadow:0 0 0 4px rgba(231,176,74,.16); }
.lh-row.t-rose .lh-node{ background:var(--lh-rose); box-shadow:0 0 0 4px rgba(224,118,132,.16); }
.lh-node.pulse::after{
  content:""; position:absolute; inset:-3px; border-radius:50%;
  background:currentColor; opacity:.45; animation:lh-ping 1.9s cubic-bezier(0,0,.2,1) infinite;
}
.lh-row.t-sky .lh-node.pulse::after{ background:var(--lh-sky); }
.lh-row.t-emerald .lh-node.pulse::after{ background:var(--lh-emerald); }
.lh-row.t-amber .lh-node.pulse::after{ background:var(--lh-amber); }
.lh-row.t-rose .lh-node.pulse::after{ background:var(--lh-rose); }
@keyframes lh-ping{ 70%,100%{ transform:scale(2.3); opacity:0; } }

/* البطاقة */
.lh-card{
  border:1px solid var(--lh-line); border-radius:14px; padding:14px 16px;
  background:rgba(255,255,255,.022);
  border-inline-start:3px solid transparent;
  transition:transform .3s cubic-bezier(.2,.7,.2,1), border-color .3s, background .3s, box-shadow .3s;
}
.lh-card:hover{ transform:translateX(-3px); background:rgba(255,255,255,.045); box-shadow:0 16px 36px -24px rgba(0,0,0,.8); }
[dir="rtl"] .lh-card:hover{ transform:translateX(3px); }
.lh-row.t-sky .lh-card:hover{ border-inline-start-color:var(--lh-sky); }
.lh-row.t-emerald .lh-card:hover{ border-inline-start-color:var(--lh-emerald); }
.lh-row.t-amber .lh-card:hover{ border-inline-start-color:var(--lh-amber); }
.lh-row.t-rose .lh-card:hover{ border-inline-start-color:var(--lh-rose); }

.lh-card-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.lh-badge{ display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; font-size:11.5px; font-weight:600; }
.lh-badge.t-sky{ background:rgba(92,198,230,.15); color:var(--lh-sky); }
.lh-badge.t-emerald{ background:rgba(70,192,140,.15); color:var(--lh-emerald); }
.lh-badge.t-amber{ background:rgba(231,176,74,.15); color:var(--lh-amber); }
.lh-badge.t-rose{ background:rgba(224,118,132,.15); color:var(--lh-rose); }
.lh-seq{ font-family:'JetBrains Mono'; font-size:11px; color:var(--lh-muted); letter-spacing:.04em; }

.lh-stage{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:18px; font-weight:600; margin:9px 0 7px; color:var(--lh-paper); letter-spacing:-.01em; }

.lh-meta{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:12.5px; color:var(--lh-muted); }
.lh-who{ color:var(--lh-paper); font-weight:600; }
.lh-when{ color:var(--lh-sky); }
.lh-abs{ font-family:'JetBrains Mono'; font-size:11px; opacity:.75; }

.lh-note{
  margin:11px 0 0; padding:9px 13px; font-size:12.5px; line-height:1.6;
  color:var(--lh-paper); background:rgba(255,255,255,.03);
  border-inline-start:2px solid var(--lh-line); border-radius:0 8px 8px 0;
  font-style:italic;
}
.lh-row.t-sky .lh-note{ border-inline-start-color:var(--lh-sky); }
.lh-row.t-emerald .lh-note{ border-inline-start-color:var(--lh-emerald); }
.lh-row.t-amber .lh-note{ border-inline-start-color:var(--lh-amber); }
.lh-row.t-rose .lh-note{ border-inline-start-color:var(--lh-rose); }

/* حالات فارغة */
.lh-loading, .lh-empty{
  display:flex; flex-direction:column; align-items:center; gap:10px;
  padding:42px 0; color:var(--lh-muted); text-align:center;
}
.lh-empty svg{ opacity:.5; }

@media (max-width:560px){
  .lh-summary-num{ font-size:38px; }
  .lh-row{ padding-inline-start:44px; }
  .lh-spine{ inset-inline-start:16px; }
  .lh-node{ inset-inline-start:9px; }
}
`;
