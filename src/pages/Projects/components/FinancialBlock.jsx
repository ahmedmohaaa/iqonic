import { useState, useEffect } from 'react';
import { getProjectInvoices, createInvoice, recordPayment } from '../../../api/services/projectDetails';
import { DollarSign, Plus, AlertTriangle } from 'lucide-react';

const FinancialBlock = ({ projectId }) => {
  const [invoices, setInvoices] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchInvoices = () => {
    getProjectInvoices(projectId).then(res => setInvoices(res.data.results || res.data));
  };

  useEffect(() => { fetchInvoices(); }, [projectId]);

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ISSUED: 'bg-blue-100 text-blue-800',
      PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-300 text-gray-800'
    };
    return colors[status] || 'bg-gray-100';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center"><DollarSign className="mr-2 text-green-600"/> Financials & Invoices</h2>
        <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm bg-green-700 flex items-center">
          <Plus size={16} className="mr-1"/> Add Invoice
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-3">Milestone</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Due Date</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className={`border-b ${inv.status === 'OVERDUE' ? 'bg-red-50' : ''}`}>
                <td className="p-3 font-medium">{inv.title}</td>
                <td className="p-3">${inv.total_amount}</td>
                <td className="p-3">
                  {inv.due_date}
                  {inv.status === 'OVERDUE' && <AlertTriangle className="inline ml-2 text-red-500" size={14} />}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(inv.status)}`}>
                    {inv.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialBlock;
