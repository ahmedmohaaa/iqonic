import { useMemo } from 'react';
import { Receipt, CheckCircle2, Clock, AlertOctagon, FileX } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   InvoiceStatusStrip
   يعرض "اسم الفاتورة + حالتها + نسبة تحصيلها" لكل المستخدمين،
   بلا أي مبلغ مالي — مطابقاً لحرفية الوثيقة.
   ═══════════════════════════════════════════════════════════════ */

const STATUS_META = {
  PAID:           { tone: 'emerald', label: 'Settled',     Icon: CheckCircle2 },
  PARTIALLY_PAID: { tone: 'amber',   label: 'Partial',     Icon: Clock },
  ISSUED:         { tone: 'sky',     label: 'Issued',      Icon: Receipt },
  OVERDUE:        { tone: 'rose',    label: 'Overdue',     Icon: AlertOctagon },
  DRAFT:          { tone: 'slate',   label: 'Draft',       Icon: FileX },
  CANCELLED:      { tone: 'zinc',    label: 'Cancelled',   Icon: FileX },
};

const pctOf = (inv) =>
  inv.collection_percentage ??
  (Number(inv.total_amount) > 0
    ? Math.round((Number(inv.collected_amount || 0) / Number(inv.total_amount)) * 100)
    : 0);

