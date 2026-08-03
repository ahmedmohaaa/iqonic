import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, Flag, TrendingUp } from 'lucide-react';

const ProjectCard = ({ project }) => {
  const {
    id,
    project_no,
    name,
    scope,
    is_active,
    priority,
    start_date,
    client_name,
    revision_number,
    parent_project_name,
    lifecycle_stages = [],
    progress_percentage = 0,
  } = project;

  // حساب حالة المراحل
  const achievedStages = lifecycle_stages.filter(s => s.status === 'ACHIEVED').length;
  const totalStages = lifecycle_stages.length || 6;
  const overdueStages = lifecycle_stages.filter(s => s.status === 'OVERDUE').length;

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getScopeColor = (scope) => {
    const colors = {
      DESIGN: 'bg-blue-100 text-blue-800',
      SUPERVISION: 'bg-purple-100 text-purple-800',
      BOTH: 'bg-orange-100 text-orange-800',
    };
    return colors[scope] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Link
      to={`/projects/${id}`}
      className="bg-white rounded-lg shadow-sm shadow-md transition border border-gray-100 overflow-hidden block"
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-lg">{name}</h3>
            <p className="text-xs text-gray-500 font-mono">{project_no}</p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getScopeColor(scope)}`}>
              {scope}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(priority)}`}>
              <Flag size={10} className="inline mr-1" />
              {priority}
            </span>
          </div>
        </div>

        {/* Revision Flag for Sub Projects */}
        {revision_number && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-yellow-800">
                Revision: {revision_number}
              </span>
              {parent_project_name && (
                <span className="text-xs text-yellow-600">
                  Parent: {parent_project_name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Client & Start Date */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p>
            <span className="font-semibold">Client:</span> {client_name}
          </p>
          {start_date && (
            <p className="flex items-center">
              <Calendar size={14} className="mr-2 text-gray-400" />
              <span className="font-semibold">Start:</span> {start_date}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-bold text-primary">{progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress_percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{achievedStages}/{totalStages} stages completed</span>
            {overdueStages > 0 && (
              <span className="text-red-600 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {overdueStages} overdue
              </span>
            )}
          </div>
        </div>

        {/* Lifecycle Stages Preview */}
        {lifecycle_stages.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Lifecycle Status:</p>
            <div className="flex flex-wrap gap-1">
              {lifecycle_stages.map((stage, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    stage.status === 'ACHIEVED'
                      ? 'bg-green-100 text-green-800'
                      : stage.status === 'OVERDUE'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {stage.stage_name_display || stage.stage_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-5 py-3 border-t flex justify-between items-center">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
        }`}>
          {is_active ? 'Active' : 'Closed'}
        </span>
        <span className="text-primary text-sm font-semibold flex items-center">
          View Details <TrendingUp size={14} className="ml-1" />
        </span>
      </div>
    </Link>
  );
};

export default ProjectCard;
