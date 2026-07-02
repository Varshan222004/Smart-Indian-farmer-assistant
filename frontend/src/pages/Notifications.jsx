import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

const Notifications = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = filter === 'unread' ? { unreadOnly: true } : {};
      const response = await api.get('/api/notifications', { params });
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Stay updated with farming advice and alerts</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`pb-2 px-4 font-medium transition-colors ${
              filter === 'all'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`pb-2 px-4 font-medium transition-colors ${
              filter === 'unread'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="ml-auto text-sm text-primary-600 hover:text-primary-700"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <p className="text-gray-600 text-lg">No notifications</p>
          <p className="text-gray-500 text-sm mt-2">
            You'll receive farming advice and alerts here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                !notification.read
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary-600"></span>
                    )}
                    <h3 className={`text-lg font-semibold ${
                      !notification.read ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.title}
                    </h3>
                  </div>
                  <p className="text-gray-700 mb-3">{notification.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatTime(notification.sentAt)}</span>
                    {notification.type && (
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {notification.type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-2 text-gray-400 hover:text-primary-600 rounded"
                      title="Mark as read"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

