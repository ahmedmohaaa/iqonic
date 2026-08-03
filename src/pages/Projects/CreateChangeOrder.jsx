import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getProjectDetails, createChangeOrder } from '../../api/services/projects';
import { getUsersList } from '../../api/services/audit';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, GitBranch, AlertCircle, Loader, Plus, Trash2 } from 'lucide-react';

const CreateChangeOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm();
  const [project, setProject] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState([{ assigned_to: '', discipline: '', title: '', priority: 'MEDIUM' }]);

  const isProjectClosed = project?.is_active === false;

  useEffect(() => {
    Promise.all([
      getProjectDetails(id),
      getUsersList()
    ]).then(([projRes, usersRes]) => {
      setProject(projRes.data);
      const engs = (usersRes.data.results || usersRes.data).filter(u => 
        ['ENGINEER', 'SENIOR_ENG', 'DRAFTSMAN'].includes(u.role)
      );
      setEngineers(engs);
    }).catch(err => {
      setError('Failed to load project data');
    }).finally(() => setLoading(false));
  }, [id]);

  const addTask = () => {
    setTasks([...tasks, { assigned_to: '', discipline: '', title: '', priority: 'MEDIUM' }]);
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const onSubmit = async (data) => {
    setError('');
    try {
      let payload;
      if (isProjectClosed) {
        // Case 1: Project مغلق → Sub Project
        payload = {
          revision_number: data.revision_number,
          new_application_no: data.new_application_no,
          revision_start_date: data.revision_start_date,
          change_order_reason: data.change_order_reason,
        };
      } else {
        // Case 2: Project نشط → Tasks
        payload = {
          tasks: tasks.map(t => ({
            assigned_to: t.assigned_to,
            discipline: t.discipline,
            title: t.title,
            priority: t.priority,
            stage: 'DC1'
          }))
        };
      }
      await createChangeOrder(id, payload);
      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create change order');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-20 text-red-500">Project not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <GitBranch className="mr-2 text-primary" size={28} />
              Create Change Order
            </h1>
            <p className="text-sm text-gray-500">
              {isProjectClosed ? 'Case 1: Create Sub Project (Revision)' : 'Case 2: Add Change Order Tasks'}
            </p>
          </div>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-600">Parent: </span>
          <span className="font-bold text-gray-800">{project.project_no}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-center">
          <AlertCircle className="text-red-500 mr-2" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* Project Info Summary */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-800 mb-2">Original Project Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">Name:</span> {project.name}</div>
            <div><span className="text-gray-500">Client:</span> {project.client_name}</div>
            <div><span className="text-gray-500">Scope:</span> {project.scope}</div>
            <div><span className="text-gray-500">Status:</span> {project.is_active ? 'Active' : 'Closed'}</div>
          </div>
        </div>

        {isProjectClosed ? (
          // Case 1: Sub Project Form
          <div>
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Sub Project Details (Revision)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Revision Number *</label>
                <input {...register('revision_number', { required: true })} placeholder="e.g. Rev1, Rev2" className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Application Number</label>
                <input {...register('new_application_no')} placeholder="If issued" className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Revision Start Date *</label>
                <input type="date" {...register('revision_start_date', { required: true })} className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Change Order Reason/Description *</label>
                <textarea {...register('change_order_reason', { required: true })} rows="4" className="w-full border rounded-lg p-2 text-sm" placeholder="Explain the reason for this change order..."></textarea>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-semibold mb-1">Note:</p>
              <p>A new sub-project will be created with pre-filled information from the original project. You can update only the changed fields.</p>
            </div>
          </div>
        ) : (
          // Case 2: Tasks Form
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Change Order Tasks</h2>
              <button type="button" onClick={addTask} className="bg-primary text-white px-4 py-2 rounded-lg bg-blue-800 flex items-center text-sm">
                <Plus size={16} className="mr-1" /> Add Task
              </button>
            </div>
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700">Task #{index + 1}</h3>
                    {tasks.length > 1 && (
                      <button type="button" onClick={() => removeTask(index)} className="text-red-500 text-red-700">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                      <input 
                        value={task.title} 
                        onChange={(e) => updateTask(index, 'title', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm" 
                        placeholder="Task title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Assign To *</label>
                      <select 
                        value={task.assigned_to} 
                        onChange={(e) => updateTask(index, 'assigned_to', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm bg-white"
                      >
                        <option value="">Select Engineer</option>
                        {engineers.map(eng => (
                          <option key={eng.id} value={eng.id}>{eng.first_name} {eng.last_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Discipline *</label>
                      <select 
                        value={task.discipline} 
                        onChange={(e) => updateTask(index, 'discipline', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm bg-white"
                      >
                        <option value="">Select Discipline</option>
                        <option value="1">Architecture</option>
                        <option value="2">Structural</option>
                        <option value="3">Electrical</option>
                        <option value="4">Mechanical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                      <select 
                        value={task.priority} 
                        onChange={(e) => updateTask(index, 'priority', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm bg-white"
                      >
                        <option value="URGENT">Urgent</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white rounded-lg bg-blue-800 flex items-center disabled:opacity-50">
            <GitBranch size={18} className="mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Change Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateChangeOrder;
