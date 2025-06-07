import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "./registerClient.scss";

const RegisterClient = () => {
  const { userId } = useParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const downloadedRef = useRef(false); // Pour éviter double téléchargement en dev strict mode

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

    try {
      const response = await fetch(
        `http://localhost:5000/api/clients/register/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone }),
        }
      );

      if (response.ok) {
        setSuccess(true);
        // Redirection immédiate vers Google
        window.location.href = 'https://google.com';
      } else {
        const data = await response.json();
        throw new Error(data.message || "Erreur d'inscription du client");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="register-client-container">
      <form onSubmit={handleRegister} className="register-form">
        <h2>Inscription Client</h2>
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit" disabled={success}>
          {success ? 'Inscription réussie !' : "S'inscrire"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default RegisterClient;
