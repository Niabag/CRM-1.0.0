import { useState, useEffect } from 'react';
import './notifications.scss';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Simuler des notifications
    const mockNotifications = [
      {
        id: 1,
        type: 'info',
        title: 'Nouveau client inscrit',
        message: 'Un nouveau client s\'est inscrit via votre QR code',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2 heures
        read: false
      },
      {
        id: 2,
        type: 'success',
        title: 'Devis accepté',
        message: 'Le devis DEV-001 a été accepté par le client',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Il y a 1 jour
        read: false
      },
      {
        id: 3,
        type: 'warning',
        title: 'Devis expirant',
        message: 'Le devis DEV-002 expire dans 3 jours',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
        read: true
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      return 'À l\'instant';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>🔔 Notifications</h2>
        {unreadCount > 0 && (
          <div className="notifications-actions">
            <span className="unread-count">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
            <button onClick={markAllAsRead} className="mark-all-read">
              Tout marquer comme lu
            </button>
          </div>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-icon">🔕</div>
            <p>Aucune notification</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-date">
                  {formatDate(notification.date)}
                </span>
              </div>
              
              <div className="notification-actions">
                {!notification.read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="mark-read-btn"
                    title="Marquer comme lu"
                  >
                    👁️
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notification.id)}
                  className="delete-btn"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;