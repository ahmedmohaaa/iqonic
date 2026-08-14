import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import apiClient from '../../api/axios';
import { getFinancialDashboard, getInvoices } from '../../api/services/financials';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign, TrendingUp, AlertOctagon, CheckCircle2, Receipt, Plus,
  Calendar, Paperclip, Upload, X, ChevronDown, FileText, Trash2,
  Search, Wallet, CircleDot, Clock,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   غرفة خزنة المحاسب — لوحة مالية حيّة كاملة الأفعال
   ═══════════════════════════════════════════════════════════════ */
const STATUS_META = {
  DRAFT:          { tone: 'slate',   label: 'مسوّدة' },
  ISSUED:         { tone: 'sky',     label: 'مُصدَرة' },
  PARTIALLY_PAID: { tone: 'amber',   label: 'جزئية' },
  PAID:           { tone: 'emerald', label: 'مسدّدة' },
  OVERDUE:        { tone: 'rose',    label: 'متأخرة' },
  CANCELLED:      { tone: 'slate',   label: 'ملغاة' },
};
const MILESTONES = [
  ['DOWN_PAYMENT', 'دفعة مقدمة / Advanced'],
  ['DC1', 'دفعة DC1'],
  ['DC2', 'دفعة DC2'],
  ['TENDERING', 'دفعة المناقصة'],
];
const todayISO = () => new Date().toISOString().slice(0, 10);

function useCountUp(target, dec = 0) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const from = ref.current, to = Number(target) || 0, start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 850), e = 1 - Math.pow(1 - t, 3);
      const cur = from + (to - from) * e; setV(cur); ref.current = cur;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
}
const Money = ({ value, dec = 0 }) => <span className="v-num">{useCountUp(value, dec)}</span>;

export default function GlobalFinancialDashboard() {
  const { user } = useAuth();
  const [dash, setDash] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const wrap = useRef(null);
const isAccountant = user?.role === 'ACCOUNTANT' || user?.groups?.includes('ACCOUNTANT');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, inv, pr] = await Promise.all([
        getFinancialDashboard(),
        getInvoices({ status: filter || undefined }),
        apiClient.get('projects/', { params: { page_size: 200 } }),
      ]);
      setDash(d.data);
      setInvoices(inv.data.results || inv.data || []);
      setProjects(pr.data.results || pr.data || []);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const io = new IntersectionObserver((es) =>
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { threshold: 0.08 });
    el.querySelectorAll('.rv').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [invoices, loading]);

  const totals = dash?.company_totals || {};
  const overdueCount = dash?.alerts?.total_overdue_invoices || 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((i) =>
      (i.title || '').toLowerCase().includes(q) ||
      (i.project_name || '').toLowerCase().includes(q) ||
      (i.project_no || '').toLowerCase().includes(q)
    );
  }, [invoices, query]);

  return (
    <div ref={wrap} className="gfd" dir="rtl">
      <style>{CSS}</style>
      <div className="gfd-ambient" aria-hidden />

      {/* الرأس + شريط الأفعال */}
{/* الرأس + شريط الأفعال */}
      <header className="gfd-head rv">
        <div>
          <span className="gfd-kicker">ACCOUNTANT · غرفة الخزنة</span>
          <h1 className="gfd-title">مركز التحكم المالي</h1>
          <p className="gfd-sub">مرحباً {user?.first_name || ''} — أنشئ الفواتير، سجّل الدفعات، وارفع المستندات من مكان واحد.</p>
        </div>
        {/* === تعديل: إظهار الزر للمحاسب فقط === */}
        {isAccountant && (
          <button className="gfd-create" onClick={() => setCreateOpen(true)}>
            <Plus size={18} /> فاتورة جديدة
          </button>
        )}
        {/* === نهاية التعديل === */}
      </header>

      {/* KPIs */}
      <section className="gfd-kpis rv">
        <Kpi tone="sky" icon={<Receipt size={18} />} label="إجمالي المفوتر" value={totals.total_contract_values_invoiced} />
        <Kpi tone="emerald" icon={<CheckCircle2 size={18} />} label="المحصّل" value={totals.total_collected} />
        <Kpi tone="amber" icon={<Wallet size={18} />} label="المعلّق" value={totals.total_outstanding} />
        <Kpi tone="rose" icon={<AlertOctagon size={18} />} label="فواتير متأخرة" value={overdueCount} pulse={overdueCount > 0} plain />
      </section>

      {/* بحث + فلتر */}
      <section className="gfd-toolbar rv">
        <div className="gfd-search">
          <Search size={15} />
          <input placeholder="ابحث بالاسم أو رقم المشروع أو عنوان الفاتورة…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="gfd-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="ISSUED">مُصدَرة</option>
          <option value="PARTIALLY_PAID">جزئية</option>
          <option value="PAID">مسدّدة</option>
          <option value="OVERDUE">متأخرة</option>
        </select>
      </section>

      {/* قائمة الفواتير الحيّة */}
{/* قائمة الفواتير الحيّة */}
      <section className="gfd-list">
        {loading ? <div className="gfd-empty">جارٍ تحميل الخزنة…</div>
          : visible.length === 0 ? <div className="gfd-empty"><Receipt size={30} /> لا فواتير مطابقة. ابدأ بـ «فاتورة جديدة».</div>
          : visible.map((inv, idx) => (
            <InvoiceRow
              key={inv.id} inv={inv} idx={idx}
              open={expanded === inv.id}
              onToggle={() => setExpanded(expanded === inv.id ? null : inv.id)}
              onChanged={load}
              isAccountant={isAccountant} // === إضافة هذا البروب ===
            />
          ))}
      </section>

      {createOpen && (
        <CreateInvoiceModal projects={projects} onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); }} />
      )}
    </div>
  );
}

