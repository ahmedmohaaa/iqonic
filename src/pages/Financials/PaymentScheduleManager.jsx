import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  getPaymentSchedules,
  createPaymentSchedule,
  updatePaymentSchedule,
} from '../../api/services/financials';
import {
  Receipt, Plus, X, Calendar, CircleDot, CheckCircle2,
  FileText, TrendingUp, Coins, ChevronRight,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   PaymentScheduleManager
   يُستخدم داخل صفحة تفاصيل المشروع (prop) أو كصفحة (param)
   ═══════════════════════════════════════════════════════════ */
export default function PaymentScheduleManager({ projectId: propId, contractValue = 0 }) {
  const params = useParams();
  const projectId = propId ?? params?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    getPaymentSchedules(projectId)
      .then((r) => setItems(r.data.results ?? r.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (projectId) load(); }, [projectId]);

  /* ── حسابات حيّة ─────────────────────────────────────── */
  const totals = useMemo(() => {
    const contract = contractValue || items.reduce((s, i) => s + Number(i.amount || 0), 0);
    const collected = items
      .filter((i) => i.status === 'PAID')
      .reduce((s, i) => s + Number(i.amount || 0), 0);
    const invoiced = items
      .filter((i) => i.status !== 'PENDING')
      .reduce((s, i) => s + Number(i.amount || 0), 0);
    const outstanding = Math.max(invoiced - collected, 0);
    const pct = contract > 0 ? Math.min((collected / contract) * 100, 100) : 0;
    return { contract, collected, invoiced, outstanding, pct };
  }, [items, contractValue]);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (it) => { setEditing(it); setModalOpen(true); };

  const save = async (payload) => {
    if (editing) await updatePaymentSchedule(editing.id, payload);
    else await createPaymentSchedule(projectId, payload);
    setModalOpen(false);
    load();
  };

  const cycleStatus = async (it) => {
    const order = ['PENDING', 'INVOICED', 'PAID'];
    const next = order[(order.indexOf(it.status) + 1) % order.length];
    await updatePaymentSchedule(it.id, { status: next });
    load();
  };

  return (
    <div className="psm-root">
      <style>{CSS}</style>
      <div className="psm-ambient" aria-hidden />

      {/* ── الترويسة ─────────────────────────────────── */}
      <header className="psm-head reveal d1">
        <div>
          <span className="psm-kicker">CONTRACT · PAYMENT SCHEDULE</span>
          <h1 className="psm-title">جدول الدفعات</h1>
          <p className="psm-sub">تقسيم قيمة العقد إلى أقساط، وتتبع تحصيل كل قسط حتى الإقفال.</p>
        </div>
        <div className="psm-hero-num">
          <span className="psm-hero-label">نسبة التحصيل</span>
          <span className="psm-hero-figure">{totals.pct.toFixed(0)}<i>%</i></span>
        </div>
      </header>

      {/* ── لوحة الملخص ──────────────────────────────── */}
      <section className="psm-summary reveal d2">
        <Stat label="قيمة العقد" value={totals.contract} tone="ink" icon={<Coins size={16} />} />
        <Stat label="المحصَّل" value={totals.collected} tone="emerald" icon={<CheckCircle2 size={16} />} />
        <Stat label="المُصدَر" value={totals.invoiced} tone="sky" icon={<FileText size={16} />} />
        <Stat label="المتبقي" value={totals.outstanding} tone="amber" icon={<TrendingUp size={16} />} />
      </section>

      {/* ── شريط التقدّم الزمني ─────────────────────── */}
      <section className="psm-track reveal d3">
        <div className="psm-track-bar">
          <div className="psm-track-fill" style={{ width: `${totals.pct}%` }} />
          {items.map((it, idx) => {
            const pos = items.length > 1 ? (idx / (items.length - 1)) * 100 : 50;
            return (
              <button
                key={it.id}
                className={`psm-node st-${it.status.toLowerCase()}`}
                style={{ left: `${pos}%` }}
                onClick={() => cycleStatus(it)}
                title={`القسط ${it.installment_number} — انقر لتغيير الحالة`}
              >
                <span className="psm-node-dot" />
                <span className="psm-node-tag">#{it.installment_number}</span>
              </button>
            );
          })}
        </div>
        <div className="psm-track-legend">
          <Legend dot="st-pending" label="معلّق" />
          <Legend dot="st-invoiced" label="مُصدَر" />
          <Legend dot="st-paid" label="محصَّل" />
        </div>
      </section>

      {/* ── بطاقات الأقساط ──────────────────────────── */}
      <section className="psm-grid">
        {loading ? (
          <div className="psm-empty">جارٍ تحميل جدول الدفعات…</div>
        ) : items.length === 0 ? (
          <div className="psm-empty">
            <Receipt size={26} />
            <p>لا أقساط مسجّلة بعد. أضف القسط الأول لبدء تتبع التحصيل.</p>
          </div>
        ) : (
          items.map((it, idx) => (
            <article
              key={it.id}
              className={`psm-card st-${it.status.toLowerCase()} reveal`}
              style={{ animationDelay: `${0.06 * idx + 0.3}s` }}
            >
              <div className="psm-card-top">
                <span className="psm-card-no">{String(it.installment_number).padStart(2, '0')}</span>
                <button
                  className={`psm-pill st-${it.status.toLowerCase()}`}
                  onClick={() => cycleStatus(it)}
                >
                  {it.status === 'PAID' && <CheckCircle2 size={12} />}
                  {it.status === 'INVOICED' && <FileText size={12} />}
                  {it.status === 'PENDING' && <CircleDot size={12} />}
                  <span>{STATUS_AR[it.status]}</span>
                </button>
              </div>

              <div className="psm-card-amount">{Number(it.amount || 0).toLocaleString()} <i>ر.ق</i></div>

              <div className="psm-card-meta">
                <span><Calendar size={13} /> {it.due_date ?? '—'}</span>
                {it.description && <span className="psm-card-desc">{it.description}</span>}
              </div>

              <div className="psm-card-foot">
                <span className="psm-card-hint">انقر الوسم لتدوير الحالة</span>
                <button className="psm-edit" onClick={() => openEdit(it)}>
                  تعديل <ChevronRight size={13} />
                </button>
              </div>
            </article>
          ))
        )}

        <button className="psm-add reveal d4" onClick={openNew}>
          <Plus size={20} />
          <span>إضافة قسط</span>
        </button>
      </section>

      {modalOpen && (
        <PaymentModal item={editing} onClose={() => setModalOpen(false)} onSave={save} />
      )}
    </div>
  );
}

/* ── مكوّنات فرعية ──────────────────────────────────────── */
const STATUS_AR = { PENDING: 'معلّق', INVOICED: 'مُصدَر', PAID: 'محصَّل' };

function Stat({ label, value, tone, icon }) {
  return (
    <div className={`psm-stat t-${tone}`}>
      <span className="psm-stat-ico">{icon}</span>
      <div>
        <span className="psm-stat-label">{label}</span>
        <span className="psm-stat-value">{Number(value || 0).toLocaleString()}</span>
      </div>
    </div>
  );
}

function Legend({ dot, label }) {
  return (
    <span className="psm-legend">
      <span className={`psm-node-dot ${dot}`} /> {label}
    </span>
  );
}

function PaymentModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    installment_number: item?.installment_number ?? 1,
    amount: item?.amount ?? '',
    due_date: item?.due_date ?? '',
    description: item?.description ?? '',
    status: item?.status ?? 'PENDING',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await onSave({ ...form, amount: Number(form.amount) }); }
    finally { setBusy(false); }
  };

  return (
    <div className="psm-modal-mask" onClick={onClose}>
      <form className="psm-modal reveal d1" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="psm-modal-head">
          <h3>{item ? 'تعديل القسط' : 'قسط جديد'}</h3>
          <button type="button" className="psm-x" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="psm-modal-grid">
          <label>
            <span>رقم القسط</span>
            <input type="number" min="1" value={form.installment_number} onChange={set('installment_number')} required />
          </label>
          <label>
            <span>المبلغ</span>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} required />
          </label>
          <label>
            <span>تاريخ الاستحقاق</span>
            <input type="date" value={form.due_date} onChange={set('due_date')} required />
          </label>
          <label>
            <span>الحالة</span>
            <select value={form.status} onChange={set('status')}>
              <option value="PENDING">معلّق</option>
              <option value="INVOICED">مُصدَر</option>
              <option value="PAID">محصَّل</option>
            </select>
          </label>
          <label className="psm-full">
            <span>ملاحظة / وصف</span>
            <input type="text" value={form.description} onChange={set('description')} placeholder="مثال: دفعة مقدمة 20%" />
          </label>
        </div>

        <div className="psm-modal-foot">
          <button type="button" className="psm-ghost" onClick={onClose}>إلغاء</button>
          <button type="submit" className="psm-save" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ'}</button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   الأنماط — طابع دفتر حسابات حيّ
   ═══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

