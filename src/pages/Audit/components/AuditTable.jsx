import { format } from 'date-fns';
import { User, FileText, Calendar, AlertCircle } from 'lucide-react';

const AuditTable = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="bg-white p-10 rounded-lg shadow-sm text-center text-gray-500">
        <AlertCircle className="mx-auto mb-3 text-gray-300" size={40} />
        <p>No audit logs found matching your filters.</p>
      </div>
    );
  }

  // دالة مساعدة لتحديد لون الـ Badge بناءً على نوع الإجراء
  const getActionColor = (actionType) => {
    const colors = {
      // Project Actions (Blue)
      PROJECT_CREATED: 'bg-blue-100 text-blue-800',
      PROJECT_UPDATED: 'bg-blue-100 text-blue-800',
      REVISION_CREATED: 'bg-indigo-100 text-indigo-800',
      PRIORITY_CHANGED: 'bg-purple-100 text-purple-800',
      
      // Task Actions (Green/Yellow)
      TASK_CREATED: 'bg-green-100 text-green-800',
      TASK_ASSIGNED: 'bg-green-100 text-green-800',
      TASK_SELF_ASSIGNED: 'bg-green-100 text-green-800',
      TASK_STATUS_CHANGED: 'bg-yellow-100 text-yellow-800',
      TASK_COMPLETED: 'bg-emerald-100 text-emerald-800',
      TASK_APPROVED: 'bg-emerald-100 text-emerald-800',
      
      // Hold & Reassignment (Orange/Red)
      ON_HOLD_SET: 'bg-orange-100 text-orange-800',
      ON_HOLD_RESUMED: 'bg-teal-100 text-teal-800',
      REASSIGNMENT_REQUESTED: 'bg-pink-100 text-pink-800',
      REASSIGNMENT_APPROVED: 'bg-pink-100 text-pink-800',
      
      // Financial (Gray/Dark)
      INVOICE_ADDED: 'bg-gray-200 text-gray-800',
      INVOICE_STATUS_CHANGED: 'bg-gray-200 text-gray-800',
      
      // Others
      STAGE_ACTUAL_DATE_UPDATED: 'bg-cyan-100 text-cyan-800',
      DISCIPLINE_STATUS_CHANGED: 'bg-cyan-100 text-cyan-800',
      NOTE_ADDED: 'bg-slate-100 text-slate-800',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-4 w-48">Date & Time</th>
              <th className="p-4 w-40">User</th>
              <th className="p-4 w-48">Action Type</th>
              <th className="p-4">Project</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map(log => (
              <tr key={log.id} className="bg-gray-50 transition">
                {/* Date & Time */}
                <td className="p-4 text-gray-600 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-2 text-gray-400" />
                    <div>
                      <p className="font-medium">{format(new Date(log.created_at), 'dd MMM yyyy')}</p>
                      <p className="text-xs text-gray-500">{format(new Date(log.created_at), 'hh:mm a')}</p>
                    </div>
                  </div>
                </td>

                {/* User */}
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                      <User size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-xs">
                        {log.user_name || log.user_username || 'System'}
                      </p>
                      <p className="text-[10px] text-gray-500">{log.user_role || ''}</p>
                    </div>
                  </div>
                </td>

                {/* Action Type */}
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action_type)}`}>
                    {log.action_type_display || log.action_type.replace(/_/g, ' ')}
                  </span>
                </td>

                {/* Project */}
                <td className="p-4">
                  {log.project_name ? (
                    <div>
                      <p className="font-semibold text-gray-800 text-xs">{log.project_name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{log.project_no || ''}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </td>

                {/* Details */}
                <td className="p-4 text-gray-600 text-xs max-w-md truncate" title={log.details}>
                  {log.details || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTable;