/* ── بطاقة KPI ─────────────────────────────────────────────── */
function Kpi({ tone, icon, label, value, pulse, plain }) {
  return (
    <div className={`gfd-kpi t-${tone} ${pulse ? 'pulse-card' : ''}`}>
      <span className="gfd-kpi-ic">{icon}</span>
      <div>
        <span className="gfd-kpi-l">{label}</span>
        <span className="gfd-kpi-v">{plain ? <Money value={value} /> : <><Money value={value} /> <i>ر.ق</i></>}</span>
      </div>
    </div>
  );
}

/* ── صف فاتورة قابل للتوسع ─────────────────────────────────── */
function InvoiceRow({ inv, idx, open, onToggle, onChanged, isAccountant }) {
    const m = STATUS_META[inv.status] || STATUS_META.slate;
  const paid = Number(inv.collected_amount || 0);
  const total = Number(inv.total_amount || 0);
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const overdue = inv.status === 'OVERDUE' ? (inv.delayed_days || 0) : 0;

  return (
    <article className={`gfd-row rv t-${m.tone} ${overdue ? 'is-over' : ''}`} style={{ '--i': idx }}>
      <div className="gfd-row-main" onClick={onToggle}>
        <span className="gfd-row-bar" />
        <div className="gfd-row-id">
          <span className="gfd-row-title">{inv.title}</span>
          <span className="gfd-row-ms">{inv.project_name || '—'} · {inv.project_no || ''} · {inv.milestone_type_display}</span>
        </div>
        <div className="gfd-row-amt"><Money value={total} /> <i>ر.ق</i></div>
        <div className="gfd-row-prog">
          <div className="gfd-prog-bar"><span style={{ width: `${pct}%` }} /></div>
          <em>{Math.round(pct)}%</em>
        </div>
        {overdue > 0
          ? <span className="gfd-over"><span className="gfd-pdot" /> متأخر {overdue}ي</span>
          : <span className={`gfd-badge t-${m.tone}`}>{m.label}</span>}
        <ChevronDown size={18} className={`gfd-chev ${open ? 'rot' : ''}`} />
      </div>
<div className={`gfd-detail ${open ? 'open' : ''}`}>
        <div className="gfd-detail-grid">
          <Cell icon={<Calendar size={13} />} l="إصدار" v={inv.issue_date || '—'} />
          <Cell icon={<Calendar size={13} />} l="استحقاق" v={inv.due_date || '—'} danger={overdue > 0} />
          <Cell icon={<CheckCircle2 size={13} />} l="محصّل" v={<Money value={paid} />} good />
          <Cell icon={<Wallet size={13} />} l="متبقٍّ" v={<Money value={inv.outstanding_amount} />} warn />
        </div>
        <RowActions inv={inv} onChanged={onChanged} isAccountant={isAccountant} /> {/* === إضافة isAccountant === */}
      </div>
    </article>
  );
}
function Cell({ icon, l, v, good, warn, danger }) {
  return (
    <div className="gfd-cell">
      {icon}<span className="gfd-cell-l">{l}</span>
      <b className={good ? 'good' : warn ? 'warn' : danger ? 'danger' : ''}>{v}</b>
    </div>
  );
}

