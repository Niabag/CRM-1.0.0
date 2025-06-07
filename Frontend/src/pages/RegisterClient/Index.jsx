import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./registerClient.scss";

const RegisterClient = () => {
  const { userId } = useParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const downloadedRef = useRef(false);

  // Télécharger automatiquement une image à l'ouverture de la page
  useEffect(() => {
    if (downloadedRef.current) return;
    downloadedRef.current = true;

    const imageUrl = '/images/welcome.png';
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'welcome.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.REGISTER(userId), {
        method: "POST",
        body: JSON.stringify({ name, email, phone }),
      });

      setSuccess(true);
      // Redirection immédiate vers Google
      setTimeout(() => {
        window.location.href = 'https://google.com';
      }, 1000);
    } catch (err) {
      console.error("❌ Erreur inscription client:", err);
      setError(err.message || "Erreur d'inscription du client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-client-container">
      <form onSubmit={handleRegister} className="register-form">
        <h2>Inscription Client</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Inscription réussie ! Redirection en cours...</div>}
        
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={success}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={success}
        />
        <input
          type="text"
          placeholder="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          disabled={success}
        />
        <button type="submit" disabled={loading || success}>
          {loading ? "Inscription en cours..." : success ? "Inscription réussie !" : "S'inscrire"}
        </button>
      </form>
    </div>
  );
};

export default RegisterClient;