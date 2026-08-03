import { useState, useEffect } from 'react';
import { getClientProjects } from '../../../api/services/clients';
import { X, FolderOpen, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientDetailsModal = ({ client, onClose }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClientProjects(client.id)
      .then(res => setProjects(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [client.id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{client.name}</h2>
            <p className="text-sm text-gray-500">{client.phone} | {client.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 text-gray-600"><X size={24} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <FolderOpen size={18} className="mr-2" /> Projects Directory
          </h3>

          {loading ? (
            <div className="flex justify-center py-10"><Loader className="animate-spin text-primary" size={28} /></div>
          ) : projects.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No projects found for this client.</p>
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
                <tbody>
                  {projects.map(proj => (
                    <tr key={proj.id} className="border-b bg-gray-50">
                      <td className="p-3 font-mono text-xs">{proj.project_no}</td>
                      <td className="p-3 font-semibold text-gray-800">{proj.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          proj.scope === 'DESIGN' ? 'bg-blue-100 text-blue-800' :
                          proj.scope === 'SUPERVISION' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {proj.scope}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          proj.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                        }`}>
                          {proj.is_active ? 'Active' : 'Closed'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{proj.start_date || 'TBD'}</td>
                      <td className="p-3">
                        <Link 
                          to={`/projects/${proj.id}`} 
                          className="text-primary text-blue-800 font-semibold text-xs"
                          onClick={onClose} // إغلاق الـ Modal عند الانتقال للصفحة
                        >
                          View Details
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
    </div>
  );
};

export default ClientDetailsModal;
