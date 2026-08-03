import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Wallet, TrendingUp, AlertOctagon, CheckCircle2, FileText,
  Upload, Plus, ChevronDown, Receipt, Calendar, Paperclip, X,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   InvoiceConsole — خزنة الفواتير المدمّجة
   ملفات + دفعات + إحصاء، بقاعدة Total Outstanding الصحيحة
   ═══════════════════════════════════════════════════════════ */

const STATUS_META = {
  DRAFT:          { tone: 'slate',   label: 'مسوّدة' },
  ISSUED:         { tone: 'sky',     label: 'مُصدَرة' },
  PARTIALLY_PAID: { tone: 'amber',   label: 'مدفوعة جزئياً' },
  PAID:           { tone: 'emerald', label: 'مسدّدة' },
  OVERDUE:        { tone: 'rose',    label: 'متأخرة' },
  CANCELLED:      { tone: 'slate',   label: 'ملغاة' },
};

const today = new Date();
const daysOverdue = (due) => {
  if (!due) return 0;
  return Math.max(0, Math.floor((today - new Date(due)) / 86400000));
};

/* عدّاد متحرّك */
function useCountUp(target, decimals = 0) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const from = ref.current, to = Number(target) || 0, start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 850);
      const e = 1 - Math.pow(1 - t, 3);
      const cur = from + (to - from) * e;
      setV(cur); ref.current = cur;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
}

function Money({ value, decimals = 0 }) {
  const out = useCountUp(value, decimals);
  return <span className="ic-num">{out}</span>;
}

