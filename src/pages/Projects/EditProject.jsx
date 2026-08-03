import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getProjectDetails, updateProject } from '../../api/services/projects';
import { getClients } from '../../api/services/clients';
import { getContractors } from '../../api/services/contractors';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, AlertCircle, Loader } from 'lucide-react';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm();
  const [clients, setClients] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const scope = watch('scope');

  useEffect(() => {
    Promise.all([
      getProjectDetails(id),
      getClients(),
      getContractors()
    ]).then(([projRes, clientsRes, contractorsRes]) => {
      const proj = projRes.data;
      // ملء النموذج بالبيانات الحالية
      Object.keys(proj).forEach(key => {
        if (proj[key] !== null && proj[key] !== undefined) {
          setValue(key, proj[key]);
        }
      });
      setClients(clientsRes.data.results || clientsRes.data);
      setContractors(contractorsRes.data.results || contractorsRes.data);
    }).catch(err => {
      setError('Failed to load project data');
    }).finally(() => setLoading(false));
  }, [id, setValue]);

  // تحديد الصلاحيات للتعديل
  const canEdit = ['GM', 'AGM', 'DESIGN_MGR', 'SECRETARY'].includes(user?.role);

  const onSubmit = async (data) => {
    setError('');
    try {
      await updateProject(id, data);
      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update project');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="text-center py-20 text-red-500">
        You don't have permission to edit this project.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Project</h1>
            <p className="text-sm text-gray-500">Update project information</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-center">
          <AlertCircle className="text-red-500 mr-2" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input {...register('name', { required: true })} className="w-full border rounded-lg p-2 text-sm" />
              {errors.name && <span className="text-red-500 text-xs">Required</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Number *</label>
              <input {...register('project_no', { required: true })} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scope *</label>
              <select {...register('scope', { required: true })} className="w-full border rounded-lg p-2 text-sm bg-white">
                <option value="DESIGN">Design Only</option>
                <option value="SUPERVISION">Supervision Only</option>
                <option value="BOTH">Design & Supervision</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select {...register('client', { required: true })} className="w-full border rounded-lg p-2 text-sm bg-white">
                <option value="">Select Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contractor</label>
              <select {...register('contractor')} className="w-full border rounded-lg p-2 text-sm bg-white">
                <option value="">Select Contractor</option>
                {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" {...register('start_date')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
              <input type="number" {...register('duration_days')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input {...register('location')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select {...register('priority')} className="w-full border rounded-lg p-2 text-sm bg-white">
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Building Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Building Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building Type</label>
              <input {...register('building_type')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plot Area (sqm)</label>
              <input type="number" {...register('plot_area')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BUA (sqm)</label>
              <input type="number" {...register('bua')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">FAR</label>
              <input {...register('far')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floors</label>
              <input type="number" {...register('floors')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parking</label>
              <input type="number" {...register('parking')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apartments</label>
              <input type="number" {...register('apartments')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shops</label>
              <input type="number" {...register('shops')} className="w-full border rounded-lg p-2 text-sm" />
            </div>
          </div>
        </div>

        {/* Design Specific Fields */}
        {(scope === 'DESIGN' || scope === 'BOTH') && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-4">Design Fields</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Status</label>
                <select {...register('offer_status')} className="w-full border rounded-lg p-2 text-sm bg-white">
                  <option value="NOT_SUBMITTED">Not Submitted Yet</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Status</label>
                <select {...register('contract_status')} className="w-full border rounded-lg p-2 text-sm bg-white">
                  <option value="NOT_SUBMITTED">Not Submitted Yet</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Number</label>
                <input {...register('application_no')} className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Number</label>
                <input {...register('pin_no')} className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Design Review</label>
                <select {...register('internal_design_review_required')} className="w-full border rounded-lg p-2 text-sm bg-white">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Supervision Specific Fields */}
        {(scope === 'SUPERVISION' || scope === 'BOTH') && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h2 className="text-lg font-semibold text-green-800 border-b border-green-200 pb-2 mb-4">Supervision Fields</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permit Status</label>
                <select {...register('permit_status')} className="w-full border rounded-lg p-2 text-sm bg-white">
                  <option value="NOT_ISSUED">Not Issued</option>
                  <option value="PENDING_AUTHORITY">Pending Authority</option>
                  <option value="ISSUED">Approved/Issued</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commencement Status</label>
                <select {...register('commencement_status')} className="w-full border rounded-lg p-2 text-sm bg-white">
                  <option value="NOT_ISSUED">Not Issued</option>
                  <option value="PENDING_AUTHORITY">Pending Authority</option>
                  <option value="ISSUED">Approved/Issued</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea {...register('description')} rows="4" className="w-full border rounded-lg p-2 text-sm"></textarea>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white rounded-lg bg-blue-800 flex items-center disabled:opacity-50">
            <Save size={18} className="mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProject;
