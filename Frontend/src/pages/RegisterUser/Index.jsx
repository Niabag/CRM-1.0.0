import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./registerUser.scss";

const RegisterUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Compte créé avec succès !");
        navigate("/login");
      } else {
        setError(data.message || "Erreur lors de la création du compte");
      }
    } catch (err) {
      console.error("Erreur d'inscription:", err);
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-user-container">
      <form onSubmit={handleRegister}>
        <h2>Créer un compte</h2>
        {error && <div className="error-message">{error}</div>}
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
          type="password" 
          placeholder="Mot de passe" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" disabled={loading}>
          {loading ? "Création en cours..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
};

export default RegisterUser;