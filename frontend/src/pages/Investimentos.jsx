import { useEffect, useMemo, useState } from "react";
import "./Investimentos.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API = "http://127.0.0.1:8000/api/investimentos/";
const CHART_COLORS = ["#ff7a00", "#1e293b", "#22c55e", "#3b82f6", "#a855f7"];

function Investimentos() {
  const [showModalCadastro, setShowModalCadastro] = useState(false);
  const [showModalFiltro, setShowModalFiltro] = useState(false);

  const [filtro, setFiltro] = useState({
    tipo: "",
    dataInicio: "",
    dataFim: "",
  });

  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);

  const BRL = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const parseISO = (iso) => (iso ? new Date(iso + "T00:00:00") : null);

  const dentroDoPeriodo = (dataISO, inicioISO, fimISO) => {
    const d = parseISO(dataISO);
    const ini = parseISO(inicioISO);
    const fim = parseISO(fimISO);
    if (!d) return false;
    if (ini && d < ini) return false;
    if (fim && d > fim) return false;
    return true;
  };

  const mapApiToUI = (i) => ({
    id: i.id,
    ativo: i.ativo,
    tipo: i.tipo,
    data: i.data,
    valor: Number(i.valor_brl ?? 0),
    detalhes: {
      vencimento: i.vencimento || null,
      taxa: i.taxa || "",
      quantidade: i.quantidade != null ? Number(i.quantidade) : null,
      precoMedio: i.preco_medio != null ? Number(i.preco_medio) : null,
      quantidadeUSD: i.quantidade_usd != null ? Number(i.quantidade_usd) : null,
      valorBRL: Number(i.valor_brl ?? 0),
      ticker: i.tipo === "Ação" || i.tipo === "FII" ? i.ativo : undefined,
      moeda: i.tipo === "Cripto" ? i.ativo : i.tipo === "Dolar" ? "USD" : undefined,
    },
  });

  const carregarInvestimentos = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Falha ao buscar investimentos");
      const data = await res.json();
      setHistorico(Array.isArray(data) ? data.map(mapApiToUI) : []);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar investimentos do backend.");
      setHistorico([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarInvestimentos();
  }, []);

  // Totais
  const calcularTotalPorTipo = (tipo) =>
    historico.filter((i) => i.tipo === tipo).reduce((acc, i) => acc + Number(i.valor || 0), 0);

  const totalGeral = historico.reduce((acc, i) => acc + Number(i.valor || 0), 0);

  const categorias = useMemo(
    () => [
      { id: "Renda Fixa", label: "Renda Fixa", valor: calcularTotalPorTipo("Renda Fixa") },
      { id: "Ação", label: "Ações", valor: calcularTotalPorTipo("Ação") },
      { id: "FII", label: "FIIs", valor: calcularTotalPorTipo("FII") },
      { id: "Cripto", label: "Cripto", valor: calcularTotalPorTipo("Cripto") },
      { id: "Dolar", label: "Dólar", valor: calcularTotalPorTipo("Dolar") },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historico]
  );

  // Filtro
  const dadosExibidos = useMemo(() => {
    return historico.filter((item) => {
      const passaTipo = filtro.tipo ? item.tipo === filtro.tipo : true;
      const passaData = dentroDoPeriodo(item.data, filtro.dataInicio, filtro.dataFim);
      return passaTipo && passaData;
    });
  }, [historico, filtro]);

  const totalExibido = useMemo(
    () => dadosExibidos.reduce((acc, i) => acc + Number(i.valor || 0), 0),
    [dadosExibidos]
  );

  // Form
  const TIPOS = ["Renda Fixa", "Ação", "FII", "Cripto", "Dolar"];

  const [form, setForm] = useState({
    tipo: "Renda Fixa",
    data: new Date().toISOString().slice(0, 10),
    valor: "",
    valorBRL: "",
    ativo: "",
    quantidade: "",
    precoMedio: "",
    vencimento: "",
    taxa: "",
  });

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const limparForm = () =>
    setForm({
      tipo: "Renda Fixa",
      data: new Date().toISOString().slice(0, 10),
      valor: "",
      valorBRL: "",
      ativo: "",
      quantidade: "",
      precoMedio: "",
      vencimento: "",
      taxa: "",
    });

  const fecharCadastro = () => {
    setShowModalCadastro(false);
    limparForm();
  };

  const validar = () => {
    if (!form.tipo) return "Selecione o tipo.";
    if (!form.data) return "Selecione a data.";

    if (form.tipo === "Renda Fixa") {
      const valorNum = Number(String(form.valor).replace(",", "."));
      if (!valorNum || valorNum <= 0) return "Informe um valor válido.";
      if (!form.ativo.trim()) return "Informe o nome do título (ex: Tesouro Selic 2029).";
      return null;
    }

    if (form.tipo === "Dolar") {
      const qtdUSD = Number(String(form.quantidade).replace(",", "."));
      const brl = Number(String(form.valorBRL).replace(",", "."));
      if (!qtdUSD || qtdUSD <= 0) return "Informe a quantidade comprada em dólar (USD).";
      if (!brl || brl <= 0) return "Informe o valor pago em reais (R$).";
      return null;
    }

    // Ação / FII / Cripto
    const valorNum = Number(String(form.valor).replace(",", "."));
    if (!valorNum || valorNum <= 0) return "Informe um valor válido.";
    if (!form.ativo.trim()) return "Informe o ticker/moeda (ex: ITUB4, KNRI11, BTC).";
    if (!form.quantidade || Number(String(form.quantidade).replace(",", ".")) <= 0)
      return "Informe uma quantidade válida.";
    if (!form.precoMedio || Number(String(form.precoMedio).replace(",", ".")) <= 0)
      return "Informe um preço médio válido.";
    return null;
  };

  const salvarAporte = async () => {
    const erro = validar();
    if (erro) return alert(erro);

    const valorFinalBRL =
      form.tipo === "Dolar"
        ? Number(String(form.valorBRL).replace(",", "."))
        : Number(String(form.valor).replace(",", "."));

    const payload = {
      tipo: form.tipo,
      data: form.data,
      valor_brl: valorFinalBRL,
      ativo:
        form.tipo === "Renda Fixa"
          ? form.ativo.trim()
          : form.tipo === "Dolar"
          ? "USD"
          : (form.ativo || "").toUpperCase(),
    };

    if (form.tipo === "Renda Fixa") {
      payload.vencimento = form.vencimento || null;
      payload.taxa = form.taxa || "";
    }

    if (form.tipo === "Ação" || form.tipo === "FII" || form.tipo === "Cripto") {
      payload.quantidade = Number(String(form.quantidade).replace(",", "."));
      payload.preco_medio = Number(String(form.precoMedio).replace(",", "."));
    }

    if (form.tipo === "Dolar") {
      payload.quantidade_usd = Number(String(form.quantidade).replace(",", "."));
    }

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return alert("Erro ao salvar no backend:\n" + JSON.stringify(err, null, 2));
      }

      const criado = await res.json();
      setHistorico((prev) => [mapApiToUI(criado), ...prev]);
      fecharCadastro();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar (sem conexão com o backend).");
    }
  };

  // Filtro modal
  const aplicarFiltro = () => setShowModalFiltro(false);

  const limparFiltro = () => {
    setFiltro({ tipo: "", dataInicio: "", dataFim: "" });
    setShowModalFiltro(false);
  };

  const temFiltroAtivo = Boolean(filtro.tipo || filtro.dataInicio || filtro.dataFim);

  const tituloTabela = useMemo(() => {
    const partes = [];
    if (filtro.tipo) partes.push(`Tipo: ${filtro.tipo}`);
    if (filtro.dataInicio || filtro.dataFim) {
      const ini = filtro.dataInicio ? filtro.dataInicio.split("-").reverse().join("/") : "—";
      const fim = filtro.dataFim ? filtro.dataFim.split("-").reverse().join("/") : "—";
      partes.push(`Período: ${ini} até ${fim}`);
    }
    return partes.length ? `Filtrado (${partes.join(" | ")})` : "Todos os Ativos na Carteira";
  }, [filtro]);

  // Dados gráficos
  const dadosPorCategoria = useMemo(() => {
    return categorias.map((c) => ({ name: c.label, value: Number(c.valor || 0) }));
  }, [categorias]);

  const dadosPorData = useMemo(() => {
    const mapa = new Map();
    dadosExibidos.forEach((i) => {
      const key = i.data.split("-").reverse().slice(0, 2).join("/"); // DD/MM
      mapa.set(key, (mapa.get(key) || 0) + Number(i.valor || 0));
    });
    const arr = Array.from(mapa.entries()).map(([label, total]) => ({ label, total }));
    return arr.slice(-14);
  }, [dadosExibidos]);

  return (
    <div className="invest-page">
      <Header />
      <div className="invest-main">
        <Sidebar />
        <main className="invest-content">
          <header className="invest-header-actions">
            <div className="invest-title">
              <h2>Meus Investimentos</h2>
              <p>
                Total na carteira: <strong>{BRL(totalGeral)}</strong>
                {temFiltroAtivo && (
                  <>
                    {" "}
                    • Exibindo: <strong>{BRL(totalExibido)}</strong>
                  </>
                )}
              </p>
              {loading && <p className="table-subtitle">Carregando do backend...</p>}
            </div>

            <div className="invest-buttons">
              <button className="btn-filter" onClick={() => setShowModalFiltro(true)}>
                Filtros
              </button>
              <button className="btn-add" onClick={() => setShowModalCadastro(true)}>
                + Novo Aporte
              </button>
            </div>
          </header>

          <section className="invest-grid">
            <div className="invest-card card-highlight">
              <span className="card-label">Patrimônio Total</span>
              <h3 className="card-value">{BRL(totalGeral)}</h3>
              <span className="card-footer">Resumo da carteira</span>
            </div>

            {categorias.map((cat) => (
              <div key={cat.id} className="invest-card">
                <span className="card-label">{cat.label}</span>
                <h3 className="card-value">{BRL(cat.valor)}</h3>
                <span className="card-footer">Resumo</span>
              </div>
            ))}
          </section>

          <section className="invest-charts">
            <div className="chart-card">
              <div className="chart-head">
                <h3>Distribuição por categoria</h3>
                <span className="chart-sub">Total da carteira (R$) por tipo</span>
              </div>

              <div className="chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={dadosPorCategoria} dataKey="value" nameKey="name" outerRadius={95} innerRadius={55}>
                      {dadosPorCategoria.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => BRL(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-head">
                <h3>Aportes por data</h3>
                <span className="chart-sub">Soma dos valores exibidos (últimos 14 pontos)</span>
              </div>

              <div className="chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dadosPorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(v) => BRL(v)} />
                    <Bar dataKey="total" radius={[10, 10, 0, 0]} fill="#ff7a00" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="invest-table-container">
            <div className="table-header">
              <div>
                <h3>{tituloTabela}</h3>
                {temFiltroAtivo && (
                  <p className="table-subtitle">Clique em “Filtros” para ajustar ou “Limpar” para resetar.</p>
                )}
              </div>

              {temFiltroAtivo && (
                <button className="btn-clear" onClick={limparFiltro}>
                  Limpar
                </button>
              )}
            </div>

            <div className="table-wrapper">
              <table className="invest-table">
                <thead>
                  <tr>
                    <th>Ativo</th>
                    <th>Categoria</th>
                    <th>Data</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosExibidos.map((item) => (
                    <tr key={item.id}>
                      <td className="font-bold">{item.ativo}</td>
                      <td>
                        <span className={`badge badge-${item.tipo.toLowerCase().replace(" ", "-")}`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td>{item.data.split("-").reverse().join("/")}</td>
                      <td className="font-bold">{BRL(item.valor)}</td>
                    </tr>
                  ))}

                  {!dadosExibidos.length && (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        Nenhum registro encontrado com esses filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* MODAL CADASTRO */}
          {showModalCadastro && (
            <div className="modal-overlay" onClick={fecharCadastro}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Novo Aporte</h3>

                <div className="form-grid">
                  <div className="form-field">
                    <label>Tipo</label>
                    <select value={form.tipo} onChange={(e) => setField("tipo", e.target.value)}>
                      {TIPOS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Data</label>
                    <input type="date" value={form.data} onChange={(e) => setField("data", e.target.value)} />
                  </div>

                  {form.tipo !== "Dolar" && (
                    <div className="form-field">
                      <label>Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.valor}
                        onChange={(e) => setField("valor", e.target.value)}
                        placeholder="Ex: 1500.00"
                      />
                    </div>
                  )}

                  {form.tipo === "Renda Fixa" ? (
                    <>
                      <div className="form-field form-span-2">
                        <label>Título</label>
                        <input
                          value={form.ativo}
                          onChange={(e) => setField("ativo", e.target.value)}
                          placeholder="Ex: Tesouro Selic 2029"
                        />
                      </div>

                      <div className="form-field">
                        <label>Vencimento (opcional)</label>
                        <input type="date" value={form.vencimento} onChange={(e) => setField("vencimento", e.target.value)} />
                      </div>

                      <div className="form-field">
                        <label>Taxa / Indexador (opcional)</label>
                        <input
                          value={form.taxa}
                          onChange={(e) => setField("taxa", e.target.value)}
                          placeholder="Ex: Selic, IPCA+ 6%"
                        />
                      </div>
                    </>
                  ) : form.tipo === "Dolar" ? (
                    <>
                      <div className="form-field">
                        <label>USD comprados</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.quantidade}
                          onChange={(e) => setField("quantidade", e.target.value)}
                          placeholder="Ex: 200"
                        />
                      </div>

                      <div className="form-field form-span-2">
                        <label>Valor pago (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.valorBRL}
                          onChange={(e) => setField("valorBRL", e.target.value)}
                          placeholder="Ex: 1050.00"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-field">
                        <label>{form.tipo === "Cripto" ? "Moeda" : "Ticker"}</label>
                        <input
                          value={form.ativo}
                          onChange={(e) => setField("ativo", e.target.value)}
                          placeholder={form.tipo === "FII" ? "Ex: KNRI11" : form.tipo === "Ação" ? "Ex: ITUB4" : "Ex: BTC / ETH"}
                        />
                      </div>

                      <div className="form-field">
                        <label>Quantidade</label>
                        <input
                          type="number"
                          step="0.00000001"
                          value={form.quantidade}
                          onChange={(e) => setField("quantidade", e.target.value)}
                          placeholder="Ex: 10"
                        />
                      </div>

                      <div className="form-field form-span-2">
                        <label>Preço Médio (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.precoMedio}
                          onChange={(e) => setField("precoMedio", e.target.value)}
                          placeholder="Ex: 75.50"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-actions">
                  <button className="btn-secondary" onClick={fecharCadastro}>
                    Cancelar
                  </button>
                  <button className="btn-add" onClick={salvarAporte}>
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL FILTRO */}
          {showModalFiltro && (
            <div className="modal-overlay" onClick={() => setShowModalFiltro(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Filtros</h3>

                <div className="form-grid">
                  <div className="form-field form-span-2">
                    <label>Tipo</label>
                    <select value={filtro.tipo} onChange={(e) => setFiltro((p) => ({ ...p, tipo: e.target.value }))}>
                      <option value="">Todos</option>
                      {TIPOS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Data início</label>
                    <input type="date" value={filtro.dataInicio} onChange={(e) => setFiltro((p) => ({ ...p, dataInicio: e.target.value }))} />
                  </div>

                  <div className="form-field">
                    <label>Data fim</label>
                    <input type="date" value={filtro.dataFim} onChange={(e) => setFiltro((p) => ({ ...p, dataFim: e.target.value }))} />
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="btn-secondary" onClick={limparFiltro}>
                    Limpar
                  </button>
                  <button className="btn-add" onClick={aplicarFiltro}>
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Investimentos;