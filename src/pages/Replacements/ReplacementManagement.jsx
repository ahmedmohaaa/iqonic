import { useState, useEffect } from 'react';
import { getTaskReplacementRequests, getSupervisionReplacementRequests } from '../../api/services/replacements';
import { useAuth } from '../../context/AuthContext';
import { UserX, Briefcase, HardHat, Loader, AlertCircle } from 'lucide-react';
import ReplacementCard from './components/ReplacementCard';
import RespondModal from './components/RespondModal';

const ReplacementManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('task'); // 'task' or 'supervision'

  const tabs = [
    { id: 'tasks', label: 'Task Replacements', icon: Briefcase, fetchFn: getTaskReplacementRequests },
    { id: 'supervision', label: 'Supervision Team Replacements', icon: HardHat, fetchFn: getSupervisionReplacementRequests },
  ];

  useEffect(() => {
    const currentTab = tabs.find(t => t.id === activeTab);
    setLoading(true);
    currentTab.fetchFn({ status: 'PENDING' })
      .then(res => setRequests(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const handleRespond = (request, type) => {
    setSelectedRequest(request);
    setModalType(type);
    setShowModal(true);
  };

  const refreshData = () => {
    const currentTab = tabs.find(t => t.id === activeTab);
    currentTab.fetchFn({ status: 'PENDING' })
      .then(res => setRequests(res.data.results || res.data));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <UserX className="mr-2 text-red-500" size={28} />
          Replacement Requests Management
        </h1>
        <p className="text-sm text-gray-500">Review and respond to engineer replacement requests.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 text-gray-700 border-gray-300'
              }`}
            >
              <tab.icon size={18} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader className="animate-spin text-primary" size={32} /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
          <p className="text-gray-500">No pending replacement requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(req => (
            <ReplacementCard 
              key={req.id} 
              request={req} 
              type={activeTab}
              onRespond={() => handleRespond(req, activeTab)} 
            />
          ))}
        </div>
      )}

      {/* Respond Modal */}
      {showModal && (
        <RespondModal 
          request={selectedRequest} 
          type={modalType}
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            refreshData();
          }} 
        />
      )}
    </div>
  );
};

export default ReplacementManagement;
