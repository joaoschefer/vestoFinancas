import "./Investimentos.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function Investimentos() {
  return (
    <div className="invest-page">
      <Header />
      <div className="invest-main">
        <Sidebar />
        <main className="invest-content" />
      </div>
    </div>
  );
}

export default Investimentos;
