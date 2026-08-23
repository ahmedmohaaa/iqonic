import { Filter, X } from 'lucide-react';

const AuditFilters = ({ filters, onFilterChange, users, actionTypes }) => {
  const handleReset = () => {
    onFilterChange('search', '');
    onFilterChange('project', '');
    onFilterChange('user', '');
    onFilterChange('action_type', '');
    onFilterChange('date_from', '');
    onFilterChange('date_to', '');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center">
          <Filter size={18} className="mr-2 text-primary" /> Advanced Filters
        </h2>
        <button onClick={handleReset} className="text-sm text-red-500 text-red-700 flex items-center">
          <X size={14} className="mr-1" /> Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Global Search */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Search (Details, User, Project)</label>
          <input
            type="text"
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            placeholder="Search..."
            className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm font-semibold text-gray-900 placeholder-gray-500 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-500 outline-none"
          />
        </div>

        {/* User Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">User</label>
          <select
            value={filters.user}
            onChange={e => onFilterChange('user', e.target.value)}
            className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-500 outline-none"
          >
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.username})</option>
            ))}
          </select>
        </div>

        {/* Action Type Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Action Type</label>
          <select
            value={filters.action_type}
            onChange={e => onFilterChange('action_type', e.target.value)}
            className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-500 outline-none"
          >
            <option value="">All Actions</option>
            {actionTypes.map(at => (
              <option key={at.value} value={at.value}>{at.label}</option>
            ))}
          </select>
        </div>

        {/* Project Filter (Text-based for simplicity, can be upgraded to Select) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Project (Name or Number)</label>
          <input
            type="text"
            value={filters.project}
            onChange={e => onFilterChange('project', e.target.value)}
            placeholder="Project Name / No."
            className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm font-semibold text-gray-900 placeholder-gray-500 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={e => onFilterChange('date_from', e.target.value)}
            className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm font-semibold text-gray-900 placeholder-gray-500 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={e => onFilterChange('date_to', e.target.value)}
            className="w-full border-2 border-gray-400 rounded-lg p-2 text-sm font-semibold text-gray-900 placeholder-gray-500 bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default AuditFilters;
