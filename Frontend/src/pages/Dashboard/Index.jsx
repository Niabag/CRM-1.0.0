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
    const payloadBase64 = token.split(".")[1];
    const payload = atob(payloadBase64);
    return JSON.parse(payload);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = decodeToken(token);
      setUserId(decodedToken.userId);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5000/api/clients", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setClients(data);
      } catch {
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
              <p>Chargement...</p>
            ) : error ? (
              <p>{error}</p>
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
                      <td>{client.name}</td>
                      <td>{client.email}</td>
                      <td>{client.phone}</td>
                      <td>
                        <button
                          onClick={() => {
                            setCurrentDevis({ ...DEFAULT_DEVIS, clientId: client._id });
                            setActiveTab("devis");
                          }}
                        >
                          ➕ Créer / ✏️ Modifier un devis
                        </button>
                        <button
                          onClick={async () => {
                            const confirmDelete = window.confirm("❗ Supprimer ce client ?");
                            if (!confirmDelete) return;

                            const token = localStorage.getItem("token");
                            try {
                              const res = await fetch(`http://localhost:5000/api/clients/${client._id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (!res.ok) throw new Error("Erreur suppression client");

                              setClients((prev) => prev.filter((c) => c._id !== client._id));
                              alert("✅ Client supprimé");
                            } catch (err) {
                              alert("❌ Échec suppression client");
                            }
                          }}
                        >
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

        {activeTab === "carte" && (
          <div className="qr-container">
            <h2>Carte de visite</h2>
            <button onClick={generateQRCode}>Générer le QR Code</button>
            {error && <div>{error}</div>}
            {qrValue && <QRCode value={qrValue} size={256} />}
          </div>
        )}

        {activeTab === "devis" && <Devis clients={clients} initialDevisFromClient={currentDevis} hideList={currentDevis?.title === 'Modèle de devis' && !currentDevis?._id} />}
      </div>
    </div>
  );
};

export default Dashboard;