/* ── أفعال الصف: دفعة + PDF + حالة + إلغاء ─────────────────── */
function RowActions({ inv, onChanged, isAccountant }) {
    const [payOpen, setPayOpen] = useState(false);
  const [amt, setAmt] = useState('');
  const [status, setStatus] = useState(inv.status);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    apiClient.get(`invoices/${inv.id}/files/`).then((r) => setFiles(r.data.results || r.data || [])).catch(() => setFiles([]));
  }, [inv.id]);

  const remaining = Number(inv.outstanding_amount || inv.total_amount || 0);

  const submitPay = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await apiClient.post('invoices/payment/', { invoice: inv.id, amount_paid: Number(amt) }); setAmt(''); setPayOpen(false); onChanged(); }
    catch (err) { alert(err.response?.data?.detail || 'تعذّر تسجيل الدفعة'); }
    finally { setBusy(false); }
  };
  const upload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return; setBusy(true);
    const fd = new FormData(); fd.append('file', f);
    try {
      await apiClient.post(`invoices/${inv.id}/files/upload/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const r = await apiClient.get(`invoices/${inv.id}/files/`); setFiles(r.data.results || r.data || []);
    } catch { alert('تعذّر الرفع'); }
    finally { setBusy(false); e.target.value = ''; }
  };
  const changeStatus = async (s) => {
    setStatus(s);
    try { await apiClient.patch(`invoices/${inv.id}/update/`, { status: s }); onChanged(); }
    catch { setStatus(inv.status); }
  };
  const cancel = async () => {
    if (!window.confirm('إلغاء الفاتورة نهائياً؟')) return;
    await changeStatus('CANCELLED');
  };
return (
    <div className="gfd-acts">
      {/* تسجيل دفعة */}
      <div className="gfd-act-block">
        <div className="gfd-act-h"><DollarSign size={14} /> الدفعات</div>
        {(inv.payments || []).length === 0
          ? <p className="gfd-muted">لا دفعات بعد.</p>
          : (inv.payments || []).map((p, i) => (
            <div key={i} className="gfd-pay"><span className="gfd-pay-dot" /><span className="gfd-pay-d">{p.payment_date}</span><span className="gfd-pay-a">+<Money value={p.amount_paid} /></span></div>
          ))}
        {/* === تعديل: إظهار تسجيل الدفعة للمحاسب فقط === */}
        {isAccountant && (
          payOpen ? (
            <form onSubmit={submitPay} className="gfd-payform">
              <input type="number" step="0.01" max={remaining} placeholder={`الحدّ ${remaining}`} value={amt} onChange={(e) => setAmt(e.target.value)} required />
              <button disabled={busy} type="submit">حفظ</button>
              <button type="button" onClick={() => setPayOpen(false)}><X size={14} /></button>
            </form>
          ) : (
            <button className="gfd-mini" onClick={() => setPayOpen(true)}><Plus size={13} /> تسجيل دفعة</button>
          )
        )}
        {/* === نهاية التعديل === */}
      </div>

      {/* ملفات */}
      <div className="gfd-act-block">
        <div className="gfd-act-h"><Paperclip size={14} /> المستندات</div>
        {files.length === 0 ? <p className="gfd-muted">لا ملفات.</p>
          : files.map((f, i) => (
            <a key={i} href={f.file} target="_blank" rel="noreferrer" className="gfd-file"><FileText size={13} /> {f.file?.split('/').pop()}</a>
          ))}
        
        {/* === تعديل: إظهار إرفاق الملفات للمحاسب فقط === */}
        {isAccountant && (
          <>
            <input ref={fileRef} type="file" hidden onChange={upload} />
            <button className="gfd-mini" onClick={() => fileRef.current?.click()} disabled={busy}><Upload size={13} /> إرفاق PDF</button>
          </>
        )}
        {/* === نهاية التعديل === */}
      </div>

      {/* حالة + إلغاء */}
      <div className="gfd-act-block">
        <div className="gfd-act-h"><Clock size={14} /> الحالة</div>
        
        {/* === تعديل: إذا لم يكن محاسباً نعرض الحالة كنص فقط بدون select === */}
        {isAccountant ? (
          <select className="gfd-status-sel" value={status} onChange={(e) => changeStatus(e.target.value)}>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        ) : (
          <span className={`gfd-badge t-${STATUS_META[inv.status]?.tone || 'slate'}`} style={{ alignSelf: 'flex-start' }}>
            {STATUS_META[inv.status]?.label || status}
          </span>
        )}
        {/* === نهاية التعديل === */}

        {/* === تعديل: إظهار زر إلغاء الفاتورة للمحاسب فقط === */}
        {isAccountant && inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
          <button className="gfd-mini rose" onClick={cancel}><Trash2 size={13} /> إلغاء الفاتورة</button>
        )}
        {/* === نهاية التعديل === */}
      </div>
    </div>
  );
}

/* ── مودال إنشاء فاتورة ────────────────────────────────────── */
function CreateInvoiceModal({ projects, onClose, onDone }) {
  const [f, setF] = useState({ project: '', title: '', milestone_type: 'DOWN_PAYMENT', total_amount: '', issue_date: todayISO(), due_date: '' });
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const filtered = projects.filter((p) => (p.name || '').toLowerCase().includes(q.toLowerCase()) || (p.project_no || '').toLowerCase().includes(q.toLowerCase())).slice(0, 8);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await apiClient.post('invoices/create/', { ...f, project: Number(f.project), total_amount: Number(f.total_amount) });
      onDone();
    } catch (err) { alert(err.response?.data?.detail || 'تعذّر إنشاء الفاتورة'); }
    finally { setBusy(false); }
  };

  return (
    <div className="gfd-mask" onClick={onClose}>
      <form className="gfd-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="gfd-modal-h"><h3><Receipt size={18} /> فاتورة جديدة</h3><button type="button" onClick={onClose}><X size={18} /></button></div>
        <div className="gfd-modal-b">
          <label className="gfd-lbl">المشروع</label>
          <input className="gfd-in" placeholder="ابحث برقم أو اسم المشروع…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="gfd-projlist">
            {filtered.map((p) => (
              <button type="button" key={p.id} className={`gfd-proj ${f.project == p.id ? 'on' : ''}`} onClick={() => { setF((x) => ({ ...x, project: p.id })); setQ(`${p.project_no} — ${p.name}`); }}>
                <b>{p.project_no}</b><span>{p.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <span className="gfd-muted">لا نتائج.</span>}
          </div>

          <div className="gfd-two">
            <label className="gfd-lbl">المرحلة
              <select className="gfd-in" value={f.milestone_type} onChange={set('milestone_type')}>
                {MILESTONES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="gfd-lbl">المبلغ
              <input className="gfd-in" type="number" step="0.01" value={f.total_amount} onChange={set('total_amount')} required />
            </label>
          </div>
          <label className="gfd-lbl">عنوان الفاتورة
            <input className="gfd-in" value={f.title} onChange={set('title')} placeholder="مثال: دفعة DC1 — المرحلة الثانية" required />
          </label>
          <div className="gfd-two">
            <label className="gfd-lbl">تاريخ الإصدار<input className="gfd-in" type="date" value={f.issue_date} onChange={set('issue_date')} /></label>
            <label className="gfd-lbl">تاريخ الاستحقاق<input className="gfd-in" type="date" value={f.due_date} onChange={set('due_date')} /></label>
          </div>
        </div>
        <div className="gfd-modal-f">
          <button type="button" className="gfd-ghost" onClick={onClose}>إلغاء</button>
          <button type="submit" className="gfd-solid" disabled={busy || !f.project}>{busy ? 'جارٍ الإنشاء…' : 'إنشاء الفاتورة'}</button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.gfd{ --ink:#0c141d; --surf:#131c27; --surf2:#18222f; --line:#26323f; --paper:#e9eff5; --mut:#8694a4;
  --amber:#e6ab4c; --emerald:#3fb286; --sky:#5cc6ef; --rose:#e3707e; --slate:#5d6b7a;
  position:relative; min-height:100vh; color:var(--paper); padding:30px clamp(16px,4vw,44px) 70px;
  font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
  background:linear-gradient(180deg,#0a0f16,#080c12); }
.gfd-ambient{ position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(56% 44% at 92% -6%, rgba(230,171,76,.10), transparent 60%),
    radial-gradient(50% 42% at -4% 104%, rgba(92,198,239,.08), transparent 60%),
    linear-gradient(rgba(92,198,239,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(92,198,239,.04) 1px,transparent 1px);
  background-size:auto,auto,44px 44px,44px 44px;
  -webkit-mask-image:radial-gradient(125% 100% at 50% 0%,#000,transparent 88%);
          mask-image:radial-gradient(125% 100% at 50% 0%,#000,transparent 88%); }
.gfd > *{ position:relative; }
.v-num{ font-family:'Fraunces','Space Grotesk'; font-variant-numeric:tabular-nums; font-weight:700; }
.rv{ opacity:0; transform:translateY(16px); transition:opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1); transition-delay:calc(var(--i,0) * 40ms); }
.rv.in{ opacity:1; transform:none; }

.gfd-head{ display:flex; justify-content:space-between; align-items:flex-end; gap:18px; flex-wrap:wrap; padding-bottom:20px; border-bottom:1px solid var(--line); }
.gfd-kicker{ font-family:'Space Grotesk'; font-size:11px; letter-spacing:.3em; color:var(--amber); }
.gfd-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(28px,4.6vw,48px); font-weight:700; line-height:1; margin:6px 0 5px; letter-spacing:-.02em; }
.gfd-sub{ color:var(--mut); font-size:13.5px; margin:0; max-width:50ch; }
.gfd-create{ display:inline-flex; align-items:center; gap:8px; font-family:inherit; font-weight:700; font-size:14px;
  color:#1a1206; background:linear-gradient(180deg,#f0bd5e,var(--amber)); border:none; border-radius:12px; padding:12px 20px;
  cursor:pointer; box-shadow:0 14px 30px -14px rgba(230,171,76,.8); transition:transform .25s, filter .25s; position:relative; overflow:hidden; }
.gfd-create:hover{ transform:translateY(-2px); filter:brightness(1.06); }
.gfd-create::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-120%); }
.gfd-create:hover::after{ animation:gfdsh .8s ease; }
@keyframes gfdsh{ to{ transform:translateX(120%); } }

.gfd-kpis{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-top:22px; }
@media(max-width:880px){ .gfd-kpis{ grid-template-columns:1fr 1fr; } }
.gfd-kpi{ display:flex; gap:13px; align-items:flex-start; background:linear-gradient(180deg,rgba(255,255,255,.03),transparent),var(--surf);
  border:1px solid var(--line); border-top:3px solid var(--slate); border-radius:14px; padding:16px 18px; transition:transform .3s, box-shadow .3s, border-color .3s; }
.gfd-kpi:hover{ transform:translateY(-4px); box-shadow:0 18px 38px -24px rgba(0,0,0,.7); }
.gfd-kpi-ic{ display:grid; place-items:center; width:38px; height:38px; border-radius:11px; flex:none; }
.gfd-kpi-l{ display:block; font-size:11px; color:var(--mut); letter-spacing:.04em; }
.gfd-kpi-v{ font-family:'Fraunces','Space Grotesk'; font-size:26px; font-weight:700; line-height:1.1; }
.gfd-kpi-v i{ font-style:normal; font-size:.42em; color:var(--mut); margin-inline-start:3px; }
.t-sky{ border-top-color:var(--sky); } .t-sky .gfd-kpi-ic{ background:rgba(92,198,239,.14); color:var(--sky); }
.t-emerald{ border-top-color:var(--emerald); } .t-emerald .gfd-kpi-ic{ background:rgba(63,178,134,.14); color:var(--emerald); }
.t-amber{ border-top-color:var(--amber); } .t-amber .gfd-kpi-ic{ background:rgba(230,171,76,.14); color:var(--amber); }
.t-rose{ border-top-color:var(--rose); } .t-rose .gfd-kpi-ic{ background:rgba(227,112,126,.14); color:var(--rose); }
.pulse-card{ animation:gfdpulse 2.4s ease-in-out infinite; }
@keyframes gfdpulse{ 0%,100%{ box-shadow:0 0 0 0 rgba(227,112,126,0); } 50%{ box-shadow:0 0 0 4px rgba(227,112,126,.14); } }

.gfd-toolbar{ display:flex; gap:12px; margin-top:20px; flex-wrap:wrap; }
.gfd-search{ flex:1; min-width:240px; display:flex; align-items:center; gap:9px; background:var(--surf); border:1px solid var(--line); border-radius:11px; padding:0 13px; color:var(--mut); transition:border-color .2s; }
.gfd-search:focus-within{ border-color:var(--sky); }
.gfd-search input{ flex:1; background:none; border:none; outline:none; color:var(--paper); font-family:inherit; font-size:13.5px; padding:11px 0; }
.gfd-filter{ background:var(--surf); border:1px solid var(--line); border-radius:11px; color:var(--paper); font-family:inherit; font-size:13px; padding:0 14px; cursor:pointer; }

.gfd-list{ margin-top:18px; display:flex; flex-direction:column; gap:12px; }
.gfd-empty{ background:var(--surf); border:1px dashed var(--line); border-radius:14px; padding:46px; text-align:center; color:var(--mut); display:flex; flex-direction:column; align-items:center; gap:10px; }
.gfd-row{ background:var(--surf); border:1px solid var(--line); border-radius:14px; overflow:hidden; transition:box-shadow .3s, transform .3s; }
.gfd-row:hover{ box-shadow:0 16px 34px -24px rgba(0,0,0,.7); }
.gfd-row.is-over{ border-color:rgba(227,112,126,.45); background:linear-gradient(90deg,rgba(227,112,126,.06),var(--surf) 32%); }
.gfd-row-main{ display:flex; align-items:center; gap:14px; padding:15px 18px; cursor:pointer; }
.gfd-row-bar{ width:4px; align-self:stretch; border-radius:99px; background:var(--slate); flex:none; }
.gfd-row.t-sky .gfd-row-bar{ background:var(--sky); } .gfd-row.t-emerald .gfd-row-bar{ background:var(--emerald); }
.gfd-row.t-amber .gfd-row-bar{ background:var(--amber); } .gfd-row.t-rose .gfd-row-bar{ background:var(--rose); }
.gfd-row-id{ flex:1; min-width:0; }
.gfd-row-title{ display:block; font-weight:600; font-size:14.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.gfd-row-ms{ font-size:11px; color:var(--mut); }
.gfd-row-amt{ font-family:'Fraunces','Space Grotesk'; font-size:18px; font-weight:700; }
.gfd-row-amt i{ font-style:normal; font-size:.45em; color:var(--mut); margin-inline-start:3px; }
.gfd-row-prog{ width:120px; display:flex; align-items:center; gap:8px; }
.gfd-prog-bar{ flex:1; height:6px; background:rgba(255,255,255,.08); border-radius:99px; overflow:hidden; }
.gfd-prog-bar span{ display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,var(--emerald),var(--sky)); position:relative; transition:width .8s ease; }
.gfd-prog-bar span::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-100%); animation:gfdshim 2.6s ease-in-out infinite; }
@keyframes gfdshim{ 60%,100%{ transform:translateX(240%); } }
.gfd-row-prog em{ font-style:normal; font-family:'JetBrains Mono'; font-size:11px; min-width:34px; text-align:end; }
.gfd-badge{ font-size:11px; font-weight:600; padding:4px 11px; border-radius:99px; white-space:nowrap; }
.gfd-badge.t-sky{ background:rgba(92,198,239,.14); color:var(--sky); } .gfd-badge.t-emerald{ background:rgba(63,178,134,.14); color:var(--emerald); }
.gfd-badge.t-amber{ background:rgba(230,171,76,.14); color:var(--amber); } .gfd-badge.t-rose{ background:rgba(227,112,126,.14); color:var(--rose); } .gfd-badge.t-slate{ background:rgba(93,107,122,.2); color:#aeb9c5; }
.gfd-over{ display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:var(--rose); background:rgba(227,112,126,.14); padding:4px 11px; border-radius:99px; }
.gfd-pdot{ width:7px; height:7px; border-radius:50%; background:var(--rose); position:relative; }
.gfd-pdot::after{ content:""; position:absolute; inset:-3px; border-radius:50%; background:var(--rose); opacity:.5; animation:gfdping 1.6s infinite; }
@keyframes gfdping{ 70%,100%{ transform:scale(2.4); opacity:0; } }
.gfd-chev{ color:var(--mut); transition:transform .3s; flex:none; } .gfd-chev.rot{ transform:rotate(180deg); }

.gfd-detail{ max-height:0; overflow:hidden; transition:max-height .45s ease; border-top:0 solid var(--line); }
.gfd-detail.open{ max-height:900px; border-top:1px solid var(--line); }
.gfd-detail-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:14px 18px; background:rgba(255,255,255,.02); }
@media(max-width:680px){ .gfd-detail-grid{ grid-template-columns:1fr 1fr; } }
.gfd-cell{ display:flex; align-items:center; gap:6px; font-size:12px; color:var(--mut); }
.gfd-cell-l{ color:var(--mut); } .gfd-cell b{ color:var(--paper); font-family:'JetBrains Mono'; margin-inline-start:auto; }
.gfd-cell b.good{ color:var(--emerald); } .gfd-cell b.warn{ color:var(--amber); } .gfd-cell b.danger{ color:var(--rose); }

.gfd-acts{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; padding:16px 18px; }
@media(max-width:760px){ .gfd-acts{ grid-template-columns:1fr; } }
.gfd-act-block{ background:var(--surf2); border:1px solid var(--line); border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px; }
.gfd-act-h{ display:flex; align-items:center; gap:7px; font-size:12px; font-weight:600; color:var(--paper); padding-bottom:8px; border-bottom:1px solid var(--line); }
.gfd-muted{ font-size:12px; color:var(--mut); }
.gfd-pay{ display:flex; align-items:center; gap:8px; font-size:12px; }
.gfd-pay-dot{ width:7px; height:7px; border-radius:50%; background:var(--emerald); }
.gfd-pay-d{ color:var(--mut); font-family:'JetBrains Mono'; font-size:11px; }
.gfd-pay-a{ margin-inline-start:auto; font-family:'Fraunces','Space Grotesk'; font-weight:700; color:var(--emerald); }
.gfd-file{ display:flex; align-items:center; gap:7px; font-size:12px; color:var(--sky); text-decoration:none; }
.gfd-mini{ display:inline-flex; align-items:center; gap:6px; align-self:flex-start; font-family:inherit; font-size:11.5px; font-weight:600; color:var(--sky); background:rgba(92,198,239,.1); border:1px dashed rgba(92,198,239,.4); border-radius:8px; padding:6px 11px; cursor:pointer; transition:.2s; }
.gfd-mini:hover{ background:rgba(92,198,239,.2); } .gfd-mini.rose{ color:var(--rose); background:rgba(227,112,126,.1); border-color:rgba(227,112,126,.4); }
.gfd-mini:disabled{ opacity:.5; }
.gfd-payform{ display:flex; gap:7px; }
.gfd-payform input{ flex:1; border:1px solid var(--line); border-radius:8px; padding:7px 9px; font-family:'JetBrains Mono'; font-size:12px; background:var(--ink); color:var(--paper); }
.gfd-payform button{ border:1px solid var(--line); border-radius:8px; padding:7px 12px; background:var(--emerald); color:#06140e; font-family:inherit; font-weight:700; cursor:pointer; }
.gfd-payform button[type=button]{ background:var(--surf); color:var(--mut); }
.gfd-status-sel{ background:var(--ink); border:1px solid var(--line); border-radius:8px; color:var(--paper); font-family:inherit; font-size:12px; padding:7px 9px; }

.gfd-mask{ position:fixed; inset:0; z-index:60; display:grid; place-items:center; padding:18px; background:rgba(6,10,15,.76); backdrop-filter:blur(3px); }
.gfd-modal{ width:min(520px,100%); background:linear-gradient(180deg,#16202c,#0e1822); border:1px solid var(--line); border-radius:18px; overflow:hidden; animation:gfdpop .25s cubic-bezier(.2,.8,.2,1); }
@keyframes gfdpop{ from{ opacity:0; transform:scale(.95) translateY(8px); } to{ opacity:1; transform:none; } }
.gfd-modal-h{ display:flex; justify-content:space-between; align-items:center; padding:15px 18px; border-bottom:1px solid var(--line); }
.gfd-modal-h h3{ display:flex; align-items:center; gap:9px; font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:17px; margin:0; }
.gfd-modal-h button{ background:none; border:none; color:var(--mut); cursor:pointer; }
.gfd-modal-b{ padding:18px; display:flex; flex-direction:column; gap:12px; max-height:64vh; overflow-y:auto; }
.gfd-lbl{ display:flex; flex-direction:column; gap:6px; font-size:12px; color:var(--mut); }
.gfd-in{ background:var(--ink); border:1px solid var(--line); border-radius:9px; padding:10px 12px; color:var(--paper); font-family:inherit; font-size:13.5px; outline:none; transition:border-color .2s; }
.gfd-in:focus{ border-color:var(--sky); }
.gfd-two{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.gfd-projlist{ display:flex; flex-direction:column; gap:5px; max-height:150px; overflow-y:auto; background:var(--ink); border:1px solid var(--line); border-radius:9px; padding:6px; }
.gfd-proj{ display:flex; gap:9px; align-items:center; text-align:start; background:none; border:1px solid transparent; border-radius:7px; padding:7px 9px; cursor:pointer; font-family:inherit; color:var(--mut); transition:.15s; }
.gfd-proj:hover{ background:rgba(92,198,239,.08); color:var(--paper); }
.gfd-proj.on{ background:rgba(92,198,239,.16); border-color:rgba(92,198,239,.4); color:var(--paper); }
.gfd-proj b{ font-family:'JetBrains Mono'; font-size:11px; color:var(--amber); }
.gfd-proj span{ font-size:12.5px; }
.gfd-modal-f{ display:flex; justify-content:flex-end; gap:9px; padding:14px 18px; border-top:1px solid var(--line); }
.gfd-ghost{ padding:9px 16px; border:1px solid var(--line); border-radius:10px; background:transparent; color:var(--mut); cursor:pointer; font-family:inherit; }
.gfd-solid{ display:inline-flex; align-items:center; gap:7px; padding:9px 20px; border:none; border-radius:10px; background:linear-gradient(180deg,#f0bd5e,var(--amber)); color:#1a1206; font-weight:700; cursor:pointer; font-family:inherit; transition:filter .2s; }
.gfd-solid:hover{ filter:brightness(1.06); } .gfd-solid:disabled{ opacity:.5; cursor:not-allowed; }
`;

