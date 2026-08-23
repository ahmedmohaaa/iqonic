import { useState, useEffect } from 'react';
import { Award, Filter, Users, Clock, CheckCircle2, Repeat } from 'lucide-react';
import { getStaffKPIInsights } from '../../api/services/staff'; // نفس مسار الاستيراد عندك
import EngineerDetailModal from './components/EngineerDetailModal';

/* ═══ قراءة القسم/الدور من أي مكان بالكائن — تطابق مضمون ═══ */
const deptOf = (e) => e?.department || e?.user?.department || 'General';
const roleOf = (e) => e?.role || e?.user?.role || '';
// ✅ يقرأ الاسم من أي شكل يرجعه الـ API (مفرود / متداخل / username)
const nameOf = (e) =>
  [e?.first_name, e?.last_name].filter(Boolean).join(' ') ||
  [e?.user?.first_name, e?.user?.last_name].filter(Boolean).join(' ') ||
  e?.username || '—';
const ROLES = ['All', 'ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN', 'PM'];

/* ═══ ألوان ثابتة (Tailwind لا يدعم الأسماء الديناميكية) ═══ */
const METRIC_COLORS = {
  blue:   { border: 'border-blue-500',   bg: 'bg-blue-100',   text: 'text-blue-600' },
  green:  { border: 'border-green-500',  bg: 'bg-green-100',  text: 'text-green-600' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-100', text: 'text-purple-600' },
  amber:  { border: 'border-amber-500',  bg: 'bg-amber-100',  text: 'text-amber-600' },
  red:    { border: 'border-red-500',    bg: 'bg-red-100',    text: 'text-red-600' },
};

const StaffKPI = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', department: '' });
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [error, setError] = useState('');

  // ✅ الدور فقط من الباك-إند — القسم يُفلتر محليًا فلا يختفي أحد أبدًا
  useEffect(() => {
    fetchData();
  }, [filters.role]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.role) params.role = filters.role;
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

  // ✅ مصدر فلترة واحد يستخدمه الرسم (بدون تكرار)
  const visibleEngineers = (data?.engineers || []).filter(
    (e) => !filters.department || deptOf(e) === filters.department
  );

  // ✅ الخيارات مشتقة من البيانات نفسها → تطابق مضمون
  const departments = ['All', ...new Set((data?.engineers || []).map(deptOf))];

  const handleViewDetails = (engineer) => {
    setSelectedEngineer(engineer);
    setShowDetailModal(true);
  };

  const all = data?.engineers || [];
  const totalActive = all.reduce((s, e) => s + (e.active_tasks_count || 0), 0);
  const totalCompleted = all.reduce((s, e) => s + (e.completed_tasks || 0), 0);
  const totalHandovers = all.reduce((s, e) => s + (e.handover_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Award className="mr-2 text-blue-700" size={28} />
            Staff KPIs
          </h1>
          <p className="text-sm text-gray-600">Performance insights per engineer</p>
        </div>
      </div>

      {/* Filters — ألوان واضحة */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-end gap-4">
        <Filter size={18} className="text-gray-800 mb-2" />
        <div>
          <label className="block text-xs font-bold text-gray-800 mb-1">Department</label>
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="border border-gray-400 rounded-lg p-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {departments.map((d) => (
              <option key={d} value={d === 'All' ? '' : d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-800 mb-1">Role</label>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="border border-gray-400 rounded-lg p-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {ROLES.map((r) => (
              <option key={r} value={r === 'All' ? '' : r}>{r === 'All' ? 'All' : r.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-semibold">
          {error}
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={<Users size={20} />} title="Total Engineers" value={all.length} color="blue" />
            <MetricCard icon={<Clock size={20} />} title="Active Tasks" value={totalActive} color="amber" />
            <MetricCard icon={<CheckCircle2 size={20} />} title="Completed Tasks" value={totalCompleted} color="green" />
            <MetricCard icon={<Repeat size={20} />} title="Active Handovers" value={totalHandovers} color="red" />
          </div>

          {/* Engineers Grid — يستخدم القائمة المفلترة */}
          {visibleEngineers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg shadow-sm text-gray-600">
              لا يوجد مهندسون مطابقون للفلتر الحالي.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleEngineers.map((eng) => (
                <EngineerCard
                  key={eng.id || eng.user?.id}
                  engineer={eng}
                  onViewDetails={() => handleViewDetails(eng)}
                />
              ))}
            </div>
          )}
        </>
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

/* ═══ كارت المهندس ═══ */
const EngineerCard = ({ engineer, onViewDetails }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div>
<p className="font-bold text-gray-900">{nameOf(engineer)}</p>
        <p className="text-xs text-gray-700 font-semibold mt-0.5">
          {roleOf(engineer).replace('_', ' ')} · {deptOf(engineer)}
        </p>
      </div>
      <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
        {engineer.completion_rate ?? 0}%
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      <div className="bg-gray-50 rounded p-2">
        <p className="text-gray-500 font-semibold">Active</p>
        <p className="font-bold text-gray-900">{engineer.active_tasks_count ?? 0}</p>
      </div>
      <div className="bg-gray-50 rounded p-2">
        <p className="text-gray-500 font-semibold">Done</p>
        <p className="font-bold text-green-700">{engineer.completed_tasks ?? 0}</p>
      </div>
      <div className="bg-gray-50 rounded p-2">
        <p className="text-gray-500 font-semibold">On Hold</p>
        <p className="font-bold text-red-600">{engineer.on_hold_tasks ?? 0}</p>
      </div>
    </div>
    <button
      onClick={onViewDetails}
      className="mt-auto w-full bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold py-2 rounded-lg transition"
    >
      View Details
    </button>
  </div>
);

/* ═══ كارت المؤشر (ألوان ثابتة تعمل فعلًا) ═══ */
const MetricCard = ({ icon, title, value, color }) => {
  const c = METRIC_COLORS[color] || METRIC_COLORS.blue;
  return (
    <div className={`bg-white p-5 rounded-lg shadow-sm border-l-4 ${c.border} flex items-center`}>
      <div className={`p-3 rounded-full mr-4 ${c.bg} ${c.text}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default StaffKPI;