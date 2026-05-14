import "./Registro.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Registro() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const navigate = useNavigate();

  async function handleRegistro(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    try {
      await api.post("usuarios/registrar/", {
        username,
        email,
        password,
      });

      setSucesso("Usuário cadastrado com sucesso!");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.log("Erro completo:", error);
      console.log("Erro do backend:", error.response?.data);

      setErro(
        JSON.stringify(error.response?.data) ||
        "Erro ao cadastrar usuário. Verifique os dados."
      );
    }
  }

  return (
    <div className="registro-page">
      <div className="registro-card">
        <h1>Criar Conta</h1>

        <form onSubmit={handleRegistro}>
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Cadastrar</button>
        </form>

        {erro && <p className="registro-error">{erro}</p>}
        {sucesso && <p className="registro-success">{sucesso}</p>}

        <p className="registro-link">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

export default Registro;