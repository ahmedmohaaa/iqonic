import { useState } from 'react';
import { Filter, Search, X } from 'lucide-react';

const GlobalFilterBar = ({ onFilterChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    scope: initialFilters.scope || '',
    is_active: initialFilters.is_active || '',
    priority: initialFilters.priority || '',
    permit_status: initialFilters.permit_status || '',
    client_id: initialFilters.client_id || '',
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
      is_active: '',
      priority: '',
      permit_status: '',
      client_id: '',
      stage: '',
      start_date_from: '',
      start_date_to: '',
      q: '',
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
          <Filter size={16} className="mr-2" />
          Global Filters
        </h3>
        <button
          onClick={handleReset}
          className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center transition-colors"
        >
          <X size={14} className="mr-1" />
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => handleChange('q', e.target.value)}
              placeholder="Project name, number, client, location..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Scope */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Scope</label>
          <select
            value={filters.scope}
            onChange={(e) => handleChange('scope', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="" className="text-gray-900 bg-white">All Scopes</option>
            <option value="DESIGN" className="text-gray-900 bg-white">Design</option>
            <option value="SUPERVISION" className="text-gray-900 bg-white">Supervision</option>
            <option value="BOTH" className="text-gray-900 bg-white">Both</option>
          </select>
        </div>

  

        {/* Priority */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="" className="text-gray-900 bg-white">All Priorities</option>
            <option value="URGENT" className="text-gray-900 bg-white">Urgent</option>
            <option value="HIGH" className="text-gray-900 bg-white">High</option>
            <option value="MEDIUM" className="text-gray-900 bg-white">Medium</option>
            <option value="LOW" className="text-gray-900 bg-white">Low</option>
          </select>
        </div>

        {/* Permit Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Permit Status</label>
          <select
            value={filters.permit_status}
            onChange={(e) => handleChange('permit_status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="" className="text-gray-900 bg-white">All</option>
            <option value="NOT_ISSUED" className="text-gray-900 bg-white">Not Issued</option>
            <option value="PENDING_AUTHORITY" className="text-gray-900 bg-white">Pending Authority</option>
            <option value="ISSUED" className="text-gray-900 bg-white">Approved/Issued</option>
          </select>
        </div>

        {/* Stage */}
           {/* Stage */}
     <div>
       <label className="block text-xs font-semibold text-gray-700 mb-1">Lifecycle Stage</label>
       <select
         value={filters.stage}
         onChange={(e) => handleChange('stage', e.target.value)}
         className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
       >
         <option value="" className="text-gray-900 bg-white">All Stages</option>
         <option value="OFFER" className="text-gray-900 bg-white">RFQ / Offer</option>
         <option value="CONTRACT_SUBMITTED" className="text-gray-900 bg-white">Contract Submitted</option>
         <option value="CONTRACT_SIGNED" className="text-gray-900 bg-white">Contract Signed</option>
         <option value="CONCEPT" className="text-gray-900 bg-white">Concept Design</option>
         <option value="DC1" className="text-gray-900 bg-white">DC1</option>
         <option value="DC2" className="text-gray-900 bg-white">DC2</option>
         <option value="TENDER" className="text-gray-900 bg-white">Tender Documents</option>
         <option value="COLLECTION" className="text-gray-900 bg-white">Collection</option>
         <option value="CLOSED" className="text-gray-900 bg-white">Closed</option>
       </select>
     </div>
        {/* Date Range */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date From</label>
          <input
            type="date"
            value={filters.start_date_from}
            onChange={(e) => handleChange('start_date_from', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date To</label>
          <input
            type="date"
            value={filters.start_date_to}
            onChange={(e) => handleChange('start_date_to', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default GlobalFilterBar;

     