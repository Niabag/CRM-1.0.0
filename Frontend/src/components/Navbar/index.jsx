import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './navbar.scss';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Erreur parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link" onClick={closeMenu}>
            <span className="brand-icon">💼</span>
            <span className="brand-text">CRM Pro</span>
          </Link>
        </div>

        <button 
          className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          {!user ? (
            <>
              <Link to="/\" className="nav-link\" onClick={closeMenu}>
                <span>🏠</span> Accueil
              </Link>
              <Link to="/login" className="nav-link login-btn" onClick={closeMenu}>
                <span>🔐</span> Connexion
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link" onClick={closeMenu}>
                <span>🏠</span> Accueil
              </Link>
              <Link to="/dashboard" className="nav-link dashboard-btn" onClick={closeMenu}>
                <span>📊</span> Dashboard
              </Link>
              
              <div className="user-menu">
                <div className="user-info">
                  <div className="user-avatar">
                    {getInitials(user.name)}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  <span>🚪</span> Déconnexion
                </button>
              </div>
            </>
          )}
        </div>

        {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
      </div>
    </nav>
  );
};

export default Navbar;