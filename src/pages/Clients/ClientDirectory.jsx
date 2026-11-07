import { useState, useEffect } from 'react';
import { getClientDirectory, deleteClient } from '../../api/services/clients';
import { Users, Building2, Phone, Mail, Search, Plus, FolderOpen, Loader, Pencil, Trash2 } from 'lucide-react';
import ClientDetailsModal from './components/ClientDetailsModal';
import AddClientModal from './components/AddClientModal';
import { useAuth } from '../../context/AuthContext';

const ClientDirectory = () => {
  const { user } = useAuth();  // ← ضيف السطر ده

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // ✅ NEW: حالات التعديل والحذف
  const [editingClient, setEditingClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingClient, setDeletingClient] = useState(null);

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

  // ✅ NEW: فتح مودال التعديل
  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowEditModal(true);
  };

  // ✅ NEW: بدء عملية الحذف (تأكيد أولاً)
  const handleDeleteClick = (client) => {
    setDeletingClient(client);
  };

  // ✅ NEW: تأكيد الحذف فعلياً
  const confirmDelete = async () => {
    if (!deletingClient) return;
    try {
      await deleteClient(deletingClient.id);
      setDeletingClient(null);
      fetchClients();
    } catch (error) {
      const msg = error.response?.data?.detail 
        || 'Failed to delete client. They may have active projects.';
      alert(msg);
    }
  };

  // ✅ الصلاحية: السكرتارية + المدراء يمكنهم التعديل والحذف
  const canManageClients = 
    user?.role === 'SECRETARY' || 
    ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM'].includes(user?.role);

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
        {user?.role === 'SECRETARY' && ['Supervision', 'Design'].includes(user?.department) && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center justify-center"
          >
            <Plus size={18} className="mr-1" /> Add New Client
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          className="w-full pl-10 pr-4 py-2 border-2 border-gray-400 rounded-lg text-gray-900 font-semibold placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-500"
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
              onEdit={() => handleEditClient(client)}
              onDelete={() => handleDeleteClick(client)}
              canManage={canManageClients}
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
      
      {/* ✅ NEW: Edit Modal */}
      {showEditModal && editingClient && (
        <AddClientModal 
          client={editingClient}
          onClose={() => { setShowEditModal(false); setEditingClient(null); }} 
          onSuccess={() => { setShowEditModal(false); setEditingClient(null); fetchClients(); }}
        />
      )}
      
      {/* ✅ NEW: Delete Confirmation Modal */}
      {deletingClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Client</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete <b>{deletingClient.name}</b>?
                </p>
                {(deletingClient.active_projects_count || 0) > 0 && (
                  <p className="text-xs text-red-700 mt-2 flex items-center gap-1">
                    <span>⚠️</span>
                    This client has {deletingClient.active_projects_count} active project(s). 
                    Deletion may fail if projects are linked.
                  </p>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeletingClient(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-800 bg-gray-50 hover:bg-gray-100 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold transition"
                >
                  Delete Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// مكون بطاقة العميل
const ClientCard = ({ client, onViewDetails, onEdit, onDelete, canManage }) => {
  // الإحصائيات تأتي من الـ ClientDirectorySerializer في الـ Backend
  const activeProjects = client.active_projects_count || 0;
  const closedProjects = client.closed_projects_count || 0;
  const totalProjects = activeProjects + closedProjects;

  return (
    <div className="bg-white rounded-lg shadow-sm shadow-md transition border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 truncate">{client.name}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1 flex-wrap gap-2">
              {client.phone && (
                <span className="flex items-center"><Phone size={14} className="mr-1" /> {client.phone}</span>
              )}
              {client.email && (
                <span className="flex items-center"><Mail size={14} className="mr-1" /> {client.email}</span>
              )}
            </div>
          </div>
          <div className="bg-blue-100 p-2.5 rounded-full border border-blue-200 flex-shrink-0">
            <Building2 className="text-blue-800" size={20} />
          </div>
        </div>

        {/* Statistics */}

      </div>

      <div className="bg-gray-50 px-5 py-3 border-t flex justify-between items-center gap-2">
        {/* ✅ NEW: أزرار التعديل والحذف (للأشخاص المصرح لهم فقط) */}
        {canManage && (
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Edit client"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Delete client"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        
        <button 
          onClick={onViewDetails}
          className="text-primary text-blue-800 text-sm font-semibold flex items-center ml-auto"
        >
          View Projects <FolderOpen size={16} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default ClientDirectory;
