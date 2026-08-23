import { User, Calendar, Clock, Edit, Trash2, AlertTriangle } from 'lucide-react';

const TeamMemberCard = ({ assignment, onEdit, onRemove }) => {
  const { engineer_name, role, days_of_week, time_from, time_to, contract_percentage, actual_percentage ,is_pm} = assignment;
  // تنسيق الوقت (إزالة الثواني إن وجدت)
  const formatTime = (t) => t ? t.substring(0, 5) : '--:--';

  // حساب الفرق بين النسب لتحذير المدير
  const percentageDiff = Math.abs(contract_percentage - actual_percentage);
  const isOverloaded = actual_percentage > contract_percentage;

  return (
    <div className="bg-white rounded-lg shadow-sm shadow-md transition border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="text-primary" size={20} />
          </div>
          <div>
<p className="font-bold text-gray-900 flex items-center gap-2">
  {engineer_name}
  {is_pm && (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300">
      PM
    </span>
  )}
</p>            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <button onClick={onEdit} className="p-1.5 text-blue-600 bg-blue-50 rounded" title="Edit">
            <Edit size={16} />
          </button>
          <button onClick={onRemove} className="p-1.5 text-red-600 bg-red-50 rounded" title="Remove">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Schedule */}
        <div>
          <div className="flex items-center text-xs text-gray-500 mb-1.5">
            <Calendar size={12} className="mr-1" /> Work Days
          </div>
          <div className="flex flex-wrap gap-1">
            {days_of_week && days_of_week.length > 0 ? (
              days_of_week.map(day => (
                <span key={day} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                  {day}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">No days specified</span>
            )}
          </div>
        </div>

        <div className="flex items-center text-xs text-gray-500">
          <Clock size={12} className="mr-1" /> 
          <span className="font-medium text-gray-700">{formatTime(time_from)} - {formatTime(time_to)}</span>
        </div>

        {/* Percentages */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Contract %</span>
            <span className="font-bold text-blue-700">{contract_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${contract_percentage}%` }}></div>
          </div>

          <div className="flex justify-between items-center text-xs mt-2">
            <span className="text-gray-600">Actual %</span>
            <span className={`font-bold ${isOverloaded ? 'text-red-600' : 'text-purple-700'}`}>{actual_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${isOverloaded ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${actual_percentage}%` }}></div>
          </div>

          {isOverloaded && percentageDiff > 10 && (
            <div className="flex items-center text-[10px] text-red-600 bg-red-50 p-1.5 rounded mt-2">
              <AlertTriangle size={12} className="mr-1" /> Actual is significantly higher than Contract!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMemberCard;
