import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectDetails, getLifecycleStages, getLifecycleAnalytics } from '../../api/services/projects';
import { Calendar, CheckCircle, Clock, AlertCircle, TrendingUp, Loader, Circle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

// ═══════════════════════════════════════════════════════════
// 🎯 دالة واحدة نظيفة: تحسب حالة أي Stage (متأخر/مبكر/في الوقت)
// ═══════════════════════════════════════════════════════════
const getStageTiming = (stage) => {
  const today = new Date();

  // ✅ منجز → قارن الفعلي بالمخطط
  if (stage.status === 'ACHIEVED') {
    if (stage.actual_date && stage.planned_date) {
      const diff = differenceInDays(
        new Date(stage.actual_date),
        new Date(stage.planned_date)
      );
      if (diff > 0)
        return {
          label: `Late by ${diff}d`,
          className: 'bg-red-100 text-red-700 border-red-200',
          icon: AlertCircle,
        };
      if (diff < 0)
        return {
          label: `Early by ${Math.abs(diff)}d`,
          className: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle,
        };
      return {
        label: 'On Time',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: CheckCircle,
      };
    }
    return {
      label: 'Achieved',
      className: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
    };
  }

  // ⏰ متأخر عن الموعد المخطط
  if (stage.planned_date && new Date(stage.planned_date) < today) {
    const diff = differenceInDays(today, new Date(stage.planned_date));
    return {
      label: `Overdue by ${diff}d`,
      className: 'bg-red-100 text-red-700 border-red-200',
      icon: AlertCircle,
    };
  }

  // 📅 قادم مع تاريخ مخطط
  if (stage.planned_date) {
    const diff = differenceInDays(new Date(stage.planned_date), today);
    return {
      label: diff === 0 ? 'Due Today' : `Due in ${diff}d`,
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: Clock,
    };
  }

  // 🔘 بدون تاريخ مخطط
  return {
    label: 'Upcoming',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Circle,
  };
};

// ═══════════════════════════════════════════════════════════
// 🏷️ Badge واحد نظيف لعرض الحالة (يُستخدم في كل مكان)
// ═══════════════════════════════════════════════════════════
const StageStatusBadge = ({ stage }) => {
  const timing = getStageTiming(stage);
  const Icon = timing.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${timing.className}`}
      title={`${stage.stage_name_display}: ${timing.label}`}
    >
      <Icon size={13} />
      {timing.label}
    </span>
  );
};

const TimelineView = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [stages, setStages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProjectDetails(id),
      getLifecycleStages(id),
      getLifecycleAnalytics(id),
    ])
      .then(([projRes, stagesRes, analyticsRes]) => {
        setProject(projRes.data);
        setStages(stagesRes.data);
        setAnalytics(analyticsRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!project || !stages.length) {
    return (
      <div className="text-center py-20 text-red-500">
        No timeline data available
      </div>
    );
  }

  // حساب نطاق التواريخ للـ Gantt Chart
  const allDates = stages
    .flatMap((s) => [s.planned_date, s.actual_date])
    .filter(Boolean);
  const minDate = allDates.length
    ? new Date(Math.min(...allDates.map((d) => new Date(d))))
    : new Date();
  const maxDate = allDates.length
    ? new Date(Math.max(...allDates.map((d) => new Date(d))))
    : new Date();
  const totalDays = Math.max(differenceInDays(maxDate, minDate), 30);

  const getStagePosition = (date) => {
    if (!date) return 0;
    return (differenceInDays(new Date(date), minDate) / totalDays) * 100;
  };

  const getStatusColor = (status) => {
    const colors = {
      ACHIEVED: 'bg-green-500',
      UPCOMING: 'bg-gray-300',
      IN_PROGRESS: 'bg-blue-500',
      OVERDUE: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Calendar className="mr-2 text-primary" size={28} />
            Project Timeline
          </h1>
          <p className="text-sm text-gray-500">
            {project.name} - {project.project_no}
          </p>
        </div>
        {analytics && (
          <div className="bg-primary/10 px-4 py-2 rounded-lg">
            <span className="text-sm text-black text-primary font-semibold">
              Progress: {analytics.progress_percentage}
            </span>
          </div>
        )}
      </div>


      {/* Gantt Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Gantt Chart View
        </h2>

        {/* Timeline Header */}
        <div className="relative mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{format(minDate, 'dd MMM yyyy')}</span>
            <span>{format(maxDate, 'dd MMM yyyy')}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full relative">
            <div
              className="absolute top-0 left-0 h-full bg-primary/20 rounded-full"
              style={{ width: '100%' }}
            ></div>
            {/* Current Date Marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-red-500"
              style={{ left: `${getStagePosition(new Date())}%` }}
            >
              <div className="absolute -top-6 -left-8 text-xs text-red-500 font-semibold">
                Today
              </div>
            </div>
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stage) => (
            <div key={stage.id} className="relative">
              <div className="flex items-center space-x-4">
                <div className="w-48 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {stage.stage_name_display}
                      </p>
                      <p className="text-xs text-gray-500">{stage.stage_name}</p>
                    </div>
                  </div>
                </div>

                {/* 🎯 Badge حالة المرحلة (الجديد) */}
                <div className="flex-shrink-0">
                  <StageStatusBadge stage={stage} />
                </div>

                <div className="flex-1 relative h-8 bg-gray-100 rounded">
                  {/* Planned Bar */}
                  {stage.planned_date && (
                    <div
                      className={`absolute top-1 h-6 rounded ${getStatusColor(
                        stage.status
                      )} opacity-30`}
                      style={{
                        left: `${getStagePosition(stage.planned_date)}%`,
                        width: '10%',
                      }}
                    ></div>
                  )}
                  {/* Actual Bar */}
                  {stage.actual_date && (
                    <div
                      className={`absolute top-1 h-6 rounded ${getStatusColor(
                        stage.status
                      )}`}
                      style={{
                        left: `${getStagePosition(stage.actual_date)}%`,
                        width: '10%',
                      }}
                    ></div>
                  )}
                </div>
              </div>

              {/* Dates Info */}
              <div className="ml-52 mt-1 flex space-x-6 text-xs text-gray-600">
                <span>
                  Planned:{' '}
                  {stage.planned_date
                    ? format(new Date(stage.planned_date), 'dd MMM yyyy')
                    : 'TBD'}
                </span>
                <span>
                  Actual:{' '}
                  {stage.actual_date
                    ? format(new Date(stage.actual_date), 'dd MMM yyyy')
                    : 'TBD'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="mr-2 text-primary" size={20} />
          Overall Progress
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Completion Rate</span>
            <span className="font-bold text-primary">
              {analytics?.progress_percentage || '0%'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-primary h-4 rounded-full transition-all duration-500"
              style={{ width: analytics?.progress_percentage || '0%' }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {stages.filter((s) => s.status === 'ACHIEVED').length} completed
            </span>
            <span>{stages.length} total stages</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div
    className={`bg-${color}-50 p-4 rounded-lg border border-${color}-100 text-center`}
  >
    <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
    <p className="text-xs text-gray-600 mt-1">{label}</p>
  </div>
);

export default TimelineView;

