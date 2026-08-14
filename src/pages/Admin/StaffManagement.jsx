import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/services/admin';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Plus, Edit, Trash2, Search, Filter, 
  Phone, Mail, Shield, Loader, AlertCircle 
} from 'lucide-react';

const StaffManagement = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const isManager = ['GM', 'AGM'].includes(user?.role);

  const roles = [
    { value: 'GM', label: 'General Manager' },
    { value: 'AGM', label: 'Assistant General Manager' },
    { value: 'DESIGN_MGR', label: 'Design Manager' },
    { value: 'SUP_MGR', label: 'Supervision Manager' },
    { value: 'PM', label: 'Project Manager' },
    { value: 'SENIOR_ENG', label: 'Senior Engineer' },
    { value: 'ENGINEER', label: 'Engineer' },
    { value: 'DRAFTSMAN', label: 'Draftsman' },
    { value: 'SECRETARY', label: 'Secretary' },
    { value: 'ACCOUNTANT', label: 'Accountant' },
    { value: 'DOC_CONTROLLER', label: 'Document Controller' },
  ];

  const departments = ['Design', 'Supervision', 'Management', 'Finance', 'Architecture', 'Structural', 'Electrical', 'Mechanical'];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setStaff(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch staff', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteUser(id);
        setStaff(staff.filter(s => s.id !== id));
      } catch (err) {
        alert('Failed to delete staff member');
      }
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setShowModal(true);
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = 
      s.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = !filterRole || s.role === filterRole;
    const matchesDept = !filterDepartment || s.department === filterDepartment;
    
    return matchesSearch && matchesRole && matchesDept;
  });

  const getRoleColor = (role) => {
    const colors = {
      GM: 'bg-purple-100 text-purple-800',
      AGM: 'bg-blue-100 text-blue-800',
      DESIGN_MGR: 'bg-indigo-100 text-indigo-800',
      SUP_MGR: 'bg-green-100 text-green-800',
      SENIOR_ENG: 'bg-orange-100 text-orange-800',
      ENGINEER: 'bg-teal-100 text-teal-800',
      DRAFTSMAN: 'bg-cyan-100 text-cyan-800',
      SECRETARY: 'bg-pink-100 text-pink-800',
      ACCOUNTANT: 'bg-yellow-100 text-yellow-800',
      PM: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="mr-2 text-primary" size={28} />
            Staff Management
          </h1>
          <p className="text-sm text-gray-500">Manage employees and their roles</p>
        </div>
        {isManager && (
          <button 
            onClick={handleAdd}
            className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center"
          >
            <Plus size={18} className="mr-1" /> Add Staff Member
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Staff" value={staff.length} color="blue" />
        <StatCard title="Engineers" value={staff.filter(s => ['ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN'].includes(s.role)).length} color="green" />
        <StatCard title="Managers" value={staff.filter(s => ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM'].includes(s.role)).length} color="purple" />
        <StatCard title="Support Staff" value={staff.filter(s => ['SECRETARY', 'ACCOUNTANT', 'DOC_CONTROLLER'].includes(s.role)).length} color="orange" />
      </div>
{/* Search & Filters */}
<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center gap-4">
  <div className="relative flex-1 min-w-[200px]">
    <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
    <input
      type="text"
      placeholder="Search by name, username, or email..."
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>
  <div className="flex items-center space-x-2">
    <Filter size={18} className="text-gray-700" />
    <select
      value={filterRole}
      onChange={(e) => setFilterRole(e.target.value)}
      className="border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="" className="text-gray-900 bg-white">All Roles</option>
      {roles.map(r => (
        <option key={r.value} value={r.value} className="text-gray-900 bg-white">
          {r.label}
        </option>
      ))}
    </select>
    <select
      value={filterDepartment}
      onChange={(e) => setFilterDepartment(e.target.value)}
      className="border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="" className="text-gray-900 bg-white">All Departments</option>
      {departments.map(d => (
        <option key={d} value={d} className="text-gray-900 bg-white">
          {d}
        </option>
      ))}
    </select>
  </div>
</div>

      {/* Staff Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <Users className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No staff members found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStaff.map(member => (
                  <tr key={member.id} className="bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-xs">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {member.first_name} {member.last_name}
                          </p>
                          {member.username === 'salman.saeed' && (
                            <span className="text-xs text-yellow-600">Multi-Dept</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{member.username}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(member.role)}`}>
                        {member.role_display || member.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{member.department || 'N/A'}</td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {member.email && (
                          <p className="text-xs text-gray-600 flex items-center">
                            <Mail size={12} className="mr-1" /> {member.email}
                          </p>
                        )}
                        {member.phone_number && (
                          <p className="text-xs text-gray-600 flex items-center">
                            <Phone size={12} className="mr-1" /> {member.phone_number}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {member.date_joined ? new Date(member.date_joined).toLocaleDateString() : 'N/A'}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <StaffModal
          staff={editingStaff}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchStaff(); }}
          roles={roles}
          departments={departments}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className={`bg-white p-5 rounded-lg shadow-sm border-l-4 border-${color}-500`}>
    <p className="text-xs text-gray-500 uppercase">{title}</p>
    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

const StaffModal = ({ staff, onClose, onSuccess, roles, departments }) => {
  const [formData, setFormData] = useState({
    first_name: staff?.first_name || '',
    last_name: staff?.last_name || '',
    username: staff?.username || '',
    email: staff?.email || '',
    role: staff?.role || 'ENGINEER',
    department: staff?.department || '',
    phone_number: staff?.phone_number || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (staff) {
        await updateUser(staff.id, formData);
      } else {
        await createUser(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">
            {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button onClick={onClose} className="text-gray-400 text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
              <AlertCircle size={16} className="mr-2" /> {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full border rounded-lg p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full border rounded-lg p-2 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full border rounded-lg p-2 text-sm"
              required
              disabled={!!staff}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full border rounded-lg p-2 text-sm bg-white"
                required
              >
                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full border rounded-lg p-2 text-sm bg-white"
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          {!staff && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full border rounded-lg p-2 text-sm"
                required
              />
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded bg-blue-800 disabled:opacity-50">
              {loading ? 'Saving...' : (staff ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffManagement;
