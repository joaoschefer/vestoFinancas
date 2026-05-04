import "./Investimentos.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function Investimentos() {
  return (
    <div className="invest-page">
      <Header />

      <div className="invest-main">
        <Sidebar />

        <main className="invest-content">
          <div className="invest-empty">
            <h2>Página de Investimentos</h2>
            <p>Em desenvolvimento futuramente.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Investimentos;