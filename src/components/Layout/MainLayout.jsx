import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  DollarSign, Users, FileText, Bell, Search, LogOut,
  ShellIcon, Building2, MessageSquare, Printer,
  PlayCircle, Archive, Clock, TrendingUp, UserX,
  User, ListTodo, Shield, BarChart3, Loader2,HardHat,Menu,FolderOpen
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getGlobalSearch } from '../../api/services/dashboard';
import NotificationBell from './NotificationBell';
import logo from '../../assets/logo.jfif';

// ✅ قائمة أسماء مهندسي الإشراف (من ملف الباك إند)
const SUPERVISION_ENGINEER_USERNAMES = [
  'ahmed.zabady',
  'nader.bekhit', 'syed.mahmoud', 'muhammed.faisal', 'eslam.mahdy',
  'ahmed.yosef', 'saheer.parayil', 'mahmoud.hamed', 'waled.mohamed',
  'ahmed.zaki', 'mohamed.salah', 'loai.hamouda', 'mohamed.elshenawy',
  'ahmed.ghazy', 'muammer.muhammed', 'abdulrahim.ahmed', 'ali.odeh',
  'noufal.thodi', 'mohammed.shemseer', 'mohammed.rashid',
  'mohamed.hisham', 'mohamed.salem',
  'mani.kumar',
  'jocelyn.mallilin', 'allen.guanzon', 'jason.cuison', 'mostafa.zabady',
  'isuru.palliyaguruge', 'faseela.foroth',
];


