import { useState, useEffect } from 'react';
import { getClosedProjects } from '../../api/services/projects';
import { Link } from 'react-router-dom';
import { Archive, Search, Filter, Loader, FolderOpen } from 'lucide-react';

const ClosedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [filterScope]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterScope) params.scope = filterScope;
      const res = await getClosedProjects(params);
      setProjects(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Archive className="mr-2 text-gray-600" size={28} />
            Closed Projects
          </h1>
          <p className="text-sm text-gray-500">Archived and completed projects</p>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-600">Total: </span>
          <span className="font-bold text-gray-800">{projects.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or project number..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">All Scopes</option>
            <option value="DESIGN">Design</option>
            <option value="SUPERVISION">Supervision</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" size={32} /></div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <Archive className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No closed projects found.</p>
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
                  <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-full font-semibold">
                    Closed
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold">Client:</span> {project.client_name}</p>
                  <p><span className="font-semibold">Scope:</span> {project.scope}</p>
                  {project.revision_number && (
                    <p className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block">
                      Rev: {project.revision_number}
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

export default ClosedProjects;
