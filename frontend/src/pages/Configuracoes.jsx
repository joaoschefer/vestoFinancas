import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Configuracoes.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { tratarErroAutenticacao } from "../utils/financas";

function Configuracoes() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState({ username: "", email: "" });
  const [preferencias, setPreferencias] = useState({ meta_economia_mensal: "", limite_gastos_mensal: "" });
  const [senhas, setSenhas] = useState({ senha_atual: "", nova_senha: "", confirmar_senha: "" });
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [resPerfil, resPreferencias] = await Promise.all([
        api.get("usuarios/me/"),
        api.get("usuarios/preferencias/"),
      ]);
      setPerfil({ username: resPerfil.data.username || "", email: resPerfil.data.email || "" });
      setPreferencias(resPreferencias.data);
    } catch (erro) {
      tratarErroAutenticacao(erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const notificar = (texto) => {
    setMensagem(texto);
    window.setTimeout(() => setMensagem(""), 3500);
  };

  const salvarPerfil = async (event) => {
    event.preventDefault();
    try {
      await api.patch("usuarios/me/", perfil);
      notificar("Perfil atualizado com sucesso.");
    } catch (erro) {
      if (!tratarErroAutenticacao(erro)) alert("Não foi possível atualizar o perfil.");
    }
  };

  const salvarPreferencias = async (event) => {
    event.preventDefault();
    try {
      await api.patch("usuarios/preferencias/", {
        meta_economia_mensal: Number(preferencias.meta_economia_mensal || 0),
        limite_gastos_mensal: Number(preferencias.limite_gastos_mensal || 0),
      });
      notificar("Metas financeiras atualizadas.");
    } catch (erro) {
      if (!tratarErroAutenticacao(erro)) alert("Não foi possível atualizar as metas.");
    }
  };

  const alterarSenha = async (event) => {
    event.preventDefault();
    if (senhas.nova_senha !== senhas.confirmar_senha) {
      alert("A confirmação da nova senha não confere.");
      return;
    }
    try {
      await api.post("usuarios/alterar-senha/", {
        senha_atual: senhas.senha_atual,
        nova_senha: senhas.nova_senha,
      });
      setSenhas({ senha_atual: "", nova_senha: "", confirmar_senha: "" });
      notificar("Senha alterada com sucesso.");
    } catch (erro) {
      if (!tratarErroAutenticacao(erro)) alert("Não foi possível alterar a senha. Confira a senha atual.");
    }
  };

  const exportarCsv = async () => {
    try {
      const response = await api.get("transacoes/exportar/", { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transacoes.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (erro) {
      if (!tratarErroAutenticacao(erro)) alert("Não foi possível exportar os dados.");
    }
  };

  const excluirConta = async () => {
    if (!window.confirm("Excluir sua conta e todos os lançamentos? Esta ação não pode ser desfeita.")) return;
    try {
      await api.delete("usuarios/me/");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/registro", { replace: true });
    } catch (erro) {
      if (!tratarErroAutenticacao(erro)) alert("Não foi possível excluir a conta.");
    }
  };

  return (
    <div className="config-page">
      <Header />
      <div className="config-main">
        <Sidebar />
        <main className="config-content">
          <header className="config-header"><div><h2>Configurações</h2><p>Gerencie seu perfil, metas financeiras e dados.</p></div>{mensagem && <span>{mensagem}</span>}</header>

          {carregando ? <div className="config-loading">Carregando configurações...</div> : <div className="config-grid">
            <form className="config-card" onSubmit={salvarPerfil}>
              <div className="config-card-title"><h3>Perfil</h3><p>Dados usados na sua conta.</p></div>
              <label>Nome de usuário<input required value={perfil.username} onChange={(e) => setPerfil({ ...perfil, username: e.target.value })} /></label>
              <label>E-mail<input type="email" value={perfil.email} onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} /></label>
              <button>Salvar perfil</button>
            </form>

            <form className="config-card" onSubmit={salvarPreferencias}>
              <div className="config-card-title"><h3>Metas financeiras</h3><p>Esses valores aparecerão no Dashboard.</p></div>
              <label>Meta mensal de economia<input type="number" min="0" step="0.01" value={preferencias.meta_economia_mensal} onChange={(e) => setPreferencias({ ...preferencias, meta_economia_mensal: e.target.value })} /></label>
              <label>Limite mensal de gastos<input type="number" min="0" step="0.01" value={preferencias.limite_gastos_mensal} onChange={(e) => setPreferencias({ ...preferencias, limite_gastos_mensal: e.target.value })} /></label>
              <button>Salvar metas</button>
            </form>

            <form className="config-card" onSubmit={alterarSenha}>
              <div className="config-card-title"><h3>Alterar senha</h3><p>Use pelo menos seis caracteres.</p></div>
              <label>Senha atual<input required type="password" value={senhas.senha_atual} onChange={(e) => setSenhas({ ...senhas, senha_atual: e.target.value })} /></label>
              <label>Nova senha<input required minLength="6" type="password" value={senhas.nova_senha} onChange={(e) => setSenhas({ ...senhas, nova_senha: e.target.value })} /></label>
              <label>Confirmar nova senha<input required minLength="6" type="password" value={senhas.confirmar_senha} onChange={(e) => setSenhas({ ...senhas, confirmar_senha: e.target.value })} /></label>
              <button>Alterar senha</button>
            </form>

            <section className="config-card">
              <div className="config-card-title"><h3>Seus dados</h3><p>Exporte ou remova os dados da sua conta.</p></div>
              <div className="config-data-action"><div><strong>Exportar lançamentos</strong><span>Baixe seu histórico financeiro em CSV.</span></div><button type="button" onClick={exportarCsv}>Exportar CSV</button></div>
              <div className="config-data-action danger"><div><strong>Excluir conta</strong><span>Apaga permanentemente sua conta e lançamentos.</span></div><button type="button" onClick={excluirConta}>Excluir conta</button></div>
            </section>
          </div>}
        </main>
      </div>
    </div>
  );
}

export default Configuracoes;
