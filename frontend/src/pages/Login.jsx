import "./Login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [erro, setErro] = useState(() => {
        const mensagem = sessionStorage.getItem("auth_message") || "";
        sessionStorage.removeItem("auth_message");
        return mensagem;
    });

    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        setErro("");

        try {
            const response = await api.post("usuarios/login/", {
                username,
                password,
            });

            localStorage.setItem("access_token", response.data.access);
            localStorage.setItem("refresh_token", response.data.refresh);

            navigate("/financas", { replace: true });
        } catch {
            setErro("Usuário ou senha inválidos.");
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>Login</h1>

                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button type="submit">Entrar</button>
                </form>

                {erro && <p className="login-error">{erro}</p>}

                <p className="login-link">
                    Não tem conta? <Link to="/registro">Criar conta</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
