import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  DollarSign, Users, FileText, Bell, Search, LogOut,
  ShellIcon, Building2, MessageSquare, Printer,
  PlayCircle, Archive, Clock, TrendingUp, UserX,
  User, ListTodo, Shield, BarChart3, Loader2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getGlobalSearch } from '../../api/services/dashboard';
import NotificationBell from './NotificationBell';

const MainLayout = () => {
  const { user, logout, isManagement, isDesignManager, isSupervisionManager, isAccountant, isSecretary } = useAuth();
  const navigate = useNavigate();

  // Search states
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
    { path: '/projects', label: 'Project Directory', icon: FolderKanban, roles: ['ALL'] },
    { path: '/projects/active', label: 'Active Projects', icon: PlayCircle, roles: ['ALL'] },
    { path: '/projects/closed', label: 'Closed Projects', icon: Archive, roles: ['ALL'] },
    { path: '/projects/pending', label: 'Pending Projects', icon: Clock, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM'] },
    { path: '/supervision/projects', label: 'Supervision Projects', icon: Building2, roles: ['SUP_MGR', 'PM', 'GM', 'AGM', 'ENGINEER', 'SENIOR_ENG', 'SECRETARY'] },
    { path: '/contractors', label: 'Contractors', icon: Building2, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'ACCOUNTANT', 'SECRETARY'] },
    { path: '/financials', label: 'Financials', icon: DollarSign, roles: ['GM', 'AGM', 'ACCOUNTANT'] },
    { path: '/financials/report', label: 'Financial Report', icon: TrendingUp, roles: ['GM', 'AGM', 'ACCOUNTANT'] },
    { path: '/staff-kpi', label: 'Performance (KPI)', icon: Users, roles: ['GM', 'AGM', 'DESIGN_MGR'] },
    { path: '/client-directory', label: 'Client Directory', icon: Users, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'ACCOUNTANT', 'SECRETARY'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: FileText, roles: ['GM', 'AGM', 'SUP_MGR', 'DESIGN_MGR'] },
    { path: '/replacements', label: 'Replacement Requests', icon: UserX, roles: ['ALL'] },
    { path: '/supervision-team', label: 'Supervision Team', icon: Users, roles: ['SUP_MGR', 'PM', 'GM', 'AGM'] },
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

  const filteredMenu = menuItems.filter(item =>
    item.roles.includes('ALL') || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-gray-100" dir="ltr">
      {/* Sidebar — full navy background */}
      <aside className="w-64 shadow-md flex flex-col bg-[#0b1f3c]">
        {/* ICON Logo */}
        <div style={{ backgroundColor: '#0b1f3c' }}>
          <div className="p-4 pb-3 flex flex-col items-center">
            <div className="flex items-center justify-center">
              <span style={{ color: '#ffffff', fontSize: '40px', fontWeight: 300, letterSpacing: '2px' }}>I</span>

              <span style={{ color: '#ffffff', fontSize: '40px', fontWeight: 300, letterSpacing: '2px' }}>C</span>

                           <span
                style={{
                  display: 'inline-block',
                  width: '26px',
                  height: '32px',
                  border: '3px solid #e5e32a',
                  borderRadius: '10px',
                  margin: '0 5px',
                }}
              /> 
              <span style={{ color: '#ffffff', fontSize: '40px', fontWeight: 300, letterSpacing: '2px' }}>N</span>
            </div>
            <span style={{ color: '#ffffff', fontSize: '10px', letterSpacing: '3px', marginTop: '6px' }}>
              CONSULTING ENGINEERING
            </span>
          </div>
          <div style={{ height: '4px', backgroundColor: '#e5e32a' }} />
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
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
        <header className="shadow-sm h-16 flex items-center justify-between px-6 bg-[#0b1f3c]">
          {/* Search container and dropdown */}
          <div className="relative w-96" ref={searchRef}>
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

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right border-r pr-4 border-[#1d3a66]">
              <p className="text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-300">{user?.role_display || user?.role}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
