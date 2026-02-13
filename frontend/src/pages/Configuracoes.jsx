import "./Configuracoes.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function Configuracoes() {
  return (
    <div className="config-page">
      <Header />

      <div className="config-main">
        <Sidebar />

        <main className="config-content">
          <div className="config-title">
            <h2>Configurações</h2>
          </div>

          <section className="config-box">
            <p>Altere o tema, moeda principal e dados do perfil.</p>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Configuracoes;