export default function InvoiceConsole({ projectId }) {
  const { user } = useAuth();
  const canAct = ['GM', 'AGM', 'ACCOUNTANT'].includes(user?.role);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [payModal, setPayModal] = useState(null);   // invoice id
  const wrap = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = projectId ? { project: projectId } : {};
      const res = await apiClient.get('invoices/', { params });
      setInvoices(res.data.results || res.data || []);
    } catch (e) { setInvoices([]); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  /* كشف عند التمرير */
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const io = new IntersectionObserver((es) =>
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { threshold: 0.08 });
    el.querySelectorAll('.ic-reveal').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [invoices, loading]);

  /* ── الإحصاء بقاعدة الوثيقة الصحيحة ─────────────────── */
  const valid = invoices.filter((i) => i.status !== 'DRAFT' && i.status !== 'CANCELLED');
  const totalInvoiced  = valid.reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const totalCollected = valid.reduce((s, i) => s + Number(i.collected_amount || 0), 0);
  // Total Outstanding = مجموع المتبقي = Issued + Overdue + باقي الـ Partially (مطابق حرفياً)
  const totalOutstanding = valid.reduce((s, i) => s + Number(i.outstanding_amount || 0), 0);
  const overdueList = valid.filter((i) => i.status === 'OVERDUE');
  const overdueAmount = overdueList.reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const collectPct = totalInvoiced > 0 ? Math.min(100, (totalCollected / totalInvoiced) * 100) : 0;

  return (
    <div ref={wrap} className="ic-root" dir="rtl">
      <style>{CSS}</style>
      <div className="ic-ambient" aria-hidden />

      {/* الرأس */}
      <header className="ic-head ic-reveal">
        <div>
          <span className="ic-kicker">FINANCIAL VAULT · خزنة الفواتير</span>
          <h1 className="ic-title">لوحة التحصيل</h1>
          <p className="ic-sub">
            {projectId ? 'فواتير المشروع المحدّد' : 'كل فواتير المكتب — مُصدَرة، محصّلة، ومعلّقة'}
          </p>
        </div>
        <div className="ic-head-stat">
          <span className="ic-head-stat-l">نسبة التحصيل</span>
          <span className="ic-head-stat-v"><Money value={collectPct} decimals={1} /><i>%</i></span>
        </div>
      </header>

      {/* بطاقات KPI غير متساوية */}
      <section className="ic-kpis ic-reveal">
        <div className="ic-kpi ic-kpi--wide t-sky">
          <Receipt size={18} />
          <div>
            <span className="ic-kpi-l">إجمالي المفوتر</span>
            <span className="ic-kpi-v"><Money value={totalInvoiced} /> <i>ر.ق</i></span>
          </div>
        </div>
        <div className="ic-kpi t-emerald">
          <CheckCircle2 size={18} />
          <div>
            <span className="ic-kpi-l">المحصّل</span>
            <span className="ic-kpi-v"><Money value={totalCollected} /></span>
          </div>
        </div>
        <div className="ic-kpi t-amber">
          <Wallet size={18} />
          <div>
            <span className="ic-kpi-l">المعلّق</span>
            <span className="ic-kpi-v"><Money value={totalOutstanding} /></span>
          </div>
        </div>
        <div className={`ic-kpi t-rose ${overdueList.length ? 'pulse-card' : ''}`}>
          <AlertOctagon size={18} />
          <div>
            <span className="ic-kpi-l">متأخر</span>
            <span className="ic-kpi-v"><Money value={overdueAmount} /></span>
            <span className="ic-kpi-foot">{overdueList.length} فاتورة</span>
          </div>
        </div>
      </section>

      {/* شريط التحصيل الكلي */}
      <section className="ic-bar-wrap ic-reveal">
        <div className="ic-bar-head">
          <span>التحصيل مقابل المفوتر</span>
          <span className="ic-bar-frac"><Money value={totalCollected} /> / <Money value={totalInvoiced} /></span>
        </div>
        <div className="ic-bar">
          <div className="ic-bar-fill" style={{ width: `${collectPct}%` }} />
        </div>
      </section>

      {/* قائمة الفواتير */}
      <section className="ic-list">
        {loading ? (
          <div className="ic-empty">جارٍ تحميل الخزنة…</div>
        ) : invoices.length === 0 ? (
          <div className="ic-empty"><Receipt size={30} /> لا فواتير بعد.</div>
        ) : (
          invoices.map((inv, idx) => {
            const meta = STATUS_META[inv.status] || STATUS_META.DRAFT;
            const pct = Number(inv.total_amount) > 0
              ? Math.min(100, (Number(inv.collected_amount || 0) / Number(inv.total_amount)) * 100) : 0;
            const overdue = inv.status === 'OVERDUE' ? daysOverdue(inv.due_date) : 0;
            const open = expanded === inv.id;
            return (
              <article
                key={inv.id}
                className={`ic-row ic-reveal t-${meta.tone} ${overdue ? 'is-overdue' : ''}`}
                style={{ '--i': idx }}
              >
                <div className="ic-row-main" onClick={() => setExpanded(open ? null : inv.id)}>
                  <span className="ic-row-bar" />
                  <div className="ic-row-id">
                    <span className="ic-row-title">{inv.title}</span>
                    <span className="ic-row-ms">{inv.milestone_type_display || inv.milestone_type}</span>
                  </div>

                  <div className="ic-row-amt">
                    <span className="ic-row-amt-v"><Money value={inv.total_amount} /></span>
                    <span className="ic-row-amt-l">ر.ق</span>
                  </div>

                  <div className="ic-row-prog">
                    <div className="ic-row-prog-bar"><span style={{ width: `${pct}%` }} /></div>
                    <span className="ic-row-prog-pct">{Math.round(pct)}%</span>
                  </div>

                  {overdue > 0 ? (
                    <span className="ic-overdue-chip"><span className="ic-pulse-dot" /> متأخر بـ {overdue} يوم</span>
                  ) : (
                    <span className={`ic-status t-${meta.tone}`}>{meta.label}</span>
                  )}

                  <ChevronDown size={18} className={`ic-chev ${open ? 'rot' : ''}`} />
                </div>

                {/* التفاصيل الموسّعة */}
                <div className={`ic-detail ${open ? 'open' : ''}`}>
                  <div className="ic-detail-grid">
                    <div className="ic-meta-cell">
                      <Calendar size={13} /> إصدار <b>{inv.issue_date || '—'}</b>
                    </div>
                    <div className="ic-meta-cell">
                      <Calendar size={13} /> استحقاق <b className={overdue ? 'rose' : ''}>{inv.due_date || '—'}</b>
                    </div>
                    <div className="ic-meta-cell">
                      محصّل <b className="emerald"><Money value={inv.collected_amount} /></b>
                    </div>
                    <div className="ic-meta-cell">
                      متبقٍّ <b className="amber"><Money value={inv.outstanding_amount} /></b>
                    </div>
                  </div>

                  <DetailTabs invoice={inv} canAct={canAct} onChanged={load} />
                </div>
              </article>
            );
          })
        )}
      </section>

      {payModal && (
        <PayModal
          invoice={invoices.find((i) => i.id === payModal)}
          onClose={() => setPayModal(null)}
          onDone={() => { setPayModal(null); load(); }}
        />
      )}
    </div>
  );
}

