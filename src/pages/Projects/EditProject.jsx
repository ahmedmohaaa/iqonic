import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { updateProject, getProjectDetails } from '../../api/services/projects';
import { getClients } from '../../api/services/clients';
import {
  getContractors, createContractor,
} from '../../api/services/contractors';
import {
  Building2, HardHat, Lock, Plus, UserPlus, Check,
  AlertTriangle, Calendar, Ruler, FileSignature, Search, Edit
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   منطق القسم:
   - المدراء يرون كل الأقسام (DESIGN, SUPERVISION, BOTH)
   - سكرتيرة التصميم ترى (DESIGN, BOTH)
   - سكرتيرة الإشراف ترى (SUPERVISION, BOTH)
   ═══════════════════════════════════════════════════════════ */
const FREE_ROLES = ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'MANAGER'];

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDeptSecretary =
    user?.role === 'SECRETARY' && ['Design', 'Supervision'].includes(user?.department);
  
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

  const [scope, setScope] = useState('DESIGN');
  const [clients, setClients] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  
  // ✅ حالة البحث في المقاولين
  const [contractorSearch, setContractorSearch] = useState('');

  // وضع المقاول: existing | new
  const [contractorMode, setContractorMode] = useState('existing');

  const [f, setF] = useState({
    name: '', project_no: '', client: '', location: '',
    start_date: '', duration_days: '', priority: 'MEDIUM',
    building_type: 'Residential', floors: '', plot_area: '', bua: '',
    apartments: '', shops: '', parking: '', description: '', application_no: '', pin_no: '',
    // ══ الحقول الناقصة ══
    owner: '', supervision_consultant: '', permit_no: '', permit_date: '', permit_deadline: '', application_type: '', permit_status: 'NOT_ISSUED',
    // ═════════════════════
    // تصميم
    offer_status: 'NOT_SUBMITTED', contract_status: 'NOT_SUBMITTED',
    internal_design_review_required: false,
    // إشراف
    contractors: [], design_company: '', commencement_status: 'PENDING_AUTHORITY',
    newContractor: { name: '', contact_person: '', phone: '', email: '' },
  });

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((p) => ({ ...p, [k]: v }));
  };
  const setNC = (k) => (e) =>
    setF((p) => ({ ...p, newContractor: { ...p.newContractor, [k]: e.target.value } }));

  // ✅ ترتيب المقاولين: المتطابقون مع البحث يظهر أولاً (Smart Sort)
  const sortedContractors = useMemo(() => {
    if (!contractorSearch) return contractors;
    const lowerSearch = contractorSearch.toLowerCase();
    const matched = contractors.filter(c => c.name.toLowerCase().includes(lowerSearch));
    const unmatched = contractors.filter(c => !c.name.toLowerCase().includes(lowerSearch));
    return [...matched, ...unmatched];
  }, [contractors, contractorSearch]);

  // ═══ تحميل بيانات المشروع + القوائم ═══
  useEffect(() => {
    Promise.all([
      getProjectDetails(id),
      getClients(),
      getContractors()
    ])
      .then(([proj, c, co]) => {
        const p = proj.data;
        setScope(p.scope);
        setClients(c.data.results || c.data || []);
        setContractors(co.data.results || co.data || []);
        
        // تعبئة البيانات من المشروع الموجود
        setF({
          name: p.name || '',
          project_no: p.project_no || '',
          client: p.client ?? '',
          location: p.location || '',
          description: p.description || '',
          start_date: p.start_date || '',
          duration_days: p.duration_days ?? '',
          priority: p.priority || 'MEDIUM',
          building_type: p.building_type || '',
          floors: p.floors ?? '',
          plot_area: p.plot_area ?? '',
          bua: p.bua ?? '',
          apartments: p.apartments ?? '',
          shops: p.shops ?? '',
          parking: p.parking ?? '',
          application_no: p.application_no || '',
          pin_no: p.pin_no || '',
          owner: p.owner || '',
          supervision_consultant: p.supervision_consultant || '',
          permit_no: p.permit_no || '',
          permit_date: p.permit_date || '',
          permit_deadline: p.permit_deadline || '',
          application_type: p.application_type || '',
          permit_status: p.permit_status || 'NOT_ISSUED',
          offer_status: p.offer_status || 'NOT_SUBMITTED',
          contract_status: p.contract_status || 'NOT_SUBMITTED',
          internal_design_review_required: !!p.internal_design_review_required,
          contractors: (p.contractors || []).map(c => String(c.id || c)),
          design_company: p.design_company || '',
          commencement_status: p.commencement_status || 'PENDING_AUTHORITY',
          newContractor: { name: '', contact_person: '', phone: '', email: '' },
        });
      })
      .catch((err) => {
        setError('تعذّر تحميل المشروع.');
        console.error(err);
      })
      .finally(() => setLoad(false));
  }, [id]);

  const showDesign = scope === 'DESIGN' || scope === 'BOTH';
  const showSup = scope === 'SUPERVISION' || scope === 'BOTH';

  // ✅ دالة مساعدة: تحويل empty string إلى null للحقول الاختيارية
  const cleanValue = (value) => {
    if (value === '' || value === undefined) return null;
    return value;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      // ✅ المقاولون لمشاريع الإشراف فقط (اختيار متعدد)
      let contractorIds = [...f.contractors];
      if (showSup && contractorMode === 'new') {
        if (!f.newContractor.name.trim()) throw new Error('اسم المقاول مطلوب.');
        const co = await createContractor(f.newContractor);
        contractorIds.push(String(co.data.id));
      }

      // ✅ حساب End Date تلقائياً من Start Date + Duration
      const computedEnd = computedEndDate || null;

      // ═══════════════════════════════════════════════════════════════
      // ✅ الـ Payload الكامل — جميع الحقول تُرسل بشكل صحيح
      // ═══════════════════════════════════════════════════════════════
      const payload = {
        // ═══ الحقول الأساسية (Required) ═══
        name: f.name,
        project_no: f.project_no,
        scope: scope,
        client: Number(f.client),
        location: f.location,
        
        // ═══ التواريخ ═══
        start_date: f.start_date || null,
        end_date: computedEnd,  // ✅ End Date المحسوب
        duration_days: f.duration_days ? Number(f.duration_days) : 0,
        
        // ═══ الأولوية ═══
        priority: f.priority,
        
        // ═══ الحقول النصية الاختيارية — تحويل empty string إلى null ═══
        description: cleanValue(f.description),
        building_type: cleanValue(f.building_type),
        
        // ═══ الحقول الرقمية الاختيارية — تحويل empty إلى null ═══
        floors: f.floors !== '' && f.floors !== null ? Number(f.floors) : null,
        plot_area: f.plot_area !== '' && f.plot_area !== null ? Number(f.plot_area) : null,
        bua: f.bua !== '' && f.bua !== null ? Number(f.bua) : null,
        apartments: f.apartments !== '' && f.apartments !== null ? Number(f.apartments) : 0,
        shops: f.shops !== '' && f.shops !== null ? Number(f.shops) : 0,
        parking: cleanValue(f.parking),
        
        // ═══ أرقام الطلبات والتراخيص — كلها حقول نصية اختيارية ═══
        application_no: cleanValue(f.application_no),
        pin_no: cleanValue(f.pin_no),
        application_type: cleanValue(f.application_type),
        owner: cleanValue(f.owner),
        supervision_consultant: cleanValue(f.supervision_consultant),
        permit_no: cleanValue(f.permit_no),
        permit_date: f.permit_date || null,
        permit_deadline: f.permit_deadline || null,
        permit_status: f.permit_status || 'NOT_ISSUED',
        
        // ═══ المقاول (اختياري) ═══
        ...(showSup && contractorIds.length > 0 && { contractors: contractorIds }),
        
        // ═══ بيانات الإشراف الإضافية ═══
        ...(showSup && {
          design_company: cleanValue(f.design_company),
          commencement_status: f.commencement_status,
          internal_design_review_required: f.internal_design_review_required,
        }),
      };

      console.log('📤 Payload sent to backend:', payload);  // ✅ للتصحيح

      await updateProject(id, payload);
      navigate(`/projects/${id}`);
    } catch (err) {
      console.error('❌ Update error:', err.response?.data);
      setError(err.response?.data?.detail || err.message || 'Unable to update the project.');
    } finally { setBusy(false); }
  };

  const activeTone = showSup && !showDesign ? 'amber' : showDesign && !showSup ? 'sky' : 'both';

  // ✅ معاينة End Date = Start + Duration (الحفظ الفعلي يتم في الباك-إند)
  const computedEndDate = (() => {
    if (!f.start_date || !Number(f.duration_days)) return '';
    const d = new Date(f.start_date + 'T00:00:00');
    d.setDate(d.getDate() + Number(f.duration_days));
    return d.toISOString().slice(0, 10);
  })();

  if (loading) {
    return (
      <div className="cp-root">
        <style>{CSS}</style>
        <div className="cp-ambient" aria-hidden />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <div className="cp-spin" />
            <p style={{ marginTop: '16px', fontSize: '14px' }}>جاري تحميل المشروع...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-root">
      <style>{CSS}</style>
      <div className="cp-ambient" aria-hidden />

      <header className="cp-head cp-rv">
        <div>
          <span className="cp-kicker">EDIT PROJECT · {f.project_no || 'Loading...'}</span>
          <h1 className="cp-title">Edit Project</h1>
          <p className="cp-sub">
            {isSecretary
              ? `You are editing as a ${isDesignDept ? 'Design' : 'Supervision'} secretary — you can choose your department or a shared project (Both).`
              : 'Update the project scope and details. Some fields may be locked based on current progress.'}
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
              {s === 'DESIGN' ? 'Design' : s === 'SUPERVISION' ? 'Supervision' : 'Shared (Both)'}
            </button>
          ))}
        </div>

        <div className={`cp-dept-cards ${activeTone}`}>
          <DeptCard tone="sky" Icon={Building2} label="Design" active={showDesign} hint="Offer · Contract" />
          <DeptCard tone="amber" Icon={HardHat} label="Supervision" active={showSup} hint="Contractor · Design Company · Commencement · Internal Review" />
        </div>
      </div>

      {error && (
        <div className="cp-err cp-rv"><AlertTriangle size={16} /> {error}</div>
      )}

      <form onSubmit={submit} className="cp-form">
        {/* ── مشترك دائماً ── */}
        <section className="cp-block cp-rv">
          <h2 className="cp-block-h"><span className="cp-num">01</span> Basic Information</h2>
          <div className="cp-grid">
            <Field label="Description">
              <textarea value={f.description} onChange={set('description')} rows={2} placeholder="Proposed (B+G+3+PH) Residential Building" />
            </Field>
            <Field label="Project Name *"><input required value={f.name} onChange={set('name')} /></Field>
            <Field label="Project Number *"><input required value={f.project_no} onChange={set('project_no')} /></Field>
            <Field label="Client *">
              <select required value={f.client} onChange={set('client')}>
                <option value="">— Select —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Location"><input value={f.location} onChange={set('location')} /></Field>
            <Field label="Start Date"><input type="date" value={f.start_date} onChange={set('start_date')} /></Field>
            <Field label="Duration (Days)"><input type="number" value={f.duration_days} onChange={set('duration_days')} /></Field>
            <Field label="Application Type">
              <select value={f.application_type} onChange={set('application_type')}>
                <option value="">— Select —</option>
                <option value="NEW_PERMIT">New Permit</option>
                <option value="MODIFICATION_PERMIT">Modification Permit</option>
                <option value="COMPLETION_CERTIFICATE">Completion Certificate</option>
                <option value="MAINTENANCE_DEMOLITION">Maintenance and Demolition</option>
              </select>
            </Field>

            <Field label="End Date (Auto)">
              <input type="date" value={computedEndDate} readOnly
                style={{ background: '#f1f5f9', color: '#334155', fontWeight: 600 }} />
            </Field>

            <Field label="Priority">
              <select value={f.priority} onChange={set('priority')}>
                <option value="URGENT">Urgent</option><option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option><option value="LOW">Low</option>
              </select>
            </Field>
            <Field label="Building Type"><input value={f.building_type} onChange={set('building_type')} /></Field>
            <Field label="Floors"><input type="number" value={f.floors} onChange={set('floors')} /></Field>
            <Field label="Plot Area"><input value={f.plot_area} onChange={set('plot_area')} /></Field>
            <Field label="BUA (M²)"><input value={f.bua} onChange={set('bua')} /></Field>
            <Field label="Apartments"><input type="number" value={f.apartments} onChange={set('apartments')} /></Field>
            <Field label="Shops"><input type="number" value={f.shops} onChange={set('shops')} /></Field>
            <Field label="Parking"><input value={f.parking} onChange={set('parking')} /></Field>
            <Field label="Application No."><input value={f.application_no} onChange={set('application_no')} placeholder="N/2026/XXXXXXX" /></Field>
            <Field label="PIN No."><input value={f.pin_no} onChange={set('pin_no')} /></Field>
            {/* ══ الحقول الناقصة ══ */}
            <Field label="Owner"><input value={f.owner} onChange={set('owner')} /></Field>
            <Field label="Supervision Consultant"><input value={f.supervision_consultant} onChange={set('supervision_consultant')} /></Field>
            <Field label="Permit No."><input value={f.permit_no} onChange={set('permit_no')} /></Field>
            <Field label="Permit Date"><input type="date" value={f.permit_date} onChange={set('permit_date')} /></Field>
            <Field label="Permit Deadline"><input type="date" value={f.permit_deadline} onChange={set('permit_deadline')} /></Field>
            <Field label="Permit Status">
              <select value={f.permit_status} onChange={set('permit_status')}>
                <option value="NOT_ISSUED">Not Issued</option>
                <option value="PENDING_AUTHORITY">Pending Authority</option>
                <option value="ISSUED">Approved/Issued</option>
              </select>
            </Field>
            {/* ═════════════════════ */}
          </div>
        </section>

        {/* ── حقول الإشراف والمقاولين ── */}
        {showSup && (
          <section className="cp-block cp-block--amber cp-rv">
            <h2 className="cp-block-h t-amber"><HardHat size={16} /><span className="cp-num">02</span> Supervision Details & Contractors</h2>

            <div className="cp-grid">
              {/* ✅ اختيار المقاولين (Checkboxes + Search) */}
              <div className="cp-contractor" style={{ gridColumn: '1 / -1' }}>
                <div className="cp-mode">
                  <button type="button" className={contractorMode === 'existing' ? 'on' : ''}
                    onClick={() => setContractorMode('existing')}>Registered Contractors</button>
                  <button type="button" className={contractorMode === 'new' ? 'on' : ''}
                    onClick={() => setContractorMode('new')}><UserPlus size={14} /> New Contractor</button>
                </div>
                
                {contractorMode === 'existing' ? (
                  <div className="cp-contractor-select">
                    <div className="cp-search-wrap">
                      <Search size={16} className="cp-search-icon" />
                      <input 
                        type="text" 
                        placeholder="Search contractors..." 
                        value={contractorSearch}
                        onChange={(e) => setContractorSearch(e.target.value)}
                        className="cp-search-input"
                      />
                    </div>
                    <div className="cp-checkbox-list">
                      {sortedContractors.map((c) => {
                        const idStr = String(c.id);
                        const isChecked = f.contractors.includes(idStr);
                        return (
                          <label key={c.id} className={`cp-checkbox-item ${isChecked ? 'checked' : ''}`}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setF(p => ({ ...p, contractors: [...p.contractors, idStr] }));
                                } else {
                                  setF(p => ({ ...p, contractors: p.contractors.filter(cid => cid !== idStr) }));
                                }
                              }}
                            />
                            <span>{c.name}</span>
                          </label>
                        );
                      })}
                      {sortedContractors.length === 0 && (
                        <p className="cp-no-results">No contractors found.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="cp-new-co">
                    <Field label="Contractor Name *"><input value={f.newContractor.name} onChange={setNC('name')} /></Field>
                    <Field label="Contact Person"><input value={f.newContractor.contact_person} onChange={setNC('contact_person')} /></Field>
                    <Field label="Phone"><input value={f.newContractor.phone} onChange={setNC('phone')} /></Field>
                    <Field label="Email"><input type="email" value={f.newContractor.email} onChange={setNC('email')} /></Field>
                  </div>
                )}
              </div>

              <Field label="Design Company">
                <input value={f.design_company} onChange={set('design_company')}
                  placeholder="Name of the company that designed the project" />
              </Field>
              <Field label="Commencement Permit">
                <select value={f.commencement_status} onChange={set('commencement_status')}>
                  <option value="PENDING_AUTHORITY">Pending Authority</option>
                  <option value="ISSUED">Approved/Issued</option>
                </select>
              </Field>
              <label className="cp-check">
                <input type="checkbox" checked={f.internal_design_review_required}
                  onChange={set('internal_design_review_required')} />
                <span>Internal Design Review Required</span>
              </label>
            </div>
          </section>
        )}

        <div className="cp-foot cp-rv">
          <button type="button" className="cp-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" disabled={busy} className="cp-save">
            {busy ? 'Updating…' : <><Edit size={16} /> Update Project</>}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Field({ label, children }) {
  return <label className="cp-field"><span>{label}</span>{children}</label>;
}

