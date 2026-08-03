import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../api/services/users';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Briefcase, Building, Calendar, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser?.id) {
      getCurrentUser()
        .then(res => setUser(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [authUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-12 text-red-500">Failed to load profile.</div>;
  }

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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="text-primary" size={48} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-gray-500">@{user.username}</p>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(user.role)}`}>
                {user.role_display || user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
          <Link
            to="/profile/settings"
            className="px-4 py-2 bg-primary text-white rounded-lg bg-blue-800 transition"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Mail className="mr-2 text-primary" size={20} />
            Contact Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-800">{user.email || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-800">{user.phone_number || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Briefcase className="mr-2 text-primary" size={20} />
            Professional Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm font-medium text-gray-800">{user.department || 'Not assigned'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="text-gray-400" size={18} />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-800">{user.role_display || user.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2 text-primary" size={20} />
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(user.date_joined).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Login</p>
              <p className="text-sm font-medium text-gray-800">
                {user.last_login 
                  ? new Date(user.last_login).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/profile/settings"
              className="block w-full px-4 py-3 bg-gray-50 bg-gray-100 rounded-lg transition text-sm font-medium text-gray-700"
            >
              Edit Profile Settings
            </Link>
            <Link
              to="/profile/change-password"
              className="block w-full px-4 py-3 bg-gray-50 bg-gray-100 rounded-lg transition text-sm font-medium text-gray-700"
            >
              Change Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
