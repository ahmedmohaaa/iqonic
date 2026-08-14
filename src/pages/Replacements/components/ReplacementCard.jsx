import { User, ArrowRight, Calendar, FileText } from 'lucide-react';

const STATUS_CONFIG = {
  PENDING:            { label: 'Pending',            className: 'bg-yellow-100 text-yellow-800' },
  ENGINEER_RESPONDED: { label: 'Engineer Responded', className: 'bg-blue-100 text-blue-800' },
  APPROVED:           { label: 'Approved',           className: 'bg-green-100 text-green-800' },
  REJECTED:           { label: 'Rejected',           className: 'bg-red-100 text-red-800' },
};

const ReplacementCard = ({ request, type, canRespond, onRespond }) => {
  const isTask = type === 'tasks';
  const currentEngineer = request.requested_by || request.engineer;
  const suggestedEngineer = request.suggested_engineer;
  const title = isTask
    ? request.task?.title || request.task?.discipline_name
    : request.assignment?.role;
  const projectInfo = isTask ? request.task?.project : request.assignment?.project;
  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 shadow-md transition overflow-hidden">
      {/* Header */}
      <div className="bg-red-50 px-4 py-3 border-b border-red-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-red-800 text-sm">Replacement Request</h3>
          <span className={`px-2 py-1 ${status.className} text-xs rounded-full font-semibold`}>
            {status.label}
          </span>
        </div>
        <p className="text-xs text-red-600 mt-1">
          {isTask ? 'Task' : 'Supervision Assignment'}: {title}
        </p>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Project Info */}
        <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <FileText size={14} className="mr-1" />
          <span className="font-semibold">{projectInfo?.project_no}</span> - {projectInfo?.name}
        </div>

        {/* Engineers Flow */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 text-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-1">
              <User size={18} className="text-gray-600" />
            </div>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {currentEngineer?.first_name} {currentEngineer?.last_name}
            </p>
            <p className="text-[10px] text-gray-500">Current</p>
          </div>
          <ArrowRight className="text-gray-400" size={20} />
          <div className="flex-1 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
              <User size={18} className="text-blue-600" />
            </div>
            <p className="text-xs font-semibold text-blue-800 truncate">
              {suggestedEngineer?.first_name} {suggestedEngineer?.last_name}
            </p>
            <p className="text-[10px] text-blue-500">Suggested</p>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-gray-50 p-3 rounded border border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-1">Reason for Replacement:</p>
          <p className="text-sm text-gray-600 italic">"{request.reason}"</p>
        </div>

        {/* Dates */}
        <div className="flex items-center text-xs text-gray-500">
          <Calendar size={12} className="mr-1" />
          Requested on: {new Date(request.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Footer — يظهر فقط لمن يقدر يرد */}
      {canRespond && request.status === 'PENDING' && (
        <div className="px-4 py-3 bg-gray-50 border-t flex space-x-2">
          <button
            onClick={onRespond}
            className="flex-1 bg-primary text-white py-2 rounded text-sm font-semibold bg-blue-800 transition"
          >
            Review & Respond
          </button>
        </div>
      )}
    </div>
  );
};

export default ReplacementCard;