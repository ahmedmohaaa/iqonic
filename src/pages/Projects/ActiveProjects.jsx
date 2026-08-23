import { useState, useEffect } from 'react';
import { getGlobalFilterProjects } from '../../api/services/projects';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, Search, Filter, Loader, 
  Flag, Calendar, AlertCircle, TrendingUp, 
  Clock, Edit, Eye 
} from 'lucide-react';
import GlobalFilterBar from '../../components/GlobalFilterBar';

const ActiveProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    scope: '',
    priority: '',
    permit_status: '',
    stage: '',
    start_date_from: '',
    start_date_to: '',
    q: '',
  });
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [currentPage, setCurrentPage] = useState(1);

  // ------------------------------------------------------------------------
  // نظام شامل للتحقق من الصلاحيات (يقرأ كل بيانات المستخدم للبحث عن المنصب)
  // ------------------------------------------------------------------------
  const checkPermissions = () => {
    if (!user) return false;
    
    // 1. التحقق من الصلاحيات المباشرة (إن وجدت)
    if (user.is_superuser || user.is_staff || user.is_manager || user.isAdmin) return true;

    // 2. تحويل جميع بيانات المستخدم لنص للبحث فيها (يحل مشكلة البيانات المتداخلة)
    const userDataString = JSON.stringify(user).toLowerCase();
    
    // قائمة الكلمات الدلالية للمناصب المسموح لها
    const allowedRoles = [
      'manager', 'assistant', 'secretary', 'admin',
      'مدير', 'مساعد', 'سكرتير', 'سكرتيرة'
    ];
    
    // إذا كان نص بيانات المستخدم يحتوي على أي كلمة من القائمة السابقة، سيتم إظهار الأزرار
    return allowedRoles.some(role => userDataString.includes(role));
  };

  const hasActionPermissions = checkPermissions();
  // ✅ زر التعديل لا يظهر لناصر (GM) ولا نسرين (AGM)
const canEditProject = !['GM', 'AGM'].includes(user?.role);
  // ------------------------------------------------------------------------

  useEffect(() => {
    fetchProjects();
  }, [filters, currentPage]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = { 
        ...filters, 
        is_active: 'true',
        page: currentPage,
      };
      
      const res = await getGlobalFilterProjects(params);
      setProjects(res.data.results || res.data);
      setPagination({
        count: res.data.count || 0,
        next: res.data.next,
        previous: res.data.previous,
      });
    } catch (err) {
      console.error('Failed to fetch active projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // دالة لترتيب المشاريع محلياً (نشط أولاً، ثم حسب الأولوية URGENT -> LOW)
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

  const sortedProjects = getSortedProjects(projects);
  const totalPages = Math.ceil(pagination.count / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FolderKanban className="mr-2 text-primary" size={28} />
            Active Projects
          </h1>
          <p className="text-sm text-gray-500">
            Showing active projects sorted by priority
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg flex items-center">
          <TrendingUp className="text-green-600 mr-2" size={18} />
          <span className="text-sm text-green-800 font-semibold">
            {pagination.count} Active Project{pagination.count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Global Filter Bar */}
      <GlobalFilterBar onFilterChange={handleFilterChange} initialFilters={filters} />

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <FolderKanban className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No active projects found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map(project => (
            <div key={project.id} className="bg-white rounded-lg shadow transition flex flex-col border-t-4 border-primary hover:shadow-xl">
              
              {/* تفاصيل المشروع */}
              <div className="p-5 block grow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.project_no}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${project.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {project.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold">Client:</span> {project.client_name}</p>
                  <p><span className="font-semibold">Scope:</span> {project.scope}</p>
                  <div className="flex items-center text-gray-500">
                    <Calendar size={14} className="mr-1" />
                    <span>Start: {project.start_date || 'TBD'}</span>
                  </div>
                </div>

                {/* شارة الأولوية */}
                {project.priority && (
                  <div className={`mt-3 flex items-center text-sm font-semibold ${
                    project.priority.toUpperCase() === 'URGENT' ? 'text-red-600' :
                    project.priority.toUpperCase() === 'HIGH' ? 'text-orange-500' :
                    project.priority.toUpperCase() === 'MEDIUM' ? 'text-yellow-600' :
                    'text-blue-500'
                  }`}>
                    <AlertCircle size={16} className="mr-1" /> {project.priority} Priority
                  </div>
                )}
              </div>

              {/* قسم الأزرار */}
              <div className="border-t border-gray-100 p-3 bg-gray-50 flex flex-col gap-2 rounded-b-lg">
                
                {/* زر التفاصيل للجميع */}
                <Link 
                  to={`/projects/${project.id}`}
                  className="flex justify-center items-center gap-1 px-3 py-2 text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition w-full"
                >
                  <Eye size={14} /> Project Details
                </Link>

                {/* أزرار الإدارة المخصصة (تظهر للمدير والمساعد والسكرتارية فقط) */}
                {hasActionPermissions && (
                  <div className="flex justify-between gap-2 pt-1 border-t border-gray-200 mt-1">
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

  {canEditProject && (
                  <Link 
                      to={`/projects/${project.id}/edit`}
                      className="flex flex-1 justify-center items-center gap-1 px-2 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 rounded transition"
                    >
                      <Edit size={14} /> Edit
                    </Link>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.previous}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!pagination.next}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveProjects;


