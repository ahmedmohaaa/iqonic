import { useState } from 'react';
import { Filter, Search, X } from 'lucide-react';

const GlobalFilterBar = ({ onFilterChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    scope: initialFilters.scope || '',
    priority: initialFilters.priority || '',
    permit_status: initialFilters.permit_status || '',
    stage: initialFilters.stage || '',
    start_date_from: initialFilters.start_date_from || '',
    start_date_to: initialFilters.start_date_to || '',
    q: initialFilters.q || '',
  });

  const handleChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      scope: '',
      priority: '',
      permit_status: '',
      stage: '',
      start_date_from: '',
      start_date_to: '',
      q: '',
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
          <Filter size={16} className="mr-2" />
          Global Filters
        </h3>
        <button
          onClick={handleReset}
          className="text-xs text-red-500 text-red-700 flex items-center"
        >
          <X size={14} className="mr-1" />
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => handleChange('q', e.target.value)}
              placeholder="Project name, number, client, location..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Scope */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Scope</label>
          <select
            value={filters.scope}
            onChange={(e) => handleChange('scope', e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">All Scopes</option>
            <option value="DESIGN">Design</option>
            <option value="SUPERVISION">Supervision</option>
            <option value="BOTH">Both</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Permit Status */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Permit Status</label>
          <select
            value={filters.permit_status}
            onChange={(e) => handleChange('permit_status', e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">All</option>
            <option value="NOT_ISSUED">Not Issued</option>
            <option value="PENDING_AUTHORITY">Pending Authority</option>
            <option value="ISSUED">Approved/Issued</option>
          </select>
        </div>

        {/* Stage */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Lifecycle Stage</label>
          <select
            value={filters.stage}
            onChange={(e) => handleChange('stage', e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">All Stages</option>
            <option value="OFFER">RFQ / Offer</option>
            <option value="CONTRACT_SUBMITTED">Contract Submitted</option>
            <option value="CONTRACT_SIGNED">Contract Signed</option>
            <option value="DESIGN_PHASE">Design Phase</option>
            <option value="COLLECTION">Collection</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date From</label>
          <input
            type="date"
            value={filters.start_date_from}
            onChange={(e) => handleChange('start_date_from', e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date To</label>
          <input
            type="date"
            value={filters.start_date_to}
            onChange={(e) => handleChange('start_date_to', e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default GlobalFilterBar;
