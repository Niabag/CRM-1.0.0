// Dashboard.jsx
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Devis from "../../components/Dashboard/Devis/devisPage";
import "./dashboard.scss";
import "./QRCodeGenerator.scss";
import { DEFAULT_DEVIS } from "../../components/Dashboard/Devis/constants";

const Dashboard = () => {
  const [clients, setClients] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("clients");
  const [qrValue, setQrValue] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [currentDevis, setCurrentDevis] = useState(null);

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
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5000/api/clients", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
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
      const generatedLink = `http://localhost:5173/register-client/${userId}`;
      setQrValue(generatedLink);
      setError(null);
    } else {
      setError("L'ID utilisateur n'est pas encore disponible.");
    }
  };

  const handleDeleteClient = async (clientId) => {
    const confirmDelete = window.confirm("❗ Supprimer ce client et tous ses devis ?");
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/clients/${clientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la suppression");
      }

      setClients((prev) => prev.filter((c) => c._id !== clientId));
      alert("✅ Client supprimé avec succès");
    } catch (err) {
      console.error("Erreur suppression client:", err);
      alert(`❌ Échec suppression client: ${err.message}`);
    }
  };

  const handleCreateDevis = (client) => {
    const newDevis = {
      ...DEFAULT_DEVIS,
      clientId: client._id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone
    };
    setCurrentDevis(newDevis);
    setActiveTab("devis");
  };

  return (
    <div className="page-container">
      <div className="app">
        <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
          <button className="toggle-btn" onClick={toggleSidebar}>
            {isOpen ? "◀" : "▶"}
          </button>
          <div className="menu">
            <div
              className={`menu-item ${activeTab === "clients" ? "active" : ""}`}
              onClick={() => setActiveTab("clients")}
            >
              👤 {isOpen && <span>Prospects</span>}
            </div>
            <div
              className={`menu-item ${activeTab === "devis" ? "active" : ""}`}
              onClick={() => setActiveTab("devis")}
            >
              📄 {isOpen && <span>Devis</span>}
            </div>
            <div
              className={`menu-item ${activeTab === "carte" ? "active" : ""}`}
              onClick={() => setActiveTab("carte")}
            >
              💼 {isOpen && <span>Carte</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {activeTab === "clients" && (
          <>
            <h2>Mes Prospects</h2>
            {loading ? (
              <p>Chargement des clients...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : clients.length === 0 ? (
              <p>Aucun client trouvé. Utilisez votre QR code pour en ajouter !</p>
            ) : (
              <table className="prospect-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client._id}>
                      <td>{client.name || "N/A"}</td>
                      <td>{client.email || "N/A"}</td>
                      <td>{client.phone || "N/A"}</td>
                      <td>
                        <button onClick={() => handleCreateDevis(client)}>
                          ➕ Créer un devis
                        </button>
                        <button onClick={() => handleDeleteClient(client._id)}>
                          🗑 Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === "devis" && (
          <Devis 
            clients={clients} 
            initialDevisFromClient={currentDevis}
            onBack={() => {
              setActiveTab("clients");
              setCurrentDevis(null);
            }}
          />
        )}

        {activeTab === "carte" && (
          <div className="qr-container">
            <h2>Carte de visite</h2>
            <p>Générez un QR code pour permettre à vos prospects de s'inscrire directement</p>
            <button onClick={generateQRCode}>Générer le QR Code</button>
            {error && <div className="error-message">{error}</div>}
            {qrValue && (
              <div className="qr-display">
                <QRCode value={qrValue} size={256} />
                <p>Lien d'inscription: <a href={qrValue} target="_blank" rel="noopener noreferrer">{qrValue}</a></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;