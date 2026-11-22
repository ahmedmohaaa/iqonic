import { useState, useEffect } from 'react';
import { getDashboardData } from '../api/services/dashboard';
import { useAuth } from '../context/AuthContext';
import { Folder, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { user, isAccountant } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboardData().then(res => setData(res.data));
  }, []);

  if (!data) return <div>Loading Dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{data.welcome_message}</h1>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* ✅ بيعد حسب القسم: تصميم للمصمم، إشراف للمشرف، والكل للمدراء */}
        <MetricCard icon={Folder} title="Active Projects" value={data.metrics.active_projects} color="blue" />
        {/* ✅ بدل Completed → Approved */}
        <MetricCard icon={CheckCircle} title="My Approved Tasks" value={data.metrics.my_approved_tasks} color="green" />
        {/* ✅ كل المهام ما عدا المعتمدة */}
        <MetricCard icon={Clock} title="Pending Tasks" value={data.metrics.my_pending_tasks} color="yellow" />
        <MetricCard icon={AlertTriangle} title="Unread Notifications" value={data.metrics.unread_notifications} color="red" />
      </div>
    </div>
  );
};

// خريطة كلاسات Tailwind لتفادي مشاكل الحذف الديناميكي
const colorStyles = {
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
  yellow: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
  },
  red: {
    border: 'border-red-500',
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
};

const MetricCard = ({ icon: Icon, title, value, color }) => {
  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`bg-white p-6 rounded-lg shadow flex items-center space-x-4 border-l-4 ${style.border}`}>
      <div className={`p-3 ${style.bg} rounded-full`}>
        <Icon className={style.text} size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${style.text}`}>{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;