/* ── تبويبات الدفعات والملفات داخل البطاقة ─────────────── */
function DetailTabs({ invoice, canAct, onChanged }) {
  const [tab, setTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setPayments(invoice.payments || []);
    apiClient.get(`invoices/${invoice.id}/files/`)
      .then((r) => setFiles(r.data.results || r.data || []))
      .catch(() => setFiles([]));
  }, [invoice]);

  const upload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    const fd = new FormData(); fd.append('file', f);
    try {
      await apiClient.post(`invoices/${invoice.id}/files/upload/`, fd,
        { headers: { 'Content-Type': 'multipart/form-data' } });
      const r = await apiClient.get(`invoices/${invoice.id}/files/`);
      setFiles(r.data.results || r.data || []);
    } catch {} finally { setBusy(false); e.target.value = ''; }
  };

  return (
    <div className="ic-tabs">
      <div className="ic-tab-bar">
        <button className={tab === 'payments' ? 'on' : ''} onClick={() => setTab('payments')}>
          الدفعات <b>{payments.length}</b>
        </button>
        <button className={tab === 'files' ? 'on' : ''} onClick={() => setTab('files')}>
          الملفات <b>{files.length}</b>
        </button>
      </div>

      {tab === 'payments' && (
        <div className="ic-tab-body">
          {payments.length === 0
            ? <p className="ic-muted">لا دفعات مسجّلة.</p>
            : payments.map((p, i) => (
              <div key={i} className="ic-pay-row">
                <span className="ic-pay-dot" />
                <span className="ic-pay-date">{p.payment_date}</span>
                <span className="ic-pay-amt">+<Money value={p.amount_paid} /></span>
                <span className="ic-pay-by">{p.recorded_by_name || ''}</span>
              </div>
            ))}
          {canAct && (
            <button className="ic-add-pay" onClick={() => setPayOpen(true)}>
              <Plus size={14} /> تسجيل دفعة
            </button>
          )}
          {payOpen && (
            <PayInline
              invoice={invoice}
              onCancel={() => setPayOpen(false)}
              onDone={() => { setPayOpen(false); onChanged(); }}
            />
          )}
        </div>
      )}

      {tab === 'files' && (
        <div className="ic-tab-body">
          {files.length === 0
            ? <p className="ic-muted">لا ملفات مرفقة.</p>
            : files.map((f, i) => (
              <a key={i} href={f.file} target="_blank" rel="noreferrer" className="ic-file-row">
                <Paperclip size={13} />
                <span className="ic-file-name">{f.file?.split('/').pop()}</span>
                <span className="ic-file-by">{f.uploaded_by_name || ''}</span>
              </a>
            ))}
          {canAct && (
            <>
              <input ref={fileRef} type="file" hidden onChange={upload} />
              <button className="ic-add-pay" onClick={() => fileRef.current?.click()} disabled={busy}>
                <Upload size={14} /> {busy ? 'جارٍ الرفع…' : 'إرفاق PDF'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── تسجيل دفعة سريع داخل البطاقة ─────────────────────── */
function PayInline({ invoice, onCancel, onDone }) {
  const [amt, setAmt] = useState('');
  const [busy, setBusy] = useState(false);
  const remaining = Number(invoice.outstanding_amount || invoice.total_amount || 0);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await apiClient.post('invoices/payment/', { invoice: invoice.id, amount_paid: Number(amt) });
      onDone();
    } catch {} finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="ic-pay-form">
      <input type="number" step="0.01" max={remaining} placeholder={`الحدّ ${remaining}`}
        value={amt} onChange={(e) => setAmt(e.target.value)} required />
      <button disabled={busy} type="submit">حفظ</button>
      <button type="button" onClick={onCancel}><X size={14} /></button>
    </form>
  );
}

/* ── نافذة دفع منبثقة (احتياطي) ─────────────────────────── */
function PayModal({ invoice, onClose, onDone }) {
  if (!invoice) return null;
  return (
    <div className="ic-mask" onClick={onClose}>
      <div className="ic-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ic-modal-h">
          <span>تسجيل دفعة — {invoice.title}</span>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <PayInline invoice={invoice} onCancel={onClose} onDone={onDone} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   الأنماط — دفتر خزينة بارد، أرقام جدوليّة، صفوف نابضة
   ═══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.ic-root{
  --paper:#eef1f4; --ink:#131a22; --line:#dde3e9; --card:#ffffff;
  --muted:#697585; --amber:#b9791a; --emerald:#15805a; --rose:#c0392b;
  --sky:#2563a8; --slate:#5b6675;
  position:relative; min-height:60vh; padding:30px clamp(16px,4vw,42px) 64px;
  color:var(--ink); font-family:'IBM Plex Sans Arabic',sans-serif;
  background:var(--paper);
}
.ic-ambient{ position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(46% 38% at 96% -6%, rgba(37,99,168,.07), transparent 60%),
    radial-gradient(40% 34% at -4% 104%, rgba(185,121,26,.06), transparent 60%),
    radial-gradient(rgba(19,26,34,.05) 1px, transparent 1px);
  background-size:auto,auto,22px 22px;
}
.ic-root > *{ position:relative; }
.ic-num{ font-family:'Space Grotesk',sans-serif; font-variant-numeric:tabular-nums; font-weight:700; }
.ic-reveal{ opacity:0; transform:translateY(16px); transition:opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1); transition-delay:calc(var(--i,0) * 45ms); }
.ic-reveal.in{ opacity:1; transform:none; }

/* الرأس */
.ic-head{ display:flex; justify-content:space-between; align-items:flex-end; gap:18px; flex-wrap:wrap;
  padding-bottom:20px; border-bottom:2px solid var(--ink); }
.ic-kicker{ font-family:'Space Grotesk'; font-size:11px; letter-spacing:.3em; color:var(--amber); font-weight:600; }
.ic-title{ font-family:'Space Grotesk'; font-size:clamp(30px,5vw,50px); font-weight:700; line-height:1; margin:6px 0 4px; letter-spacing:-.02em; }
.ic-sub{ color:var(--muted); font-size:13.5px; margin:0; }
.ic-head-stat{ text-align:start; }
.ic-head-stat-l{ display:block; font-size:10px; letter-spacing:.18em; color:var(--muted); }
.ic-head-stat-v{ font-family:'Space Grotesk'; font-size:38px; font-weight:700; line-height:.9; }
.ic-head-stat-v i{ font-style:normal; font-size:.4em; color:var(--amber); margin-inline-start:3px; }

/* KPI */
.ic-kpis{ display:grid; grid-template-columns:1.7fr 1fr 1fr 1fr; gap:14px; margin-top:22px; }
@media(max-width:880px){ .ic-kpis{ grid-template-columns:1fr 1fr; } .ic-kpi--wide{ grid-column:1/-1; } }
.ic-kpi{ display:flex; gap:13px; align-items:flex-start; background:var(--card); border:1px solid var(--line);
  border-top:3px solid var(--slate); border-radius:14px; padding:16px 18px;
  transition:transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s; }
.ic-kpi:hover{ transform:translateY(-4px); box-shadow:0 18px 38px -24px rgba(19,26,34,.4); }
.ic-kpi > svg{ margin-top:2px; }
.ic-kpi.t-sky{ border-top-color:var(--sky); } .ic-kpi.t-sky svg{ color:var(--sky); }
.ic-kpi.t-emerald{ border-top-color:var(--emerald); } .ic-kpi.t-emerald svg{ color:var(--emerald); }
.ic-kpi.t-amber{ border-top-color:var(--amber); } .ic-kpi.t-amber svg{ color:var(--amber); }
.ic-kpi.t-rose{ border-top-color:var(--rose); } .ic-kpi.t-rose svg{ color:var(--rose); }
.ic-kpi-l{ display:block; font-size:11px; color:var(--muted); letter-spacing:.04em; }
.ic-kpi-v{ font-family:'Space Grotesk'; font-size:26px; font-weight:700; line-height:1.05; }
.ic-kpi-v i{ font-style:normal; font-size:.42em; color:var(--muted); margin-inline-start:3px; font-weight:500; }
.ic-kpi-foot{ display:block; font-size:10.5px; color:var(--muted); }
.pulse-card{ animation:ic-cardpulse 2.4s ease-in-out infinite; }
@keyframes ic-cardpulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(192,57,43,0); } 50%{ box-shadow:0 0 0 4px rgba(192,57,43,.12); } }

/* شريط */
.ic-bar-wrap{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:16px 18px; margin-top:14px; }
.ic-bar-head{ display:flex; justify-content:space-between; font-size:12.5px; color:var(--muted); margin-bottom:9px; }
.ic-bar-frac{ font-family:'JetBrains Mono'; color:var(--ink); font-weight:600; }
.ic-bar{ height:12px; background:repeating-linear-gradient(90deg,rgba(19,26,34,.05) 0 1px,transparent 1px 10%), #e6eaee; border-radius:99px; overflow:hidden; }
.ic-bar-fill{ height:100%; border-radius:99px; background:linear-gradient(90deg,var(--emerald),#1fa46f); position:relative; transition:width 1s cubic-bezier(.2,.7,.2,1); }
.ic-bar-fill::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent); transform:translateX(-100%); animation:ic-shim 2.6s ease-in-out infinite; }
@keyframes ic-shim{ 60%,100%{ transform:translateX(220%); } }

/* القائمة */
.ic-list{ margin-top:18px; display:flex; flex-direction:column; gap:12px; }
.ic-empty{ background:var(--card); border:1px dashed var(--line); border-radius:14px; padding:46px; text-align:center; color:var(--muted); display:flex; flex-direction:column; align-items:center; gap:10px; }
.ic-row{ background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; transition:box-shadow .3s, transform .3s; }
.ic-row:hover{ box-shadow:0 16px 34px -24px rgba(19,26,34,.4); }
.ic-row.is-overdue{ border-color:rgba(192,57,43,.45); background:linear-gradient(90deg,rgba(192,57,43,.05),var(--card) 30%); }
.ic-row-main{ display:flex; align-items:center; gap:14px; padding:15px 18px; cursor:pointer; }
.ic-row-bar{ width:4px; align-self:stretch; border-radius:99px; background:var(--slate); flex:none; }
.ic-row.t-sky .ic-row-bar{ background:var(--sky); } .ic-row.t-emerald .ic-row-bar{ background:var(--emerald); }
.ic-row.t-amber .ic-row-bar{ background:var(--amber); } .ic-row.t-rose .ic-row-bar{ background:var(--rose); }
.ic-row-id{ flex:1; min-width:0; }
.ic-row-title{ display:block; font-weight:600; font-size:14.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ic-row-ms{ font-size:11px; color:var(--muted); }
.ic-row-amt{ text-align:start; }
.ic-row-amt-v{ font-family:'Space Grotesk'; font-size:18px; font-weight:700; }
.ic-row-amt-l{ font-size:10px; color:var(--muted); margin-inline-start:3px; }
.ic-row-prog{ width:120px; display:flex; align-items:center; gap:8px; }
.ic-row-prog-bar{ flex:1; height:6px; background:#e6eaee; border-radius:99px; overflow:hidden; }
.ic-row-prog-bar span{ display:block; height:100%; background:var(--emerald); border-radius:99px; transition:width .8s ease; }
.ic-row-prog-pct{ font-family:'JetBrains Mono'; font-size:11px; min-width:32px; text-align:end; }
.ic-status{ font-size:11px; font-weight:600; padding:4px 11px; border-radius:99px; white-space:nowrap; }
.ic-status.t-sky{ background:rgba(37,99,168,.12); color:var(--sky); }
.ic-status.t-emerald{ background:rgba(21,128,90,.12); color:var(--emerald); }
.ic-status.t-amber{ background:rgba(185,121,26,.13); color:var(--amber); }
.ic-status.t-rose{ background:rgba(192,57,43,.12); color:var(--rose); }
.ic-status.t-slate{ background:rgba(91,102,117,.14); color:var(--slate); }
.ic-overdue-chip{ display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:var(--rose);
  background:rgba(192,57,43,.12); padding:4px 11px; border-radius:99px; white-space:nowrap; }
.ic-pulse-dot{ width:7px; height:7px; border-radius:50%; background:var(--rose); position:relative; }
.ic-pulse-dot::after{ content:""; position:absolute; inset:-3px; border-radius:50%; background:var(--rose); opacity:.5; animation:ic-ping 1.6s infinite; }
@keyframes ic-ping{ 70%,100%{ transform:scale(2.4); opacity:0; } }
.ic-chev{ color:var(--muted); transition:transform .3s; flex:none; }
.ic-chev.rot{ transform:rotate(180deg); }

/* التفاصيل */
.ic-detail{ max-height:0; overflow:hidden; transition:max-height .4s ease; border-top:0 solid var(--line); }
.ic-detail.open{ max-height:760px; border-top:1px solid var(--line); }
.ic-detail-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:14px 18px; background:rgba(19,26,34,.02); }
@media(max-width:680px){ .ic-detail-grid{ grid-template-columns:1fr 1fr; } }
.ic-meta-cell{ display:flex; align-items:center; gap:6px; font-size:12px; color:var(--muted); }
.ic-meta-cell b{ color:var(--ink); font-family:'JetBrains Mono'; }
.ic-meta-cell b.rose{ color:var(--rose); } .ic-meta-cell b.emerald{ color:var(--emerald); } .ic-meta-cell b.amber{ color:var(--amber); }

/* التبويبات */
.ic-tabs{ padding:0 18px 16px; }
.ic-tab-bar{ display:flex; gap:6px; border-bottom:1px solid var(--line); margin-bottom:12px; }
.ic-tab-bar button{ background:none; border:none; border-bottom:2px solid transparent; padding:8px 12px; font-family:inherit;
  font-size:12.5px; color:var(--muted); cursor:pointer; display:flex; align-items:center; gap:6px; transition:.2s; }
.ic-tab-bar button.on{ color:var(--ink); border-bottom-color:var(--sky); }
.ic-tab-bar b{ font-family:'JetBrains Mono'; background:rgba(19,26,34,.06); border-radius:99px; padding:1px 7px; font-size:10px; }
.ic-muted{ font-size:12.5px; color:var(--muted); padding:8px 0; }
.ic-pay-row, .ic-file-row{ display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:9px; font-size:12.5px; transition:background .2s; }
.ic-pay-row:hover, .ic-file-row:hover{ background:rgba(19,26,34,.03); }
.ic-pay-dot{ width:7px; height:7px; border-radius:50%; background:var(--emerald); flex:none; }
.ic-pay-date{ color:var(--muted); font-family:'JetBrains Mono'; font-size:11px; }
.ic-pay-amt{ font-family:'Space Grotesk'; font-weight:700; color:var(--emerald); margin-inline-start:auto; }
.ic-pay-by{ color:var(--muted); font-size:11px; }
.ic-file-row{ color:var(--sky); text-decoration:none; }
.ic-file-name{ font-weight:600; } .ic-file-by{ color:var(--muted); margin-inline-start:auto; font-size:11px; }
.ic-add-pay{ margin-top:10px; display:inline-flex; align-items:center; gap:6px; font-family:inherit; font-size:12px; font-weight:600;
  color:var(--sky); background:rgba(37,99,168,.08); border:1px dashed rgba(37,99,168,.4); border-radius:9px; padding:7px 12px; cursor:pointer; transition:.2s; }
.ic-add-pay:hover{ background:rgba(37,99,168,.14); } .ic-add-pay:disabled{ opacity:.5; }
.ic-pay-form{ display:flex; gap:8px; margin-top:10px; }
.ic-pay-form input{ flex:1; border:1px solid var(--line); border-radius:9px; padding:8px 10px; font-family:'JetBrains Mono'; font-size:13px; }
.ic-pay-form button{ border:1px solid var(--line); border-radius:9px; padding:8px 14px; background:var(--ink); color:#fff; font-family:inherit; font-weight:600; cursor:pointer; }
.ic-pay-form button[type=button]{ background:#fff; color:var(--muted); }

/* النافذة */
.ic-mask{ position:fixed; inset:0; background:rgba(19,26,34,.5); backdrop-filter:blur(3px); display:grid; place-items:center; z-index:60; padding:18px; }
.ic-modal{ background:var(--card); border-radius:16px; width:min(420px,100%); padding:18px; }
.ic-modal-h{ display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-weight:600; }
.ic-modal-h button{ background:none; border:none; color:var(--muted); cursor:pointer; }
`;