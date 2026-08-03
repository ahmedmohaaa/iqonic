import { User, Briefcase, Clock, RefreshCw } from 'lucide-react';

const EngineerCard = ({ engineer, onViewDetails }) => {
  const completionRate = engineer.total_tasks > 0 
    ? Math.round((engineer.completed_tasks / engineer.total_tasks) * 100) 
    : 0;

  const getRoleColor = (role) => {
    // 1. إضافة حماية هنا في حال كان الـ role غير معرف
    if (!role) return 'bg-gray-100 text-gray-800'; 

    const colors = {
      SENIOR_ENG: 'bg-purple-100 text-purple-800',
      ENGINEER: 'bg-blue-100 text-blue-800',
      DRAFTSMAN: 'bg-green-100 text-green-800',
      PM: 'bg-orange-100 text-orange-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm shadow-md transition border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{engineer.first_name} {engineer.last_name}</h3>
              
              {/* 2. التعديل الرئيسي هنا لمنع الخطأ */}
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getRoleColor(engineer.role)}`}>
                {engineer.role_display || (engineer.role ? engineer.role.replace('_', ' ') : 'Unassigned')}
              </span>

            </div>
          </div>
        </div>

        <div className="flex items-center text-xs text-gray-500 mb-4">
          <Briefcase size={14} className="mr-1" />
          <span>{engineer.department || 'General'} Department</span>
          {engineer.username === 'salman.saeed' && (
            <span className="ml-2 bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
              Multi-Dept
            </span>
          )}
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{engineer.total_days_worked || 0}</p>
            <p className="text-[10px] text-gray-500 flex items-center justify-center"><Clock size={10} className="mr-1"/> Days Worked</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{engineer.completed_tasks || 0}</p>
            <p className="text-[10px] text-gray-500">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-600">{engineer.handover_count || 0}</p>
            <p className="text-[10px] text-gray-500 flex items-center justify-center"><RefreshCw size={10} className="mr-1"/> Handovers</p>
          </div>
        </div>

        {/* Completion Rate Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Task Completion Rate</span>
            <span className="font-bold">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${completionRate > 75 ? 'bg-green-500' : completionRate > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-5 py-3 border-t flex justify-end">
        <button 
          onClick={onViewDetails}
          className="text-primary text-blue-800 text-sm font-semibold"
        >
          View Full Insights →
        </button>
      </div>
    </div>
  );
};

export default EngineerCard;
