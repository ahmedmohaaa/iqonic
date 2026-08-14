import { useState, useEffect } from 'react';
import { getUsers, updateUser, deleteUser } from '../../api/services/admin';
import { useAuth } from '../../context/AuthContext';
import { 
  Shield, Edit, Trash2, Search, Loader, 
  AlertCircle, CheckCircle, XCircle
} from 'lucide-react';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isManager = ['GM', 'AGM'].includes(user?.role);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (window.confirm(`Are you sure you want to delete user ${username}?`)) {
      try {
        await deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getRoleBadge = (role) => {
    const badges = {
      GM: { color: 'bg-purple-100 text-purple-800', icon: <Shield size={12} /> },
      AGM: { color: 'bg-blue-100 text-blue-800', icon: <Shield size={12} /> },
      DESIGN_MGR: { color: 'bg-indigo-100 text-indigo-800', icon: <Shield size={12} /> },
      SUP_MGR: { color: 'bg-green-100 text-green-800', icon: <Shield size={12} /> },
      SECRETARY: { color: 'bg-pink-100 text-pink-800', icon: <CheckCircle size={12} /> },
      ACCOUNTANT: { color: 'bg-yellow-100 text-yellow-800', icon: <CheckCircle size={12} /> },
    };
    return badges[role] || { color: 'bg-gray-100 text-gray-800', icon: <XCircle size={12} /> };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-2 text-blue-600" size={28} />
            User Management
          </h1>
          <p className="text-sm font-medium text-gray-600">Manage system users and permissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
          <Shield className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-600 font-medium">No users found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-800 uppercase text-xs font-bold border-b border-gray-200">
                <tr>
                  <th className="p-4">Username</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map(u => {
                  const badge = getRoleBadge(u.role);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      {/* اسم المستخدم أصبح كبيراً وواضحاً باللون الأسود الداكن */}
                      <td className="p-4 font-mono text-sm font-bold text-gray-900">{u.username}</td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{u.first_name} {u.last_name}</p>
                      </td>
                      <td className="p-4 text-gray-800 font-medium">{u.email || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                          {badge.icon}
                          <span>{u.role_display || u.role}</span>
                        </span>
                      </td>
                      <td className="p-4 text-gray-800 font-medium">{u.department || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;