import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./registerUser.scss";

const RegisterUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5000/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (response.ok) {
      const user = await response.json();
      navigate(`/register-client/${user.userId}`);
    } else {
      console.error("Erreur d'inscription");
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h2>Créer un compte</h2>
      <input type="text" placeholder="Nom" onChange={(e) => setName(e.target.value)} required />
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Mot de passe" onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">S'inscrire</button>
    </form>
  );
};

export default RegisterUser;
