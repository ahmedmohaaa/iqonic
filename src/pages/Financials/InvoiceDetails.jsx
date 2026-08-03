import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getInvoiceDetails, updateInvoice, deleteInvoice, recordPayment 
} from '../../api/services/financials';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, FileText, Calendar, DollarSign, AlertCircle, 
  CheckCircle, Clock, Trash2, Plus, Printer, Download 
} from 'lucide-react';
import InvoiceFilesPanel from './components/InvoiceFilesPanel';

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [error, setError] = useState('');

  const isAccountantOrManager = ['GM', 'AGM', 'ACCOUNTANT'].includes(user?.role);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await getInvoiceDetails(id);
      setInvoice(res.data);
    } catch (err) {
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (amount) => {
    try {
      await recordPayment({ invoice: invoice.id, amount_paid: amount });
      setShowPaymentModal(false);
      fetchInvoice(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record payment');
    }
  };

  const handleCancelInvoice = async () => {
    if (window.confirm('Are you sure you want to cancel this invoice?')) {
      try {
        await updateInvoice(id, { status: 'CANCELLED' });
        fetchInvoice();
      } catch (err) {
        alert('Failed to cancel invoice');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ISSUED: 'bg-blue-100 text-blue-800',
      PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-300 text-gray-800',
    };
    return colors[status] || 'bg-gray-100';
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!invoice) return <div className="text-center py-20 text-gray-500">Invoice not found</div>;

  const totalPaid = invoice.payments?.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0) || 0;
  const remaining = parseFloat(invoice.total_amount) - totalPaid;
  const progressPercent = (totalPaid / parseFloat(invoice.total_amount)) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FileText className="mr-2 text-primary" size={28} />
              Invoice #{invoice.id} - {invoice.title}
            </h1>
            <p className="text-sm text-gray-500">
              Milestone: {invoice.milestone_type_display || invoice.milestone_type}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 border rounded-lg text-gray-700 bg-gray-50 flex items-center">
            <Printer size={16} className="mr-2" /> Print
          </button>
          {isAccountantOrManager && invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
            <>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg bg-green-700 flex items-center"
              >
                <Plus size={16} className="mr-2" /> Record Payment
              </button>
              <button 
                onClick={handleCancelInvoice}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg bg-red-50 flex items-center"
              >
                <Trash2 size={16} className="mr-2" /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Amount" value={`$${invoice.total_amount}`} icon={<DollarSign />} color="blue" />
        <StatCard label="Total Paid" value={`$${totalPaid.toFixed(2)}`} icon={<CheckCircle />} color="green" />
        <StatCard label="Remaining" value={`$${remaining.toFixed(2)}`} icon={<Clock />} color={remaining > 0 ? "yellow" : "gray"} />
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase">Status</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getStatusColor(invoice.status)}`}>
            {invoice.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold text-gray-700">Payment Progress</span>
          <span className="font-bold text-primary">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-green-500 h-3 rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Information</h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="Project" value={
              <Link to={`/projects/${invoice.project_id}`} className="text-primary underline font-medium">
                {invoice.project_name || 'View Project'}
              </Link>
            } />
            <InfoRow label="Issue Date" value={invoice.issue_date || 'Not set'} />
            <InfoRow label="Due Date" value={
              <span className={invoice.status === 'OVERDUE' ? 'text-red-600 font-bold' : ''}>
                {invoice.due_date || 'Not set'}
              </span>
            } />
            <InfoRow label="Created At" value={new Date(invoice.created_at).toLocaleDateString()} />
          </div>
        </div>

        {/* Payment History */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.payments.map((payment, idx) => (
                    <tr key={idx} className="bg-gray-50">
                      <td className="p-3">{payment.payment_date}</td>
                      <td className="p-3 font-semibold text-green-700">${payment.amount_paid}</td>
                      <td className="p-3 text-gray-600">{payment.recorded_by_name || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <DollarSign className="mx-auto mb-2 text-gray-300" size={32} />
              <p>No payments recorded yet.</p>
            </div>
          )}
        </div>
      </div>
<InvoiceFilesPanel invoiceId={invoice.id} invoiceTitle={invoice.title} />
      {/* Record Payment Modal */}
      {showPaymentModal && (
        <PaymentModal 
          remaining={remaining} 
          onClose={() => setShowPaymentModal(false)} 
          onSubmit={handleRecordPayment} 
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-white p-5 rounded-lg shadow-sm border-l-4 border-${color}-500 flex items-center`}>
    <div className={`p-3 bg-${color}-100 rounded-full mr-4 text-${color}-600`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between border-b pb-2">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
);

const PaymentModal = ({ remaining, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseFloat(amount) > remaining) {
      alert('Amount cannot exceed remaining balance');
      return;
    }
    onSubmit(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Record Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Max: ${remaining.toFixed(2)})</label>
            <input 
              type="number" 
              step="0.01" 
              max={remaining}
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm" 
              required 
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded bg-green-700">Confirm Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceDetails;
