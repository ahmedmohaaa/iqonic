import { useState, useEffect } from 'react';
import { getInvoices, createInvoice, recordPayment, getInvoiceStatistics } from '../../../api/services/financials';
import { useAuth } from '../../../context/AuthContext';
import { DollarSign, Plus, AlertTriangle, CreditCard } from 'lucide-react';

const DesignFinancialBlock = ({ projectId }) => {
  const { isAccountant, isManagement } = useAuth();
  const canEdit = isAccountant() || isManagement();
  
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null);

  const fetchData = () => {
    getInvoices({ project: projectId }).then(res => setInvoices(res.data.results || res.data));
    getInvoiceStatistics(projectId).then(res => setStats(res.data));
  };

  useEffect(() => { fetchData(); }, [projectId]);

  // حساب أيام التأخير للفواتير المتأخرة
  const calculateDelayedDays = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center"><DollarSign className="mr-2 text-green-600"/> Design Financials & Milestones</h2>
        {canEdit && (
          <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm bg-green-700 flex items-center">
            <Plus size={16} className="mr-1"/> Add Milestone Invoice
          </button>
        )}
      </div>

      {/* Statistics Summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded text-center">
            <p className="text-xs text-gray-600">Total Invoiced</p>
            <p className="text-xl font-bold text-blue-700">${stats.financial_summary.total_invoiced}</p>
          </div>
          <div className="p-3 bg-green-50 rounded text-center">
            <p className="text-xs text-gray-600">Total Collected</p>
            <p className="text-xl font-bold text-green-700">${stats.financial_summary.collected}</p>
          </div>
          <div className="p-3 bg-red-50 rounded text-center">
            <p className="text-xs text-gray-600">Total Outstanding</p>
            <p className="text-xl font-bold text-red-700">${stats.financial_summary.outstanding}</p>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-3">Milestone</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Due Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const isOverdue = inv.status === 'OVERDUE';
              const delayedDays = calculateDelayedDays(inv.due_date);
              
              return (
                <tr key={inv.id} className={`border-b ${isOverdue ? 'bg-red-50 text-red-800' : ''}`}>
                  <td className="p-3 font-medium">{inv.milestone_type_display}</td>
                  <td className="p-3">${inv.total_amount}</td>
                  <td className="p-3">
                    {inv.due_date || 'N/A'}
                    {isOverdue && delayedDays > 0 && (
                      <span className="ml-2 text-xs bg-red-200 px-1 rounded flex items-center inline-flex">
                        <AlertTriangle size={12} className="mr-1" /> Delayed by {delayedDays} days
                      </span>
                    )}
                  </td>
                  <td className="p-3"><StatusBadge status={inv.status} /></td>
                  <td className="p-3">
                    {canEdit && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                      <button 
                        onClick={() => setShowPayModal(inv)} 
                        className="text-blue-600 text-blue-800 flex items-center text-xs font-semibold"
                      >
                        <CreditCard size={14} className="mr-1" /> Record Payment
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddModal && <AddInvoiceModal projectId={projectId} onClose={() => setShowAddModal(false)} onSuccess={fetchData} />}
      {showPayModal && <RecordPaymentModal invoice={showPayModal} onClose={() => setShowPayModal(null)} onSuccess={fetchData} />}
    </div>
  );
};

// Add Invoice Modal (Restricted to 4 Milestones)
const AddInvoiceModal = ({ projectId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    project: projectId,
    milestone_type: 'DOWN_PAYMENT',
    title: '',
    total_amount: '',
    issue_date: '',
    due_date: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createInvoice(formData);
    onSuccess();
    onClose();
  };

  return (
    <ModalWrapper title="Add Milestone Invoice" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Milestone Type *</label>
          <select required value={formData.milestone_type} onChange={e => setFormData({...formData, milestone_type: e.target.value})} className="w-full border rounded p-2 text-sm">
            <option value="DOWN_PAYMENT">Down Payment / Advanced</option>
            <option value="DC1">DC1 Payment</option>
            <option value="DC2">DC2 Payment</option>
            <option value="TENDERING">Tendering Payment</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title / Description *</label>
          <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded p-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount *</label>
            <input required type="number" step="0.01" value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: e.target.value})} className="w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Issue Date *</label>
            <input required type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} className="w-full border rounded p-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Due Date *</label>
          <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full border rounded p-2 text-sm" />
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded bg-green-700">Create Invoice</button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// Record Payment Modal
const RecordPaymentModal = ({ invoice, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await recordPayment({ invoice: invoice.id, amount_paid: amount });
    onSuccess();
    onClose();
  };

  return (
    <ModalWrapper title={`Record Payment for ${invoice.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">Total Invoice Amount: <span className="font-bold">${invoice.total_amount}</span></p>
        <div>
          <label className="block text-sm font-medium mb-1">Payment Amount *</label>
          <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded p-2 text-sm" />
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded bg-blue-700">Confirm Payment</button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// Helper: Modal Wrapper
export const ModalWrapper = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <button onClick={onClose} className="text-gray-400 text-gray-600 text-xl">&times;</button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

export const StatusBadge = ({ status }) => {
  const colors = {
    DRAFT: 'bg-gray-100 text-gray-800', ISSUED: 'bg-blue-100 text-blue-800',
    PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800', PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800', CANCELLED: 'bg-gray-300 text-gray-800'
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>{status.replace('_', ' ')}</span>;
};

export default DesignFinancialBlock;