.psm-root{
  --ink:#0d1822; --ink2:#122230; --line:#22384a;
  --paper:#e9f1f5; --muted:#88a0ad;
  --amber:#e3a948; --sky:#62b1cf; --emerald:#54b189; --rose:#d9736a;
  position:relative; min-height:60vh; padding:30px 26px 60px;
  color:var(--paper);
  font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
  background:
    radial-gradient(120% 90% at 100% 0%, rgba(227,169,72,.10), transparent 55%),
    radial-gradient(100% 80% at 0% 100%, rgba(98,177,207,.09), transparent 55%),
    linear-gradient(180deg,#0d1822,#0a141d);
}
.psm-ambient{
  position:absolute; inset:0; pointer-events:none; opacity:.5;
  background-image:
    linear-gradient(rgba(98,177,207,.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(98,177,207,.05) 1px,transparent 1px);
  background-size:42px 42px;
  -webkit-mask-image:radial-gradient(120% 100% at 50% 0%,#000,transparent 80%);
          mask-image:radial-gradient(120% 100% at 50% 0%,#000,transparent 80%);
}
.psm-root *{ box-sizing:border-box; }

/* حركة الدخول المتدرّجة */
.reveal{ opacity:0; transform:translateY(16px); animation:psm-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
.d1{animation-delay:.05s}.d2{animation-delay:.13s}.d3{animation-delay:.21s}.d4{animation-delay:.5s}
@keyframes psm-rise{ to{opacity:1;transform:none;} }

/* الترويسة */
.psm-head{ position:relative; display:flex; justify-content:space-between; align-items:flex-end; gap:24px; flex-wrap:wrap; padding-bottom:22px; border-bottom:1px solid var(--line); }
.psm-kicker{ font-family:'Space Grotesk'; font-size:11px; letter-spacing:.32em; color:var(--amber); }
.psm-title{ font-family:'IBM Plex Sans Arabic'; font-size:clamp(30px,5vw,46px); font-weight:700; margin:6px 0 4px; line-height:1.05; }
.psm-sub{ color:var(--muted); font-size:14px; max-width:46ch; margin:0; }
.psm-hero-num{ text-align:left; }
.psm-hero-label{ display:block; font-family:'Space Grotesk'; font-size:10px; letter-spacing:.28em; color:var(--muted); }
.psm-hero-figure{ font-family:'Fraunces'; font-weight:700; font-size:clamp(54px,9vw,92px); line-height:.9; color:var(--paper); font-variant-numeric:tabular-nums; }
.psm-hero-figure i{ font-style:normal; font-size:.4em; color:var(--amber); margin-inline-start:4px; vertical-align:super; }

/* الملخص */
.psm-summary{ position:relative; display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-top:24px; }
.psm-stat{ display:flex; align-items:center; gap:12px; padding:16px 18px; border:1px solid var(--line); border-radius:14px; background:linear-gradient(180deg,rgba(255,255,255,.03),transparent); transition:transform .3s,border-color .3s; }
.psm-stat:hover{ transform:translateY(-3px); }
.psm-stat-ico{ display:grid; place-items:center; width:34px; height:34px; border-radius:10px; }
.psm-stat-label{ display:block; font-size:11px; color:var(--muted); letter-spacing:.04em; }
.psm-stat-value{ display:block; font-family:'Fraunces'; font-weight:600; font-size:24px; font-variant-numeric:tabular-nums; }
.t-ink .psm-stat-ico{ background:rgba(233,241,245,.08); color:var(--paper);} .t-ink .psm-stat-value{color:var(--paper);}
.t-emerald .psm-stat-ico{ background:rgba(84,177,137,.14); color:var(--emerald);} .t-emerald .psm-stat-value{color:var(--emerald);}
.t-sky .psm-stat-ico{ background:rgba(98,177,207,.14); color:var(--sky);} .t-sky .psm-stat-value{color:var(--sky);}
.t-amber .psm-stat-ico{ background:rgba(227,169,72,.14); color:var(--amber);} .t-amber .psm-stat-value{color:var(--amber);}
.psm-stat.t-emerald:hover{border-color:rgba(84,177,137,.5);}
.psm-stat.t-sky:hover{border-color:rgba(98,177,207,.5);}
.psm-stat.t-amber:hover{border-color:rgba(227,169,72,.5);}

/* الشريط الزمني */
.psm-track{ position:relative; margin-top:30px; padding:34px 8px 14px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,.015); }
.psm-track-bar{ position:relative; height:6px; border-radius:99px; background:var(--line); margin:0 14px; }
.psm-track-fill{ position:absolute; inset-inline-start:0; top:0; height:100%; border-radius:99px; background:linear-gradient(90deg,var(--emerald),var(--sky)); transition:width .8s cubic-bezier(.2,.7,.2,1); }
.psm-track-fill::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent); transform:translateX(-100%); animation:psm-shim 2.6s ease-in-out infinite; }
@keyframes psm-shim{ 60%,100%{transform:translateX(260%);} }
.psm-node{ position:absolute; top:50%; transform:translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:6px; background:none; border:0; cursor:pointer; }
.psm-node-dot{ width:16px; height:16px; border-radius:50%; border:3px solid var(--ink); transition:transform .25s; }
.psm-node:hover .psm-node-dot{ transform:scale(1.35); }
.psm-node.st-pending .psm-node-dot{ background:var(--amber); }
.psm-node.st-invoiced .psm-node-dot{ background:var(--sky); }
.psm-node.st-paid .psm-node-dot{ background:var(--emerald); }
.psm-node.st-pending .psm-node-dot{ box-shadow:0 0 0 0 rgba(227,169,72,.6); animation:psm-ping 1.9s infinite; }
@keyframes psm-ping{ 70%,100%{box-shadow:0 0 0 9px rgba(227,169,72,0);} }
.psm-node-tag{ font-family:'Space Grotesk'; font-size:10px; color:var(--muted); }
.psm-track-legend{ display:flex; gap:18px; justify-content:center; margin-top:18px; }
.psm-legend{ display:inline-flex; align-items:center; gap:7px; font-size:12px; color:var(--muted); }
.psm-legend .psm-node-dot{ width:10px; height:10px; border-width:0; }
.psm-legend .st-pending{ background:var(--amber);} .psm-legend .st-invoiced{ background:var(--sky);} .psm-legend .st-paid{ background:var(--emerald);}

/* شبكة البطاقات */
.psm-grid{ position:relative; display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; margin-top:28px; }
.psm-card{ position:relative; padding:18px; border:1px solid var(--line); border-radius:16px; background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01)); border-inline-start-width:4px; transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s,border-color .35s; }
.psm-card:hover{ transform:translateY(-5px); box-shadow:0 22px 44px -26px rgba(0,0,0,.8); }
.psm-card.st-pending{ border-inline-start-color:var(--amber);} .psm-card.st-pending:hover{border-color:rgba(227,169,72,.55);}
.psm-card.st-invoiced{ border-inline-start-color:var(--sky);} .psm-card.st-invoiced:hover{border-color:rgba(98,177,207,.55);}
.psm-card.st-paid{ border-inline-start-color:var(--emerald);} .psm-card.st-paid:hover{border-color:rgba(84,177,137,.55);}
.psm-card-top{ display:flex; justify-content:space-between; align-items:center; }
.psm-card-no{ font-family:'Fraunces'; font-weight:700; font-size:30px; color:rgba(233,241,245,.22); line-height:1; }
.psm-pill{ display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:99px; font-size:11px; font-weight:600; border:1px solid transparent; cursor:pointer; transition:filter .2s; }
.psm-pill:hover{ filter:brightness(1.15); }
.psm-pill.st-pending{ background:rgba(227,169,72,.16); color:var(--amber); border-color:rgba(227,169,72,.4); }
.psm-pill.st-invoiced{ background:rgba(98,177,207,.16); color:var(--sky); border-color:rgba(98,177,207,.4); }
.psm-pill.st-paid{ background:rgba(84,177,137,.16); color:var(--emerald); border-color:rgba(84,177,137,.4); }
.psm-card-amount{ font-family:'Fraunces'; font-weight:600; font-size:30px; margin:14px 0 10px; font-variant-numeric:tabular-nums; }
.psm-card-amount i{ font-style:normal; font-size:.42em; color:var(--muted); margin-inline-start:5px; }
.psm-card-meta{ display:flex; flex-direction:column; gap:5px; font-size:12px; color:var(--muted); }
.psm-card-meta > span:first-child{ display:inline-flex; align-items:center; gap:6px; }
.psm-card-desc{ color:var(--paper); opacity:.8; }
.psm-card-foot{ display:flex; justify-content:space-between; align-items:center; margin-top:16px; padding-top:12px; border-top:1px dashed var(--line); }
.psm-card-hint{ font-size:10px; color:var(--muted); }
.psm-edit{ display:inline-flex; align-items:center; gap:3px; font-size:12px; color:var(--sky); background:none; border:0; cursor:pointer; font-family:inherit; }
.psm-edit:hover{ color:var(--paper); }

