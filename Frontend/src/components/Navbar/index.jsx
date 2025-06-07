import { Link, useNavigate } from "react-router-dom";
import "./navbar.scss";

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
  
    const handleLogout = () => {
      localStorage.removeItem("token");
      navigate("/login");
    };
  
    return (
      <nav>
        {!token && <Link to="/register-user">Créer un compte</Link>}
        {!token && <Link to="/login">Se connecter</Link>}
        {token && <Link to="/dashboard">Dashboard</Link>}
        {token && <button onClick={handleLogout}>Déconnexion</button>}
      </nav>
    );
  };
  
  export default Navbar;
