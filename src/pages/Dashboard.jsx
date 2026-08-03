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
        <MetricCard icon={Folder} title="Active Projects" value={data.metrics.active_projects} color="blue" />
        <MetricCard icon={CheckCircle} title="My Completed Tasks" value={data.metrics.my_total_tasks - data.metrics.my_pending_tasks} color="green" />
        <MetricCard icon={Clock} title="Pending Tasks" value={data.metrics.my_pending_tasks} color="yellow" />
        <MetricCard icon={AlertTriangle} title="Unread Notifications" value={data.metrics.unread_notifications} color="red" />
      </div>

      {/* Financial Snapshot for Management & Accountant */}
      {isAccountant() && data.financial_snapshot && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Financial Snapshot</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Overdue Invoices</p>
              <p className="text-2xl font-bold text-red-600">{data.financial_snapshot.total_unpaid_invoices}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Partially Paid</p>
              <p className="text-2xl font-bold text-yellow-600">{data.financial_snapshot.partially_paid_invoices}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-blue-600">${data.financial_snapshot.total_outstanding}</p>
            </div>
          </div>
        </div>
      )}
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