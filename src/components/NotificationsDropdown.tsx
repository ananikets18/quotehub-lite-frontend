import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { fetchNotifications, markNotificationsRead, type NotificationType } from '../api';
import './NotificationsDropdown.css';

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications(1);
      const data = res.data || res;
      setNotifications(data);
      const unread = data.filter((n: NotificationType) => !n.readAt).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const toggleDropdown = async () => {
    setOpen(!open);
    if (!open && unreadCount > 0) {
      try {
        await markNotificationsRead();
        setUnreadCount(0);
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button className="nav-btn-icon" onClick={toggleDropdown} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && <span className="notifications-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notifications-empty">No new notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`notification-item ${!n.readAt && unreadCount === 0 ? '' : (!n.readAt ? 'unread' : '')}`}>
                  <div className="notification-icon">
                    {n.type === 'like' ? '❤️' : n.type === 'save' ? '🔖' : '👋'}
                  </div>
                  <div className="notification-content">
                    <p>
                      {n.type === 'like' && <span><strong>{n.data?.fromUserName}</strong> liked your quote.</span>}
                      {n.type === 'save' && <span><strong>{n.data?.fromUserName}</strong> saved your quote.</span>}
                      {n.type === 'welcome' && <span>Welcome to Quoteshub!</span>}
                    </p>
                    <small>{new Date(n.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
