import { useState, useEffect } from 'react';
import { getSupervisionProjects } from '../../api/services/supervision';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Search, Filter, Loader, FolderOpen, Archive, Clock } from 'lucide-react';

const SupervisionDirectory = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState('');

  const tabs = [
    { id: 'active', label: 'Active Projects', icon: Building2, count: 0 },
    { id: 'closed', label: 'Closed Projects', icon: Archive, count: 0 },
    { id: 'pending', label: 'Pending Authority', icon: Clock, count: 0 },
  ];

  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === 'active') params.is_active = 'true';
      if (activeTab === 'closed') params.is_active = 'false';
      if (activeTab === 'pending') params.permit_status = 'PENDING_AUTHORITY';
      
      const res = await getSupervisionProjects(params);
      setProjects(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTabCount = (tabId) => {
    if (tabId === 'active') return projects.filter(p => p.is_active).length;
    if (tabId === 'closed') return projects.filter(p => !p.is_active).length;
    if (tabId === 'pending') return projects.filter(p => p.permit_status === 'PENDING_AUTHORITY').length;
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Building2 className="mr-2 text-primary" size={28} />
            Supervision Projects Directory
          </h1>
          <p className="text-sm text-gray-500">Manage and track all supervision projects</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 text-gray-700 border-gray-300'
              }`}
            >
              <tab.icon size={18} className="mr-2" />
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {getTabCount(tab.id)}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by project name, number, or client..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Filter by client..."
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="border rounded-lg p-2 text-sm"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <Building2 className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No supervision projects found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Link to={`/projects/${project.id}`} key={project.id} className="bg-white rounded-lg shadow-sm shadow-md transition border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{project.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{project.project_no}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    project.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {project.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold">Client:</span> {project.client_name}</p>
                  <p><span className="font-semibold">Location:</span> {project.location || 'N/A'}</p>
                  {project.permit_status && (
                    <p>
                      <span className="font-semibold">Permit:</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        project.permit_status === 'ISSUED' ? 'bg-green-100 text-green-800' :
                        project.permit_status === 'PENDING_AUTHORITY' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.permit_status.replace('_', ' ')}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t flex justify-end">
                <span className="text-primary text-sm font-semibold flex items-center">
                  View Details <FolderOpen size={16} className="ml-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupervisionDirectory;
