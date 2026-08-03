import { useState, useEffect } from 'react';
import { getStaffKPIInsights } from '../../api/services/staff';
import { Users, Clock, TrendingUp, Award, Loader, Filter } from 'lucide-react';
import EngineerCard from './components/EngineerCard';
import EngineerDetailModal from './components/EngineerDetailModal';

const StaffKPI = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', department: '' });
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.department) params.department = filters.department;
      
      const res = await getStaffKPIInsights(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch staff KPI', err);
      setError(err.response?.status === 403
        ? 'ليس لديك صلاحية عرض هذه الصفحة (مطلوب: GM / AGM / Design Manager).'
        : 'تعذّر تحميل البيانات. تحقق من الاتصال بالسيرفر.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (engineer) => {
    setSelectedEngineer(engineer);
    setShowDetailModal(true);
  };

  // استخراج الأقسام الفريدة من قائمة المهندسين (مع ملاحظة أن Salman Saeed قد يظهر في أكثر من قسم)
  const departments = ['All', 'Architecture', 'Structural', 'Electrical', 'Mechanical', 'Supervision'];
  const roles = ['All', 'ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN', 'PM'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Award className="mr-2 text-primary" size={28} />
            Staff KPI & Performance Insights
          </h1>
          <p className="text-sm text-gray-500">Evaluate engineers, track workdays, and monitor handover history.</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Content Rendering based on Loading/Data state */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : data ? (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard icon={<Users />} title="Total Engineers" value={data.summary.total_engineers} color="blue" />
            <MetricCard icon={<Clock />} title="Total Days Worked" value={data.summary.total_days_worked} color="green" />
            <MetricCard 
              icon={<TrendingUp />} 
              title="Avg. Tasks/Engineer" 
              value={data.engineers.length ? Math.round(data.engineers.reduce((acc, e) => acc + (e.total_tasks || 0), 0) / data.engineers.length) : 0} 
              color="purple" 
            />
            <MetricCard 
              icon={<Award />} 
              title="Active Handovers" 
              value={data.engineers.reduce((acc, e) => acc + (e.handover_count || 0), 0)} 
              color="orange" 
            />
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
            <Filter size={18} className="text-gray-500" />
            <select 
              value={filters.department} 
              onChange={e => setFilters({...filters, department: e.target.value})}
              className="border rounded-lg p-2 text-sm bg-white"
            >
              {departments.map(d => <option key={d} value={d === 'All' ? '' : d}>{d}</option>)}
            </select>
            <select 
              value={filters.role} 
              onChange={e => setFilters({...filters, role: e.target.value})}
              className="border rounded-lg p-2 text-sm bg-white"
            >
              {roles.map(r => <option key={r} value={r === 'All' ? '' : r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>

          {/* Engineers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.engineers.map(eng => (
              <EngineerCard 
                key={eng.id} 
                engineer={eng} 
                onViewDetails={() => handleViewDetails(eng)} 
              />
            ))}
          </div>
        </>
      ) : (
        !error && <div className="text-center py-20 text-gray-500">لا بيانات لعرضها.</div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEngineer && (
        <EngineerDetailModal 
          engineer={selectedEngineer} 
          onClose={() => setShowDetailModal(false)} 
        />
      )}
    </div>
  );
};

const MetricCard = ({ icon, title, value, color }) => (
  <div className={`bg-white p-5 rounded-lg shadow-sm border-l-4 border-${color}-500 flex items-center`}>
    <div className={`p-3 bg-${color}-100 rounded-full mr-4 text-${color}-600`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default StaffKPI;