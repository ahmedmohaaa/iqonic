// src/pages/Reports/ExportConsole.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/axios';
import { useExport, EXPORT_STATUS } from '../../lib/useExport';
import {
  Printer, FileText, FileSpreadsheet, FileJson, Braces, Check, Loader2,
  Columns3, Calendar, Database, Eye, Hash,
} from 'lucide-react';

const colId = (c) => c.id || c.key || c.label;

const SOURCES = {
  projects: {
    label: 'تقرير المشاريع', endpoint: 'reports/projects', rowsKey: 'projects',
    Icon: Database,
    columns: [
      { key: 'project_no', label: 'رقم المشروع', width: 14 },
      { key: 'name', label: 'اسم المشروع', width: 32 },
      { key: 'client_name', label: 'العميل', width: 22 },
      { key: 'scope', label: 'النطاق', width: 12 },
      { id: 'active', label: 'نشط', width: 8, get: (r) => r.is_active },
      { key: 'priority', label: 'الأولوية', width: 10 },
      { key: 'start_date', label: 'تاريخ البدء', width: 13 },
    ],
  },
  tasks: {
    label: 'تقرير المهام', endpoint: 'reports/tasks', rowsKey: 'tasks',
    Icon: Columns3,
    columns: [
      { key: 'title', label: 'المهمة', width: 30, get: (r) => r.title || r.discipline_name || '—' },
      { id: 'project', label: 'المشروع', width: 16, get: (r) => r.project_name || r.project || '' },
      { id: 'owner', label: 'المسند إليه', width: 18, get: (r) => r.assigned_to_name || 'غير مسند' },
      { key: 'status', label: 'الحالة', width: 12 },
      { key: 'priority', label: 'الأولوية', width: 10 },
      { id: 'prog', label: 'التقدّم %', width: 9, get: (r) => r.progress_percentage ?? 0 },
    ],
  },
  employees: {
    label: 'تقرير الموظفين', endpoint: 'reports/employees', self: true,
    Icon: Hash,
    columns: [
      { id: 'name', label: 'الاسم', width: 24, get: (r) => `${r.user?.first_name || ''} ${r.user?.last_name || ''}`.trim() },
      { id: 'role', label: 'الدور', width: 16, get: (r) => r.user?.role || '' },
      { key: 'total_tasks', label: 'إجمالي المهام', width: 12 },
      { key: 'completed_tasks', label: 'المكتملة', width: 10 },
      { id: 'rate', label: 'نسبة الإنجاز %', width: 13, get: (r) => r.completion_rate ?? 0 },
    ],
  },
  financial: {
    label: 'التقرير المالي', endpoint: 'reports/financial', rowsKey: 'invoices',
    Icon: FileText,
    columns: [
      { key: 'title', label: 'الفاتورة', width: 26 },
      { key: 'milestone_type', label: 'المرحلة', width: 16 },
      { id: 'amount', label: 'المبلغ', width: 12, get: (r) => r.total_amount ?? 0 },
      { key: 'status', label: 'الحالة', width: 12 },
      { key: 'due_date', label: 'الاستحقاق', width: 13 },
    ],
  },
};

const FORMATS = [
  { id: 'pdf',  label: 'PDF',   ext: 'pdf',  Icon: Printer,         tone: 'rose',    desc: 'مستند للطباعة والأرشفة' },
  { id: 'xlsx', label: 'Excel', ext: 'xlsx', Icon: FileSpreadsheet, tone: 'emerald', desc: 'جدول قابل للتحليل' },
  { id: 'csv',  label: 'CSV',   ext: 'csv',  Icon: FileJson,        tone: 'sky',     desc: 'نصّ مفصول بفواصل' },
  { id: 'json', label: 'JSON',  ext: 'json', Icon: Braces,          tone: 'amber',   desc: 'بيانات خام للتكامل' },
];

const STATUS_LABEL = {
  [EXPORT_STATUS.PREPARING]: 'تجهيز البيانات…',
  [EXPORT_STATUS.RENDERING]: 'بناء الملف…',
  [EXPORT_STATUS.DONE]: 'تم التصدير بنجاح',
  [EXPORT_STATUS.ERROR]: 'تعذّر التصدير',
};

