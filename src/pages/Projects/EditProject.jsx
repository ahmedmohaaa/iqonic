import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, HardHat, Users, UserPlus, AlertTriangle, Save } from 'lucide-react';
import apiClient from '../../api/axios';
import { CSS as CP_CSS, Field, DeptCard } from './CreateProject';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [contractorMode, setContractorMode] = useState('existing');
  const [scope, setScope] = useState('DESIGN');

  const [f, setF] = useState({
    name: '', project_no: '', client: '', location: '', description: '',
    start_date: '', duration_days: '', priority: 'MEDIUM', building_type: '',
    floors: '', plot_area: '', bua: '', apartments: '', shops: '', parking: '',
    application_no: '', pin_no: '', owner: '', supervision_consultant: '',
    permit_no: '', permit_date: '', permit_deadline: '', permit_status: 'NOT_ISSUED',
    contractor: '', design_company: '', commencement_status: 'PENDING_AUTHORITY',
    internal_design_review_required: false,
    newContractor: { name: '', contact_person: '', phone: '', email: '' },
  });
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((p) => ({ ...p, [k]: v }));
  };
  const setNC = (k) => (e) =>
    setF((p) => ({ ...p, newContractor: { ...p.newContractor, [k]: e.target.value } }));

  // ═══ تحميل المشروع + القوائم ═══
  useEffect(() => {
    Promise.all([
      apiClient.get(`projects/${id}/`),
      apiClient.get('clients/'),
      apiClient.get('contractors/'),
    ])
      .then(([p, c, co]) => {
        const proj = p.data;
        setScope(proj.scope);
        setClients(c.data.results || c.data || []);
        setContractors(co.data.results || co.data || []);
        setF((prev) => ({
          ...prev,
          name: proj.name || '', project_no: proj.project_no || '',
          client: proj.client ?? '', location: proj.location || '',
          description: proj.description || '', start_date: proj.start_date || '',
          duration_days: proj.duration_days ?? '', priority: proj.priority || 'MEDIUM',
          building_type: proj.building_type || '',
          floors: proj.floors || '', plot_area: proj.plot_area || '', bua: proj.bua || '',
          apartments: proj.apartments ?? '', shops: proj.shops ?? '', parking: proj.parking || '',
          application_no: proj.application_no || '', pin_no: proj.pin_no || '',
          owner: proj.owner || '', supervision_consultant: proj.supervision_consultant || '',
          permit_no: proj.permit_no || '', permit_date: proj.permit_date || '',
          permit_deadline: proj.permit_deadline || '', permit_status: proj.permit_status || 'NOT_ISSUED',
          contractor: proj.contractor ?? '', design_company: proj.design_company || '',
          commencement_status: proj.commencement_status || 'PENDING_AUTHORITY',
          internal_design_review_required: !!proj.internal_design_review_required,
        }));
      })
      .catch(() => setError('تعذّر تحميل المشروع.'))
      .finally(() => setLoading(false));
  }, [id]);

  const showDesign = scope === 'DESIGN' || scope === 'BOTH';
  const showSup = scope === 'SUPERVISION' || scope === 'BOTH';

  // ═══ الحفظ (نفس حقول الإنشاء تمامًا) ═══
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      let contractorId = f.contractor || null;
      if (contractorMode === 'new') {
        const res = await apiClient.post('contractors/', { ...f.newContractor });
        contractorId = res.data.id;
      }
      const payload = {
        name: f.name, project_no: f.project_no, scope,
        client: Number(f.client), location: f.location, description: f.description,
        start_date: f.start_date || null,
        duration_days: f.duration_days ? Number(f.duration_days) : 0,
        priority: f.priority, building_type: f.building_type,
        floors: f.floors || null,
        plot_area: f.plot_area || null,
        bua: f.bua || null,
        apartments: f.apartments ? Number(f.apartments) : 0,
        shops: f.shops ? Number(f.shops) : 0,
        parking: f.parking || null,
        application_no: f.application_no || null,
        pin_no: f.pin_no || null,
        owner: f.owner || null,
        supervision_consultant: f.supervision_consultant || null,
        permit_no: f.permit_no || null,
        permit_date: f.permit_date || null,
        permit_deadline: f.permit_deadline || null,
        permit_status: f.permit_status,
        contractor: contractorId || null,
        ...(showSup && {
          design_company: f.design_company || null,
          commencement_status: f.commencement_status,
          internal_design_review_required: f.internal_design_review_required,
        }),
      };
      await apiClient.patch(`projects/${id}/update/`, payload);
      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'تعذّر حفظ التعديلات.');
    } finally { setBusy(false); }
  };

  return (
    <div className="cp-root">
      <style>{CP_CSS}</style>
      <div className="cp-ambient" aria-hidden />

      <header className="cp-head cp-rv">
        <div>
          <span className="cp-kicker">EDIT PROJECT · e</span>
          <h1 className="cp-title">Edit Project</h1>
          <p className="cp-sub">Same fields as the creation page — the scope is fixed from the moment of creation.</p>
        </div>
        <div className="cp-scope">
          {['DESIGN', 'SUPERVISION', 'BOTH'].map((s) => (
            <button key={s} type="button" disabled className={`cp-scope-btn ${scope === s ? 'on' : ''}`}>
              {s === 'DESIGN' ? 'Design' : s === 'SUPERVISION' ? 'Supervision' : 'Both'}
            </button>
          ))}
        </div>
      </header>

      <div className="cp-dept-cards cp-rv">
        <DeptCard tone="sky" Icon={Building2} label="Design" active={showDesign} hint="Cases of offer/contract are managed by the administration secretary from the project page" />
        <DeptCard tone="amber" Icon={HardHat} label="Supervision" active={showSup} hint="Design company + commencement of implementation + internal review" />
      </div>

      <form className="cp-form" onSubmit={submit}>
        {/* ── 01 البيانات الأساسية ── */}
        <section className="cp-block cp-rv">
          <h2 className="cp-block-h"><span className="cp-num">01</span> Basic Information</h2>
          <div className="cp-grid">
            <Field label="Project Name *"><input required value={f.name} onChange={set('name')} /></Field>
            <Field label="Project Number *"><input required value={f.project_no} onChange={set('project_no')} /></Field>
            <Field label="Client *">
              <select required value={f.client} onChange={set('client')}>
                <option value="">— Choose —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Location"><input value={f.location} onChange={set('location')} /></Field>
            <Field label="Start Date"><input type="date" value={f.start_date} onChange={set('start_date')} /></Field>
            <Field label="Duration (Days)"><input type="number" value={f.duration_days} onChange={set('duration_days')} /></Field>
            <Field label="Priority">
              <select value={f.priority} onChange={set('priority')}>
                <option value="URGENT">Urgent</option><option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option><option value="LOW">Low</option>
              </select>
            </Field>
            <Field label="Building Type"><input value={f.building_type} onChange={set('building_type')} /></Field>
                        <Field label="Floors"><input value={f.floors} onChange={set('floors')} /></Field>
            <Field label="Plot Area"><input value={f.plot_area} onChange={set('plot_area')} /></Field>
            <Field label="BUA"><input value={f.bua} onChange={set('bua')} /></Field>
            <Field label="Apartments"><input type="number" value={f.apartments} onChange={set('apartments')} /></Field>

            <Field label="Shops"><input type="number" value={f.shops} onChange={set('shops')} /></Field>
            <Field label="Parking"><input type="number" value={f.parking} onChange={set('parking')} /></Field>
            <Field label="Application No."><input value={f.application_no} onChange={set('application_no')} /></Field>
            <Field label="PIN No."><input value={f.pin_no} onChange={set('pin_no')} /></Field>
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
            <Field label="Description">
              <textarea value={f.description} onChange={set('description')} rows={2} />
            </Field>
          </div>
        </section>

        {/* ── 02 المقاول (لكل النطاقات) ── */}
        <section className="cp-block cp-rv">
          <h2 className="cp-block-h"><HardHat size={16} /><span className="cp-num">02</span> Contractor</h2>
          <div className="cp-contractor">
            <div className="cp-mode">
              <button type="button" className={contractorMode === 'existing' ? 'on' : ''} onClick={() => setContractorMode('existing')}>
                <Users size={14} /> Existing Contractor
              </button>
              <button type="button" className={contractorMode === 'new' ? 'on' : ''} onClick={() => setContractorMode('new')}>
                <UserPlus size={14} /> New Contractor
              </button>
            </div>
            {contractorMode === 'existing' ? (
              <Field label="Choose Contractor">
                <select value={f.contractor} onChange={set('contractor')}>
                  <option value="">— Choose —</option>
                  {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            ) : (
              <div className="cp-new-co">
                <Field label="Contractor Name *"><input value={f.newContractor.name} onChange={setNC('name')} /></Field>
                <Field label="Contact Person"><input value={f.newContractor.contact_person} onChange={setNC('contact_person')} /></Field>
                <Field label="Phone"><input value={f.newContractor.phone} onChange={setNC('phone')} /></Field>
                <Field label="Email"><input type="email" value={f.newContractor.email} onChange={setNC('email')} /></Field>
              </div>
            )}
          </div>
        </section>

        {/* ── 03 بيانات الإشراف (SUPERVISION / BOTH فقط) ── */}
        {showSup && (
          <section className="cp-block cp-block--amber cp-rv">
            <h2 className="cp-block-h t-amber"><HardHat size={16} /><span className="cp-num">03</span> بيانات الإشراف</h2>
            <div className="cp-grid">
              <Field label="شركة التصميم (Design Company)">
                <input value={f.design_company} onChange={set('design_company')} />
              </Field>
              <Field label="تصريح بدء التنفيذ (Commencement)">
                <select value={f.commencement_status} onChange={set('commencement_status')}>
                  <option value="NOT_ISSUED">لم يصدر</option>
                  <option value="PENDING_AUTHORITY">لدى الجهة</option>
                  <option value="ISSUED">صادر</option>
                </select>
              </Field>
              <label className="cp-check">
                <input type="checkbox" checked={f.internal_design_review_required} onChange={set('internal_design_review_required')} />
                Requires Internal Design Review
              </label>
            </div>
          </section>
        )}

        {/* ── الفوتر ── */}
        <div className="cp-foot cp-rv">
          {error && <div className="cp-err"><AlertTriangle size={14} /> {error}</div>}
          <button className="cp-save" disabled={busy || loading} type="submit">
            <Save size={16} /> {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProject;

