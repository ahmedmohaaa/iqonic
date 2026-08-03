import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, FolderKanban, CheckSquare, 
  DollarSign, Users, FileText, Bell, Search, LogOut, 
  ShellIcon, Building2, MessageSquare, Printer, 
  PlayCircle, Archive, Clock, TrendingUp, UserX, 
  User, ListTodo, Shield, BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { getGlobalSearch } from '../../api/services/dashboard';
import NotificationBell from './NotificationBell';

const MainLayout = () => {
  const { user, logout, isManagement, isDesignManager, isSupervisionManager, isAccountant, isSecretary } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // جميع الروابط الآن باللغة العربية
  const menuItems = [
    { path: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard, roles: ['ALL'] },
    { path: '/projects', label: 'دليل المشاريع', icon: FolderKanban, roles: ['ALL'] },
    { path: '/projects/active', label: 'المشاريع النشطة', icon: PlayCircle, roles: ['ALL'] },
    { path: '/projects/closed', label: 'المشاريع المغلقة', icon: Archive, roles: ['ALL'] },
    { path: '/projects/pending', label: 'المشاريع المعلقة', icon: Clock, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM'] },
    { path: '/supervision/projects', label: 'مشاريع الإشراف', icon: Building2, roles: ['SUP_MGR', 'PM', 'GM', 'AGM', 'ENGINEER', 'SENIOR_ENG', 'SECRETARY'] },
    { path: '/contractors', label: 'المقاولون', icon: Building2, roles: ['ALL'] },
    { path: '/financials', label: 'المالية', icon: DollarSign, roles: ['GM', 'AGM', 'ACCOUNTANT'] },
    { path: '/financials/report', label: 'التقرير المالي', icon: TrendingUp, roles: ['GM', 'AGM', 'ACCOUNTANT'] },
    { path: '/staff-kpi', label: 'تقييم الأداء (KPI)', icon: Users, roles: ['GM', 'AGM', 'DESIGN_MGR'] },
    { path: '/client-directory', label: 'دليل العملاء', icon: Users, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'ACCOUNTANT'] },
    { path: '/audit-logs', label: 'سجلات التدقيق', icon: FileText, roles: ['GM', 'AGM','SUP_MGR','DESIGN_MGR'] },
    { path: '/replacements', label: 'طلبات الاستبدال', icon: UserX, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM'] },  
    { path: '/supervision-team', label: 'فريق الإشراف', icon: Users, roles: ['SUP_MGR', 'PM', 'GM', 'AGM'] },
    { path: '/review-directory', label: 'مراجعة التصميم الداخلية', icon: ShellIcon, roles: ['GM', 'AGM', 'SUP_MGR', 'PM', 'DESIGN_MGR', 'ENGINEER', 'SENIOR_ENG'] },
    { path: '/chat', label: 'المراسلات', icon: MessageSquare, roles: 'ALL' },
    { path: '/profile', label: 'الملف الشخصي', icon: User, roles: ['ALL'] },
    { path: '/tasks', label: 'مهامي', icon: CheckSquare, roles: ['ALL'] },
    { path: '/tasks/all', label: 'كل المهام', icon: ListTodo, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'SENIOR_ENG'] },
    { path: '/admin/staff', label: 'إدارة الموظفين', icon: Users, roles: ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM'] },
    { path: '/admin/users', label: 'إدارة المستخدمين', icon: Shield, roles: ['GM', 'AGM'] },
    { path: '/admin/reports', label: 'التقارير والتحليلات', icon: BarChart3, roles: ['GM', 'AGM', 'ACCOUNTANT'] },
    { path: '/supervision/external-logs', label: 'السجلات الخارجية', icon: FileText, roles: ['SUP_MGR', 'PM', 'ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN', 'SECRETARY'] },
    { path: '/reports', label: 'التقارير', icon: BarChart3, roles: ['GM','AGM','DESIGN_MGR','SUP_MGR','ACCOUNTANT'] },
    { path: '/reports/export', label: 'تصدير التقارير', icon: Printer, roles: ['GM','AGM','DESIGN_MGR','SUP_MGR','ACCOUNTANT'] },
  ];

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes('ALL') || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-gray-100" dir="ltr">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b font-bold text-xl text-blue-600 text-center">نظام الإدارة</div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                // تم استبدال bg-primary بـ bg-blue-600 واستخدام gap-3 للتوافق مع العربي
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium ${
                  isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 hover:bg-red-50 w-full px-4 py-2 rounded-lg transition font-medium">
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <div className="relative w-96">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="بحث عام (مشاريع، مهام، عملاء...)"
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            
            <div className="text-right border-r pr-4 border-gray-200">
              <p className="text-sm font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-500">{user?.role_display || user?.role}</p>
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