export default function ExportConsole() {
  const { user } = useAuthSafe();
  const { status, progress, lastFormat, exportCSV, exportJSON, exportXLSX, exportPDF } = useExport();

  const [source, setSource] = useState('projects');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null); // null = كل الأعمدة

  const cfg = SOURCES[source];
  const columns = cfg.columns;
  const activeCols = useMemo(
    () => (picked ? columns.filter((c) => picked.includes(colId(c))) : columns),
    [columns, picked]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const { data } = await apiClient.get(cfg.endpoint, { params });
      const list = cfg.self ? (Array.isArray(data) ? data : []) : data?.[cfg.rowsKey] || [];
      setRows(list);
      setPicked(null);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [cfg, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const toggleCol = (id) =>
    setPicked((prev) => {
      const base = prev || columns.map(colId);
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      return next.length === columns.length ? null : next;
    });

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${source}_${stamp}`;
  const preview = rows.slice(0, 6);
  const busy = status === EXPORT_STATUS.PREPARING || status === EXPORT_STATUS.RENDERING;
  const estKB = Math.max(1, Math.round(JSON.stringify(rows).length / 1024));

  const fire = (id) => {
    if (id === 'pdf') exportPDF(rows, activeCols, filename, cfg.label);
    else if (id === 'xlsx') exportXLSX(rows, activeCols, filename);
    else if (id === 'csv') exportCSV(rows, activeCols, filename);
    else exportJSON(rows, filename);
  };

  return (
    <div className="xc-root">
      <style>{CSS}</style>
      <div className="xc-ambient" aria-hidden />

      {/* الرأس — طابع «ورشة طباعة» لا hero عام */}
      <header className="xc-head">
        <div className="xc-head-mark" aria-hidden>
          <span className="xc-press-dot" />
          <span className="xc-press-dot" />
          <span className="xc-press-dot" />
        </div>
        <div className="xc-head-text">
          <span className="xc-kicker">EXPORT PRESS · ورشة التصدير</span>
          <h1 className="xc-title">صدّر بياناتك كما تشاء</h1>
          <p className="xc-sub">اختر المصدر، انتقِ الأعمدة، ثم اطبع الصيغة التي تحتاجها — PDF أو Excel أو CSV أو JSON.</p>
        </div>
        <div className="xc-head-stat">
          <span className="xc-stat-num">{rows.length}</span>
          <span className="xc-stat-lbl">صف جاهز</span>
        </div>
      </header>

      {/* شريط الحالة الحيّ */}
      {status !== EXPORT_STATUS.IDLE && (
        <div className={`xc-status xc-status--${status}`}>
          <span className="xc-status-ico">
            {busy ? <Loader2 size={15} className="xc-spin" /> : status === EXPORT_STATUS.DONE ? <Check size={15} /> : null}
          </span>
          <span className="xc-status-txt">{STATUS_LABEL[status]}</span>
          <div className="xc-status-bar"><span style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      <div className="xc-grid">
        {/* العمود الأيسر: الضوابط */}
        <aside className="xc-panel xc-reveal">
          {/* اختيار المصدر */}
          <div className="xc-block">
            <span className="xc-block-h">المصدر</span>
            <div className="xc-src-list">
              {Object.entries(SOURCES).map(([id, s]) => (
                <button key={id} className={`xc-src ${source === id ? 'on' : ''}`} onClick={() => setSource(id)}>
                  <s.Icon size={16} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* النطاق الزمني */}
          <div className="xc-block">
            <span className="xc-block-h"><Calendar size={13} /> النطاق الزمني</span>
            <div className="xc-dates">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <span className="xc-dash">→</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <button className="xc-apply" onClick={load} disabled={loading}>
              {loading ? 'جارٍ الجلب…' : 'تطبيق وجلب'}
            </button>
          </div>

          {/* اختيار الأعمدة */}
          <div className="xc-block">
            <span className="xc-block-h"><Columns3 size={13} /> الأعمدة ({activeCols.length}/{columns.length})</span>
            <div className="xc-cols">
              {columns.map((c) => {
                const id = colId(c);
                const on = !picked || picked.includes(id);
                return (
                  <button key={id} className={`xc-col ${on ? 'on' : ''}`} onClick={() => toggleCol(id)}>
                    <span className="xc-col-box">{on ? '✓' : ''}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* حجم تقديري */}
          <div className="xc-est">
            <span>الحجم التقديري</span>
            <b>≈ {estKB} KB</b>
          </div>
        </aside>

        {/* العمود الأيمن: المعاينة + التصدير */}
        <section className="xc-main xc-reveal xc-reveal--2">
          {/* بطاقات الصيغ */}
          <div className="xc-formats">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                className={`xc-fmt xc-fmt--${f.tone} ${lastFormat === f.id && status === EXPORT_STATUS.DONE ? 'is-done' : ''}`}
                onClick={() => fire(f.id)}
                disabled={busy || rows.length === 0}
              >
                <span className="xc-fmt-ico"><f.Icon size={20} /></span>
                <span className="xc-fmt-body">
                  <span className="xc-fmt-top">
                    <span className="xc-fmt-label">{f.label}</span>
                    <span className="xc-fmt-ext">.{f.ext}</span>
                  </span>
                  <span className="xc-fmt-desc">{f.desc}</span>
                </span>
                {lastFormat === f.id && status === EXPORT_STATUS.DONE && <Check size={16} className="xc-fmt-check" />}
              </button>
            ))}
          </div>

          {/* المعاينة الحيّة */}
          <div className="xc-preview">
            <div className="xc-preview-h">
              <span><Eye size={14} /> معاينة حيّة</span>
              <span className="xc-preview-meta">{preview.length} من {rows.length} صف</span>
            </div>
            {loading ? (
              <div className="xc-empty"><Loader2 size={20} className="xc-spin" /> جارٍ تحميل البيانات…</div>
            ) : rows.length === 0 ? (
              <div className="xc-empty">لا بيانات في هذا النطاق.</div>
            ) : (
              <div className="xc-table-wrap">
                <table className="xc-table">
                  <thead>
                    <tr>{activeCols.map((c) => <th key={colId(c)}>{c.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.map((r, ri) => (
                      <tr key={ri}>
                        {activeCols.map((c) => <td key={colId(c)}>{colValue(c, r)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// قراءة آمنة للسياق (إن وُجد) دون كسر إن لم يُستورد
function useAuthSafe() {
  try {
    // eslint-disable-next-line global-require
    const { useAuth } = require('../../context/AuthContext');
    return useAuth();
  } catch {
    return { user: null };
  }
}

function colValue(c, r) {
  let v = c.get ? c.get(r) : c.key != null ? r[c.key] : '';
  if (v === null || v === undefined) v = '';
  if (typeof v === 'boolean') v = v ? 'نعم' : 'لا';
  return String(v);
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
.xc-root{ 
  --ink:#ffffff; --surface:#ffffff; --line:#e2e8f0; --paper:#0f172a; --muted:#64748b;
  --rose:#dc2626; --emerald:#059669; --sky:#0284c7; --amber:#d97706;
  position:relative; min-height:100vh; padding:30px clamp(16px,4vw,46px) 64px; color:var(--paper);
  font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
  background:linear-gradient(180deg,#f8fafc,#f1f5f9); 
}
.xc-ambient{ position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(58% 46% at 90% -8%, rgba(217,119,6,.06), transparent 60%),
    radial-gradient(50% 44% at -6% 108%, rgba(2,132,199,.06), transparent 60%),
    linear-gradient(rgba(2,132,199,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(2,132,199,.03) 1px, transparent 1px);
  background-size:auto,auto,42px 42px,42px 42px;
  -webkit-mask-image:radial-gradient(125% 100% at 50% 0%,#000,transparent 86%);
          mask-image:radial-gradient(125% 100% at 50% 0%,#000,transparent 86%); }
.xc-root > *{ position:relative; }

.xc-head{ display:flex; align-items:flex-end; gap:20px; padding-bottom:22px; border-bottom:1px solid var(--line); }
.xc-head-mark{ display:flex; gap:7px; align-self:flex-start; padding-top:6px; }
.xc-press-dot{ width:11px; height:11px; border-radius:50%; background:#cbd5e1; box-shadow:inset 0 0 0 2px #94a3b8; animation:xc-press 2.4s ease-in-out infinite; }
.xc-press-dot:nth-child(2){ animation-delay:.3s; } .xc-press-dot:nth-child(3){ animation-delay:.6s; }
@keyframes xc-press{ 0%,100%{ background:#cbd5e1; } 50%{ background:var(--amber); box-shadow:0 0 12px rgba(217,119,6,.4); } }
.xc-head-text{ flex:1; }
.xc-kicker{ font-family:'Space Grotesk'; font-size:11px; letter-spacing:.3em; color:var(--amber); }
.xc-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(28px,5vw,46px); font-weight:700; line-height:1.02; margin:6px 0 6px; letter-spacing:-.02em; }
.xc-sub{ color:var(--muted); font-size:14px; max-width:54ch; margin:0; }
.xc-head-stat{ text-align:end; }
.xc-stat-num{ display:block; font-family:'JetBrains Mono'; font-size:34px; font-weight:700; line-height:.9; color:var(--emerald); }
.xc-stat-lbl{ font-size:11px; color:var(--muted); }

.xc-status{ display:flex; align-items:center; gap:10px; margin-top:16px; padding:11px 14px; border-radius:11px; border:1px solid var(--line); background:rgba(0,0,0,.02); box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
.xc-status--done{ border-color:rgba(5,150,105,.3); background:rgba(5,150,105,.03); } 
.xc-status--error{ border-color:rgba(220,38,38,.3); background:rgba(220,38,38,.03); }
.xc-status-ico{ display:grid; place-items:center; color:var(--amber); }
.xc-status--done .xc-status-ico{ color:var(--emerald); } .xc-status--error .xc-status-ico{ color:var(--rose); }
.xc-status-txt{ font-size:13px; font-weight:600; flex:1; }
.xc-status-bar{ width:160px; height:5px; background:rgba(0,0,0,.06); border-radius:99px; overflow:hidden; }
.xc-status-bar span{ display:block; height:100%; background:linear-gradient(90deg,var(--emerald),var(--sky)); transition:width .25s ease; }
.xc-spin{ animation:xc-spin .8s linear infinite; } @keyframes xc-spin{ to{ transform:rotate(360deg); } }

/* تعديل الجريد لمنع التمدد غير المحدود */
.xc-grid{ display:grid; grid-template-columns:300px minmax(0, 1fr); gap:18px; margin-top:20px; }
@media (max-width:880px){ .xc-grid{ grid-template-columns:1fr; } }

.xc-panel{ background:linear-gradient(180deg,rgba(0,0,0,.01),transparent),var(--surface); border:1px solid var(--line); border-radius:16px; padding:18px; box-shadow: 0 4px 6px -1px rgba(0,0,0,.02); }
.xc-reveal{ opacity:0; transform:translateY(16px); animation:xc-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
.xc-reveal--2{ animation-delay:.12s; }
@keyframes xc-rise{ to{ opacity:1; transform:none; } }
.xc-block{ margin-bottom:20px; }
.xc-block-h{ display:flex; align-items:center; gap:7px; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin-bottom:10px; }
.xc-src-list{ display:flex; flex-direction:column; gap:7px; }
.xc-src{ display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; border:1px solid var(--line); background:transparent; color:#334155; font-family:inherit; font-size:13px; cursor:pointer; transition:.2s; text-align:start; }
.xc-src:hover{ border-color:#cbd5e1; background:#f8fafc; transform:translateX(-2px); }
[dir=rtl] .xc-src:hover{ transform:translateX(2px); }
.xc-src.on{ background:rgba(2,132,199,.06); border-color:rgba(2,132,199,.3); color:var(--sky); font-weight:500; }
.xc-dates{ display:flex; align-items:center; gap:8px; }
.xc-dates input{ flex:1; background:#ffffff; border:1px solid var(--line); border-radius:9px; padding:8px 10px; color:var(--paper); font-family:inherit; font-size:12px; transition:.2s; box-shadow:inset 0 1px 2px rgba(0,0,0,.02); outline:none; }
.xc-dates input:focus{ border-color:var(--sky); box-shadow:0 0 0 2px rgba(2,132,199,.1); }
.xc-dash{ color:var(--muted); }
.xc-apply{ width:100%; margin-top:10px; padding:9px; border-radius:9px; border:1px solid var(--line); background:#ffffff; color:var(--paper); font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; transition:.2s; box-shadow:0 1px 2px rgba(0,0,0,.03); }
.xc-apply:hover{ border-color:var(--emerald); color:var(--emerald); } .xc-apply:disabled{ opacity:.6; background:#f1f5f9; }
.xc-cols{ display:flex; flex-wrap:wrap; gap:6px; }
.xc-col{ display:inline-flex; align-items:center; gap:6px; padding:6px 9px; border-radius:8px; border:1px solid var(--line); background:transparent; color:var(--muted); font-family:inherit; font-size:12px; cursor:pointer; transition:.18s; }
.xc-col.on{ color:var(--paper); border-color:#cbd5e1; background:rgba(0,0,0,.02); }
.xc-col-box{ width:15px; height:15px; border-radius:4px; border:1px solid #cbd5e1; display:grid; place-items:center; font-size:10px; color:var(--emerald); }
.xc-col.on .xc-col-box{ background:rgba(5,150,105,.12); border-color:var(--emerald); }
.xc-est{ display:flex; justify-content:space-between; align-items:center; padding-top:14px; border-top:1px dashed var(--line); font-size:12px; color:var(--muted); }
.xc-est b{ font-family:'JetBrains Mono'; color:var(--amber); }

.xc-main{ display:flex; flex-direction:column; gap:18px; min-width:0; }

/* جعل البطاقات مرنة وتلتف تلقائياً */
.xc-formats{ display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:12px; }

.xc-fmt{ display:flex; align-items:center; gap:12px; padding:16px; border-radius:14px; border:1px solid var(--line); background:linear-gradient(180deg,rgba(0,0,0,.01),transparent),var(--surface); cursor:pointer; font-family:inherit; text-align:start; transition:transform .25s cubic-bezier(.2,.7,.2,1), border-color .25s, box-shadow .25s; box-shadow:0 2px 4px rgba(0,0,0,.02); min-width:0; }
.xc-fmt:hover{ transform:translateY(-4px); }
.xc-fmt:disabled{ opacity:.45; cursor:default; transform:none; }
.xc-fmt-ico{ display:grid; place-items:center; width:42px; height:42px; border-radius:11px; flex:none; }
.xc-fmt--rose .xc-fmt-ico{ background:rgba(220,38,38,.1); color:var(--rose); } .xc-fmt--rose:hover{ border-color:rgba(220,38,38,.4); box-shadow:0 12px 24px -12px rgba(220,38,38,.3); }
.xc-fmt--emerald .xc-fmt-ico{ background:rgba(5,150,105,.1); color:var(--emerald); } .xc-fmt--emerald:hover{ border-color:rgba(5,150,105,.4); box-shadow:0 12px 24px -12px rgba(5,150,105,.3); }
.xc-fmt--sky .xc-fmt-ico{ background:rgba(2,132,199,.1); color:var(--sky); } .xc-fmt--sky:hover{ border-color:rgba(2,132,199,.4); box-shadow:0 12px 24px -12px rgba(2,132,199,.3); }
.xc-fmt--amber .xc-fmt-ico{ background:rgba(217,119,6,.1); color:var(--amber); } .xc-fmt--amber:hover{ border-color:rgba(217,119,6,.4); box-shadow:0 12px 24px -12px rgba(217,119,6,.3); }
.xc-fmt-body{ flex:1; min-width:0; }
.xc-fmt-top{ display:flex; align-items:baseline; gap:7px; }
.xc-fmt-label{ font-size:15px; font-weight:700; color:var(--paper); }
.xc-fmt-ext{ font-family:'JetBrains Mono'; font-size:11px; color:var(--muted); }
.xc-fmt-desc{ display:block; font-size:11px; color:var(--muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.xc-fmt-check{ color:var(--emerald); flex:none; }
.xc-fmt.is-done{ border-color:var(--emerald); background:rgba(5,150,105,.02); }

.xc-preview{ background:linear-gradient(180deg,rgba(0,0,0,.01),transparent),var(--surface); border:1px solid var(--line); border-radius:16px; padding:16px; box-shadow:0 4px 6px -1px rgba(0,0,0,.02); min-width:0; overflow:hidden; }
.xc-preview-h{ display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:600; margin-bottom:12px; }
.xc-preview-h > span:first-child{ display:flex; align-items:center; gap:7px; }
.xc-preview-meta{ font-family:'JetBrains Mono'; font-size:11px; color:var(--muted); }

.xc-table-wrap{ overflow-x:auto; max-width:100%; }
.xc-table{ width:100%; border-collapse:collapse; font-size:12.5px; }
.xc-table th{ text-align:start; padding:9px 12px; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); border-bottom:1px solid var(--line); white-space:nowrap; }
.xc-table td{ padding:9px 12px; border-bottom:1px solid var(--line); color:#334155; white-space:nowrap; max-width:240px; overflow:hidden; text-overflow:ellipsis; }
.xc-table tbody tr{ transition:background .18s; } .xc-table tbody tr:hover{ background:rgba(2,132,199,.04); }
.xc-empty{ display:flex; align-items:center; justify-content:center; gap:8px; padding:34px; color:var(--muted); font-size:13px; }
`;