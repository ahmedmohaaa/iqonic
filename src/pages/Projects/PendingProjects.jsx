import { useState, useEffect } from 'react';
import { getPendingProjects } from '../../api/services/projects';
import { Link } from 'react-router-dom';
import { Clock, Search, AlertCircle, Loader, FolderOpen } from 'lucide-react';

const PendingProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getPendingProjects();
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
            <Clock className="mr-2 text-yellow-600" size={28} />
            Pending Projects
          </h1>
          <p className="text-sm text-gray-500">Projects awaiting authority approval</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg flex items-center">
          <AlertCircle className="text-yellow-600 mr-2" size={18} />
          <span className="text-sm text-yellow-800">
            {projects.length} project{projects.length !== 1 ? 's' : ''} pending
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search pending projects..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" size={32} /></div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <Clock className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No pending projects found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map(project => (
            <Link to={`/projects/${project.id}`} key={project.id} className="block bg-white rounded-lg shadow-sm shadow-md transition border-l-4 border-yellow-500 p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-bold text-gray-800 text-lg">{project.name}</h3>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-semibold">
                      Pending Authority
                    </span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span><span className="font-semibold">Project No:</span> {project.project_no}</span>
                    <span><span className="font-semibold">Client:</span> {project.client_name}</span>
                    <span><span className="font-semibold">Scope:</span> {project.scope}</span>
                  </div>
                </div>
                <div className="text-primary font-semibold flex items-center">
                  View <FolderOpen size={16} className="ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingProjects;
