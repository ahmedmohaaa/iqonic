import { useState, useEffect } from 'react';
import { getTendering, updateTendering } from '../../../api/services/projectDetails';
import { useAuth } from '../../../context/AuthContext';
import { FileText } from 'lucide-react';

const TenderingBlock = ({ projectId }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const isAGM = user?.role === 'AGM';

  useEffect(() => {
    getTendering(projectId).then(res => setData(res.data)).catch(() => {});
  }, [projectId]);

  const handleUpdate = (field, value) => {
    updateTendering(projectId, { [field]: value })
      .then(res => setData(res.data));
  };

  if (!data) return null;

  const sections = [
    { key: 'boq', title: 'BOQ (Bill of Quantities)' },
    { key: 'specs', title: 'Specifications' },
    { key: 'conditions', title: 'Conditions of Contract' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 flex items-center mb-4"><FileText className="mr-2 text-blue-600"/> Tendering Module</h2>
      <div className="space-y-4">
        {sections.map(sec => (
          <div key={sec.key} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-700">{sec.title}</h3>
              <select 
                value={data[`${sec.key}_status`]} 
                onChange={(e) => handleUpdate(`${sec.key}_status`, e.target.value)}
                disabled={!isAGM}
                className="text-sm border rounded p-1 disabled:bg-gray-100"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <textarea 
              value={data[`${sec.key}_notes`] || ''}
              onChange={(e) => handleUpdate(`${sec.key}_notes`, e.target.value)}
              disabled={!isAGM}
              placeholder="Executive notes..."
              className="w-full text-sm border rounded p-2 mt-2 disabled:bg-gray-50"
              rows="2"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TenderingBlock;
