import { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import { getSupervisionTeam, removeAssignment } from '../../api/services/supervision';
import { getProjects } from '../../api/services/projects'; // Assuming a generic getProjects exists
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Calendar, Clock, AlertCircle, Loader, Trash2, Edit } from 'lucide-react';
import AssignEngineerModal from './components/AssignEngineerModal';
import TeamMemberCard from './components/TeamMemberCard';

const SupervisionTeamManagement = () => {
  
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
console.log("projects =", projects);
console.log("selectedProject =", selectedProject);
  // جلب مشاريع الإشراف فقط
useEffect(() => {
  apiClient.get('projects/supervision/')
    .then((r) => {
      const list = r.data.results || r.data || [];
      setProjects(list);
      if (list.length > 0 && !selectedProject) {
        setSelectedProject(list[0]);   // ✅ تعيين تلقائي لأول مشروع
      }
    })
    .catch(() => setProjects([]));
}, []);

  // جلب فريق الإشراف عند تغيير المشروع
  useEffect(() => {
    if (selectedProject) {
      setLoading(true);
      getSupervisionTeam(selectedProject.id)
        .then(res => setTeam(res.data.results || res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [selectedProject]);

  const handleRemove = async (assignmentId, engineerName) => {
    if (window.confirm(`Are you sure you want to remove ${engineerName} from this project?`)) {
      await removeAssignment(assignmentId);
      setTeam(team.filter(t => t.id !== assignmentId));
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setShowAssignModal(true);
  };

  const handleModalSuccess = () => {
    setShowAssignModal(false);
    setEditingAssignment(null);
    // Refresh team
    if (selectedProject) {
      getSupervisionTeam(selectedProject.id).then(res => setTeam(res.data.results || res.data));
    }
  };

  // حساب الإحصائيات
  const totalContract = team.reduce((acc, t) => acc + (t.contract_percentage || 0), 0);
  const totalActual = team.reduce((acc, t) => acc + (t.actual_percentage || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Project Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="mr-2 text-primary" size={28} />
            Supervision Team Management
          </h1>
          <p className="text-sm text-gray-500">Assign engineers, manage schedules, and track workloads.</p>
        </div>
        <div className="flex items-center gap-3">
<select
value={selectedProject?.id ?? ''}
onChange={e => {
  const id = Number(e.target.value);
  setSelectedProject(projects.find(p => p.id === id) || null);
}}  className="min-w-[240px] border-2 border-gray-500 rounded-lg p-2 text-sm font-semibold text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
>
  <option value="" className="text-gray-900 font-semibold">Select Project</option>
  {projects.map((p) => (
    <option key={p.id} value={p.id} className="text-gray-900">
      {p.project_no} - {p.name}
    </option>
  ))}
</select>
          <button 
            onClick={() => { setEditingAssignment(null); setShowAssignModal(true); }}
            className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center"
          >
            <Plus size={18} className="mr-1" /> Assign Engineer
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase">Total Engineers</p>
          <p className="text-2xl font-bold text-gray-800">{team.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase">Total Contract %</p>
          <p className="text-2xl font-bold text-green-700">{totalContract}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase">Total Actual %</p>
          <p className="text-2xl font-bold text-purple-700">{totalActual}%</p>
        </div>
      </div>

      {/* Team List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" size={32} /></div>
      ) : team.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <Users className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No engineers assigned to this project yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map(assignment => (
            <TeamMemberCard 
              key={assignment.id} 
              assignment={assignment} 
              onEdit={() => handleEdit(assignment)}
              onRemove={() => handleRemove(assignment.id, assignment.engineer_name)}
            />
          ))}
        </div>
      )}

      {/* Assign/Edit Modal */}
{/* Assign/Edit Modal */}
{/* Assign/Edit Modal */}
      {showAssignModal && (
        <AssignEngineerModal 
          projectId={selectedProject?.id} 
          projects={projects} // <-- هل تأكدت من إضافة هذا السطر هنا؟
          assignment={editingAssignment}
          onClose={() => { setShowAssignModal(false); setEditingAssignment(null); }} 
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default SupervisionTeamManagement;
