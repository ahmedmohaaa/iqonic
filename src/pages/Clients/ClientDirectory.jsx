import { useState, useEffect } from 'react';
import { getClientDirectory } from '../../api/services/clients';
import { Users, Building2, Phone, Mail, Search, Plus, FolderOpen, Loader } from 'lucide-react';
import ClientDetailsModal from './components/ClientDetailsModal';
import AddClientModal from './components/AddClientModal';

const ClientDirectory = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await getClientDirectory();
      // الـ Backend يرجع البيانات مع الإحصائيات (active_projects_count, closed_projects_count)
      setClients(res.data.results || res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  // البحث بالاسم، الهاتف، أو الإيميل
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="mr-2 text-primary" size={28} />
            Client Directory
          </h1>
          <p className="text-sm text-gray-500">Manage clients and view their project statistics.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center justify-center"
        >
          <Plus size={18} className="mr-1" /> Add New Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" size={32} /></div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <Users className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No clients found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <ClientCard 
              key={client.id} 
              client={client} 
              onViewDetails={() => handleViewDetails(client)} 
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showDetailsModal && selectedClient && (
        <ClientDetailsModal 
          client={selectedClient} 
          onClose={() => setShowDetailsModal(false)} 
        />
      )}
      {showAddModal && (
        <AddClientModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => { setShowAddModal(false); fetchClients(); }}
        />
      )}
    </div>
  );
};

// مكون بطاقة العميل
const ClientCard = ({ client, onViewDetails }) => {
  // الإحصائيات تأتي من الـ ClientDirectorySerializer في الـ Backend
  const activeProjects = client.active_projects_count || 0;
  const closedProjects = client.closed_projects_count || 0;
  const totalProjects = activeProjects + closedProjects;

  return (
    <div className="bg-white rounded-lg shadow-sm shadow-md transition border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{client.name}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1 flex-wrap gap-2">
              {client.phone && (
                <span className="flex items-center"><Phone size={14} className="mr-1" /> {client.phone}</span>
              )}
              {client.email && (
                <span className="flex items-center"><Mail size={14} className="mr-1" /> {client.email}</span>
              )}
            </div>
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            <Building2 className="text-primary" size={20} />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{totalProjects}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{activeProjects}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">{closedProjects}</p>
            <p className="text-xs text-gray-500">Closed</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-5 py-3 border-t flex justify-end">
        <button 
          onClick={onViewDetails}
          className="text-primary text-blue-800 text-sm font-semibold flex items-center"
        >
          View Projects <FolderOpen size={16} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default ClientDirectory;
