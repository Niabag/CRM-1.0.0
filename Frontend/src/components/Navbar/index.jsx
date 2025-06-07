import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./navbar.scss";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const userData = await apiRequest(API_ENDPOINTS.AUTH.ME);
      setUser(userData);
    } catch (error) {
      console.error("Erreur lors du chargement de l'utilisateur:", error);
      // Si le token est invalide, déconnecter l'utilisateur
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // Ne pas afficher la navbar sur la page dashboard
  if (location.pathname === "/dashboard") {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={token ? "/dashboard" : "/"} className="brand-link">
          💼 CRM Pro
        </Link>
      </div>

      <div className="navbar-menu">
        {!token ? (
          <>
            <Link to="/register-user" className="nav-link">
              ✨ Créer un compte
            </Link>
            <Link to="/login" className="nav-link login-btn">
              🔐 Se connecter
            </Link>
          </>
        ) : (
          <div className="user-menu">
            <span className="welcome-text">
              Bonjour, {user?.name || "Utilisateur"} 👋
            </span>
            <Link to="/dashboard" className="nav-link dashboard-btn">
              📊 Dashboard
            </Link>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Déconnexion
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;