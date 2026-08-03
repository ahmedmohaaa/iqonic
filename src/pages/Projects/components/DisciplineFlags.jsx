import { useState, useEffect } from 'react';
import { getDC1Status, getDC2Status, getStructuralStatus, updateStructuralStatus, getIFCStatus, updateIFCStatus } from '../../../api/services/projectDetails';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircle, XCircle, Loader, PauseCircle } from 'lucide-react';

const DisciplineFlags = ({ projectId, projectScope }) => {
  const { user } = useAuth();
  const [dc1, setDc1] = useState(null);
  const [dc2, setDc2] = useState(null);
  const [structural, setStructural] = useState(null);
  const [ifc, setIfc] = useState(null);

  const isStructuralEng = user?.username === 'mohammad.mostafa';
  const isIfcEng = user?.username === 'shaaban.karam';
  const isManager = ['GM', 'AGM', 'DESIGN_MGR'].includes(user?.role);

  useEffect(() => {
    if (projectScope !== 'SUPERVISION') {
      getDC1Status(projectId).then(res => setDc1(res.data)).catch(() => {});
      getDC2Status(projectId).then(res => setDc2(res.data)).catch(() => {});
      getStructuralStatus(projectId).then(res => setStructural(res.data)).catch(() => {});
      getIFCStatus(projectId).then(res => setIfc(res.data)).catch(() => {});
    }
  }, [projectId, projectScope]);

  const handleStructuralUpdate = (status) => {
    updateStructuralStatus(projectId, { status }).then(res => setStructural(res.data));
  };

  const handleIfcUpdate = (status) => {
    updateIFCStatus(projectId, { status }).then(res => setIfc(res.data));
  };

  if (projectScope === 'SUPERVISION') return null;

  const renderFlag = (title, data, color, canEdit, onEdit) => {
    const isComplete = data?.is_complete || ['COMPLETED', 'APPROVED'].includes(data?.status);
    const isOnHold = data?.is_on_hold;
    
    return (
      <div className={`p-4 rounded-lg border-l-4 ${color} bg-white shadow-sm flex justify-between items-center`}>
        <div>
          <h3 className="font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">
            {data ? `${data.completed || 0} / ${data.total || 0} Items` : 'No Data'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isOnHold && <PauseCircle className="text-orange-500" size={20} />}
          {isComplete ? <CheckCircle className="text-green-500" size={24} /> : <Loader className="text-gray-400" size={24} />}
          {canEdit && (
            <select 
              value={data?.status || 'PENDING'} 
              onChange={(e) => onEdit(e.target.value)}
              className="text-xs border rounded p-1"
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {renderFlag("DC1 Status", dc1, "border-blue-500", false, null)}
      {renderFlag("DC2 Status", dc2, "border-purple-500", false, null)}
      {renderFlag("Structural (Mohammad)", structural, "border-orange-500", isStructuralEng || isManager, handleStructuralUpdate)}
      {renderFlag("IFC Package (Shaaban)", ifc, "border-red-500", isIfcEng || isManager, handleIfcUpdate)}
    </div>
  );
};

export default DisciplineFlags;
