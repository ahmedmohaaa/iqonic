import { useState } from 'react';
import { createClient } from '../../../api/services/clients';
import { X, AlertTriangle } from 'lucide-react';

const AddClientModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Client name is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createClient(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to create client.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Add New Client</h2>
          <button onClick={onClose} className="text-gray-400 text-gray-600"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
              <AlertTriangle size={16} className="mr-2" /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company / Client Name *</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="e.g. Al Rayyan Company"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input 
              type="text" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="+974 XXXX XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="contact@company.com"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600 bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded bg-blue-800 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
