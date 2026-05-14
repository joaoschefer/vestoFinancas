import "./Header.css";
import { FaUserCircle } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Header() {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function buscarUsuario() {
      try {
        const response = await api.get("usuarios/me/");
        setUsuario(response.data);
      } catch (error) {
        console.log("Erro ao buscar usuário:", error);

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        navigate("/login", { replace: true });
      }
    }

    buscarUsuario();
  }, [navigate]);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    navigate("/login", { replace: true });
  }

  return (
    <header className="header">
      <h1>Vesto Finanças</h1>

      <div className="header-user">
        <span>{usuario?.username || "Usuário"}</span>
        <FaUserCircle className="header-user-icon" />

        <button className="logout-btn" onClick={logout}>
          Sair
        </button>
      </div>
    </header>
  );
}

export default Header;