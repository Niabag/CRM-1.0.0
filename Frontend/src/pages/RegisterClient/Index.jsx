import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./registerClient.scss";

const RegisterClient = () => {
  const { userId } = useParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const downloadedRef = useRef(false);

  // Pas de téléchargement automatique d'image
  useEffect(() => {
    // Rien à faire ici maintenant
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.REGISTER(userId), {
        method: "POST",
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          company,
          address,
          postalCode,
          city,
          notes
        }),
      });

      setSuccess(true);
      // Redirection vers Google après inscription
      setTimeout(() => {
        window.location.href = 'https://google.com';
      }, 2000);
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
        <h2>📝 Inscription Prospect</h2>
        <p className="form-subtitle">Remplissez vos informations pour être recontacté</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">✅ Inscription réussie ! Redirection en cours...</div>}
        
        {/* Informations principales */}
        <div className="form-section">
          <h3>👤 Informations personnelles</h3>
          
          <input
            type="text"
            placeholder="Nom et prénom *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={success}
          />
          
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={success}
          />
          
          <input
            type="tel"
            placeholder="Téléphone *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={success}
          />
        </div>

        {/* Adresse */}
        <div className="form-section">
          <h3>📍 Adresse</h3>
          
          <input
            type="text"
            placeholder="Adresse (rue, numéro)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={success}
          />
          
          <div className="form-row">
            <input
              type="text"
              placeholder="Code postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={success}
              maxLength={5}
            />
            
            <input
              type="text"
              placeholder="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={success}
            />
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="form-section">
          <h3>🏢 Informations complémentaires</h3>
          
          <input
            type="text"
            placeholder="Entreprise / Organisation"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={success}
          />
          
          <textarea
            placeholder="Votre projet, besoins, commentaires..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={success}
            rows={3}
          />
        </div>
        
        <button type="submit" disabled={loading || success} className="submit-btn">
          {loading ? "Inscription en cours..." : success ? "Inscription réussie !" : "✅ S'inscrire"}
        </button>
        
        <p className="form-footer">
          * Champs obligatoires • Vos données sont sécurisées
        </p>
      </form>
    </div>
  );
};

export default RegisterClient;