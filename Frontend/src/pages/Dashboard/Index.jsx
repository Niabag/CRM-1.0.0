import { useEffect, useState, lazy, Suspense } from "react";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from "../../config/api";
import { useNavigate } from "react-router-dom";
import "./dashboard.scss";

// Lazy load dashboard components
const Analytics = lazy(() => import("../../components/Dashboard/Analytics/analytics"));
const ProspectsPage = lazy(() => import("../../components/Dashboard/Prospects/prospectsPage"));
const DevisListPage = lazy(() => import("../../components/Dashboard/Devis/devisListPage"));
const Devis = lazy(() => import("../../components/Dashboard/Devis/devisPage"));
const Notifications = lazy(() => import("../../components/Dashboard/Notifications/notifications"));
const Settings = lazy(() => import("../../components/Dashboard/Settings/settings"));
const BusinessCard = lazy(() => import("../../components/Dashboard/BusinessCard/businessCard"));

// Loading component
const ComponentLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '50vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{ fontSize: '2rem' }}>⏳</div>
    <p>Chargement du module...</p>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [qrValue, setQrValue] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({});
  const [selectedClientForDevis, setSelectedClientForDevis] = useState(null);
  const [editingDevis, setEditingDevis] = useState(null);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const decodeToken = (token) => {
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = atob(payloadBase64);
      return JSON.parse(payload);
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = decodeToken(token);
      if (decodedToken && decodedToken.userId) {
        setUserId(decodedToken.userId);
      } else {
        console.error("❌ Impossible de décoder userId du token");
      }
    } else {
      console.error("❌ Aucun token trouvé");
    }
    
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await apiRequest(API_ENDPOINTS.AUTH.ME);
      setUser(userData);
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(API_ENDPOINTS.CLIENTS.BASE);
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur lors de la récupération des clients:", err);
      setError("Erreur lors de la récupération des clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleViewClientDevis = (client) => {
    setSelectedClientForDevis(client);
    setActiveTab("devis-creation");
  };

  const handleEditDevisFromList = (devis) => {
    setEditingDevis(devis);
    setActiveTab("devis-creation");
  };

  const handleCreateNewDevis = () => {
    setEditingDevis(null);
    setSelectedClientForDevis(null);
    setActiveTab("devis-creation");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    { id: "dashboard", icon: "📊", label: "Tableau de bord" },
    { id: "clients", icon: "👤", label: "Prospects" },
    { id: "devis", icon: "📄", label: "Devis" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "carte", icon: "💼", label: "Carte de visite" },
    { id: "settings", icon: "⚙️", label: "Paramètres" }
  ];

  // Render the active component based on the selected tab
  const renderActiveComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Analytics />
          </Suspense>
        );
      case "clients":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <ProspectsPage 
              clients={clients}
              onRefresh={fetchClients}
              onViewClientDevis={handleViewClientDevis}
            />
          </Suspense>
        );
      case "devis":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <DevisListPage 
              clients={clients}
              onEditDevis={handleEditDevisFromList}
              onCreateDevis={handleCreateNewDevis}
            />
          </Suspense>
        );
      case "devis-creation":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Devis 
              clients={clients}
              initialDevisFromClient={editingDevis}
              selectedClientId={selectedClientForDevis?._id}
              onBack={selectedClientForDevis ? () => {
                setSelectedClientForDevis(null);
                setEditingDevis(null);
                setActiveTab("clients");
              } : editingDevis ? () => {
                setEditingDevis(null);
                setActiveTab("devis");
              } : null}
            />
          </Suspense>
        );
      case "notifications":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Notifications />
          </Suspense>
        );
      case "settings":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Settings />
          </Suspense>
        );
      case "carte":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <BusinessCard 
              userId={userId} 
              user={user}
            />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<ComponentLoader />}>
            <Analytics />
          </Suspense>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Header avec navigation */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isOpen ? "◀" : "▶"}
          </button>
          <div className="brand">
            <span className="brand-icon">💼</span>
            <span className="brand-text">CRM Pro</span>
          </div>
        </div>
        
        <div className="header-center">
          <h1 className="page-title">
            {activeTab === "dashboard" && "📊 Tableau de bord"}
            {activeTab === "clients" && "👤 Mes Prospects"}
            {activeTab === "devis" && "📄 Mes Devis"}
            {activeTab === "devis-creation" && "📝 Création de Devis"}
            {activeTab === "notifications" && "🔔 Notifications"}
            {activeTab === "carte" && "💼 Carte de Visite"}
            {activeTab === "settings" && "⚙️ Paramètres"}
          </h1>
        </div>
        
        <div className="header-right">
          <button 
            onClick={() => navigate("/")} 
            className="home-btn"
            title="Retour à l'accueil"
          >
            🏠 Accueil
          </button>
          <div className="user-profile">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name || "Utilisateur"}</span>
              <span className="user-email">{user.email || ""}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Déconnexion">
              🚪
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id || (activeTab === "devis-creation" && item.id === "devis") ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== "devis" && item.id !== "devis-creation") {
                    setSelectedClientForDevis(null);
                    setEditingDevis(null);
                  }
                }}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {isOpen && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;