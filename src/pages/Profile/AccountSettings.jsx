import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateUser } from '../../api/services/users';
import { useAuth } from '../../context/AuthContext';
import { Save, User, Mail, Phone, Building, AlertCircle, CheckCircle } from 'lucide-react';

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user: authUser, login } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    department: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (authUser?.id) {
      getCurrentUser()
        .then(res => {
          const user = res.data;
          setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone_number: user.phone_number || '',
            department: user.department || '',
          });
        })
        .catch(err => {
          setMessage({ type: 'error', text: 'Failed to load profile data.' });
        })
        .finally(() => setLoading(false));
    }
  }, [authUser]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await updateUser(authUser.id, formData);
      
      // تحديث البيانات في AuthContext
      login(
        { access: localStorage.getItem('access_token') },
        response.data
      );
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // إعادة التوجيه بعد 2 ثانية
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update profile.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-700 mt-1 font-medium">Update your personal information</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="mr-2" size={20} />
          ) : (
            <AlertCircle className="mr-2" size={20} />
          )}
          {message.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-600" size={18} />
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Last Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-600" size={18} />
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 text-gray-600" size={18} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 text-gray-600" size={18} />
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+974 XXXX XXXX"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Department
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-2.5 text-gray-600" size={18} />
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
            >
              <option value="">Select Department</option>
              <option value="Design">Design</option>
              <option value="Supervision">Supervision</option>
              <option value="Management">Management</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
        </div>

        {/* Read-only Fields */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Information (Read-only)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={authUser?.username || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={authUser?.role_display || authUser?.role || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-800 bg-gray-50 hover:bg-gray-100 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition flex items-center font-semibold disabled:opacity-50"
          >
            <Save className="mr-2" size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountSettings;
