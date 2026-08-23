import { useState, useEffect } from 'react';
import { getStatistics, getFinancialDashboard, getStaffKPIInsights } from '../../api/services/admin';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, DollarSign, Users, FolderKanban, 
  CheckCircle, Clock, AlertTriangle, Loader,
  BarChart3, PieChart, Activity
} from 'lucide-react';
import { getAllTasks } from '../../api/services/tasks';  // ← جديد
const ReportsAnalytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [staffKPI, setStaffKPI] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, financialRes, kpiRes, tasksRes] = await Promise.all([
        getStatistics(),
        getFinancialDashboard(),
        getStaffKPIInsights(),
        getAllTasks({ page_size: 1000 }), // ← جلب كل التاسكات للعد اليدوي
      ]);

      const statsData = statsRes.data;
      const allTasks = tasksRes.data.results || tasksRes.data || [];

      /* ── fallback: احسب approved_tasks من التاسكات لو الـ API مش بيرجّعها ── */
      const approvedCount = allTasks.filter(t => t.status === 'APPROVED').length;
      if (!statsData.tasks_efficiency) statsData.tasks_efficiency = {};
      if (statsData.tasks_efficiency.approved_tasks == null) {
        statsData.tasks_efficiency.approved_tasks = approvedCount;
      }

      setStats(statsData);
      setFinancial(financialRes.data);
      setStaffKPI(kpiRes.data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const { projects_analysis, tasks_efficiency, financial_analytics } = stats || {};
  const { company_totals, alerts } = financial || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="mr-2 text-primary" size={28} />
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500">Comprehensive business intelligence dashboard</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Financial Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <DollarSign className="mr-2 text-green-600" size={20} />
          Financial Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Total Billed"
            value={`QR${financial_analytics?.total_billed?.toLocaleString() || 0}`}
            icon={<TrendingUp />}
            color="blue"
          />
          <MetricCard
            title="Total Collected"
            value={`QR${financial_analytics?.total_collected?.toLocaleString() || 0}`}
            icon={<CheckCircle />}
            color="green"
          />
          <MetricCard
            title="Total Outstanding"
            value={`QR${financial_analytics?.total_receivables?.toLocaleString() || 0}`}
            icon={<Clock />}
            color="yellow"
          />
        </div>
        {alerts?.total_overdue_invoices > 0 && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center">
              <AlertTriangle className="text-red-600 mr-2" size={20} />
              <div>
                <p className="font-semibold text-red-800">Overdue Invoices Alert</p>
                <p className="text-sm text-red-600">
                  {alerts.total_overdue_invoices} invoices totaling ${alerts.overdue_amount_estimation.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projects Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FolderKanban className="mr-2 text-blue-600" size={20} />
          Projects Analysis
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard title="Total Projects" value={projects_analysis?.total_projects || 0} color="gray" />
          <MetricCard title="Active" value={projects_analysis?.active_projects || 0} color="green" />
          <MetricCard title="Closed" value={projects_analysis?.closed_projects || 0} color="blue" />
          <MetricCard title="High Priority" value={projects_analysis?.high_priority || 0} color="red" />
          <MetricCard title="Medium Priority" value={projects_analysis?.medium_priority || 0} color="yellow" />
        </div>
      </div>

      {/* Tasks Efficiency */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Activity className="mr-2 text-purple-600" size={20} />
          Tasks Efficiency
        </h2>
<div className="grid grid-cols-2 md:grid-cols-6 gap-4">
  <MetricCard title="Total Tasks"   value={tasks_efficiency?.total_tasks || 0} color="gray" />
  <MetricCard title="Completed"     value={tasks_efficiency?.completed_tasks || 0} color="green" />
  <MetricCard title="Approved"      value={tasks_efficiency?.approved_tasks || 0} color="emerald" />
  <MetricCard title="In Progress"   value={tasks_efficiency?.in_progress_tasks || 0} color="blue" />
  <MetricCard title="On Hold"       value={tasks_efficiency?.delayed_tasks || 0} color="red" />
  <MetricCard title="Approval Rate" value={`${tasks_efficiency?.completion_rate_percentage || 0}%`} color="purple" />
</div>
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Task Completion</span>
            <span className="font-bold text-primary">{tasks_efficiency?.completion_rate_percentage || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${tasks_efficiency?.completion_rate_percentage || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Staff KPI Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Users className="mr-2 text-orange-600" size={20} />
          Staff Performance Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600">Total Engineers</p>
            <p className="text-2xl font-bold text-orange-800">{staffKPI?.summary?.total_engineers || 0}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Total Days Worked</p>
            <p className="text-2xl font-bold text-blue-800">{staffKPI?.summary?.total_days_worked || 0}</p>
          </div>
        </div>
        {/* Top Performers */}
        {staffKPI?.engineers && staffKPI.engineers.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Performers by Days Worked</h3>
            <div className="space-y-2">
              {staffKPI.engineers
                .sort((a, b) => b.total_days_worked - a.total_days_worked)
                .slice(0, 5)
                .map((eng, idx) => (
                  <div key={eng.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{eng.first_name} {eng.last_name}</p>
                        <p className="text-xs text-gray-500">{eng.role_display || eng.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{eng.total_days_worked} days</p>
                      <p className="text-xs text-gray-500">{eng.completed_tasks} tasks</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color }) => (
  <div className={`bg-${color}-50 p-4 rounded-lg border border-${color}-100`}>
    <div className="flex items-center justify-between mb-2">
      <span className={`text-${color}-600`}>{icon}</span>
    </div>
    <p className={`text-xs text-${color}-600 uppercase`}>{title}</p>
    <p className={`text-2xl font-bold text-${color}-800 mt-1`}>{value}</p>
  </div>
);

export default ReportsAnalytics;
