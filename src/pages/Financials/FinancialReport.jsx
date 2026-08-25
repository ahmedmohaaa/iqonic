import { useState, useEffect } from 'react';
import { getFinancialReport, getFinancialDashboard, getAllInvoices } from '../../api/services/financials';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, DollarSign, AlertTriangle, CheckCircle, 
  Clock, FileText, Loader, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FinancialReport = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getFinancialDashboard(),
      getFinancialReport(),
      getAllInvoices({ page_size: 100 }) // Fetch recent invoices for breakdown
    ]).then(([dashRes, statsRes, invRes]) => {
      setDashboard(dashRes.data);
      setStats(statsRes.data);
      setInvoices(invRes.data.results || invRes.data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" size={32} /></div>;

  const { company_totals, alerts, recent_payments } = dashboard || {};
  const { financial_analytics, projects_analysis, tasks_efficiency } = stats || {};

  // حساب حالة الفواتير للعرض البياني
  const statusCounts = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});

  const totalInvoices = invoices.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <TrendingUp className="mr-2 text-primary" size={28} />
            Comprehensive Financial Report
          </h1>
          <p className="text-sm text-gray-500">Executive summary of company financial health</p>
        </div>
        <div className="text-sm text-gray-500">
          Generated on: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* 1. Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Total Billed" 
          value={`QR${financial_analytics?.total_billed?.toLocaleString() || 0}`} 
          icon={<DollarSign />} 
          color="blue" 
          trend="+12%" 
        />
        <SummaryCard 
          title="Total Collected" 
          value={`QR${financial_analytics?.total_collected?.toLocaleString() || 0}`} 
          icon={<CheckCircle />} 
          color="green" 
          trend="+8%" 
        />
        <SummaryCard 
          title="Total Outstanding" 
          value={`QR${financial_analytics?.total_receivables?.toLocaleString() || 0}`} 
          icon={<Clock />} 
          color="yellow" 
          trend="-5%" 
          isNegative 
        />
        <SummaryCard 
          title="Overdue Amount" 
          value={`QR${alerts?.overdue_amount_estimation?.toLocaleString() || 0}`} 
          icon={<AlertTriangle />} 
          color="red" 
          trend="+2%" 
          isNegative 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Invoice Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Status Breakdown</h3>
          <div className="space-y-4">
            {['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].map(status => {
              const count = statusCounts[status] || 0;
              const percent = totalInvoices > 0 ? (count / totalInvoices) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{status.replace('_', ' ')}</span>
                    <span className="text-gray-500">{count} ({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getStatusColor(status)}`} 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Overdue Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-red-500" size={20} />
            Overdue Alerts ({alerts?.total_overdue_invoices || 0})
          </h3>
          {alerts?.total_overdue_invoices > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You have <span className="font-bold text-red-600">{alerts.total_overdue_invoices}</span> overdue invoices 
                totaling <span className="font-bold text-red-600">${alerts.overdue_amount_estimation.toLocaleString()}</span>.
              </p>
              <div className="bg-red-50 p-3 rounded text-xs text-red-700">
                Immediate action required to prevent cash flow issues.
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-green-600">
              <CheckCircle className="mx-auto mb-2" size={32} />
              <p className="text-sm">No overdue invoices. Great job!</p>
            </div>
          )}
        </div>

        {/* 4. Project vs Financial Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-800">Active Projects</span>
              <span className="font-bold text-blue-900 text-lg">{projects_analysis?.active_projects || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-800">Closed Projects</span>
              <span className="font-bold text-gray-900 text-lg">{projects_analysis?.closed_projects || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-green-800">Task Completion Rate</span>
              <span className="font-bold text-green-900 text-lg">{tasks_efficiency?.completion_rate_percentage || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Payments & Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Payments Activity</h3>
        {recent_payments && recent_payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="p-3">Invoice</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recent_payments.map((payment, idx) => (
                  <tr key={idx} className="bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{payment.invoice_title}</td>
                    <td className="p-3 text-green-600 font-semibold">${payment.amount_paid}</td>
                    <td className="p-3 text-gray-600">{payment.payment_date}</td>
                    <td className="p-3 text-gray-600">{payment.recorded_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">No recent payments recorded.</p>
        )}
      </div>
    </div>
  );
};

// Helper Components
const SummaryCard = ({ title, value, icon, color, trend, isNegative }) => (
  <div className={`bg-white p-5 rounded-lg shadow-sm border-l-4 border-${color}-500`}>
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 bg-${color}-100 rounded-full text-${color}-600`}>{icon}</div>
      <span className={`text-xs font-semibold flex items-center ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
        {isNegative ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
        {trend}
      </span>
    </div>
    <p className="text-xs text-gray-500 uppercase">{title}</p>
    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

const getStatusColor = (status) => {
  const colors = {
    DRAFT: 'bg-gray-400',
    ISSUED: 'bg-blue-500',
    PARTIALLY_PAID: 'bg-yellow-500',
    PAID: 'bg-green-500',
    OVERDUE: 'bg-red-500',
    CANCELLED: 'bg-gray-300',
  };
  return colors[status] || 'bg-gray-400';
};

export default FinancialReport;
