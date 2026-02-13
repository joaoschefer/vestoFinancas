import { useEffect, useMemo, useState } from "react";
import "./Financas.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const API_URL = "http://127.0.0.1:8000/api/transacoes/";

function Financas() {
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // formulário
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("entrada");
  const [data, setData] = useState("");

  // filtro
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const formatarBRL = (n) =>
    Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatarDataBR = (d) => {
    if (!d) return "-";
    // backend costuma mandar "YYYY-MM-DD"
    const [ano, mes, dia] = String(d).split("-");
    if (!ano || !mes || !dia) return d;
    return `${dia}/${mes}/${ano}`;
  };

  const montarUrlLista = () => {
    const params = new URLSearchParams();
    if (dataInicio) params.set("data_inicio", dataInicio);
    if (dataFim) params.set("data_fim", dataFim);

    const qs = params.toString();
    return qs ? `${API_URL}?${qs}` : API_URL;
  };

  const carregarTransacoes = async () => {
    setCarregando(true);
    try {
      const res = await fetch(montarUrlLista());
      if (!res.ok) throw new Error("Falha ao buscar transações.");
      const dados = await res.json();
      setTransacoes(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar transações do backend.");
      setTransacoes([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTransacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim]);

  const adicionarTransacao = async (e) => {
    e.preventDefault();
    if (!descricao || !valor || !data) return alert("Preencha todos os campos!");

    const payload = {
      descricao: descricao.trim(),
      valor: Number(valor),
      tipo,
      data, // YYYY-MM-DD
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Falha ao salvar transação.");
      const criado = await res.json();

      // adiciona no topo (se estiver no período filtrado, pode ou não aparecer; aqui adiciona e pronto)
      setTransacoes((prev) => [criado, ...prev]);

      setDescricao("");
      setValor("");
      setData("");
      setTipo("entrada");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar no backend.");
    }
  };

  const limparFiltro = () => {
    setDataInicio("");
    setDataFim("");
  };

  // resumo (saldo/entradas/saídas) baseado no que veio do backend (já filtrado)
  const resumo = useMemo(() => {
    const entradas = transacoes
      .filter((t) => t.tipo === "entrada")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);

    const saidas = transacoes
      .filter((t) => t.tipo === "saida")
      .reduce((acc, t) => acc + Number(t.valor || 0), 0);

    return { entradas, saidas, saldo: entradas - saidas };
  }, [transacoes]);

  return (
    <div className="financas-page">
      <Header />

      <div className="financas-main">
        <Sidebar />

        <main className="financas-content">
          <div className="financas-title">
            <h2>Minhas Finanças</h2>
          </div>

          {/* Cards */}
          <div className="financas-cards">
            <div className="financas-card">
              <span>Saldo</span>
              <strong className={resumo.saldo >= 0 ? "financas-saldo-ok" : "financas-saldo-bad"}>
                {formatarBRL(resumo.saldo)}
              </strong>
            </div>

            <div className="financas-card">
              <span>Entradas</span>
              <strong className="financas-entradas">{formatarBRL(resumo.entradas)}</strong>
            </div>

            <div className="financas-card">
              <span>Saídas</span>
              <strong className="financas-saidas">{formatarBRL(resumo.saidas)}</strong>
            </div>
          </div>

          {/* Filtro */}
          <section className="financas-filter">
            <div className="financas-filter-head">
              <h3>Filtro por período</h3>
              <button type="button" className="financas-filter-clear" onClick={limparFiltro}>
                Limpar
              </button>
            </div>

            <div className="financas-filter-row">
              <div className="financas-field">
                <label>De</label>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>

              <div className="financas-field">
                <label>Até</label>
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>

              <div className="financas-filter-info">
                <span>
                  {carregando ? "Carregando..." : <>Mostrando: <strong>{transacoes.length}</strong> lançamento(s)</>}
                </span>
              </div>
            </div>
          </section>

          {/* Form */}
          <section className="financas-box">
            <h3>Novo Lançamento</h3>

            <form onSubmit={adicionarTransacao} className="financas-form">
              <input
                type="text"
                placeholder="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />

              <input
                type="number"
                placeholder="Valor (R$)"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />

              <input type="date" value={data} onChange={(e) => setData(e.target.value)} />

              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>

              <button type="submit" className="financas-btn-add">
                Adicionar
              </button>
            </form>
          </section>

          {/* Lista */}
          <section className="financas-lista">
            <div className="financas-lista-head">
              <h3>Histórico</h3>

              {(dataInicio || dataFim) && (
                <span className="financas-badge-periodo">
                  Período: {dataInicio ? formatarDataBR(dataInicio) : "—"} até {dataFim ? formatarDataBR(dataFim) : "—"}
                </span>
              )}
            </div>

            <table className="financas-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Tipo</th>
                  <th>Data</th>
                </tr>
              </thead>

              <tbody>
                {transacoes.map((t) => (
                  <tr key={t.id}>
                    <td>{t.descricao}</td>

                    <td className={t.tipo === "entrada" ? "financas-valor-entrada" : "financas-valor-saida"}>
                      {t.tipo === "saida" ? "-" : ""}
                      {formatarBRL(t.valor).replace("R$", " R$")}
                    </td>

                    <td>{String(t.tipo || "").toUpperCase()}</td>

                    <td>{formatarDataBR(t.data)}</td>
                  </tr>
                ))}

                {!carregando && transacoes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="financas-empty">
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="financas-footer-actions">
              <button type="button" className="financas-btn-refresh" onClick={carregarTransacoes}>
                Recarregar
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Financas;