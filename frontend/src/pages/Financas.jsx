import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";
import "./Financas.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import api from "../services/api";


const CATEGORIAS = [
  { value: "alimentacao", label: "Alimentação" },
  { value: "transporte", label: "Transporte" },
  { value: "moradia", label: "Moradia" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "lazer", label: "Lazer" },
  { value: "investimentos", label: "Investimentos" },
  { value: "salario", label: "Salário" },
  { value: "vendas", label: "Vendas" },
  { value: "outros", label: "Outros" }
];

function Financas() {
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalFiltroAberto, setModalFiltroAberto] = useState(false);

  const [categoria, setCategoria] = useState("outros");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("entrada");
  const [data, setData] = useState("");

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const formatarBRL = (n) =>
    Number(n || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const formatarDataBR = (d) => {
    if (!d) return "-";
    const [ano, mes, dia] = String(d).split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : d;
  };

  const nomeCategoria = (valor) => {
    const encontrada = CATEGORIAS.find((cat) => cat.value === valor);
    return encontrada ? encontrada.label : "Outros";
  };

  const carregarTransacoes = async () => {
    setCarregando(true);

    try {
      const params = new URLSearchParams();

      if (dataInicio) params.set("data_inicio", dataInicio);
      if (dataFim) params.set("data_fim", dataFim);

      const response = await api.get(`transacoes/?${params.toString()}`);

      setTransacoes(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setTransacoes([]);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    } finally {
      setCarregando(false);
    }
  };


  useEffect(() => {
    carregarTransacoes();
  }, [dataInicio, dataFim]);

  const resumo = useMemo(() => {
    const entradas = transacoes
      .filter((t) => t.tipo === "entrada")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);

    const saidas = transacoes
      .filter((t) => t.tipo === "saida")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas
    };
  }, [transacoes]);

  const dadosPizza = useMemo(() => {
    const cores = {
      alimentacao: "#f97316",
      transporte: "#3b82f6",
      moradia: "#8b5cf6",
      saude: "#ef4444",
      educacao: "#06b6d4",
      lazer: "#ec4899",
      investimentos: "#22c55e",
      salario: "#14b8a6",
      vendas: "#eab308",
      outros: "#64748b"
    };

    const agrupado = transacoes
      .filter((t) => t.tipo === "saida")
      .reduce((acc, t) => {
        const cat = t.categoria || "outros";

        if (!acc[cat]) {
          acc[cat] = {
            name: nomeCategoria(cat),
            value: 0,
            color: cores[cat] || "#64748b"
          };
        }

        acc[cat].value += Number(t.valor || 0);

        return acc;
      }, {});

    return Object.values(agrupado).filter((item) => item.value > 0);
  }, [transacoes]);



  const dadosBarras = useMemo(() => {
    const agrupado = transacoes.reduce((acc, t) => {
      const d = formatarDataBR(t.data);

      if (!acc[d]) {
        acc[d] = {
          name: d,
          entrada: 0,
          saida: 0
        };
      }

      if (t.tipo === "entrada") {
        acc[d].entrada += Number(t.valor || 0);
      } else {
        acc[d].saida += Number(t.valor || 0);
      }

      return acc;
    }, {});

    return Object.values(agrupado).reverse().slice(-7);
  }, [transacoes]);

  const adicionarTransacao = async (e) => {
    e.preventDefault();

    const payload = {
      descricao,
      valor: Number(valor),
      tipo,
      data,
      categoria
    };

    try {
      const response = await api.post("transacoes/", payload);

      const criado = response.data;

      setTransacoes((prev) => [criado, ...prev]);
      setModalNovoAberto(false);

      setCategoria("outros");
      setDescricao("");
      setValor("");
      setTipo("entrada");
      setData("");
    } catch (err) {
      console.error("Erro do backend:", err.response?.data || err);
      alert("Erro ao salvar. Veja o console.");

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
  };

  const excluirTransacao = async (id) => {
    const ok = window.confirm("Excluir este lançamento?");
    if (!ok) return;

    try {
      await api.delete(`transacoes/${id}/`);

      setTransacoes((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir.");

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
  };

  return (
    <div className="financas-page">
      <Header />

      <div className="financas-main">
        <Sidebar />

        <main className="financas-content">
          <div className="financas-top-bar">
            <div className="financas-title">
              <h2>Dashboard Financeiro</h2>
              <p>Bem-vindo ao seu controle mensal</p>
            </div>

            <div className="financas-actions">
              <button
                className="btn-secondary"
                onClick={() => setModalFiltroAberto(true)}
              >
                Filtrar
              </button>

              <button
                className="btn-primary"
                onClick={() => setModalNovoAberto(true)}
              >
                Novo Lançamento
              </button>
            </div>
          </div>

          <div className="financas-cards">
            <div className="financas-card">
              <span>Saldo Atual</span>
              <strong className={resumo.saldo >= 0 ? "valor-positivo" : "valor-negativo"}>
                {formatarBRL(resumo.saldo)}
              </strong>
            </div>

            <div className="financas-card">
              <span>Entradas</span>
              <strong className="financas-entradas">
                {formatarBRL(resumo.entradas)}
              </strong>
            </div>

            <div className="financas-card">
              <span>Saídas</span>
              <strong className="financas-saidas">
                {formatarBRL(resumo.saidas)}
              </strong>
            </div>
          </div>

          <div className="financas-charts-row">
            <div className="chart-container">
              <h3>Gastos por Categoria</h3>

              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip formatter={(value) => formatarBRL(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>Fluxo Recente</h3>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosBarras}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />

                  <XAxis
                    dataKey="name"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip cursor={{ fill: "#f5f7ff" }} />

                  <Bar
                    dataKey="entrada"
                    fill="#05cd99"
                    radius={[4, 4, 0, 0]}
                    name="Entrada"
                  />

                  <Bar
                    dataKey="saida"
                    fill="#ee5d50"
                    radius={[4, 4, 0, 0]}
                    name="Saída"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <section className="financas-lista-container">
            <div className="lista-header">
              <h3>Histórico de Lançamentos</h3>

              {(dataInicio || dataFim) && (
                <div className="filtro-badge">
                  {formatarDataBR(dataInicio)} - {formatarDataBR(dataFim)}
                  <button
                    onClick={() => {
                      setDataInicio("");
                      setDataFim("");
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="financas-table-scroll">
              <table className="financas-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Tipo</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {transacoes.map((t) => (
                    <tr key={t.id}>
                      <td>{nomeCategoria(t.categoria)}</td>

                      <td>{t.descricao}</td>

                      <td className={t.tipo === "entrada" ? "txt-entrada" : "txt-saida"}>
                        {t.tipo === "saida" ? "- " : "+ "}
                        {formatarBRL(t.valor)}
                      </td>

                      <td>
                        <span className={`badge-tipo ${t.tipo}`}>
                          {t.tipo.toUpperCase()}
                        </span>
                      </td>

                      <td>{formatarDataBR(t.data)}</td>

                      <td>
                        <button
                          className="btn-danger"
                          onClick={() => excluirTransacao(t.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!carregando && transacoes.length === 0 && (
                    <tr>
                      <td colSpan="6">Nenhum lançamento encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {modalNovoAberto && (
        <div
          className="modal-overlay"
          onClick={() => setModalNovoAberto(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Novo Lançamento</h3>

              <button
                className="close-btn"
                onClick={() => setModalNovoAberto(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={adicionarTransacao} className="modal-body">
              <div className="input-group">
                <label>Categoria</label>

                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Descrição</label>

                <input
                  required
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Valor</label>

                <input
                  required
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>

              <div className="modal-row">
                <div className="input-group">
                  <label>Data</label>

                  <input
                    required
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Tipo</label>

                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary full">
                Salvar
              </button>
            </form>
          </div>
        </div>
      )}

      {modalFiltroAberto && (
        <div
          className="modal-overlay"
          onClick={() => setModalFiltroAberto(false)}
        >
          <div
            className="modal-card mini"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Filtrar por Período</h3>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label>De</label>

                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Até</label>

                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setDataInicio("");
                    setDataFim("");
                    setModalFiltroAberto(false);
                  }}
                >
                  Limpar
                </button>

                <button
                  className="btn-primary"
                  onClick={() => setModalFiltroAberto(false)}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Financas;