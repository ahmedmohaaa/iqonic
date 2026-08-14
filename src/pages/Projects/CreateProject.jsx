import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createProject, getProjects } from '../../api/services/projects';
import { getClients } from '../../api/services/clients';
import {
  getContractors, createContractor,
} from '../../api/services/contractors';
import {
  Building2, HardHat, Lock, Plus, UserPlus, Check,
  AlertTriangle, Calendar, Ruler, FileSignature,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   منطق القسم:
   - المدراء يرون كل الأقسام (DESIGN, SUPERVISION, BOTH)
   - سكرتيرة التصميم ترى (DESIGN, BOTH)
   - سكرتيرة الإشراف ترى (SUPERVISION, BOTH)
   ═══════════════════════════════════════════════════════════ */
const FREE_ROLES = ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'MANAGER'];

export default function CreateProject() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // تنظيف بيانات المستخدم لتجنب أخطاء حالة الأحرف (Case Sensitivity)
  const roleString = String(user?.role || user?.groups?.[0] || '').toUpperCase();
  const deptString = String(user?.department || '').toUpperCase();

  const isSecretary = roleString.includes('SECRETARY') || roleString.includes('سكرتير');
  const isDesignDept = deptString.includes('DESIGN') || deptString.includes('تصميم');
  const isSupDept = deptString.includes('SUP') || deptString.includes('إشراف');

  // تحديد الخيارات المتاحة بناءً على المستخدم
  const availableScopes = useMemo(() => {
    if (isSecretary) {
      if (isDesignDept) return ['DESIGN', 'BOTH'];
      if (isSupDept) return ['SUPERVISION', 'BOTH'];
    }
    // للمدراء أو في حال عدم وجود قسم محدد
    return ['DESIGN', 'SUPERVISION', 'BOTH'];
  }, [isSecretary, isDesignDept, isSupDept]);

  // تحديد القسم الافتراضي عند فتح الصفحة
  const initialScope = isSecretary && isSupDept ? 'SUPERVISION' : 'DESIGN';
  
  const [scope, setScope] = useState(initialScope);
  const [clients, setClients] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // وضع المقاول: existing | new
  const [contractorMode, setContractorMode] = useState('existing');

  const [f, setF] = useState({
    name: '', project_no: '', client: '', location: '',
    start_date: '', duration_days: '', priority: 'MEDIUM',
    building_type: 'Residential', floors: '', plot_area: '', bua: '',
    apartments: '', shops: '', parking: '', description: '', application_no: '', pin_no: '',
    // ══ الحقول الناقصة ══
    owner: '', supervision_consultant: '', permit_no: '', permit_date: '', permit_deadline: '', permit_status: 'NOT_ISSUED',
    // ═════════════════════
    // تصميم
    offer_status: 'NOT_SUBMITTED', contract_status: 'NOT_SUBMITTED',
    internal_design_review_required: false,
    // إشراف
    contractor: '', design_company: '', commencement_status: 'PENDING_AUTHORITY',
    newContractor: { name: '', contact_person: '', phone: '', email: '' },
  });

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((p) => ({ ...p, [k]: v }));
  };
  const setNC = (k) => (e) =>
    setF((p) => ({ ...p, newContractor: { ...p.newContractor, [k]: e.target.value } }));

  useEffect(() => {
    Promise.all([getClients(), getContractors()])
      .then(([c, co]) => {
        setClients(c.data.results || c.data || []);
        setContractors(co.data.results || co.data || []);
      })
      .catch(() => setError('تعذّر تحميل القوائم.'))
      .finally(() => setLoad(false));
  }, []);

  const showDesign = scope === 'DESIGN' || scope === 'BOTH';
  const showSup = scope === 'SUPERVISION' || scope === 'BOTH';

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      let contractorId = f.contractor || null;

      // وضع «مقاول جديد»: ننشئه أولاً ثم نربطه
      if (showSup && contractorMode === 'new') {
        if (!f.newContractor.name.trim()) throw new Error('اسم المقاول مطلوب.');
        const co = await createContractor(f.newContractor);
        contractorId = co.data.id;
      }

      const payload = {
        name: f.name, project_no: f.project_no, scope,
        client: Number(f.client), location: f.location,
        description: f.description,
        start_date: f.start_date || null,
        duration_days: f.duration_days ? Number(f.duration_days) : 0,
        priority: f.priority,
        building_type: f.building_type,
        floors: f.floors ? Number(f.floors) : null, 
        plot_area: f.plot_area || null, 
        bua: f.bua || null,
        apartments: f.apartments ? Number(f.apartments) : 0,
        shops: f.shops ? Number(f.shops) : 0,
        parking: f.parking || null,
        application_no: f.application_no || null,
        pin_no: f.pin_no || null,
        // ══ الحقول الناقصة ══
        owner: f.owner || null,
        supervision_consultant: f.supervision_consultant || null,
        permit_no: f.permit_no || null,
        permit_date: f.permit_date || null,
        permit_deadline: f.permit_deadline || null,
        permit_status: f.permit_status,
        // ═════════════════════
      ...(showDesign && {
        offer_status: f.offer_status,
        contract_status: f.contract_status,
      }),
      ...(showSup && {
        contractor: contractorId || null,
        design_company: f.design_company || null,
        commencement_status: f.commencement_status,
        internal_design_review_required: f.internal_design_review_required,
      }),
      };

      await createProject(payload);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'تعذّر إنشاء المشروع.');
    } finally { setBusy(false); }
  };

  const activeTone = showSup && !showDesign ? 'amber' : showDesign && !showSup ? 'sky' : 'both';

  return (
    <div className="cp-root">
      <style>{CSS}</style>
      <div className="cp-ambient" aria-hidden />

      <header className="cp-head cp-rv">
        <div>
          <span className="cp-kicker">NEW PROJECT · إدخال مشروع</span>
          <h1 className="cp-title">مشروع جديد</h1>
          <p className="cp-sub">
            {isSecretary
              ? `أنتِ تسجّلين بصفتكِ سكرتيرة ${isDesignDept ? 'التصميم' : 'الإشراف'} — يمكنك اختيار قسمك أو مشروع مشترك (Both).`
              : 'اختر نطاق المشروع لتظهر الحقول الخاصة به.'}
          </p>
        </div>
      </header>

      {/* مؤشّر القسم النشط */}
      <div className="cp-scope cp-rv">
        <div className="cp-scope-pick">
          {availableScopes.map((s) => (
            <button
              key={s} type="button"
              className={`cp-scope-btn ${scope === s ? 'on' : ''} t-${s === 'DESIGN' ? 'sky' : s === 'SUPERVISION' ? 'amber' : 'both'}`}
              onClick={() => setScope(s)}
            >
              {s === 'DESIGN' ? 'تصميم' : s === 'SUPERVISION' ? 'إشراف' : 'مشترك (Both)'}
            </button>
          ))}
        </div>

        <div className={`cp-dept-cards ${activeTone}`}>
          <DeptCard tone="sky" Icon={Building2} label="التصميم" active={showDesign} hint="Offer · Contract" />
          <DeptCard tone="amber" Icon={HardHat} label="الإشراف" active={showSup} hint="المقاول · Design Company · Commencement · Internal Review" />
        </div>
      </div>

      {error && (
        <div className="cp-err cp-rv"><AlertTriangle size={16} /> {error}</div>
      )}

      <form onSubmit={submit} className="cp-form">
        {/* ── مشترك دائماً ── */}
        <section className="cp-block cp-rv">
          <h2 className="cp-block-h"><span className="cp-num">01</span> البيانات الأساسية</h2>
          <div className="cp-grid">
            <Field label="الوصف (Description)">
              <textarea value={f.description} onChange={set('description')} rows={2} placeholder="Proposed (B+G+3+PH) Residential Building" />
            </Field>
            <Field label="اسم المشروع *"><input required value={f.name} onChange={set('name')} /></Field>
            <Field label="رقم المشروع *"><input required value={f.project_no} onChange={set('project_no')} /></Field>
            <Field label="العميل *">
              <select required value={f.client} onChange={set('client')}>
                <option value="">— اختر —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="الموقع"><input value={f.location} onChange={set('location')} /></Field>
            <Field label="تاريخ البداية"><input type="date" value={f.start_date} onChange={set('start_date')} /></Field>
            <Field label="المدة (يوم)"><input type="number" value={f.duration_days} onChange={set('duration_days')} /></Field>
            <Field label="الأولوية">
              <select value={f.priority} onChange={set('priority')}>
                <option value="URGENT">عاجل</option><option value="HIGH">مرتفع</option>
                <option value="MEDIUM">متوسط</option><option value="LOW">منخفض</option>
              </select>
            </Field>
            <Field label="نوع المبنى"><input value={f.building_type} onChange={set('building_type')} /></Field>
            <Field label="الأدوار"><input type="number" value={f.floors} onChange={set('floors')} /></Field>
            <Field label="مساحة الأرض"><input value={f.plot_area} onChange={set('plot_area')} /></Field>
            <Field label="BUA (M²)"><input value={f.bua} onChange={set('bua')} /></Field>
            <Field label="الوحدات السكنية (Apartments)"><input type="number" value={f.apartments} onChange={set('apartments')} /></Field>
            <Field label="المحلات (Shops)"><input type="number" value={f.shops} onChange={set('shops')} /></Field>
            <Field label="المواقف (Parking)"><input value={f.parking} onChange={set('parking')} /></Field>
            <Field label="رقم الطلب (Application No.)"><input value={f.application_no} onChange={set('application_no')} placeholder="N/2026/XXXXXXX" /></Field>
            <Field label="رقم PIN"><input value={f.pin_no} onChange={set('pin_no')} /></Field>
            {/* ══ الحقول الناقصة ══ */}
            <Field label="المالك (Owner)"><input value={f.owner} onChange={set('owner')} /></Field>
            <Field label="استشاري الإشراف (Supervision Consultant)"><input value={f.supervision_consultant} onChange={set('supervision_consultant')} /></Field>
            <Field label="رقم التصريح (Permit No.)"><input value={f.permit_no} onChange={set('permit_no')} /></Field>
            <Field label="تاريخ التصريح (Permit Date)"><input type="date" value={f.permit_date} onChange={set('permit_date')} /></Field>
            <Field label="موعد نهائي للتصريح (Permit Deadline)"><input type="date" value={f.permit_deadline} onChange={set('permit_deadline')} /></Field>
            <Field label="حالة التصريح (Permit Status)">
              <select value={f.permit_status} onChange={set('permit_status')}>
                <option value="NOT_ISSUED">Not Issued</option>
                <option value="PENDING_AUTHORITY">Pending Authority</option>
                <option value="ISSUED">Approved/Issued</option>
              </select>
            </Field>
            {/* ═════════════════════ */}
          </div>
        </section>

        {/* ── حقول التصميم ── */}
        {showDesign && (
          <section className="cp-block cp-block--sky cp-rv">
            <h2 className="cp-block-h t-sky"><Building2 size={16} /><span className="cp-num">02</span> بيانات التصميم</h2>
            <div className="cp-grid">
              <Field label="حالة العرض">
                <select value={f.offer_status} onChange={set('offer_status')}>
                  <option value="NOT_SUBMITTED">لم يُرفع</option>
                  <option value="SUBMITTED">مرفوع</option>
                  <option value="APPROVED">معتمد</option>
                </select>
              </Field>
              <Field label="حالة العقد">
                <select value={f.contract_status} onChange={set('contract_status')}>
                  <option value="NOT_SUBMITTED">لم يُرفع</option>
                  <option value="SUBMITTED">مرفوع</option>
                  <option value="APPROVED">معتمد</option>
                </select>
              </Field>
            </div>
          </section>
        )}

        {/* ── حقول الإشراف ── */}
        {showSup && (
          <section className="cp-block cp-block--amber cp-rv">
            <h2 className="cp-block-h t-amber"><HardHat size={16} /><span className="cp-num">03</span> بيانات الإشراف</h2>

            <div className="cp-grid">
              <Field label="شركة التصميم (Design Company)">
                <input value={f.design_company} onChange={set('design_company')}
                  placeholder="اسم الشركة التي صمّمت المشروع" />
              </Field>
              <Field label="تصريح بدء التنفيذ (Commencement)">
                <select value={f.commencement_status} onChange={set('commencement_status')}>
                  <option value="PENDING_AUTHORITY">معلّق لدى الجهة</option>
                  <option value="ISSUED">معتمد / صادر</option>
                </select>
              </Field>
              <label className="cp-check">
                <input type="checkbox" checked={f.internal_design_review_required}
                  onChange={set('internal_design_review_required')} />
                <span>يتطلب مراجعة تصميم داخلية (Internal Design Review)</span>
              </label>
            </div>

            {/* المقاول: موجود أو جديد */}
            <div className="cp-contractor">
              <div className="cp-mode">
                <button type="button" className={contractorMode === 'existing' ? 'on' : ''}
                  onClick={() => setContractorMode('existing')}>مقاول مسجّل</button>
                <button type="button" className={contractorMode === 'new' ? 'on' : ''}
                  onClick={() => setContractorMode('new')}><UserPlus size={14} /> مقاول جديد</button>
              </div>

              {contractorMode === 'existing' ? (
                <Field label="اختر المقاول">
                  <select value={f.contractor} onChange={set('contractor')}>
                    <option value="">— اختر —</option>
                    {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
              ) : (
                <div className="cp-new-co">
                  <Field label="اسم المقاول *"><input value={f.newContractor.name} onChange={setNC('name')} /></Field>
                  <Field label="شخص الاتصال"><input value={f.newContractor.contact_person} onChange={setNC('contact_person')} /></Field>
                  <Field label="الموبايل"><input value={f.newContractor.phone} onChange={setNC('phone')} /></Field>
                  <Field label="الإيميل"><input type="email" value={f.newContractor.email} onChange={setNC('email')} /></Field>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="cp-foot cp-rv">
          <button type="button" className="cp-ghost" onClick={() => navigate(-1)}>إلغاء</button>
          <button type="submit" disabled={busy} className="cp-save">
            {busy ? 'جارٍ الإنشاء…' : <><Check size={16} /> إنشاء المشروع</>}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── مكوّنات فرعية ── */
function Field({ label, children }) {
  return <label className="cp-field"><span>{label}</span>{children}</label>;
}
function DeptCard({ tone, Icon, label, active, hint }) {
  return (
    <div className={`cp-dept t-${tone} ${active ? 'live' : 'dim'}`}>
      <Icon size={18} />
      <div>
        <b>{label}</b>
        <span>{active ? hint : 'غير مفعّل لهذا النطاق'}</span>
      </div>
      {active && <i className="cp-pulse" />}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

.cp-root{
  --ink: #ffffff; 
  --ink2: #ffffff; 
  --line: #e2e8f0; 
  --paper: #0f172a; 
  --mut: #64748b;
  --sky: #0284c7; 
  --amber: #d97706; 
  --emerald: #059669; 
  --rose: #dc2626;
  position:relative; min-height:100vh; color:var(--paper);
  font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif;
  padding:30px clamp(16px,4vw,46px) 70px;
  background: linear-gradient(180deg, #f8fafc, #f1f5f9);
}

.cp-ambient{ position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(55% 42% at 92% -6%, rgba(217,119,6,.06), transparent 60%),
    radial-gradient(50% 40% at -4% 104%, rgba(2,132,199,.06), transparent 60%),
    linear-gradient(rgba(2,132,199,.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(2,132,199,.03) 1px,transparent 1px);
  background-size:auto,auto,44px 44px,44px 44px;
  -webkit-mask-image:radial-gradient(120% 100% at 50% 0%,#000,transparent 86%);
          mask-image:radial-gradient(120% 100% at 50% 0%,#000,transparent 86%);
}
.cp-root>*{ position:relative; }
.cp-rv{ opacity:0; transform:translateY(14px); animation:cp-rise .6s cubic-bezier(.2,.7,.2,1) forwards; }
@keyframes cp-rise{ to{ opacity:1; transform:none; } }

.cp-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; }
.cp-kicker{ font-family:'Space Grotesk'; font-size:11px; letter-spacing:.3em; color:var(--amber); }
.cp-title{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:clamp(30px,5vw,50px); font-weight:700; line-height:1; margin:6px 0 6px; letter-spacing:-.02em; color:#0f172a; }
.cp-sub{ color:var(--mut); font-size:13.5px; max-width:52ch; margin:0; line-height:1.6; }

.cp-scope{ margin-top:22px; }
.cp-scope-pick{ display:inline-flex; gap:6px; background:#f1f5f9; border:1px solid var(--line); padding:5px; border-radius:12px; }
.cp-scope-btn{ border:none; background:transparent; color:var(--mut); font-family:inherit; font-weight:600;
  font-size:13px; padding:8px 18px; border-radius:9px; cursor:pointer; transition:.2s; }
.cp-scope-btn:hover{ color:var(--paper); }
.cp-scope-btn.on{ background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,.05); }
.cp-scope-btn.on.t-sky{ color:var(--sky); }
.cp-scope-btn.on.t-amber{ color:var(--amber); }
.cp-scope-btn.on.t-both{ color:var(--emerald); }

.cp-dept-cards{ display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:16px; }
.cp-dept{ position:relative; display:flex; align-items:center; gap:13px; padding:16px 18px;
  border:1px solid var(--line); border-radius:14px; background:var(--ink2); transition:.3s; overflow:hidden; box-shadow:0 2px 4px rgba(0,0,0,.02); }
.cp-dept>svg{ flex:none; }
.cp-dept b{ display:block; font-size:15px; color:var(--paper); }
.cp-dept span{ font-size:11.5px; color:var(--mut); }
.cp-dept.t-sky.live{ border-color:rgba(2,132,199,.4); background:rgba(2,132,199,.02); } .cp-dept.t-sky.live>svg{ color:var(--sky); }
.cp-dept.t-amber.live{ border-color:rgba(217,119,6,.4); background:rgba(217,119,6,.02); } .cp-dept.t-amber.live>svg{ color:var(--amber); }
.cp-dept.dim{ opacity:.6; filter:grayscale(1); background:#f8fafc; box-shadow:none; }
.cp-pulse{ position:absolute; top:14px; inset-inline-end:14px; width:9px; height:9px; border-radius:50%; background:var(--emerald); }
.cp-pulse::after{ content:""; position:absolute; inset:-4px; border-radius:50%; background:var(--emerald); opacity:.4; animation:cp-ping 1.8s infinite; }
@keyframes cp-ping{ 70%,100%{ transform:scale(2.4); opacity:0; } }

.cp-err{ display:flex; align-items:center; gap:8px; margin-top:16px; color:var(--rose);
  background:rgba(220,38,38,.05); border:1px solid rgba(220,38,38,.2); border-radius:11px; padding:11px 14px; font-size:13px; font-weight:500; }

.cp-form{ margin-top:22px; display:flex; flex-direction:column; gap:18px; }
.cp-block{ background:var(--ink2); border:1px solid var(--line); border-radius:16px; padding:22px; box-shadow:0 4px 6px -1px rgba(0,0,0,.03); }
.cp-block--sky{ border-inline-start:4px solid var(--sky); }
.cp-block--amber{ border-inline-start:4px solid var(--amber); }
.cp-block-h{ display:flex; align-items:center; gap:9px; font-family:'Space Grotesk','IBM Plex Sans Arabic';
  font-size:17px; font-weight:600; margin-bottom:18px; }
.cp-block-h.t-sky{ color:var(--sky); } .cp-block-h.t-amber{ color:var(--amber); }
.cp-num{ font-family:'JetBrains Mono'; font-size:12px; color:var(--mut); background:#f1f5f9; border:1px solid #e2e8f0;
  padding:2px 8px; border-radius:7px; }

.cp-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
.cp-field{ display:flex; flex-direction:column; gap:6px; }
.cp-field>span{ font-size:12px; font-weight:500; color:#475569; }
.cp-field input,.cp-field select, .cp-field textarea{ background:var(--ink); border:1px solid #cbd5e1; border-radius:10px;
  padding:10px 12px; color:var(--paper); font-family:inherit; font-size:13.5px; outline:none; transition:.2s; box-shadow:inset 0 1px 2px rgba(0,0,0,.02); }
.cp-field input:focus,.cp-field select:focus, .cp-field textarea:focus{ border-color:var(--sky); box-shadow:0 0 0 3px rgba(2,132,199,.15); }
.cp-field input::placeholder, .cp-field textarea::placeholder { color: #94a3b8; }
.cp-check{ display:flex; align-items:center; gap:9px; font-size:13px; font-weight:500; color:var(--paper);
  grid-column:1/-1; padding:6px 0; cursor:pointer; }
.cp-check input{ width:17px; height:17px; accent-color:var(--sky); cursor:pointer; }

.cp-contractor{ margin-top:16px; border-top:1px dashed var(--line); padding-top:18px; }
.cp-mode{ display:inline-flex; gap:5px; background:#f1f5f9; border:1px solid var(--line); padding:4px; border-radius:10px; margin-bottom:16px; }
.cp-mode button{ display:inline-flex; align-items:center; gap:6px; border:none; background:transparent; color:var(--mut);
  font-family:inherit; font-weight:600; font-size:12.5px; padding:7px 14px; border-radius:8px; cursor:pointer; transition:.2s; }
.cp-mode button:hover{ color:var(--paper); }
.cp-mode button.on{ background:#ffffff; color:var(--amber); box-shadow:0 1px 3px rgba(0,0,0,.05); }
.cp-new-co{ display:grid; grid-template-columns:1fr 1fr; gap:14px; background:#fafafa; padding:16px; border-radius:12px; border:1px solid #e2e8f0; }

.cp-foot{ display:flex; justify-content:flex-end; gap:12px; }
.cp-ghost{ border:1px solid #cbd5e1; background:#ffffff; color:#334155; border-radius:11px;
  padding:11px 22px; font-family:inherit; font-weight:600; cursor:pointer; transition:.2s; box-shadow:0 1px 2px rgba(0,0,0,.03); }
.cp-ghost:hover{ color:var(--paper); border-color:#94a3b8; background:#f8fafc; }
.cp-save{ display:inline-flex; align-items:center; gap:8px; border:none; background:var(--emerald); color:#ffffff;
  border-radius:11px; padding:11px 26px; font-family:inherit; font-weight:600; font-size:14px; cursor:pointer; transition:.2s; box-shadow:0 2px 4px rgba(5,150,105,.2); }
.cp-save:hover{ filter:brightness(1.05); transform:translateY(-1px); box-shadow:0 4px 6px rgba(5,150,105,.3); }
.cp-save:disabled{ opacity:.6; cursor:not-allowed; transform:none; filter:grayscale(0.5); box-shadow:none; }
`;