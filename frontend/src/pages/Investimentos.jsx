// Investimentos.jsx
import { useState } from "react";
import "./Investimentos.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function Investimentos() {
  const [meusAtivos, setMeusAtivos] = useState([
    { id: 1, categoria: "Ações", nome: "PETR4", valor: 4500 },
    { id: 2, categoria: "Renda Fixa", nome: "Tesouro Selic", valor: 12000 },
  ]);

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("Ações");

  const cadastrarInvestimento = (e) => {
    e.preventDefault();
    if (!nome || !valor) return alert("Preencha todos os campos!");

    const novoAtivo = {
      id: Math.random(),
      nome,
      valor: parseFloat(valor),
      categoria,
    };

    setMeusAtivos([...meusAtivos, novoAtivo]);
    setNome("");
    setValor("");
  };

  const totalCarteira = meusAtivos.reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <div className="invest-page">
      <Header />

      <div className="invest-main">
        <Sidebar />

        <main className="invest-content">
          <div className="invest-title">
            <h2>Meus Investimentos</h2>
          </div>

          <section className="invest-form-container">
            <h3>Cadastrar Novo Ativo</h3>

            <form onSubmit={cadastrarInvestimento} className="invest-form">
              <input
                type="text"
                placeholder="Nome do Ativo (ex: PETR4)"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <input
                type="number"
                placeholder="Valor Investido"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="Ações">Ações</option>
                <option value="Renda Fixa">Renda Fixa</option>
                <option value="FIIs">FIIs</option>
                <option value="Cripto">Cripto</option>
              </select>

              <button type="submit" className="invest-btn-save">
                Salvar Ativo
              </button>
            </form>
          </section>

          <div className="invest-grid">
            <div className="invest-card">
              <span className="invest-card-label">Total em Carteira</span>
              <strong className="invest-card-value">
                R$ {totalCarteira.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <section className="invest-list-container">
            <h3>Lista de Ativos</h3>

            <table className="invest-table">
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                </tr>
              </thead>

              <tbody>
                {meusAtivos.map((ativo) => (
                  <tr key={ativo.id}>
                    <td>{ativo.nome}</td>
                    <td>
                      <span className="invest-badge">{ativo.categoria}</span>
                    </td>
                    <td>
                      R$ {ativo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Investimentos;
