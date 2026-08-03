import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { updateTaskPriority } from '../../../api/services/tasks';
import { useAuth } from '../../../context/AuthContext';
import { GripVertical, Flag, AlertCircle } from 'lucide-react';

const PriorityDragDrop = ({ tasks, onUpdate }) => {
  const { user } = useAuth();
  const [localTasks, setLocalTasks] = useState(tasks);
  const [saving, setSaving] = useState(false);

  const canManage = ['GM', 'AGM', 'DESIGN_MGR', 'SUP_MGR', 'PM'].includes(user?.role);

  if (!canManage || tasks.length === 0) return null;

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // إذا لم يتم الإفلات في مكان صالح
    if (!destination) return;
    if (source.index === destination.index) return;

    // إعادة ترتيب المهام محلياً
    const newTasks = Array.from(localTasks);
    const [movedTask] = newTasks.splice(source.index, 1);
    newTasks.splice(destination.index, 0, movedTask);
    setLocalTasks(newTasks);

    // تحديث الأولوية في الـ Backend
    setSaving(true);
    try {
      // حساب الأولوية الجديدة بناءً على الموضع
      const newPriority = destination.index < 5 ? 'URGENT' : 
                         destination.index < 10 ? 'HIGH' : 
                         destination.index < 20 ? 'MEDIUM' : 'LOW';
      
      await updateTaskPriority(draggableId, { 
        priority: newPriority,
        reason: `Priority updated via drag & drop by ${user.get_full_name || user.username}`
      });
      
      onUpdate(); // تحديث القائمة من الـ Backend
    } catch (err) {
      console.error('Failed to update priority', err);
      setLocalTasks(tasks); // revert
    } finally {
      setSaving(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'border-l-red-500 bg-red-50',
      HIGH: 'border-l-orange-500 bg-orange-50',
      MEDIUM: 'border-l-yellow-500 bg-yellow-50',
      LOW: 'border-l-green-500 bg-green-50',
    };
    return colors[priority] || 'border-l-gray-500 bg-gray-50';
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <GripVertical className="mr-2 text-gray-400" size={20} />
          Priority Queue (Drag & Drop)
        </h2>
        {saving && (
          <span className="text-xs text-primary">Saving...</span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Drag tasks to reorder by priority. Top tasks are highest priority.
      </p>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tasks">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-2 min-h-[100px] p-2 rounded-lg transition ${
                snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              {localTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`border-l-4 ${getPriorityColor(task.priority)} bg-white p-3 rounded shadow-sm shadow-md transition ${
                        snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <GripVertical className="text-gray-400" size={16} />
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {task.title || task.discipline_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {task.project_name} • {task.assigned_to_name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadge(task.priority)}`}>
                            <Flag size={12} className="inline mr-1" />
                            {task.priority}
                          </span>
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
        <AlertCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Dragging a task to the top automatically sets it to <strong>URGENT</strong> priority. 
          Positions 1-5: URGENT, 6-10: HIGH, 11-20: MEDIUM, 21+: LOW.
        </p>
      </div>
    </div>
  );
};

export default PriorityDragDrop;
