// Dashboard.jsx
import "./Dashboard.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  return (
    <div className="dashboard-page">
      <Header />

      <div className="dashboard-main">
        <Sidebar />

        <main className="dashboard-content">
          <div className="dashboard-title">
            <h2>Bem vindo ao Dashboard Financeiro</h2>
          </div>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <span>Saldo Total</span>
              <strong className="dashboard-saldo">R$ 3.500,00</strong>
            </div>

            <div className="dashboard-card">
              <span>Entradas</span>
              <strong className="dashboard-entradas">R$ 5.000,00</strong>
            </div>

            <div className="dashboard-card">
              <span>Saídas</span>
              <strong className="dashboard-saidas">R$ 1.500,00</strong>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