export default function InvoiceStatusStrip({ invoices = [] }) {
  const stats = useMemo(() => {
    if (!invoices.length) return { settled: 0, total: 0, avg: 0 };
    const settled = invoices.filter((i) => i.status === 'PAID').length;
    const avg = Math.round(
      invoices.reduce((s, i) => s + pctOf(i), 0) / invoices.length
    );
    return { settled, total: invoices.length, avg };
  }, [invoices]);

  if (!invoices.length) return null;

  return (
    <section className="iss">
      <style>{CSS}</style>

      <header className="iss__head">
        <div>
          <span className="iss__kicker">Invoice Status</span>
          <h2 className="iss__title">
            {stats.settled}
            <span className="iss__title-dim"> / {stats.total} settled</span>
          </h2>
        </div>
        <div className="iss__gauge" aria-label={`average collection ${stats.avg} percent`}>
          <span className="iss__gauge-num">{stats.avg}</span>
          <span className="iss__gauge-unit">%</span>
          <span className="iss__gauge-cap">avg collected</span>
        </div>
      </header>

      <ul className="iss__list">
        {invoices.map((inv, idx) => {
          const meta = STATUS_META[inv.status] || STATUS_META.DRAFT;
          const pct = pctOf(inv);
          const { Icon } = meta;
          return (
            <li
              key={inv.id}
              className={`iss__row iss__row--${meta.tone}`}
              style={{ '--i': idx }}
            >
              <div className="iss__row-main">
                <span className={`iss__dot iss__dot--${meta.tone}`} />
                <div className="iss__row-text">
                  <span className="iss__row-title">{inv.title}</span>
                  <span className="iss__row-sub">{inv.milestone_type_display}</span>
                </div>
                <span className={`iss__badge iss__badge--${meta.tone}`}>
                  <Icon size={12} />
                  <span>{meta.label}</span>
                </span>
              </div>

              <div className="iss__bar-wrap">
                <div className="iss__bar">
                  <div
                    className={`iss__bar-fill iss__bar-fill--${meta.tone}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="iss__pct">{pct}%</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const CSS = `
.iss{
  --ink:#10161d; --line:#e6e9ee; --paper:#fbfcfd;
  --emerald:#15916a; --amber:#b9791a; --sky:#1f7fa8; --rose:#c43b4b; --slate:#5b6675; --zinc:#8a929e;
  position:relative; background:var(--paper);
  border:1px solid var(--line); border-radius:18px; padding:22px 22px 14px;
  background-image:radial-gradient(rgba(16,22,29,.035) 1px, transparent 1px);
  background-size:18px 18px;
  animation:iss-rise .6s cubic-bezier(.2,.7,.2,1) both;
}
@keyframes iss-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

.iss__head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;
  padding-bottom:16px;margin-bottom:6px;border-bottom:1px dashed var(--line)}
.iss__kicker{font:600 10px/1 'Space Grotesk',system-ui;letter-spacing:.28em;
  text-transform:uppercase;color:var(--slate)}
.iss__title{font:700 38px/1 'Space Grotesk',system-ui;color:var(--ink);margin:6px 0 0;
  letter-spacing:-.02em}
.iss__title-dim{color:var(--zinc);font-weight:500;font-size:18px}

.iss__gauge{display:flex;align-items:baseline;gap:2px;flex-direction:column;align-items:flex-end}
.iss__gauge-num{font:700 30px/1 'Space Grotesk',system-ui;color:var(--ink)}
.iss__gauge-unit{font:600 13px/1 'Space Grotesk',system-ui;color:var(--slate);margin-left:1px}
.iss__gauge-cap{font:500 9px/1 'Space Grotesk',system-ui;letter-spacing:.18em;
  text-transform:uppercase;color:var(--zinc);margin-top:5px}

.iss__list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.iss__row{padding:13px 4px;border-bottom:1px solid var(--line);
  animation:iss-row .5s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i) * 55ms)}
.iss__row:last-child{border-bottom:0}
@keyframes iss-row{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
.iss__row{transition:background .25s ease, padding-left .25s ease}
.iss__row:hover{background:rgba(16,22,29,.025);padding-left:10px}

.iss__row-main{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.iss__dot{width:9px;height:9px;border-radius:50%;flex:none;
  box-shadow:0 0 0 3px color-mix(in srgb, currentColor 14%, transparent)}
.iss__dot--emerald{color:var(--emerald);background:var(--emerald)}
.iss__dot--amber{color:var(--amber);background:var(--amber)}
.iss__dot--sky{color:var(--sky);background:var(--sky)}
.iss__dot--rose{color:var(--rose);background:var(--rose)}
.iss__dot--slate{color:var(--slate);background:var(--slate)}
.iss__dot--zinc{color:var(--zinc);background:var(--zinc)}

.iss__row-text{display:flex;flex-direction:column;min-width:0;flex:1}
.iss__row-title{font:600 13.5px/1.2 'IBM Plex Sans Arabic',system-ui;color:var(--ink);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.iss__row-sub{font:500 11px/1.2 'Space Grotesk',system-ui;color:var(--zinc);margin-top:2px}

.iss__badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;
  font:600 10.5px/1 'Space Grotesk',system-ui;letter-spacing:.02em;flex:none}
.iss__badge--emerald{background:rgba(21,145,106,.12);color:var(--emerald)}
.iss__badge--amber{background:rgba(185,121,26,.13);color:var(--amber)}
.iss__badge--sky{background:rgba(31,127,168,.12);color:var(--sky)}
.iss__badge--rose{background:rgba(196,59,75,.12);color:var(--rose)}
.iss__badge--slate{background:rgba(91,102,117,.12);color:var(--slate)}
.iss__badge--zinc{background:rgba(138,146,158,.14);color:var(--zinc);text-decoration:line-through}

.iss__bar-wrap{display:flex;align-items:center;gap:10px}
.iss__bar{flex:1;height:6px;border-radius:99px;background:rgba(16,22,29,.07);overflow:hidden}
.iss__bar-fill{height:100%;border-radius:99px;position:relative;
  transition:width .8s cubic-bezier(.2,.7,.2,1)}
.iss__bar-fill::after{content:"";position:absolute;inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);
  transform:translateX(-100%);animation:iss-shim 2.6s ease-in-out infinite}
@keyframes iss-shim{60%,100%{transform:translateX(260%)}}
.iss__bar-fill--emerald{background:var(--emerald)}
.iss__bar-fill--amber{background:var(--amber)}
.iss__bar-fill--sky{background:var(--sky)}
.iss__bar-fill--rose{background:var(--rose)}
.iss__bar-fill--slate{background:var(--slate)}
.iss__bar-fill--zinc{background:var(--zinc)}
.iss__pct{font:700 12px/1 'Space Grotesk',system-ui;color:var(--ink);
  min-width:38px;text-align:right;font-variant-numeric:tabular-nums}
`;
