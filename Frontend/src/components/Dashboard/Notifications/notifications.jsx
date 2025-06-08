import React, { useState, useEffect } from 'react';
import './notifications.scss';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Simuler des notifications pour la démo
      const mockNotifications = [
        {
          _id: '1',
          type: 'client',
          title: 'Nouveau client inscrit',
          message: 'Sophie Martin s\'est inscrite via votre carte de visite',
          details: 'Email: sophie.martin@example.com, Entreprise: Web Agency',
          read: false,
          priority: 'medium',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/dashboard/prospects'
        },
        {
          _id: '2',
          type: 'devis',
          title: 'Devis accepté',
          message: 'Le devis #DEV-2024-001 a été accepté par Pierre Durand',
          details: 'Montant: 5,500€ TTC',
          read: false,
          priority: 'high',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/dashboard/devis'
        },
        {
          _id: '3',
          type: 'system',
          title: 'Rappel de suivi',
          message: 'N\'oubliez pas de relancer Marie Dubois',
          details: 'Dernier contact il y a 7 jours',
          read: true,
          priority: 'low',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/dashboard/prospects'
        },
        {
          _id: '4',
          type: 'client',
          title: 'Nouveau prospect',
          message: 'Jean Dupont a consulté votre carte de visite',
          details: 'Aucune action supplémentaire pour le moment',
          read: true,
          priority: 'low',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/dashboard/prospects'
        },
        {
          _id: '5',
          type: 'devis',
          title: 'Nouveau devis créé',
          message: 'Devis #DEV-2024-002 créé pour Tech Solutions',
          details: 'Montant: 8,200€ TTC',
          read: true,
          priority: 'medium',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          actionUrl: '/dashboard/devis'
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (err) {
      console.error('Erreur notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif._id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAsUnread = async (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif._id === notificationId ? { ...notif, read: false } : notif
      )
    );
  };

  const deleteNotification = async (notificationId) => {
    if (confirm('Supprimer cette notification ?')) {
      setNotifications(prev =>
        prev.filter(notif => notif._id !== notificationId)
      );
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const bulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    
    setNotifications(prev =>
      prev.map(notif =>
        selectedNotifications.includes(notif._id) ? { ...notif, read: true } : notif
      )
    );
    setSelectedNotifications([]);
  };

  const bulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    if (!confirm(`Supprimer ${selectedNotifications.length} notification(s) ?`)) return;
    
    setNotifications(prev =>
      prev.filter(notif => !selectedNotifications.includes(notif._id))
    );
    setSelectedNotifications([]);
  };

  const toggleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const toggleSelectAll = () => {
    const filteredNotifications = getFilteredNotifications();
    setSelectedNotifications(
      selectedNotifications.length === filteredNotifications.length
        ? []
        : filteredNotifications.map(n => n._id)
    );
  };

  const getFilteredNotifications = () => {
    return notifications.filter(notif => {
      const matchesReadFilter = filter === 'all' || 
        (filter === 'unread' && !notif.read) || 
        (filter === 'read' && notif.read);
      
      const matchesTypeFilter = typeFilter === 'all' || notif.type === typeFilter;
      
      return matchesReadFilter && matchesTypeFilter;
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'client': return '👤';
      case 'devis': return '📄';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f56565';
      case 'medium': return '#ed8936';
      case 'low': return '#48bb78';
      default: return '#a0aec0';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const priorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="notifications-loading">
          <div className="loading-spinner">⏳</div>
          <p>Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      {/* En-tête */}
      <div className="notifications-header">
        <div className="header-content">
          <h1 className="page-title">🔔 Notifications</h1>
          <div className="notifications-stats">
            <div className="stat-item unread">
              <span className="stat-number">{unreadCount}</span>
              <span className="stat-label">Non lues</span>
            </div>
            <div className="stat-item priority">
              <span className="stat-number">{priorityCount}</span>
              <span className="stat-label">Priorité</span>
            </div>
            <div className="stat-item filtered">
              <span className="stat-number">{filteredNotifications.length}</span>
              <span className="stat-label">Affichées</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles et filtres */}
      <div className="notifications-controls">
        <div className="filters-section">
          <div className="filter-group">
            <label>Statut:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous types</option>
              <option value="client">Clients</option>
              <option value="devis">Devis</option>
              <option value="system">Système</option>
            </select>
          </div>
        </div>

        <div className="actions-section">
          <button
            onClick={markAllAsRead}
            className="action-btn mark-all-read"
            disabled={unreadCount === 0}
          >
            ✅ Tout marquer lu
          </button>
          <button
            onClick={bulkMarkAsRead}
            className="action-btn bulk-read"
            disabled={selectedNotifications.length === 0}
          >
            📖 Marquer lu ({selectedNotifications.length})
          </button>
          <button
            onClick={bulkDelete}
            className="action-btn bulk-delete"
            disabled={selectedNotifications.length === 0}
          >
            🗑️ Supprimer ({selectedNotifications.length})
          </button>
        </div>
      </div>

      {/* Sélection en masse */}
      {selectedNotifications.length > 0 && (
        <div className="bulk-select-bar">
          <label className="select-all-checkbox">
            <input
              type="checkbox"
              checked={selectedNotifications.length === filteredNotifications.length}
              onChange={toggleSelectAll}
            />
            {selectedNotifications.length} notification(s) sélectionnée(s)
          </label>
        </div>
      )}

      {/* Liste des notifications */}
      {error ? (
        <div className="error-state">❌ {error}</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="no-notifications">
          <div className="no-notifications-icon">🔔</div>
          <h3>Aucune notification</h3>
          <p>
            {filter === 'unread' 
              ? 'Toutes vos notifications ont été lues !'
              : 'Vous n\'avez pas encore de notifications.'}
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${notification.read ? '' : 'unread'} ${
                selectedNotifications.includes(notification._id) ? 'selected' : ''
              } priority-${notification.priority}`}
            >
              <div className="notification-select">
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification._id)}
                  onChange={() => toggleSelectNotification(notification._id)}
                />
              </div>

              <div
                className="priority-indicator"
                style={{ backgroundColor: getPriorityColor(notification.priority) }}
              ></div>

              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>

              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notification.title}</h4>
                  <div className="notification-meta">
                    <span className={`notification-type type-${notification.type}`}>
                      {notification.type}
                    </span>
                    <span className="notification-date">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="notification-message">{notification.message}</p>
                
                {notification.details && (
                  <p className="notification-details">{notification.details}</p>
                )}

                {notification.actionUrl && (
                  <div className="notification-action">
                    <a href={notification.actionUrl} className="action-link">
                      Voir les détails →
                    </a>
                  </div>
                )}
              </div>

              <div className="notification-actions">
                <button
                  onClick={() => notification.read ? markAsUnread(notification._id) : markAsRead(notification._id)}
                  className={`action-btn ${notification.read ? 'mark-unread' : 'mark-read'}`}
                  title={notification.read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                >
                  {notification.read ? '📖' : '✅'}
                </button>
                <button
                  onClick={() => deleteNotification(notification._id)}
                  className="action-btn delete"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Résumé */}
      <div className="notifications-summary">
        <p>
          {filteredNotifications.length} notification(s) affichée(s) sur {notifications.length} au total
        </p>
      </div>
    </div>
  );
};

export default Notifications;