import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Devis from "../../components/Dashboard/Devis/devisPage";
import Analytics from "../../components/Dashboard/Analytics/analytics";
import Settings from "../../components/Dashboard/Settings/settings";
import Notifications from "../../components/Dashboard/Notifications/notifications";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from "../../config/api";
import "./dashboard.scss";
import "./QRCodeGenerator.scss";

const Dashboard = () => {
  const [clients, setClients] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [qrValue, setQrValue] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({});

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
      }
    }
    
    // Charger les données utilisateur
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

  useEffect(() => {
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

    fetchClients();
  }, []);

  const generateQRCode = () => {
    if (userId) {
      const generatedLink = FRONTEND_ROUTES.CLIENT_REGISTER(userId);
      setQrValue(generatedLink);
      setError(null);
    } else {
      setError("L'ID utilisateur n'est pas encore disponible.");
    }
  };

  const handleDeleteClient = async (clientId) => {
    const confirmDelete = window.confirm("❗ Supprimer ce client et tous ses devis ?");
    if (!confirmDelete) return;

    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.DELETE(clientId), {
        method: "DELETE",
      });

      setClients((prev) => prev.filter((c) => c._id !== clientId));
      alert("✅ Client supprimé avec succès");
    } catch (err) {
      console.error("Erreur suppression client:", err);
      alert(`❌ Échec suppression client: ${err.message}`);
    }
  };

  const menuItems = [
    { id: "dashboard", icon: "📊", label: "Tableau de bord" },
    { id: "clients", icon: "👤", label: "Prospects" },
    { id: "devis", icon: "📄", label: "Devis" }, // ✅ GARDÉ
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "carte", icon: "💼", label: "Carte" },
    { id: "settings", icon: "⚙️", label: "Paramètres" }
  ];

  return (
    <div className="page-container">
      <div className="app">
        <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
          <button className="toggle-btn" onClick={toggleSidebar}>
            {isOpen ? "◀" : "▶"}
          </button>
          
          {isOpen && (
            <div className="user-info">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-details">
                <p className="user-name">{user.name || "Utilisateur"}</p>
                <p className="user-email">{user.email || ""}</p>
              </div>
            </div>
          )}
          
          <div className="menu">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`menu-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="menu-icon">{item.icon}</span>
                {isOpen && <span className="menu-label">{item.label}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {activeTab === "dashboard" && <Analytics />}

        {activeTab === "clients" && (
          <>
            <h2>👥 Mes Prospects</h2>
            {loading ? (
              <p>Chargement des clients...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : clients.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>Aucun client trouvé</h3>
                <p>Utilisez votre QR code pour permettre à vos prospects de s'inscrire !</p>
                <button onClick={() => setActiveTab("carte")} className="cta-button">
                  Générer mon QR code
                </button>
              </div>
            ) : (
              <div className="clients-grid">
                {clients.map((client) => (
                  <div key={client._id} className="client-card">
                    <div className="client-avatar">
                      {client.name ? client.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="client-info">
                      <h3>{client.name || "N/A"}</h3>
                      <p>📧 {client.email || "N/A"}</p>
                      <p>📞 {client.phone || "N/A"}</p>
                    </div>
                    <div className="client-actions">
                      <button 
                        onClick={() => handleDeleteClient(client._id)}
                        className="danger-btn"
                      >
                        🗑 Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ✅ SECTION DEVIS GARDÉE - Affiche tous les devis */}
        {activeTab === "devis" && (
          <Devis 
            clients={clients}
            // ✅ Pas de filtre client spécifique = affiche tous les devis
          />
        )}

        {activeTab === "notifications" && <Notifications />}

        {activeTab === "settings" && <Settings />}

        {activeTab === "carte" && (
          <div className="qr-container">
            <h2>💼 Carte de visite digitale</h2>
            <div className="qr-content">
              <div className="qr-info">
                <h3>Générez votre QR code</h3>
                <p>Permettez à vos prospects de s'inscrire directement en scannant ce code</p>
                <button onClick={generateQRCode} className="generate-btn">
                  🎯 Générer le QR Code
                </button>
                {error && <div className="error-message">{error}</div>}
              </div>
              
              {qrValue && (
                <div className="qr-display">
                  <div className="qr-code-wrapper">
                    <QRCode value={qrValue} size={200} />
                  </div>
                  <div className="qr-details">
                    <p><strong>Lien d'inscription:</strong></p>
                    <a href={qrValue} target="_blank" rel="noopener noreferrer" className="qr-link">
                      {qrValue}
                    </a>
                    <button 
                      onClick={() => navigator.clipboard.writeText(qrValue)}
                      className="copy-btn"
                    >
                      📋 Copier le lien
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;