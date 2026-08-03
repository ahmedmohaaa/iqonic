import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { createExternalLog } from '../../api/services/admin';

const AddExternalLogModal = ({ isOpen, onClose, onLogAdded }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project: '', 
    log_type: '',
    sub_type: 'PENDING_DOCUMENTS',
    url: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // إرسال البيانات باستخدام الدالة الموجودة في admin.js
      await createExternalLog(formData); 
      // تحديث القائمة في الصفحة الرئيسية
      onLogAdded(); 
      // إغلاق النافذة
      onClose(); 
    } catch (error) {
      console.error('Failed to create external log', error);
      alert('حدث خطأ أثناء إضافة السجل.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Add External Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
            <input
              required
              type="number"
              name="project"
              value={formData.project}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter project ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Log Type</label>
            <input
              required
              type="text"
              name="log_type"
              value={formData.log_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Design Review, Contractor Update"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sub Type</label>
            <select
              name="sub_type"
              value={formData.sub_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="PENDING_DOCUMENTS">Pending Documents</option>
              <option value="CRITICAL">Critical Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL (Optional)</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter details..."
            ></textarea>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-blue-800 flex items-center disabled:opacity-70"
            >
              {loading ? <Loader size={18} className="animate-spin mr-2" /> : null}
              {loading ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExternalLogModal;