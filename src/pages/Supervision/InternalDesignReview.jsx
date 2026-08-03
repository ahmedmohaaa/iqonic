import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getInternalDesignReview, updateInternalReviewStage } from '../../api/services/supervision';
import { useAuth } from '../../context/AuthContext';
import { ClipboardCheck, Loader, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const InternalDesignReview = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const isManager = ['SUP_MGR', 'PM', 'GM', 'AGM'].includes(user?.role);

  useEffect(() => {
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getInternalDesignReview(id);
      setProject(res.data.project);
      setReviews(res.data.reviews);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reviewId, newStatus) => {
    setUpdating(reviewId);
    try {
      await updateInternalReviewStage(id, {
        review_id: reviewId,
        status: newStatus,
      });
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-gray-100 text-gray-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100';
  };

  const getStatusIcon = (status) => {
    if (status === 'APPROVED') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'UNDER_REVIEW') return <Clock size={16} className="text-yellow-500" />;
    return <AlertCircle size={16} className="text-gray-400" />;
  };

  const canUpdate = (review) => {
    if (isManager) return true;
    return review.assigned_to === user?.id && review.status !== 'APPROVED';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <ClipboardCheck className="mr-2 text-primary" size={28} />
          Internal Design Review
        </h1>
        <p className="text-sm text-gray-500">
          {project?.name} - {project?.project_no}
        </p>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <ClipboardCheck className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No internal design review stages found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{review.stage_name_display || review.stage_name}</h3>
                    <p className="text-xs text-gray-500">
                      Assigned to: {review.assigned_to_name || 'Not assigned'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(review.status)}`}>
                  {review.status.replace('_', ' ')}
                </span>
              </div>

              {/* Status Update Buttons */}
              {canUpdate(review) && review.status !== 'APPROVED' && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {review.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusUpdate(review.id, 'UNDER_REVIEW')}
                        disabled={updating === review.id}
                        className="px-4 py-2 bg-yellow-500 text-white rounded text-sm bg-yellow-600 disabled:opacity-50"
                      >
                        Start Review
                      </button>
                    )}
                    {review.status === 'UNDER_REVIEW' && (
                      <button
                        onClick={() => handleStatusUpdate(review.id, 'APPROVED')}
                        disabled={updating === review.id}
                        className="px-4 py-2 bg-green-500 text-white rounded text-sm bg-green-600 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Review Info */}
              {review.review_date && (
                <div className="mt-3 text-xs text-gray-500">
                  <span>Reviewed on: {review.review_date}</span>
                  {review.approved_at && <span className="ml-4">Approved on: {review.approved_at}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternalDesignReview;
