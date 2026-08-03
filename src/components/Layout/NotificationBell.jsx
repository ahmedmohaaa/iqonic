import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/services/notifications';
import { Bell, CheckCheck, AlertCircle, UserPlus, FileText, DollarSign, MessageSquare, Loader } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // جلب الإشعارات
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ page_size: 15 });
      const data = res.data.results || res.data;
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  // جلب أولي وتحديث كل 30 ثانية (Polling)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // قراءة إشعار واحد
  const handleMarkAsRead = async (notification) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notification.related_link) {
      navigate(notification.related_link);
    }
  };

  // قراءة الكل
  const handleMarkAllAsRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // أيقونة مخصصة حسب نوع الإشعار
  const getNotificationIcon = (type) => {
    const icons = {
      REPLACEMENT_REQUEST: <UserPlus size={18} className="text-orange-500" />,
      REPLACEMENT_APPROVED: <CheckCheck size={18} className="text-green-500" />,
      TASK_ASSIGNED: <FileText size={18} className="text-blue-500" />,
      TASK_SELF_ASSIGNED: <FileText size={18} className="text-blue-400" />,
      INVOICE_ADDED: <DollarSign size={18} className="text-emerald-500" />,
      CHAT_MENTION: <MessageSquare size={18} className="text-purple-500" />,
      NOTE_MENTION: <MessageSquare size={18} className="text-indigo-500" />,
      NOTE_MENTION_ALL: <AlertCircle size={18} className="text-red-500" />,
      STAGE_COMPLETED: <CheckCheck size={18} className="text-teal-500" />,
      ACTION_REQUEST_COMPLETED: <CheckCheck size={18} className="text-green-600" />,
    };
    return icons[type] || <Bell size={18} className="text-gray-500" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button 
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition focus:outline-none"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-blue-800 font-semibold flex items-center"
              >
                <CheckCheck size={14} className="mr-1" /> Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Loader className="animate-spin text-primary" size={24} /></div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                <Bell className="mx-auto mb-2 text-gray-300" size={32} />
                <p>No notifications yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <li 
                    key={notification.id}
                    onClick={() => handleMarkAsRead(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition ${!notification.is_read ? 'bg-blue-50/50' : 'bg-white'}`}
                  >
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          {!notification.is_read && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-gray-50 text-center">
            <button className="text-xs text-primary hover:text-blue-800 font-semibold">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;