export function DeptCard({ tone, Icon, label, active, hint }) {
  return (
    <div className={`cp-dept t-${tone} ${active ? 'live' : 'dim'}`}>
      <Icon size={18} />
      <div>
        <b>{label}</b>
        <span>{active ? hint : 'Not enabled for this scope'}</span>
      </div>
      {active && <i className="cp-pulse" />}
    </div>
  );
}

export const CSS = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

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

.cp-contractor{ 
  margin-top:16px; 
  padding-top:18px; 
  grid-column: 1 / -1; 
}
.cp-new-co{ 
  display:grid; 
  grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); 
  gap:14px; 
  background:#fafafa; 
  padding:16px; 
  border-radius:12px; 
  border:1px solid #e2e8f0; 
}
.cp-mode{ display:inline-flex; gap:5px; background:#f1f5f9; border:1px solid var(--line); padding:4px; border-radius:10px; margin-bottom:16px; }
.cp-mode button{ display:inline-flex; align-items:center; gap:6px; border:none; background:transparent; color:var(--mut);
  font-family:inherit; font-weight:600; font-size:12.5px; padding:7px 14px; border-radius:8px; cursor:pointer; transition:.2s; }
.cp-mode button:hover{ color:var(--paper); }
.cp-mode button.on{ background:#ffffff; color:var(--amber); box-shadow:0 1px 3px rgba(0,0,0,.05); }

/* ✅ Search & Checkbox List Styles */
.cp-contractor-select {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fafafa;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.cp-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.cp-search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}
.cp-search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13.5px;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.cp-search-input:focus {
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
}
.cp-checkbox-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  max-height: 250px;
  overflow-y: auto;
  padding: 4px;
}
.cp-checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13.5px;
  font-weight: 500;
  color: #334155;
}
.cp-checkbox-item:hover {
  border-color: #d97706;
  background: #fffbeb;
}
.cp-checkbox-item.checked {
  border-color: #d97706;
  background: #fef3c7;
  color: #92400e;
  font-weight: 600;
}
.cp-checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #d97706;
  cursor: pointer;
  margin: 0;
}
.cp-no-results {
  grid-column: 1 / -1;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 20px 0;
}

