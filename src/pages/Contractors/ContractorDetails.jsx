import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getContractorDetails, 
  getContractorProjects 
} from '../../api/services/contractors';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, Building2, Phone, Mail, User, 
  FolderOpen, Loader, Calendar, MapPin, 
  Activity, Archive, AlertCircle 
} from 'lucide-react';

const ContractorDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [contractor, setContractor] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractorRes, projectsRes] = await Promise.all([
        getContractorDetails(id),
        getContractorProjects(id)
      ]);
      setContractor(contractorRes.data);
      setProjects(projectsRes.data.results || projectsRes.data);
    } catch (err) {
      setError('Failed to load contractor details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="text-center py-20 text-red-500">
        <AlertCircle className="mx-auto mb-3" size={48} />
        <p>{error || 'Contractor not found'}</p>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.is_active);
  const closedProjects = projects.filter(p => !p.is_active);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/contractors" className="p-2 bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Building2 className="mr-2 text-primary" size={28} />
              {contractor.name}
            </h1>
            {contractor.contact_person && (
              <p className="text-sm text-gray-500">Contact: {contractor.contact_person}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contractor Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center space-x-3">
            <Phone className="text-blue-500" size={20} />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-semibold text-gray-800">{contractor.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center space-x-3">
            <Mail className="text-green-500" size={20} />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold text-gray-800">{contractor.email || 'Not provided'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center space-x-3">
            <User className="text-purple-500" size={20} />
            <div>
              <p className="text-xs text-gray-500">Contact Person</p>
              <p className="font-semibold text-gray-800">{contractor.contact_person || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<FolderOpen />} 
          title="Total Projects" 
          value={projects.length} 
          color="blue" 
        />
        <StatCard 
          icon={<Activity />} 
          title="Active Projects" 
          value={activeProjects.length} 
          color="green" 
        />
        <StatCard 
          icon={<Archive />} 
          title="Closed Projects" 
          value={closedProjects.length} 
          color="gray" 
        />
        <StatCard 
          icon={<Calendar />} 
          title="Added On" 
          value={new Date(contractor.created_at).toLocaleDateString()} 
          color="purple" 
        />
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FolderOpen className="mr-2 text-primary" size={20} />
          Projects ({projects.length})
        </h2>
        
        {projects.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <FolderOpen className="mx-auto mb-3 text-gray-300" size={48} />
            <p>No projects assigned to this contractor yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="p-3">Project No</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.map(project => (
                  <tr key={project.id} className="bg-gray-50">
                    <td className="p-3 font-mono text-xs">{project.project_no}</td>
                    <td className="p-3 font-semibold text-gray-800">{project.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.scope === 'DESIGN' ? 'bg-blue-100 text-blue-800' :
                        project.scope === 'SUPERVISION' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {project.scope}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                      }`}>
                        {project.is_active ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{project.start_date || 'TBD'}</td>
                    <td className="p-3">
                      <Link 
                        to={`/projects/${project.id}`}
                        className="text-primary text-blue-800 font-semibold text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, color }) => (
  <div className={`bg-white p-5 rounded-lg shadow-sm border-l-4 border-${color}-500 flex items-center`}>
    <div className={`p-3 bg-${color}-100 rounded-full mr-4 text-${color}-600`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 uppercase">{title}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default ContractorDetails;
