import { useState } from 'react';
import { createChangeOrder } from '../../../api/services/changeOrders';
import { X, GitBranch, Hash, FileSignature, Calendar, PenLine, AlertTriangle, Check, Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   ChangeOrderFormModal — نموذج إنشاء Revision / Sub‑Project
   مملوء مسبقاً من الأب؛ السكرتيرة/المدير يعدّلان الحقول المتغيّرة فقط.
   ═══════════════════════════════════════════════════════════════ */
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ChangeOrderFormModal({ parent, nextRevision, onClose, onDone }) {
  const [f, setF] = useState({
    revision_number: nextRevision,
    new_application_no: '',
    revision_start_date: todayISO(),
    change_order_reason: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!f.revision_number.trim()) return setErr('رقم المراجعة مطلوب.');
    if (!f.change_order_reason.trim()) return setErr('سبب أمر التغيير مطلوب للتتبع.');
    setBusy(true);
    try {
      await createChangeOrder(parent.id, {
        revision_number: f.revision_number.trim(),
        new_application_no: f.new_application_no.trim() || null,
        revision_start_date: f.revision_start_date || null,
        change_order_reason: f.change_order_reason.trim(),
      });
      onDone?.();
    } catch (ex) {
      const d = ex.response?.data;
      setErr(d?.revision_number?.[0] || d?.detail || 'تعذّر إنشاء المراجعة.');
    } finally { setBusy(false); }
  };

  return (
    <div className="cof-mask" onClick={onClose}>
      <style>{CSS}</style>
      <form className="cof" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="cof-ambient" aria-hidden />

        <header className="cof-head">
          <span className="cof-orb"><GitBranch size={20} /></span>
          <div className="cof-head-txt">
            <span className="cof-kicker">CHANGE ORDER · أمر تغيير / مراجعة</span>
            <h3 className="cof-title">مراجعة جديدة للمشروع</h3>
          </div>
          <button type="button" className="cof-x" onClick={onClose}><X size={18} /></button>
        </header>

        {/* سياق الأب — قراءة فقط */}
        <div className="cof-parent">
          <span className="cof-parent-l">مراجعة لـ</span>
          <span className="cof-parent-v"><Hash size={12} /> {parent.project_no} · {parent.name}</span>
          {parent.client_name && <span className="cof-parent-c">{parent.client_name}</span>}
        </div>

        <div className="cof-grid">
          <label className="cof-field">
            <span><GitBranch size={12} /> رقم المراجعة *</span>
            <input value={f.revision_number} onChange={set('revision_number')} placeholder="Rev1" required />
            <em className="cof-hint">مقترح تلقائياً؛ عدّله إن لزم.</em>
          </label>

          <label className="cof-field">
            <span><FileSignature size={12} /> رقم طلب جديد</span>
            <input value={f.new_application_no} onChange={set('new_application_no')} placeholder="إن أُصدر" />
          </label>

          <label className="cof-field cof-full">
            <span><Calendar size={12} /> تاريخ بدء المراجعة</span>
            <input type="date" value={f.revision_start_date} onChange={set('revision_start_date')} />
          </label>

          <label className="cof-field cof-full">
            <span><PenLine size={12} /> سبب أمر التغيير / الوصف *</span>
            <textarea rows={3} value={f.change_order_reason} onChange={set('change_order_reason')}
              placeholder="ما الذي تغيّر عن المشروع الأصلي؟" required />
          </label>
        </div>

        {err && <div className="cof-err"><AlertTriangle size={14} /> {err}</div>}

        <div className="cof-foot">
          <button type="button" className="cof-ghost" onClick={onClose}>إلغاء</button>
          <button type="submit" className="cof-save" disabled={busy}>
            <span className="cof-shine" aria-hidden />
            {busy ? 'جارٍ الإنشاء…' : <><Check size={15} /> إنشاء المراجعة</>}
          </button>
        </div>
      </form>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.cof-mask{ position:fixed; inset:0; z-index:70; display:grid; place-items:center; padding:18px;
  background:rgba(6,10,15,.78); backdrop-filter:blur(4px); animation:cof-fade .2s ease; }
@keyframes cof-fade{ from{opacity:0} to{opacity:1} }
.cof{ position:relative; width:min(540px,100%); max-height:92vh; overflow:auto; color:#e9eff5;
  font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
  background:linear-gradient(180deg,#16202c,#0e1822); border:1px solid #26323f; border-radius:20px;
  padding:24px; box-shadow:0 40px 90px -30px rgba(0,0,0,.85);
  animation:cof-pop .3s cubic-bezier(.2,.85,.25,1); }
@keyframes cof-pop{ from{opacity:0; transform:translateY(14px) scale(.97)} to{opacity:1; transform:none} }
.cof-ambient{ position:absolute; inset:0; pointer-events:none; border-radius:20px;
  background:radial-gradient(70% 60% at 100% 0%, rgba(161,140,242,.14), transparent 60%),
    radial-gradient(60% 50% at 0% 100%, rgba(92,198,239,.08), transparent 60%),
    linear-gradient(rgba(161,140,242,.04) 1px,transparent 1px), linear-gradient(90deg,rgba(161,140,242,.04) 1px,transparent 1px);
  background-size:auto,auto,34px 34px,34px 34px; }
.cof > *:not(.cof-ambient){ position:relative; }
.cof-head{ display:flex; align-items:center; gap:13px; margin-bottom:18px; }
.cof-orb{ flex:none; width:46px; height:46px; border-radius:13px; display:grid; place-items:center;
  background:linear-gradient(145deg, rgba(161,140,242,.24), rgba(161,140,242,.08)); color:#a18cf2;
  border:1px solid rgba(161,140,242,.4); animation:cof-pulse 2.6s ease-in-out infinite; }
@keyframes cof-pulse{ 0%,100%{box-shadow:0 0 0 0 rgba(161,140,242,.35)} 50%{box-shadow:0 0 0 8px rgba(161,140,242,0)} }
.cof-kicker{ font-family:'Space Grotesk'; font-size:10px; letter-spacing:.26em; color:#a18cf2; }
.cof-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:19px; font-weight:700; margin:3px 0 0; }
.cof-x{ margin-inline-start:auto; width:34px; height:34px; border-radius:9px; display:grid; place-items:center;
  background:rgba(255,255,255,.04); border:1px solid #26323f; color:#8694a4; cursor:pointer; transition:.2s; }
.cof-x:hover{ color:#fff; background:rgba(227,112,126,.15); border-color:rgba(227,112,126,.4); transform:rotate(90deg); }
.cof-parent{ display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:11px 14px; margin-bottom:18px;
  border:1px dashed #26323f; border-radius:12px; background:rgba(255,255,255,.02); }
.cof-parent-l{ font-size:11px; color:#8694a4; }
.cof-parent-v{ display:inline-flex; align-items:center; gap:5px; font-family:'JetBrains Mono'; font-size:12px; font-weight:600; color:#e6ab4c; }
.cof-parent-c{ font-size:11px; color:#8694a4; background:rgba(255,255,255,.05); padding:2px 9px; border-radius:99px; }
.cof-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.cof-field{ display:flex; flex-direction:column; gap:6px; }
.cof-field.cof-full{ grid-column:1/-1; }
.cof-field > span{ display:flex; align-items:center; gap:6px; font-size:11px; letter-spacing:.03em; color:#8694a4; }
.cof-field input,.cof-field textarea{ background:#0b1016; border:1px solid #26323f; border-radius:10px;
  padding:10px 12px; color:#e9eff5; font-family:inherit; font-size:13.5px; outline:none; transition:.2s; resize:vertical; }
.cof-field input:focus,.cof-field textarea:focus{ border-color:#a18cf2; box-shadow:0 0 0 3px rgba(161,140,242,.12); }
.cof-hint{ font-size:10px; color:#5d6b7a; }
.cof-err{ display:flex; align-items:center; gap:8px; margin-top:14px; color:#e3707e;
  background:rgba(227,112,126,.1); border:1px solid rgba(227,112,126,.35); border-radius:10px; padding:10px 13px; font-size:12.5px; }
.cof-foot{ display:flex; justify-content:flex-end; gap:11px; margin-top:20px; }
.cof-ghost{ border:1px solid #26323f; background:transparent; color:#8694a4; border-radius:11px;
  padding:11px 20px; font-family:inherit; font-weight:600; cursor:pointer; transition:.2s; }
.cof-ghost:hover{ color:#e9eff5; border-color:#33414f; }
.cof-save{ position:relative; overflow:hidden; display:inline-flex; align-items:center; gap:8px; border:none;
  background:linear-gradient(120deg,#bca6f7,#8b6fe6); color:#10081f; border-radius:11px; padding:11px 24px;
  font-family:inherit; font-weight:700; font-size:14px; cursor:pointer; transition:.2s; }
.cof-save:hover:not(:disabled){ filter:brightness(1.07); transform:translateY(-1px); }
.cof-save:disabled{ opacity:.5; cursor:not-allowed; }
.cof-shine{ position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent); transform:translateX(-130%); }
.cof-save:hover:not(:disabled) .cof-shine{ animation:cof-shine .8s ease; }
@keyframes cof-shine{ to{ transform:translateX(130%) } }
@media (max-width:520px){ .cof-grid{ grid-template-columns:1fr; } }
`;