import { useState, useEffect } from 'react';
import { getSupervisionInvoices, createSupervisionInvoice, getSupervisionStatistics } from '../../../api/services/financials';
import { useAuth } from '../../../context/AuthContext';
import { Calendar, Plus } from 'lucide-react';
import { ModalWrapper, StatusBadge } from './DesignFinancialBlock'; // Reusing helpers

const SupervisionFinancialBlock = ({ projectId }) => {
  const { isAccountant, isManagement } = useAuth();
  const canEdit = isAccountant() || isManagement();

  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = () => {
    getSupervisionInvoices(projectId).then(res => setInvoices(res.data.results || res.data));
    getSupervisionStatistics(projectId).then(res => setStats(res.data));
  };

  useEffect(() => { fetchData(); }, [projectId]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center"><Calendar className="mr-2 text-purple-600"/> Supervision Monthly Invoices</h2>
        {canEdit && (
          <button onClick={() => setShowAddModal(true)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm bg-purple-700 flex items-center">
            <Plus size={16} className="mr-1"/> Add Monthly Invoice
          </button>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-purple-50 rounded text-center">
            <p className="text-xs text-gray-600">Total Collected</p>
            <p className="text-xl font-bold text-purple-700">${stats.total_collected_supervision}</p>
          </div>
          <div className="p-3 bg-red-50 rounded text-center">
            <p className="text-xs text-gray-600">Total Outstanding</p>
            <p className="text-xl font-bold text-red-700">${stats.total_outstanding_supervision}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded text-center">
            <p className="text-xs text-gray-600">Overdue Invoices</p>
            <p className="text-xl font-bold text-blue-700">{stats.overdue_count}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-3">Month / Name</th>
              <th className="p-3">Issue Date</th>
              <th className="p-3">Due Date</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className={`border-b ${inv.status === 'OVERDUE' ? 'bg-red-50' : ''}`}>
                <td className="p-3 font-medium">{inv.month_name}</td>
                <td className="p-3">{inv.issue_date || 'N/A'}</td>
                <td className="p-3">{inv.due_date || 'N/A'}</td>
                <td className="p-3">${inv.amount}</td>
                <td className="p-3"><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && <AddSupervisionInvoiceModal projectId={projectId} onClose={() => setShowAddModal(false)} onSuccess={fetchData} />}
    </div>
  );
};

const AddSupervisionInvoiceModal = ({ projectId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    month_name: '',
    issue_date: '',
    due_date: '',
    amount: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createSupervisionInvoice(projectId, formData);
    onSuccess();
    onClose();
  };

  return (
    <ModalWrapper title="Add Supervision Monthly Invoice" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Month / Invoice Name *</label>
          <input required type="text" placeholder="e.g. October 2023" value={formData.month_name} onChange={e => setFormData({...formData, month_name: e.target.value})} className="w-full border rounded p-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Issue Date</label>
            <input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} className="w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date *</label>
            <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full border rounded p-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount *</label>
          <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full border rounded p-2 text-sm" />
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded bg-purple-700">Create Invoice</button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default SupervisionFinancialBlock;
