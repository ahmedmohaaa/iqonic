import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import { ClipboardCheck, Eye, CheckCircle2, Circle, ChevronLeft } from 'lucide-react';

export default function ReviewDirectory() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSupMgr = ['SUP_MGR', 'PM', 'GM', 'AGM'].includes(user?.role);

  useEffect(() => {
    apiClient.get('projects/', { params: { scope: 'SUPERVISION', internal_review: 'true', page_size: 100 } })
      .then((r) => {
        let list = r.data.results || r.data || [];
        // المهندس يرى فقط ما عُيّن له
        if (!isSupMgr && user?.role !== 'DESIGN_MGR') {
          list = list.filter((p) => (p.internal_review_assignees || []).some((a) => a.id === user.id));
        }
        setProjects(list);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [isSupMgr, user]);

  return (
    <div className="rvd">
      <style>{DIR_CSS}</style>
      <header className="rvd-head">
        <ClipboardCheck size={26} />
        <div>
          <h1>دليل المراجعة التصميمية الداخلية</h1>
          <p>{isSupMgr ? 'كل مشاريع الإشراف التي تطلب مراجعة — للمتابعة.' : 'المشاريع المعيَّن لك مراجعتها.'}</p>
        </div>
      </header>
      {loading ? <p className="rvd-empty">جارٍ التحميل…</p>
        : projects.length === 0 ? <p className="rvd-empty">لا مشاريع مراجعة.</p>
        : <div className="rvd-grid">{projects.map((p) => {
            const prog = p.internal_review_progress || { approved: 0, total: 0, percentage: 0 };
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="rvd-card">
                <div className="rvd-card-top"><b>{p.project_no}</b><span>{p.name}</span></div>
                <div className="rvd-prog"><span style={{ width: `${prog.percentage}%` }} /></div>
                <div className="rvd-card-foot">
                  <span>{prog.approved}/{prog.total} معتمَدة</span>
                  {prog.all_approved ? <CheckCircle2 size={15} className="ok" /> : <Eye size={15} />}
                </div>
              </Link>
            );
          })}</div>}
    </div>
  );
}
const DIR_CSS = `
.rvd{ padding:26px clamp(16px,3vw,40px); color:#0f172a; font-family:'IBM Plex Sans Arabic','Space Grotesk',sans-serif; background:linear-gradient(180deg, #f8fafc, #f1f5f9); min-height:100vh; }
.rvd-head{ display:flex; align-items:center; gap:14px; margin-bottom:22px; }
.rvd-head svg{ color:#7c3aed; } 
.rvd-head h1{ font-family:'Space Grotesk','IBM Plex Sans Arabic'; font-size:26px; font-weight:700; margin:0; color:#0f172a; }
.rvd-head p{ color:#64748b; font-size:13px; margin:3px 0 0; font-weight:500; }
.rvd-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
.rvd-card{ display:flex; flex-direction:column; gap:12px; padding:18px; border:1px solid #e2e8f0; border-radius:14px; background:#ffffff; text-decoration:none; color:inherit; transition:transform .3s, border-color .3s, box-shadow .3s; box-shadow:0 2px 4px rgba(0,0,0,.02); }
.rvd-card:hover{ transform:translateY(-3px); border-color:rgba(124,58,237,.4); box-shadow:0 6px 12px -2px rgba(0,0,0,.05); }
.rvd-card-top b{ font-family:'JetBrains Mono'; color:#d97706; font-size:12px; font-weight:700; } 
.rvd-card-top span{ display:block; font-weight:600; margin-top:4px; color:#1e293b; font-size:14px; }
.rvd-prog{ height:6px; border-radius:99px; background:#f1f5f9; border:1px solid #e2e8f0; overflow:hidden; }
.rvd-prog span{ display:block; height:100%; background:linear-gradient(90deg,#0284c7,#059669); transition:width .8s; }
.rvd-card-foot{ display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#64748b; font-weight:500; }
.rvd-card-foot .ok{ color:#059669; }
.rvd-empty{ color:#64748b; padding:40px; text-align:center; font-weight:500; }
`;