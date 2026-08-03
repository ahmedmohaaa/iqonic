import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import {
  FileText, FileImage, FileSpreadsheet, File as FileIcon,
  UploadCloud, ExternalLink, X, CheckCircle2, AlertTriangle,
  Paperclip, Archive,
} from 'lucide-react';

/* صلاحيّة الرفع محليّاً (متانةً إن لم تُحقَن في AuthContext) — مطابقة لـ CanUploadInvoicePDF */
const FINANCE_ROLES = ['GM', 'AGM', 'ACCOUNTANT'];

const kindOf = (name = '', type = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf' || /pdf/.test(type)) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) || /image/.test(type)) return 'img';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet';
  return 'file';
};
const KIND_META = {
  pdf:   { Icon: FileText,        tone: 'rose' },
  img:   { Icon: FileImage,       tone: 'sky' },
  sheet: { Icon: FileSpreadsheet, tone: 'emerald' },
  file:  { Icon: FileIcon,        tone: 'amber' },
};
const humanSize = (b) =>
  !b ? '' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;

export default function InvoiceFilesPanel({ invoiceId, invoiceTitle }) {
  const { user } = useAuth();
  const canUpload = FINANCE_ROLES.includes(user?.role);

  const [files, setFiles] = useState([]);
  const [uploads, setUploads] = useState([]);   // { uid, name, size, progress, status }
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const fetchFiles = useCallback(() => {
    if (!invoiceId) return;
    apiClient.get(`invoices/${invoiceId}/files/`)
      .then((r) => setFiles(Array.isArray(r.data) ? r.data : (r.data?.results ?? [])))
      .catch(() => setFiles([]))
      .finally(() => setLoaded(true));
  }, [invoiceId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  /* كشفٌ عند الظهور */
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('revealed'); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const uploadOne = useCallback((file) => {
    const uid = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
    setUploads((u) => [...u, { uid, name: file.name, size: file.size, progress: 0, status: 'uploading' }]);
    const form = new FormData();
    form.append('file', file);
    apiClient
      .post(`invoices/${invoiceId}/files/upload/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
          setUploads((u) => u.map((x) => (x.uid === uid ? { ...x, progress: pct } : x)));
        },
      })
      .then(() => {
        setUploads((u) => u.map((x) => (x.uid === uid ? { ...x, progress: 100, status: 'done' } : x)));
        setTimeout(() => { setUploads((u) => u.filter((x) => x.uid !== uid)); fetchFiles(); }, 750);
      })
      .catch(() => setUploads((u) => u.map((x) => (x.uid === uid ? { ...x, status: 'error' } : x))));
  }, [invoiceId, fetchFiles]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!canUpload) return;
    Array.from(e.dataTransfer.files || []).forEach(uploadOne);
  };

  const dismissUpload = (uid) => setUploads((u) => u.filter((x) => x.uid !== uid));

  const pdfCount = files.filter((f) => kindOf(f.file, f.file_type) === 'pdf').length;

  return (
    <section ref={panelRef} className="ifp">
      <style>{CSS}</style>

      {/* الترويسة */}
      <header className="ifp__head">
        <div>
          <span className="ifp__kicker">INVOICE ARCHIVE · {invoiceTitle ?? `#${invoiceId}`}</span>
          <h2 className="ifp__title">خزانة المستندات</h2>
        </div>
        <div className="ifp__count">
          <span className="ifp__count-num">{files.length}</span>
          <span className="ifp__count-lbl">ملف محفوظ{pdfCount ? ` · ${pdfCount} PDF` : ''}</span>
        </div>
      </header>

      {/* منطقة السحب والإفلات — للمخوّلين فقط */}
      {canUpload && (
        <div
          className={`ifp__drop ${dragging ? 'is-drag' : ''} ${uploads.some((u) => u.status === 'uploading') ? 'is-busy' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => { Array.from(e.target.files || []).forEach(uploadOne); e.target.value = ''; }}
          />
          <span className="ifp__drop-orb"><UploadCloud size={22} /></span>
          <div className="ifp__drop-text">
            <strong>اسحب الملفات هنا</strong>
            <span>أو انقر للاختيار · PDF · صور · Excel</span>
          </div>
          <span className="ifp__drop-cta"><Paperclip size={15} /> إرفاق</span>
        </div>
      )}

      {/* الرفع النشط — شريط نابض بتقدّم حقيقي */}
      {uploads.length > 0 && (
        <ul className="ifp__uploads">
          {uploads.map((u) => (
            <li key={u.uid} className={`ifp__up ifp__up--${u.status}`}>
              <span className="ifp__up-pulse" />
              <div className="ifp__up-main">
                <div className="ifp__up-row">
                  <span className="ifp__up-name">{u.name}</span>
                  <span className="ifp__up-pct">
                    {u.status === 'done' ? 'تم' : u.status === 'error' ? 'فشل' : `${u.progress}%`}
                  </span>
                </div>
                <div className="ifp__up-bar"><span style={{ width: `${u.progress}%` }} /></div>
              </div>
              <button className="ifp__up-x" onClick={() => dismissUpload(u.uid)} aria-label="إزالة"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}

      {/* الملفات المحفوظة */}
      {loaded && files.length === 0 && uploads.length === 0 && (
        <div className="ifp__empty">
          <Archive size={26} />
          <p>لا مستندات مرفقة بعد{canUpload ? ' — ارفع أول نسخة من الفاتورة.' : '.'}</p>
        </div>
      )}

      {files.length > 0 && (
        <ul className="ifp__list">
          {files.map((f, i) => {
            const k = kindOf(f.file, f.file_type);
            const { Icon, tone } = KIND_META[k];
            return (
              <li key={f.id} className={`ifp__file ifp__file--${tone}`} style={{ '--i': i }}>
                <span className="ifp__file-ico"><Icon size={18} /></span>
                <div className="ifp__file-body">
                  <span className="ifp__file-name" title={f.file?.split('/').pop()}>{f.file?.split('/').pop() ?? 'ملف'}</span>
                  <span className="ifp__file-meta">
                    {f.uploaded_by_name ?? '—'} · {f.created_at ? new Date(f.created_at).toLocaleDateString('ar') : ''}
                  </span>
                </div>
                <a
                  className="ifp__file-open"
                  href={f.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="فتح / تحميل"
                >
                  <ExternalLink size={15} />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   الأنماط — خزانة مستندات داكنة الحبر، حيّة ومتجاوبة
   ═══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

.ifp{
  --ink:#0b1016; --ink2:#111921; --line:#24313c; --paper:#e9eef2; --muted:#8694a0;
  --amber:#e7a23b; --emerald:#3fae84; --sky:#5bb8d8; --rose:#d96a6a;
  position:relative; color:var(--paper); border:1px solid var(--line); border-radius:20px;
  padding:24px 24px 20px; overflow:hidden;
  background:
    radial-gradient(120% 80% at 100% 0%, rgba(231,162,59,.10), transparent 55%),
    radial-gradient(90% 70% at 0% 100%, rgba(91,184,216,.08), transparent 55%),
    linear-gradient(180deg, var(--ink2), var(--ink));
  font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
  opacity:0; transform:translateY(16px);
  transition:opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1);
}
.ifp.revealed{ opacity:1; transform:none; }
.ifp::before{ /* شبكة ورقية خفيفة */
  content:""; position:absolute; inset:0; pointer-events:none; opacity:.5;
  background-image:linear-gradient(rgba(91,184,216,.05) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(91,184,216,.05) 1px,transparent 1px);
  background-size:38px 38px;
  -webkit-mask-image:radial-gradient(120% 100% at 50% 0%,#000,transparent 85%);
          mask-image:radial-gradient(120% 100% at 50% 0%,#000,transparent 85%);
}
.ifp > *{ position:relative; }

.ifp__head{ display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:18px; }
.ifp__kicker{ font-family:'Space Grotesk'; font-size:10px; letter-spacing:.32em; color:var(--amber); text-transform:uppercase; }
.ifp__title{ font-family:'Space Grotesk'; font-weight:700; font-size:clamp(26px,4vw,38px); line-height:1; margin:6px 0 0; letter-spacing:-.02em; }
.ifp__count{ text-align:left; }
.ifp__count-num{ display:block; font-family:'JetBrains Mono'; font-weight:700; font-size:34px; line-height:.9; color:var(--paper); }
.ifp__count-lbl{ font-size:11px; color:var(--muted); }

/* منطقة السحب */
.ifp__drop{
  display:flex; align-items:center; gap:14px; cursor:pointer;
  border:1.5px dashed var(--line); border-radius:14px; padding:16px 18px; margin-bottom:14px;
  background:rgba(255,255,255,.02);
  transition:border-color .25s, background .25s, transform .25s;
}
.ifp__drop:hover{ border-color:rgba(231,162,59,.5); background:rgba(231,162,59,.05); }
.ifp__drop.is-drag{ border-color:var(--amber); border-style:solid; background:rgba(231,162,59,.10); transform:scale(1.012); }
.ifp__drop.is-busy{ opacity:.6; pointer-events:none; }
.ifp__drop-orb{
  display:grid; place-items:center; width:42px; height:42px; border-radius:12px; flex:none;
  background:rgba(231,162,59,.14); color:var(--amber);
  transition:transform .3s;
}
.ifp__drop:hover .ifp__drop-orb{ transform:translateY(-2px) rotate(-4deg); }
.ifp__drop-text{ display:flex; flex-direction:column; flex:1; }
.ifp__drop-text strong{ font-size:14px; color:var(--paper); }
.ifp__drop-text span{ font-size:11px; color:var(--muted); margin-top:2px; }
.ifp__drop-cta{
  display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600;
  color:var(--ink); background:var(--amber); padding:7px 12px; border-radius:9px; flex:none;
  transition:filter .2s;
}
.ifp__drop:hover .ifp__drop-cta{ filter:brightness(1.08); }

/* الرفع النشط */
.ifp__uploads{ list-style:none; margin:0 0 14px; padding:0; display:flex; flex-direction:column; gap:8px; }
.ifp__up{
  display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:11px;
  background:rgba(255,255,255,.03); border:1px solid var(--line);
  animation:ifp-in .35s ease both;
}
.ifp__up--done{ border-color:rgba(63,174,132,.5); }
.ifp__up--error{ border-color:rgba(217,106,106,.5); }
@keyframes ifp-in{ from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:none;} }
.ifp__up-pulse{ width:9px; height:9px; border-radius:50%; flex:none; background:var(--amber); position:relative; }
.ifp__up--done .ifp__up-pulse{ background:var(--emerald); }
.ifp__up--error .ifp__up-pulse{ background:var(--rose); }
.ifp__up--uploading .ifp__up-pulse::after{
  content:""; position:absolute; inset:-4px; border-radius:50%; background:var(--amber); opacity:.5;
  animation:ifp-ping 1.4s cubic-bezier(0,0,.2,1) infinite;
}
@keyframes ifp-ping{ 75%,100%{ transform:scale(2.2); opacity:0; } }
.ifp__up-main{ flex:1; min-width:0; }
.ifp__up-row{ display:flex; justify-content:space-between; gap:8px; margin-bottom:6px; }
.ifp__up-name{ font-size:12px; color:var(--paper); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ifp__up-pct{ font-family:'JetBrains Mono'; font-size:11px; color:var(--muted); flex:none; }
.ifp__up--done .ifp__up-pct{ color:var(--emerald); }
.ifp__up--error .ifp__up-pct{ color:var(--rose); }
.ifp__up-bar{ height:5px; border-radius:99px; background:rgba(255,255,255,.08); overflow:hidden; }
.ifp__up-bar span{ display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,var(--emerald),var(--sky)); position:relative; transition:width .2s; }
.ifp__up--uploading .ifp__up-bar span::after{
  content:""; position:absolute; inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);
  transform:translateX(-100%); animation:ifp-shim 1.6s ease-in-out infinite;
}
@keyframes ifp-shim{ 60%,100%{ transform:translateX(260%); } }
.ifp__up-x{ background:none; border:0; color:var(--muted); cursor:pointer; flex:none; padding:2px; border-radius:6px; transition:color .2s,background .2s; }
.ifp__up-x:hover{ color:var(--rose); background:rgba(217,106,106,.12); }

/* فارغ */
.ifp__empty{ display:flex; flex-direction:column; align-items:center; gap:8px; padding:30px; color:var(--muted); border:1px dashed var(--line); border-radius:14px; text-align:center; }
.ifp__empty p{ margin:0; font-size:13px; }

/* قائمة الملفات */
.ifp__list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.ifp__file{
  display:flex; align-items:center; gap:13px; padding:12px 14px; border-radius:12px;
  background:rgba(255,255,255,.025); border:1px solid var(--line);
  border-inline-start-width:3px;
  transition:transform .3s cubic-bezier(.2,.7,.2,1), background .3s, border-color .3s;
  animation:ifp-row .45s ease both; animation-delay:calc(var(--i) * 55ms);
}
@keyframes ifp-row{ from{opacity:0; transform:translateX(-8px);} to{opacity:1; transform:none;} }
.ifp__file:hover{ transform:translateX(4px); background:rgba(255,255,255,.05); }
.ifp__file--rose{ border-inline-start-color:var(--rose); }   .ifp__file--rose:hover{ border-color:rgba(217,106,106,.45); }
.ifp__file--sky{ border-inline-start-color:var(--sky); }     .ifp__file--sky:hover{ border-color:rgba(91,184,216,.45); }
.ifp__file--emerald{ border-inline-start-color:var(--emerald); } .ifp__file--emerald:hover{ border-color:rgba(63,174,132,.45); }
.ifp__file--amber{ border-inline-start-color:var(--amber); } .ifp__file--amber:hover{ border-color:rgba(231,162,59,.45); }
.ifp__file-ico{ display:grid; place-items:center; width:36px; height:36px; border-radius:10px; flex:none; background:rgba(255,255,255,.06); }
.ifp__file--rose .ifp__file-ico{ color:var(--rose); } .ifp__file--sky .ifp__file-ico{ color:var(--sky); }
.ifp__file--emerald .ifp__file-ico{ color:var(--emerald); } .ifp__file--amber .ifp__file-ico{ color:var(--amber); }
.ifp__file-body{ flex:1; min-width:0; display:flex; flex-direction:column; }
.ifp__file-name{ font-size:13px; font-weight:600; color:var(--paper); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ifp__file-meta{ font-family:'JetBrains Mono'; font-size:10.5px; color:var(--muted); margin-top:3px; }
.ifp__file-open{
  display:grid; place-items:center; width:34px; height:34px; border-radius:9px; flex:none;
  color:var(--muted); background:rgba(255,255,255,.04); transition:color .2s, background .2s, transform .2s;
}
.ifp__file-open:hover{ color:var(--ink); background:var(--sky); transform:translateY(-2px); }
`;