import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './dashboard.scss';

// Import des composants du dashboard
import Analytics from '../../components/Dashboard/Analytics/analytics.jsx';
import ProspectsPage from '../../components/Dashboard/Prospects/prospectsPage.jsx';
import ProspectEditPage from '../../components/Dashboard/Prospects/prospectEditPage.jsx';
import DevisListPage from '../../components/Dashboard/Devis/devisListPage.jsx';
import DevisPage from '../../components/Dashboard/Devis/devisPage.jsx';
import BusinessCard from '../../components/Dashboard/BusinessCard/businessCard.jsx';
import Notifications from '../../components/Dashboard/Notifications/notifications.jsx';
import Settings from '../../components/Dashboard/Settings/settings.jsx';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/prospects/edit/')) return 'Modifier le prospect';
    if (path.includes('/prospects')) return 'Prospects';
    if (path.includes('/devis/new')) return 'Nouveau devis';
    if (path.includes('/devis/edit/')) return 'Modifier le devis';
    if (path.includes('/devis')) return 'Devis';
    if (path.includes('/business-card')) return 'Carte de visite';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/settings')) return 'Paramètres';
    return 'Analytics';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isActive = (path) => {
    return location.pathname.startsWith(`/dashboard${path}`);
  };

  const navigateTo = (path) => {
    navigate(`/dashboard${path}`);
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <div className="brand">
            <span className="brand-icon">💼</span>
            <span className="brand-text">CRM Pro</span>
          </div>
        </div>
        
        <div className="header-center">
          <h1 className="page-title">{getPageTitle()}</h1>
        </div>
        
        <div className="header-right">
          <button className="home-btn" onClick={() => navigate('/')}>
            <span>🏠</span> Accueil
          </button>
          
          <div className="user-profile">
            <div className="user-avatar">
              {user ? getInitials(user.name) : 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Utilisateur'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* Corps du dashboard */}
      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${isActive('') && location.pathname === '/dashboard' ? 'active' : ''}`}
              onClick={() => navigateTo('')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Analytics</span>
            </button>
            
            <button 
              className={`nav-item ${isActive('/prospects') ? 'active' : ''}`}
              onClick={() => navigateTo('/prospects')}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">Prospects</span>
            </button>
            
            <button 
              className={`nav-item ${isActive('/devis') ? 'active' : ''}`}
              onClick={() => navigateTo('/devis')}
            >
              <span className="nav-icon">📄</span>
              <span className="nav-label">Devis</span>
            </button>
            
            <button 
              className={`nav-item ${isActive('/business-card') ? 'active' : ''}`}
              onClick={() => navigateTo('/business-card')}
            >
              <span className="nav-icon">💳</span>
              <span className="nav-label">Carte de visite</span>
            </button>
            
            <button 
              className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}
              onClick={() => navigateTo('/notifications')}
            >
              <span className="nav-icon">🔔</span>
              <span className="nav-label">Notifications</span>
            </button>
            
            <button 
              className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
              onClick={() => navigateTo('/settings')}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Paramètres</span>
            </button>
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Analytics />} />
            <Route path="/prospects" element={<ProspectsPage />} />
            <Route path="/prospects/edit/:id" element={<ProspectEditPage />} />
            <Route path="/devis" element={<DevisListPage />} />
            <Route path="/devis/new" element={<DevisPage />} />
            <Route path="/devis/edit/:id" element={<DevisPage />} />
            <Route path="/business-card" element={<BusinessCard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;