import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getChangeOrders, confirmChangeOrder, rejectChangeOrder, cancelChangeOrder,
} from '../../../api/services/changeOrders';
import ChangeOrderFormModal from './ChangeOrderFormModal';
import {
  GitBranch, Plus, CheckCircle2, XCircle, Ban, Clock, Calendar, FileSignature,
  ExternalLink, AlertTriangle, RefreshCw, Hash,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   ChangeOrdersPanel — سجلّ الـ Revisions الحيّ داخل صفحة المشروع
   يعرض كل Sub‑Project بحالته، ويفتح الإنشاء، ويدير التأكيد/الرفض/الإلغاء.
   ═══════════════════════════════════════════════════════════════ */
const STATUS_TONE = {
  PENDING_CONFIRMATION: 'amber',
  CONFIRMED: 'sky',
  REJECTED: 'rose',
  CANCELLED: 'slate',
};
const STATUS_AR = {
  PENDING_CONFIRMATION: 'بانتظار التأكيد',
  CONFIRMED: 'مؤكَّد / نشط',
  REJECTED: 'مرفوض',
  CANCELLED: 'ملغي',
};
const revNum = (s) => { const m = /(\d+)/.exec(s || ''); return m ? parseInt(m[1], 10) : 0; };

export default function ChangeOrdersPanel({ parentId, parent, canManage, canConfirm, onReload }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionKey, setActionKey] = useState(null); // `${type}-${id}`

  const load = useCallback(() => {
    setLoading(true);
    getChangeOrders(parentId)
      .then((r) => setOrders(r.data?.results || r.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [parentId]);

  useEffect(() => { load(); }, [load]);

  const nextRevision = useMemo(() => {
    const max = orders.reduce((m, o) => Math.max(m, revNum(o.revision_number)), 0);
    return `Rev${max + 1}`;
  }, [orders]);

  const counts = useMemo(() => ({
    total: orders.length,
    confirmed: orders.filter((o) => o.change_order_status === 'CONFIRMED').length,
    pending: orders.filter((o) => o.change_order_status === 'PENDING_CONFIRMATION').length,
  }), [orders]);

  const run = async (type, id, payload) => {
    setActionKey(`${type}-${id}`);
    try {
      if (type === 'confirm') await confirmChangeOrder(id);
      else if (type === 'reject') { await rejectChangeOrder(id, payload); setRejectFor(null); setRejectReason(''); }
      else if (type === 'cancel') await cancelChangeOrder(id);
      load(); onReload?.();
    } catch (e) { alert(e.response?.data?.detail || 'تعذّر تنفيذ الإجراء.'); }
    finally { setActionKey(null); }
  };

  const askCancel = (o) => {
    if (window.confirm(`إلغاء المراجعة ${o.revision_number}؟ لا يمكن التراجع.`)) run('cancel', o.id);
  };

  if (loading) return <div className="cop-load"><RefreshCw className="cop-spin" size={18} /> جارٍ تحميل سجلّ المراجعات…</div>;

  return (
    <div className="cop" dir="rtl">
      <style>{CSS}</style>

      {/* رأس اللوحة + إشارات حيّة */}
      <div className="cop-head">
        <div className="cop-signals">
          <Signal n={counts.total} label="إجمالي" tone="slate" />
          <Signal n={counts.confirmed} label="مؤكَّدة" tone="sky" />
          <Signal n={counts.pending} label="بانتظار التأكيد" tone="amber" pulse={counts.pending > 0} />
        </div>
        {canManage && (
          <button className="cop-add" onClick={() => setFormOpen(true)}>
            <span className="cop-add-shine" aria-hidden /><Plus size={16} /> إضافة مراجعة / Revision
          </button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="cop-empty">
          <GitBranch size={30} />
          <p>لا أوامر تغيير بعد.</p>
          <span>{canManage ? 'أضف أول مراجعة عند ورود تعديل على المشروع الأصلي.' : 'تظهر هنا المراجعات إن وُجدت.'}</span>
        </div>
      ) : (
        <ol className="cop-list">
          {orders.map((o, i) => {
            const tone = STATUS_TONE[o.change_order_status] || 'slate';
            const pct = Number(o.progress_percentage) || 0;
            const pendingConfirm = o.change_order_status === 'PENDING_CONFIRMATION';
            return (
              <li key={o.id} className={`cop-card t-${tone}`} style={{ '--i': i }}>
                <span className="cop-edge" aria-hidden />
                <span className="cop-watermark" aria-hidden>{o.revision_number}</span>

                <div className="cop-card-top">
                  <div className="cop-id">
                    <span className="cop-rev"><GitBranch size={13} /> {o.revision_number}</span>
                    <span className="cop-name">{o.name}</span>
                    {o.parent_project_no && (
                      <span className="cop-of">مراجعة لـ <Hash size={11} /> {o.parent_project_no}</span>
                    )}
                  </div>
                  <span className={`cop-pill t-${tone}`}>
                    {pendingConfirm && <span className="cop-pill-dot" />}
                    {STATUS_AR[o.change_order_status] || o.change_order_status}
                  </span>
                </div>

                {o.change_order_reason && (
                  <p className="cop-reason">{o.change_order_reason}</p>
                )}

                <div className="cop-meta">
                  {o.revision_start_date && <span><Calendar size={12} /> بدء: {o.revision_start_date}</span>}
                  {o.new_application_no && <span><FileSignature size={12} /> طلب: {o.new_application_no}</span>}
                </div>

                <div className="cop-prog">
                  <div className="cop-prog-bar"><span style={{ width: `${pct}%` }} /></div>
                  <span className="cop-prog-pct">{pct}%</span>
                </div>

                <div className="cop-foot">
                  <Link to={`/projects/${o.id}`} className="cop-open">فتح المراجعة <ExternalLink size={12} /></Link>
                  <div className="cop-acts">
                    {canConfirm && pendingConfirm && (
                      <>
                        <button className="cop-act ok" disabled={actionKey === `confirm-${o.id}`}
                          onClick={() => run('confirm', o.id)}>
                          {actionKey === `confirm-${o.id}` ? '…' : <><CheckCircle2 size={13} /> تأكيد</>}
                        </button>
                        <button className="cop-act no" onClick={() => { setRejectFor(o); setRejectReason(''); }}>
                          <XCircle size={13} /> رفض
                        </button>
                      </>
                    )}
                    {canManage && (o.change_order_status === 'CONFIRMED' || pendingConfirm) && (
                      <button className="cop-act mute" disabled={actionKey === `cancel-${o.id}`} onClick={() => askCancel(o)}>
                        {actionKey === `cancel-${o.id}` ? '…' : <><Ban size={13} /> إلغاء</>}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {formOpen && (
        <ChangeOrderFormModal
          parent={parent}
          nextRevision={nextRevision}
          onClose={() => setFormOpen(false)}
          onDone={() => { setFormOpen(false); load(); onReload?.(); }}
        />
      )}

      {rejectFor && (
        <div className="cop-mask" onClick={() => setRejectFor(null)}>
          <div className="cop-reject" onClick={(e) => e.stopPropagation()}>
            <h4><XCircle size={16} /> رفض {rejectFor.revision_number}</h4>
            <p>لن تُنشأ مهام تنفيذية لهذه المراجعة. اذكر السبب للتتبع.</p>
            <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="سبب الرفض *" />
            <div className="cop-reject-foot">
              <button className="cop-ghost" onClick={() => setRejectFor(null)}>إلغاء</button>
              <button className="cop-act no" disabled={!rejectReason.trim() || actionKey}
                onClick={() => run('reject', rejectFor.id, rejectReason.trim())}>
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Signal({ n, label, tone, pulse }) {
  return (
    <div className={`cop-sig t-${tone} ${pulse ? 'pulse' : ''}`}>
      <span className="cop-sig-n">{n}</span>
      <span className="cop-sig-l">{label}</span>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.cop{ --line:#26323f; --paper:#e9eff5; --mut:#8694a4; --amber:#e6ab4c; --emerald:#3fb286;
  --sky:#5cc6ef; --rose:#e3707e; --violet:#a18cf2; --slate:#5d6b7a;
  font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif; color:var(--paper); }
.cop-load{ display:flex; align-items:center; gap:9px; color:var(--mut); padding:14px 2px; font-size:13px; }
.cop-spin{ animation:cop-spin .8s linear infinite; } @keyframes cop-spin{ to{ transform:rotate(360deg) } }

.cop-head{ display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:16px; }
.cop-signals{ display:flex; gap:9px; flex-wrap:wrap; }
.cop-sig{ display:flex; align-items:baseline; gap:7px; padding:7px 13px; border-radius:11px; border:1px solid var(--line); background:rgba(255,255,255,.02); transition:transform .25s, border-color .25s; }
.cop-sig:hover{ transform:translateY(-2px); }
.cop-sig-n{ font-family:'Space Grotesk'; font-size:19px; font-weight:700; line-height:1; }
.cop-sig-l{ font-size:10.5px; color:var(--mut); }
.cop-sig.t-sky .cop-sig-n{ color:var(--sky); } .cop-sig.t-amber .cop-sig-n{ color:var(--amber); } .cop-sig.t-slate .cop-sig-n{ color:#cdd6dd; }
.cop-sig.t-amber{ border-color:rgba(230,171,76,.35); } .cop-sig.t-sky{ border-color:rgba(92,198,239,.35); }
.cop-sig.pulse{ animation:cop-pulse 2.2s ease-in-out infinite; }
@keyframes cop-pulse{ 0%,100%{box-shadow:0 0 0 0 rgba(230,171,76,0)} 50%{box-shadow:0 0 0 4px rgba(230,171,76,.14)} }
.cop-add{ position:relative; overflow:hidden; display:inline-flex; align-items:center; gap:8px; border:none;
  background:linear-gradient(120deg,#bca6f7,#8b6fe6); color:#10081f; border-radius:11px; padding:10px 18px;
  font-family:inherit; font-weight:700; font-size:13px; cursor:pointer; transition:.2s; box-shadow:0 12px 26px -14px rgba(139,111,230,.8); }
.cop-add:hover{ transform:translateY(-2px); filter:brightness(1.06); }
.cop-add-shine{ position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-130%); }
.cop-add:hover .cop-add-shine{ animation:cop-shine .8s ease; }
@keyframes cop-shine{ to{ transform:translateX(130%) } }

.cop-empty{ display:flex; flex-direction:column; align-items:center; gap:9px; padding:38px 16px; text-align:center;
  color:var(--mut); border:1px dashed var(--line); border-radius:14px; }
.cop-empty p{ font-size:14px; font-weight:600; color:var(--paper); margin:2px 0 0; }
.cop-empty span{ font-size:12px; max-width:42ch; line-height:1.7; }

.cop-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:13px; }
.cop-card{ position:relative; overflow:hidden; padding:16px 18px; border:1px solid var(--line); border-radius:15px;
  border-inline-start:4px solid var(--slate); background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.005));
  opacity:0; transform:translateY(12px); animation:cop-rise .5s cubic-bezier(.2,.7,.2,1) forwards; animation-delay:calc(var(--i) * 70ms);
  transition:transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s, border-color .3s; }
@keyframes cop-rise{ to{ opacity:1; transform:none } }
.cop-card:hover{ transform:translateY(-4px); box-shadow:0 22px 44px -26px rgba(0,0,0,.8); }
.cop-card.t-amber{ border-inline-start-color:var(--amber); } .cop-card.t-sky{ border-inline-start-color:var(--sky); }
.cop-card.t-rose{ border-inline-start-color:var(--rose); } .cop-card.t-slate{ border-inline-start-color:var(--slate); }
.cop-edge{ position:absolute; top:0; inset-inline-start:0; inset-inline-end:0; height:2px; }
.cop-card.t-amber .cop-edge{ background:linear-gradient(90deg,var(--amber),transparent); }
.cop-card.t-sky .cop-edge{ background:linear-gradient(90deg,var(--sky),transparent); }
.cop-card.t-rose .cop-edge{ background:linear-gradient(90deg,var(--rose),transparent); }
.cop-watermark{ position:absolute; top:4px; inset-inline-end:14px; font-family:'Space Grotesk'; font-weight:700;
  font-size:46px; line-height:1; color:rgba(255,255,255,.04); pointer-events:none; }

.cop-card-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
.cop-id{ display:flex; flex-direction:column; gap:3px; min-width:0; }
.cop-rev{ display:inline-flex; align-items:center; gap:6px; font-family:'JetBrains Mono'; font-size:12px; font-weight:700; color:var(--violet); }
.cop-name{ font-size:14.5px; font-weight:600; }
.cop-of{ display:inline-flex; align-items:center; gap:4px; font-size:10.5px; color:var(--mut); }
.cop-pill{ display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; padding:5px 12px; border-radius:99px; white-space:nowrap; flex:none; }
.cop-pill.t-amber{ background:rgba(230,171,76,.16); color:var(--amber); } .cop-pill.t-sky{ background:rgba(92,198,239,.16); color:var(--sky); }
.cop-pill.t-rose{ background:rgba(227,112,126,.16); color:var(--rose); } .cop-pill.t-slate{ background:rgba(93,107,122,.2); color:#aeb9c5; }
.cop-pill-dot{ width:7px; height:7px; border-radius:50%; background:var(--amber); position:relative; }
.cop-pill-dot::after{ content:""; position:absolute; inset:-3px; border-radius:50%; background:var(--amber); opacity:.5; animation:cop-ping 1.6s infinite; }
@keyframes cop-ping{ 70%,100%{ transform:scale(2.4); opacity:0 } }

.cop-reason{ margin:11px 0 0; padding:9px 12px; font-size:12.5px; line-height:1.6; color:var(--paper);
  background:rgba(255,255,255,.03); border-inline-start:3px solid var(--violet); border-radius:0 9px 9px 0; }
.cop-meta{ display:flex; flex-wrap:wrap; gap:14px; margin-top:11px; font-size:11px; color:var(--mut); }
.cop-meta span{ display:inline-flex; align-items:center; gap:5px; }

.cop-prog{ display:flex; align-items:center; gap:10px; margin-top:12px; }
.cop-prog-bar{ flex:1; height:6px; border-radius:99px; background:rgba(255,255,255,.08); overflow:hidden; }
.cop-prog-bar span{ display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,var(--sky),var(--emerald)); position:relative; transition:width .8s ease; }
.cop-prog-bar span::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-100%); animation:cop-shim 2.6s ease-in-out infinite; }
@keyframes cop-shim{ 60%,100%{ transform:translateX(240%) } }
.cop-prog-pct{ font-family:'JetBrains Mono'; font-size:11px; color:var(--mut); min-width:34px; text-align:end; }

.cop-foot{ display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:13px; padding-top:12px; border-top:1px dashed var(--line); flex-wrap:wrap; }
.cop-open{ display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:var(--sky); text-decoration:none; transition:.2s; }
.cop-open:hover{ color:var(--paper); gap:8px; }
.cop-acts{ display:flex; gap:7px; flex-wrap:wrap; }
.cop-act{ display:inline-flex; align-items:center; gap:5px; font-family:inherit; font-size:11px; font-weight:700;
  padding:6px 12px; border-radius:9px; border:1px solid transparent; cursor:pointer; transition:.2s; }
.cop-act:disabled{ opacity:.5; cursor:not-allowed; }
.cop-act.ok{ color:var(--emerald); background:rgba(63,178,134,.12); border-color:rgba(63,178,134,.4); }
.cop-act.ok:hover:not(:disabled){ background:rgba(63,178,134,.22); transform:translateY(-1px); }
.cop-act.no{ color:var(--rose); background:rgba(227,112,126,.12); border-color:rgba(227,112,126,.4); }
.cop-act.no:hover:not(:disabled){ background:rgba(227,112,126,.22); transform:translateY(-1px); }
.cop-act.mute{ color:var(--mut); background:rgba(255,255,255,.04); border-color:var(--line); }
.cop-act.mute:hover:not(:disabled){ color:var(--paper); border-color:#33414f; }

/* نافذة الرفض */
.cop-mask{ position:fixed; inset:0; z-index:75; display:grid; place-items:center; padding:18px; background:rgba(6,10,15,.78); backdrop-filter:blur(4px); }
.cop-reject{ width:min(420px,100%); background:linear-gradient(180deg,#16202c,#0e1822); border:1px solid var(--line); border-radius:16px; padding:20px; animation:cop-pop .25s cubic-bezier(.2,.85,.25,1); }
@keyframes cop-pop{ from{opacity:0; transform:translateY(12px) scale(.97)} to{opacity:1; transform:none} }
.cop-reject h4{ display:flex; align-items:center; gap:8px; margin:0 0 8px; font-size:16px; color:var(--rose); }
.cop-reject p{ margin:0 0 12px; font-size:12.5px; color:var(--mut); line-height:1.6; }
.cop-reject textarea{ width:100%; background:#0b1016; border:1px solid var(--line); border-radius:10px; padding:10px 12px; color:var(--paper); font-family:inherit; font-size:13px; outline:none; resize:vertical; }
.cop-reject textarea:focus{ border-color:var(--rose); }
.cop-reject-foot{ display:flex; justify-content:flex-end; gap:9px; margin-top:14px; }
.cop-ghost{ border:1px solid var(--line); background:transparent; color:var(--mut); border-radius:9px; padding:9px 16px; font-family:inherit; font-weight:600; cursor:pointer; }
.cop-ghost:hover{ color:var(--paper); }
`;