// ✅ محدثة لتطابق الـ usernames الجديدة في seed_users.py
const DESIGN_TASK_ASSIGNEE_USERNAMES = [
  'salah.ahmad', 'basem.taha', 'vicky.jr', 'mohammad.mostafa',
  'mohammad.alqadi', 'mahmoud.aldemyati', 'abdulhamid.ahmad', 'jan.bina',
  'shaaban.karam', 'basel.shaat', 'israa.omran', 'ahmad.alqadi',
  'yousef.amro', 'salman.saeed', 'shahajan.puthi', 'mohammad.raheem',
  'mohammad.lebbe', 'shammer.pareeth', 'mojib.rahiman', 'md.hossain',
];
const MainLayout = () => {
  const { user, logout, isManagement, isDesignManager, isSupervisionManager, isAccountant, isSecretary } = useAuth();
  const navigate = useNavigate();

  // Search states

const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Actual search logic with delay (Debounce)
  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const response = await getGlobalSearch(query);
        const data = response?.data || response;

        if (data && data.results) {
          const formattedProjects = (data.results.projects || []).map((p) => ({
            id: p.id,
            title: p.name || p.project_no,
            subtitle: 'Project',
            type: 'projects',
          }));

          const formattedTasks = (data.results.tasks || []).map((t) => ({
            id: t.id,
            title: t.title,
            subtitle: 'Task',
            type: 'tasks',
          }));

          const formattedClients = (data.results.clients || []).map((c) => ({
            id: c.id,
            title: c.name,
            subtitle: 'Client',
            type: 'client-directory',
          }));

          setSearchResults([...formattedProjects, ...formattedTasks, ...formattedClients]);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // All links in English
  const menuItems = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard, roles: ['ALL'] },
{
  path: '/projects',
  label: 'Design Projects',
  icon: FolderOpen,
  departments: ['Design'],
  fullAccessRoles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR'],
    allowedUsernames: DESIGN_TASK_ASSIGNEE_USERNAMES,

},
    { path: '/projects/active', label: 'Active Projects', icon: PlayCircle, roles: ['ALL'] },
    { path: '/projects/closed', label: 'Closed Projects', icon: Archive, roles: ['ALL'] },
    { path: '/projects/pending', label: 'Pending Projects', icon: Clock, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM'] },
{
  path: '/supervision/projects',
  label: 'Supervision Projects',
  icon: Building2,
  departments: ['Supervision'],
  fullAccessRoles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR'],
    allowedUsernames: SUPERVISION_ENGINEER_USERNAMES,   // موجودة أصلاً في الملف

},
    { path: '/contractors', label: 'Contractors', icon: Building2, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'ACCOUNTANT', 'SECRETARY'] },
    { path: '/financials', label: 'Financials', icon: DollarSign, roles: ['GM', 'AGM', 'ACCOUNTANT'] },
    { path: '/financials/report', label: 'Financial Report', icon: TrendingUp, roles: ['GM', 'AGM', 'ACCOUNTANT'] },
    { path: '/staff-kpi', label: 'Performance (KPI)', icon: Users, roles: ['GM', 'AGM', 'DESIGN_MGR'] },
    { path: '/client-directory', label: 'Client Directory', icon: Users, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'ACCOUNTANT', 'SECRETARY'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: FileText, roles: ['GM', 'AGM', 'SUP_MGR', 'DESIGN_MGR'] },
    { path: '/replacements', label: 'Replacement Requests', icon: UserX, roles: ['ALL'] },
    { path: '/supervision-team', label: 'Supervision Team', icon: Users, roles: ['SUP_MGR', 'PM'] },
{
  path: '/my-supervision-projects',
  label: 'My Supervision Projects',
  icon: HardHat,
  roles: ['ALL'],
  supervisionUsernames: SUPERVISION_ENGINEER_USERNAMES,  // ✅ يظهر فقط لمهندسي الإشراف
},
    { path: '/review-directory', label: 'Internal Design Review', icon: ShellIcon, roles: ['GM', 'AGM', 'SUP_MGR', 'PM', 'DESIGN_MGR', 'ENGINEER', 'SENIOR_ENG'] },
    { path: '/chat', label: 'Messages', icon: MessageSquare, roles: 'ALL' },
    { path: '/profile', label: 'Profile', icon: User, roles: ['ALL'] },
    { path: '/tasks', label: 'My Tasks', icon: CheckSquare, roles: ['ALL'] },
    { path: '/tasks/all', label: 'All Tasks', icon: ListTodo, roles: ['ALL'] },
    { path: '/admin/staff', label: 'Staff Management', icon: Users, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM'] },
    { path: '/admin/users', label: 'User Management', icon: Shield, roles: ['GM', 'AGM'] },
    { path: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['GM', 'AGM'] },
    { path: '/supervision/external-logs', label: 'External Logs', icon: FileText, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR'] },
    { path: '/reports/export', label: 'Export Reports', icon: Printer, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR'] },
  ];

const filteredMenu = menuItems.filter(item => {
  const isFullAccess = item.fullAccessRoles?.includes(user?.role);
  const isAllowedUsername = item.allowedUsernames?.includes(user?.username);

  const roleCheck = !item.roles || item.roles.includes('ALL') || item.roles.includes(user?.role);
  const hasRole = roleCheck || isFullAccess || isAllowedUsername;

  let hasDepartment = true;
  if (isFullAccess || isAllowedUsername) {
    hasDepartment = true; // اليوزرنيمات الصريحة أو الإدارة بتتجاوز قيد القسم
  } else if (item.department) {
    hasDepartment = item.department === user?.department;
  } else if (item.departments) {
    hasDepartment = item.departments.includes(user?.department);
  }

  return hasRole && hasDepartment;
});
  return (
<div className="flex h-screen bg-gray-100" dir="ltr">
  {/* ✅ خلفية معتمة للموبايل — تقفل القائمة بالضغط عليها */}
  {sidebarOpen && (
    <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
  )}

  {/* Sidebar — منزلق على الموبايل / ثابت على الشاشات الكبيرة */}
  <aside className={`w-64 shadow-md flex flex-col bg-[#0b1f3c] fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0 lg:z-auto`}>
        {/* ICON Logo */}
<div style={{ backgroundColor: '#0b1f3c' }}>
  <div className="p-4 pb-3 flex flex-col items-center">
    <img
      src={logo}
      alt="ICON Consulting Engineering"
      className="w-full max-w-[210px] h-auto object-contain select-none"
      draggable={false}
    />
  </div>
</div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
                onClick={() => setSidebarOpen(false)}   // ✅ يقفل بعد الاختيار على الموبايل

              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-[#16305a] hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1d3a66]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-400 hover:bg-[#16305a] w-full px-4 py-2 rounded-lg transition font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar — full navy background */}
<header className="shadow-sm h-16 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 bg-[#0b1f3c]">
  {/* ✅ زرار القائمة للموبايل فقط — في أقصى الشمال */}
  <button
    className="lg:hidden p-2 rounded-lg text-white hover:bg-[#16305a] transition shrink-0"
    onClick={() => setSidebarOpen(true)}
    aria-label="Open menu"
  >
    <Menu size={22} />
  </button>

  {/* ✅ المساحة الفارغة — تدفع باقي العناصر لليمين */}
  <div className="flex-1" />

  {/* ✅ شريط البحث */}
  <div className="relative w-48 sm:w-64 lg:w-96 shrink-0" ref={searchRef}>
    <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
    <input
      type="text"
      placeholder="Global search (projects, tasks, clients...)"
      className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50 text-gray-900 placeholder-gray-500"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onClick={() => searchQuery.trim() && setShowDropdown(true)}
    />
    {/* Results dropdown */}
    {showDropdown && (
      <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 shadow-xl rounded-lg overflow-hidden z-50 max-h-96 overflow-y-auto" dir="ltr">
        {isSearching ? (
          <div className="p-4 flex items-center justify-center text-gray-500 gap-2">
            <Loader2 size={18} className="animate-spin text-blue-600" />
            <span className="text-sm">Searching...</span>
          </div>
        ) : searchResults.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {searchResults.map((result, idx) => (
              <li
                key={idx}
                className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                onClick={() => {
                  navigate(`/${result.type || 'projects'}/${result.id}`);
                  setShowDropdown(false);
                  setSearchQuery('');
                }}
              >
                <Search size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{result.title || result.name}</p>
                  {result.subtitle && <p className="text-xs text-gray-500">{result.subtitle}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            No results matching "{searchQuery}"
          </div>
        )}
      </div>
    )}
  </div>

  {/* ✅ اسم المستخدم */}
  <div className="text-right border-r pr-2 sm:pr-4 border-[#1d3a66] min-w-0 shrink-0">
    <p className="text-sm font-semibold text-white truncate max-w-[110px] sm:max-w-none">
      {user?.first_name} {user?.last_name}
    </p>
    <p className="text-xs text-gray-300 truncate max-w-[110px] sm:max-w-none">
      {user?.role_display || user?.role}
    </p>
  </div>

  {/* ✅ الجرس في أقصى اليمين (المقدمة) */}
  <NotificationBell />
</header>

        {/* Page Content */}
<main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-gray-50">
            <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
