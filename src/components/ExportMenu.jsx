// src/components/ExportMenu.jsx
import { useRef, useState, useEffect } from 'react';
import { useExport, EXPORT_STATUS } from '../lib/useExport';
import { Download, FileText, FileSpreadsheet, FileJson, Braces, Check, Loader2 } from 'lucide-react';

const FORMATS = [
  { id: 'pdf',  label: 'PDF',  ext: '.pdf',  Icon: FileText,        tone: 'rose' },
  { id: 'xlsx', label: 'Excel', ext: '.xlsx', Icon: FileSpreadsheet, tone: 'emerald' },
  { id: 'csv',  label: 'CSV',  ext: '.csv',  Icon: FileJson,        tone: 'sky' },
  { id: 'json', label: 'JSON', ext: '.json', Icon: Braces,          tone: 'amber' },
];

/**
 * props: rows, columns, filename, title
 * columns: [{ key|get, label, width? }]
 */
export default function ExportMenu({ rows = [], columns = [], filename = 'export', title }) {
  const { status, progress, lastFormat, exportCSV, exportJSON, exportXLSX, exportPDF } = useExport();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const busy = status === EXPORT_STATUS.PREPARING || status === EXPORT_STATUS.RENDERING;

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const fire = (id) => {
    if (id === 'pdf') exportPDF(rows, columns, filename, title);
    else if (id === 'xlsx') exportXLSX(rows, columns, filename);
    else if (id === 'csv') exportCSV(rows, columns, filename);
    else exportJSON(rows, filename);
    setOpen(false);
  };

  return (
    <div className="exp-menu" ref={ref}>
      <style>{MENU_CSS}</style>
      <button className="exp-trigger" onClick={() => setOpen((o) => !o)} disabled={busy}>
        {busy ? <Loader2 size={15} className="exp-spin" /> : status === EXPORT_STATUS.DONE ? <Check size={15} /> : <Download size={15} />}
        <span>{busy ? 'جارٍ التصدير…' : status === EXPORT_STATUS.DONE ? 'تم ✓' : 'تصدير'}</span>
      </button>

      {busy && (
        <div className="exp-progress" aria-hidden>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      {open && (
        <div className="exp-pop" role="menu">
          <p className="exp-pop-h">اختر الصيغة · {rows.length} صف</p>
          {FORMATS.map((f) => (
            <button key={f.id} className={`exp-item exp-item--${f.tone} ${lastFormat === f.id && status === EXPORT_STATUS.DONE ? 'is-done' : ''}`} onClick={() => fire(f.id)} role="menuitem">
              <f.Icon size={15} />
              <span className="exp-item-label">{f.label}</span>
              <span className="exp-item-ext">{f.ext}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MENU_CSS = `
.exp-menu{ position:relative; display:inline-block; font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif; }
.exp-trigger{ display:inline-flex; align-items:center; gap:7px; padding:8px 14px; border-radius:10px;
  background:linear-gradient(180deg,#13202c,#0e1822); color:#e9eef2; border:1px solid #24313c;
  font-size:13px; font-weight:600; cursor:pointer; transition:transform .2s, border-color .2s, box-shadow .2s; }
.exp-trigger:hover{ transform:translateY(-1px); border-color:#3fae84; box-shadow:0 8px 22px -14px rgba(63,174,132,.7); }
.exp-trigger:disabled{ opacity:.7; cursor:default; transform:none; }
.exp-spin{ animation:exp-spin .8s linear infinite; }
@keyframes exp-spin{ to{ transform:rotate(360deg); } }
.exp-progress{ position:absolute; left:0; right:0; bottom:-5px; height:3px; background:rgba(255,255,255,.08); border-radius:99px; overflow:hidden; }
.exp-progress span{ display:block; height:100%; background:linear-gradient(90deg,#3fae84,#5cc8ff); transition:width .25s ease; }
.exp-pop{ position:absolute; top:calc(100% + 8px); right:0; min-width:184px; z-index:40;
  background:#0e1822; border:1px solid #24313c; border-radius:12px; padding:8px;
  box-shadow:0 24px 50px -24px rgba(0,0,0,.8); animation:exp-pop .18s ease; }
@keyframes exp-pop{ from{ opacity:0; transform:translateY(-6px); } to{ opacity:1; transform:none; } }
.exp-pop-h{ font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#8694a0; padding:4px 8px 8px; }
.exp-item{ display:flex; align-items:center; gap:9px; width:100%; padding:9px 10px; border-radius:9px;
  background:transparent; border:1px solid transparent; color:#cdd6dd; font-size:13px; cursor:pointer;
  font-family:inherit; transition:background .18s, border-color .18s, transform .18s; }
.exp-item:hover{ transform:translateX(-2px); }
.exp-item--rose:hover{ background:rgba(217,106,106,.12); border-color:rgba(217,106,106,.4); color:#f0a3a3; }
.exp-item--emerald:hover{ background:rgba(63,174,132,.12); border-color:rgba(63,174,132,.4); color:#86d8b6; }
.exp-item--sky:hover{ background:rgba(92,200,255,.12); border-color:rgba(92,200,255,.4); color:#9ad8f3; }
.exp-item--amber:hover{ background:rgba(227,169,72,.12); border-color:rgba(227,169,72,.4); color:#ecc488; }
.exp-item-label{ flex:1; text-align:start; }
.exp-item-ext{ font-family:'JetBrains Mono',monospace; font-size:11px; opacity:.6; }
.exp-item.is-done{ color:#86d8b6; }
`;