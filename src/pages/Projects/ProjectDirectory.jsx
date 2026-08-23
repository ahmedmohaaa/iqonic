import { useState, useEffect, useMemo } from 'react';
import { getGlobalFilterProjects } from '../../api/services/projects';
import GlobalFilterBar from '../../components/GlobalFilterBar';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, Plus, Clock, Flag, Edit, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProjectDirectory = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1); // تم إضافتها لتتوافق مع بناء الباراميترات

  const roleString = String(user?.role || user?.groups?.[0] || user?.user_type || '').toUpperCase();

  // ✅ كل الفلاتر بتتبعت كاملة بدون استثناء (permit_status / stage / scope / ...)
  const params = useMemo(() => {
    const p = { page: currentPage };
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v != null) p[k] = v;
    });
    return p;
  }, [filters, currentPage]);

  const paramsKey = JSON.stringify(params); // مفتاح ثابت يمنع اللوبات والتعليق

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getGlobalFilterProjects(params)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        setProjects(data?.results ?? data ?? []);
      })
      .catch(() => { if (!cancelled) setProjects([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const getSortedProjects = (projectsList) => {
    const priorityWeights = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    return [...projectsList].sort((a, b) => {
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      const priorityA = priorityWeights[a.priority?.toUpperCase()] || 5;
      const priorityB = priorityWeights[b.priority?.toUpperCase()] || 5;
      return priorityA - priorityB;
    });
  };

  const isSecretary = roleString.includes('SECRETARY') || roleString.includes('سكرتير');

  if (loading) return <div>Loading Projects...</div>;

  const sortedProjects = getSortedProjects(projects);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">قائمة المشاريع</h1>
        {isSecretary && (
          <Link
            to="/projects/create"
            className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center hover:bg-blue-900 transition"
          >
            <Plus size={18} className="mr-1" /> مشروع جديد
          </Link>
        )}
      </div>

      {/* ═══ الفلتر ═══ */}
      <div className="mb-6">
        <GlobalFilterBar onFilterChange={handleFilterChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow shadow-lg transition flex flex-col border-t-4 border-primary hover:shadow-xl"
          >
            <Link to={`/projects/${project.id}`} className="p-5 block grow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.project_no}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    project.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {project.is_active ? 'Active' : 'Closed'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-semibold">Client:</span>{' '}
                  {project.client_name}
                </p>
                <p>
                  <span className="font-semibold">Scope:</span> {project.scope}
                </p>
                <div className="flex items-center text-gray-500">
                  <Calendar size={14} className="mr-1" />
                  <span>Start: {project.start_date || 'TBD'}</span>
                </div>
              </div>
              {project.priority && project.is_active && (
                <div
                  className={`mt-3 flex items-center text-sm font-semibold ${
                    project.priority.toUpperCase() === 'URGENT'
                      ? 'text-red-600'
                      : project.priority.toUpperCase() === 'HIGH'
                      ? 'text-orange-500'
                      : project.priority.toUpperCase() === 'MEDIUM'
                      ? 'text-yellow-600'
                      : 'text-blue-500'
                  }`}
                >
                  <AlertCircle size={16} className="mr-1" />{' '}
                  {project.priority} Priority
                </div>
              )}
            </Link>
            <div className="border-t border-gray-100 p-3 bg-gray-50 flex flex-col gap-2 rounded-b-lg">
              <Link
                to={`/projects/${project.id}`}
                className="flex justify-center items-center gap-1 px-3 py-2 text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition w-full"
              >
                <Eye size={14} /> Project Details
              </Link>
              <div className="flex justify-between gap-2 pt-1 border-t border-gray-200">
                <Link
                  to={`/projects/${project.id}/timeline`}
                  className="flex flex-1 justify-center items-center gap-1 px-2 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition"
                >
                  <Clock size={14} /> Timeline
                </Link>
                <Link
                  to={`/projects/${project.id}/priority`}
                  className="flex flex-1 justify-center items-center gap-1 px-2 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 rounded transition"
                >
                  <Flag size={14} /> Priority
                </Link>
                {isSecretary && (
                  <Link
                    to={`/projects/${project.id}/edit`}
                    className="flex flex-1 justify-center items-center gap-1 px-2 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 rounded transition"
                  >
                    <Edit size={14} /> Edit
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectDirectory;