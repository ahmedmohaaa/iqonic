import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, CheckCircle2, Eye, ArrowRight } from 'lucide-react';
import apiClient from '../../api/axios';

const ReviewDirectory = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('internal-review/active-projects/')
      .then((res) => {
        const d = res.data;
        setProjects(Array.isArray(d) ? d : (d.results || d.projects || []));
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rvd">
      <style>{DIR_CSS}</style>

      <header className="rvd-head">
        <ClipboardCheck size={26} />
        <div>
          <h1>دليل المراجعة التصميمية الداخلية</h1>
          <p>كل مشاريع الإشراف التي تم تفعيل المراجعة الداخلية عليها.</p>
        </div>
      </header>

      {loading ? (
        <p className="rvd-empty">جارٍ التحميل…</p>
      ) : projects.length === 0 ? (
        <p className="rvd-empty">لا توجد مشاريع مراجعة حاليًا.</p>
      ) : (
        <div className="rvd-grid">
          {projects.map((p) => {
            const prog = p.internal_review_progress || { approved: 0, total: 0, percentage: 0 };
            return (
              <div key={p.id} className="rvd-card">
                <div className="rvd-card-top">
                  <b>{p.project_no}</b>
                  <span>{p.name}</span>
                </div>
                <div className="rvd-prog"><span style={{ width: `${prog.percentage}%` }} /></div>
                <div className="rvd-card-foot">
                  <span>{prog.approved}/{prog.total} معتمَدة</span>
                  {prog.all_approved ? <CheckCircle2 size={15} className="ok" /> : <Eye size={15} />}
                </div>
                <Link to={`/projects/${p.id}`} className="rvd-details">
                  تفاصيل المشروع <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DIR_CSS = `
.rvd{ padding:26px clamp(14px,3vw,40px); font-family:'IBM Plex Sans Arabic',sans-serif; color:#0f172a; }
.rvd-head{ display:flex; gap:12px; align-items:center; margin-bottom:20px; }
.rvd-head svg{ color:#7c3aed; }
.rvd-head h1{ font-size:22px; font-weight:700; margin:0; }
.rvd-head p{ margin:2px 0 0; color:#64748b; font-size:13px; }
.rvd-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
.rvd-card{ background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:16px; display:flex; flex-direction:column; gap:10px; box-shadow:0 2px 4px rgba(0,0,0,.03); transition:.2s; }
.rvd-card:hover{ border-color:#c4b5fd; box-shadow:0 6px 14px rgba(124,58,237,.08); }
.rvd-card-top b{ display:block; font-size:14px; }
.rvd-card-top span{ font-size:12px; color:#64748b; }
.rvd-prog{ height:6px; background:#eef2f7; border-radius:99px; overflow:hidden; }
.rvd-prog span{ display:block; height:100%; background:#7c3aed; border-radius:99px; transition:width .4s; }
.rvd-card-foot{ display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#475569; }
.rvd-card-foot .ok{ color:#059669; }
.rvd-details{ display:inline-flex; align-items:center; justify-content:center; gap:6px; background:#0f172a; color:#fff; border-radius:10px; padding:8px 12px; font-size:12.5px; font-weight:600; text-decoration:none; transition:.2s; }
.rvd-details:hover{ background:#7c3aed; }
.rvd-empty{ color:#64748b; text-align:center; padding:40px 0; }
`;

export default ReviewDirectory;