.cp-foot{ display:flex; justify-content:flex-end; gap:12px; }
.cp-ghost{ border:1px solid #cbd5e1; background:#ffffff; color:#334155; border-radius:11px;
  padding:11px 22px; font-family:inherit; font-weight:600; cursor:pointer; transition:.2s; box-shadow:0 1px 2px rgba(0,0,0,.03); }
.cp-ghost:hover{ color:var(--paper); border-color:#94a3b8; background:#f8fafc; }
.cp-save{ display:inline-flex; align-items:center; gap:8px; border:none; background:var(--emerald); color:#ffffff;
  border-radius:11px; padding:11px 26px; font-family:inherit; font-weight:600; font-size:14px; cursor:pointer; transition:.2s; box-shadow:0 2px 4px rgba(5,150,105,.2); }
.cp-save:hover{ filter:brightness(1.05); transform:translateY(-1px); box-shadow:0 4px 6px rgba(5,150,105,.3); }
.cp-save:disabled{ opacity:.6; cursor:not-allowed; transform:none; filter:grayscale(0.5); box-shadow:none; }

.cp-spin{ width:40px; height:40px; border:3px solid #e2e8f0; border-top-color:var(--sky); border-radius:50%;
  animation:cp-spin 1s linear infinite; margin:0 auto; }
@keyframes cp-spin{ to{ transform:rotate(360deg); } }
`;