.psm-add{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; min-height:170px; border:1px dashed var(--line); border-radius:16px; color:var(--muted); background:none; cursor:pointer; font-family:inherit; font-size:14px; transition:border-color .3s,color .3s,background .3s; }
.psm-add:hover{ border-color:var(--amber); color:var(--amber); background:rgba(227,169,72,.05); }

.psm-empty{ grid-column:1/-1; display:flex; flex-direction:column; align-items:center; gap:10px; padding:48px; color:var(--muted); border:1px dashed var(--line); border-radius:16px; text-align:center; }

/* النافذة المنبثقة */
.psm-modal-mask{ position:fixed; inset:0; z-index:60; display:grid; place-items:center; padding:20px; background:rgba(6,12,18,.72); backdrop-filter:blur(3px); }
.psm-modal{ width:min(480px,100%); background:linear-gradient(180deg,#13222f,#0e1a24); border:1px solid var(--line); border-radius:18px; padding:22px; }
.psm-modal-head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.psm-modal-head h3{ font-family:'IBM Plex Sans Arabic'; font-size:20px; font-weight:700; margin:0; }
.psm-x{ background:none; border:0; color:var(--muted); cursor:pointer; }
.psm-x:hover{ color:var(--paper); }
.psm-modal-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.psm-modal label{ display:flex; flex-direction:column; gap:6px; font-size:12px; color:var(--muted); }
.psm-modal label.psm-full{ grid-column:1/-1; }
.psm-modal input,.psm-modal select{ background:rgba(255,255,255,.04); border:1px solid var(--line); border-radius:10px; padding:10px 12px; color:var(--paper); font-family:inherit; font-size:14px; outline:none; transition:border-color .2s; }
.psm-modal input:focus,.psm-modal select:focus{ border-color:var(--sky); }
.psm-modal-foot{ display:flex; justify-content:flex-end; gap:10px; margin-top:20px; }
.psm-ghost{ background:none; border:1px solid var(--line); color:var(--muted); border-radius:10px; padding:9px 16px; cursor:pointer; font-family:inherit; }
.psm-ghost:hover{ color:var(--paper); }
.psm-save{ background:var(--amber); color:#1a1206; border:0; border-radius:10px; padding:9px 20px; font-weight:700; cursor:pointer; font-family:inherit; transition:filter .2s; }
.psm-save:hover{ filter:brightness(1.08); }
.psm-save:disabled{ opacity:.5; cursor:not-allowed; }

@media (max-width:760px){
  .psm-summary{ grid-template-columns:1fr 1fr; }
  .psm-head{ align-items:flex-start; }
}
`;