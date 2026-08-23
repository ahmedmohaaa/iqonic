import { useState, useEffect } from 'react';
import { getContractors, getContractorProjects } from '../../api/services/contractors';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Building2, Search, Filter, Loader, Plus, 
  Phone, Mail, User, FolderOpen, Archive, 
  Activity, AlertCircle 
} from 'lucide-react';
import AddContractorModal from './components/AddContractorModal';

const ContractorsDirectory = () => {
  const { user } = useAuth();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({});

  const canManage = ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM', 'SECRETARY'].includes(user?.role);

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const res = await getContractors();
      const contractorsList = res.data.results || res.data;
      setContractors(contractorsList);
      
      // جلب إحصائيات كل مقاول
      const statsObj = {};
      await Promise.all(
        contractorsList.map(async (contractor) => {
          try {
            const projRes = await getContractorProjects(contractor.id);
            const projects = projRes.data.results || projRes.data;
            const active = projects.filter(p => p.is_active).length;
            const closed = projects.filter(p => !p.is_active).length;
            statsObj[contractor.id] = {
              total: projects.length,
              active,
              closed,
              projects
            };
          } catch (err) {
            statsObj[contractor.id] = { total: 0, active: 0, closed: 0, projects: [] };
          }
        })
      );
      setStats(statsObj);
    } catch (err) {
      console.error('Failed to fetch contractors', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContractors = contractors.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = !filterType || 
      (filterType === 'active' && stats[c.id]?.active > 0) ||
      (filterType === 'inactive' && stats[c.id]?.total === 0);
    
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete contractor "${name}"?`)) {
      try {
        await deleteContractor(id);
        setContractors(contractors.filter(c => c.id !== id));
      } catch (err) {
        alert('Failed to delete contractor');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Building2 className="mr-2 text-primary" size={28} />
            Contractors Directory
          </h1>
          <p className="text-sm text-gray-500">Manage contractors and view their project statistics</p>
        </div>
{user?.role === 'SECRETARY' && ['Supervision', 'Design'].includes(user?.department) && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center"
          >
            <Plus size={18} className="mr-1" /> Add Contractor
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Building2 />} 
          title="Total Contractors" 
          value={contractors.length} 
          color="blue" 
        />
        <StatCard 
          icon={<Activity />} 
          title="Active Contractors" 
          value={contractors.filter(c => stats[c.id]?.active > 0).length} 
          color="green" 
        />
        <StatCard 
          icon={<Archive />} 
          title="Inactive Contractors" 
          value={contractors.filter(c => stats[c.id]?.total === 0).length} 
          color="gray" 
        />
        <StatCard 
          icon={<FolderOpen />} 
          title="Total Projects" 
          value={Object.values(stats).reduce((sum, s) => sum + s.total, 0)} 
          color="purple" 
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, contact person, phone, or email..."
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-semibold placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border-2 border-gray-400 rounded-lg p-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Contractors</option>
            <option value="active">With Active Projects</option>
            <option value="inactive">Without Projects</option>
          </select>
        </div>
      </div>

      {/* Contractors Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredContractors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <Building2 className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No contractors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContractors.map(contractor => (
            <ContractorCard 
              key={contractor.id} 
              contractor={contractor} 
              stats={stats[contractor.id] || { total: 0, active: 0, closed: 0 }}
              canManage={canManage}
              onDelete={() => handleDelete(contractor.id, contractor.name)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddContractorModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => { setShowAddModal(false); fetchContractors(); }}
        />
      )}
    </div>
  );
};

// Contractor Card Component
const ContractorCard = ({ contractor, stats, canManage, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm shadow-md transition border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{contractor.name}</h3>
              {contractor.contact_person && (
                <p className="text-xs text-gray-500 flex items-center">
                  <User size={12} className="mr-1" /> {contractor.contact_person}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          {contractor.phone && (
            <p className="flex items-center">
              <Phone size={14} className="mr-2 text-gray-400" /> {contractor.phone}
            </p>
          )}
          {contractor.email && (
            <p className="flex items-center">
              <Mail size={14} className="mr-2 text-gray-400" /> {contractor.email}
            </p>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{stats.total}</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{stats.active}</p>
            <p className="text-[10px] text-gray-500">Active</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-500">{stats.closed}</p>
            <p className="text-[10px] text-gray-500">Closed</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-5 py-3 border-t flex justify-between items-center">
        <Link 
          to={`/contractors/${contractor.id}`}
          className="text-primary text-blue-800 text-sm font-semibold flex items-center"
        >
          View Details <FolderOpen size={16} className="ml-1" />
        </Link>
        {canManage && (
          <button 
            onClick={onDelete}
            className="text-red-500 text-red-700 text-xs"
          >
            Delete
          </button>
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
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default ContractorsDirectory;
