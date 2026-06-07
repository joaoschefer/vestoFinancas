import { useCallback, useEffect, useState } from "react";
import "./Financas.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import {
  CATEGORIAS, formatarBRL, formatarDataBR, nomeCategoria, tratarErroAutenticacao,
} from "../utils/financas";

const hoje = new Date().toISOString().slice(0, 10);
const formularioInicial = { descricao: "", valor: "", tipo: "saida", categoria: "outros", data: hoje };
const filtrosIniciais = { busca: "", categoria: "", tipo: "", data_inicio: "", data_fim: "" };

function Financas() {
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciais);

  const carregarTransacoes = useCallback(async () => {
    setCarregando(true);
    try {
      const params = Object.fromEntries(Object.entries(filtrosAplicados).filter(([, valor]) => valor));
      const response = await api.get("transacoes/", { params });
      setTransacoes(Array.isArray(response.data) ? response.data : []);
    } catch (erro) {
      console.error(erro);
      setTransacoes([]);
      tratarErroAutenticacao(erro);
    } finally {
      setCarregando(false);
    }
  }, [filtrosAplicados]);

  useEffect(() => {
    carregarTransacoes();
  }, [carregarTransacoes]);

  const alterarFormulario = (campo, valor) => setFormulario((atual) => ({ ...atual, [campo]: valor }));
  const alterarFiltro = (campo, valor) => setFiltros((atuais) => ({ ...atuais, [campo]: valor }));

  const abrirNovo = () => {
    setEditandoId(null);
    setFormulario(formularioInicial);
    setModalAberto(true);
  };

  const abrirEdicao = (transacao) => {
    setEditandoId(transacao.id);
    setFormulario({
      descricao: transacao.descricao,
      valor: transacao.valor,
      tipo: transacao.tipo,
      categoria: transacao.categoria,
      data: transacao.data,
    });
    setModalAberto(true);
  };

  const salvarTransacao = async (event) => {
    event.preventDefault();
    const payload = { ...formulario, valor: Number(formulario.valor) };
    try {
      if (editandoId) await api.put(`transacoes/${editandoId}/`, payload);
      else await api.post("transacoes/", payload);
      setModalAberto(false);
      await carregarTransacoes();
    } catch (erro) {
      console.error(erro.response?.data || erro);
      if (!tratarErroAutenticacao(erro)) alert("Não foi possível salvar o lançamento.");
    }
  };

  const excluirTransacao = async (id) => {
    if (!window.confirm("Excluir este lançamento?")) return;
    try {
      await api.delete(`transacoes/${id}/`);
      setTransacoes((atuais) => atuais.filter((transacao) => transacao.id !== id));
    } catch (erro) {
      if (!tratarErroAutenticacao(erro)) alert("Não foi possível excluir o lançamento.");
    }
  };

  const aplicarFiltros = (event) => {
    event.preventDefault();
    setFiltrosAplicados(filtros);
  };

  const limparFiltros = () => {
    setFiltros(filtrosIniciais);
    setFiltrosAplicados(filtrosIniciais);
  };

  return (
    <div className="financas-page">
      <Header />
      <div className="financas-main">
        <Sidebar />
        <main className="financas-content">
          <header className="financas-header">
            <div><h2>Lançamentos financeiros</h2><p>Cadastre, consulte e organize suas movimentações.</p></div>
            <button className="financas-primary" onClick={abrirNovo}>+ Novo lançamento</button>
          </header>

          <form className="financas-filters" onSubmit={aplicarFiltros}>
            <input value={filtros.busca} onChange={(e) => alterarFiltro("busca", e.target.value)} placeholder="Buscar por descrição" />
            <select value={filtros.categoria} onChange={(e) => alterarFiltro("categoria", e.target.value)}><option value="">Todas as categorias</option>{CATEGORIAS.map((categoria) => <option key={categoria.value} value={categoria.value}>{categoria.label}</option>)}</select>
            <select value={filtros.tipo} onChange={(e) => alterarFiltro("tipo", e.target.value)}><option value="">Entradas e saídas</option><option value="entrada">Entradas</option><option value="saida">Saídas</option></select>
            <input type="date" value={filtros.data_inicio} onChange={(e) => alterarFiltro("data_inicio", e.target.value)} title="Data inicial" />
            <input type="date" value={filtros.data_fim} onChange={(e) => alterarFiltro("data_fim", e.target.value)} title="Data final" />
            <button type="submit">Filtrar</button>
            <button type="button" className="secondary" onClick={limparFiltros}>Limpar</button>
          </form>

          <section className="financas-list">
            <div className="financas-list-title"><h3>Histórico</h3><span>{transacoes.length} lançamentos encontrados</span></div>
            <div className="financas-table-scroll">
              <table>
                <thead><tr><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Data</th><th>Valor</th><th>Ações</th></tr></thead>
                <tbody>
                  {transacoes.map((transacao) => <tr key={transacao.id}>
                    <td><strong>{transacao.descricao}</strong></td>
                    <td>{nomeCategoria(transacao.categoria)}</td>
                    <td><span className={`financas-badge ${transacao.tipo}`}>{transacao.tipo === "entrada" ? "Entrada" : "Saída"}</span></td>
                    <td>{formatarDataBR(transacao.data)}</td>
                    <td className={transacao.tipo === "entrada" ? "positive" : "negative"}>{transacao.tipo === "entrada" ? "+" : "-"} {formatarBRL(transacao.valor)}</td>
                    <td className="financas-row-actions"><button onClick={() => abrirEdicao(transacao)}>Editar</button><button className="danger" onClick={() => excluirTransacao(transacao.id)}>Excluir</button></td>
                  </tr>)}
                  {!carregando && !transacoes.length && <tr><td colSpan="6" className="financas-empty">Nenhum lançamento encontrado.</td></tr>}
                  {carregando && <tr><td colSpan="6" className="financas-empty">Carregando lançamentos...</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {modalAberto && <div className="financas-modal-overlay" onClick={() => setModalAberto(false)}><form className="financas-modal" onSubmit={salvarTransacao} onClick={(e) => e.stopPropagation()}>
        <div className="financas-modal-header"><div><h3>{editandoId ? "Editar lançamento" : "Novo lançamento"}</h3><p>Informe os dados da movimentação.</p></div><button type="button" onClick={() => setModalAberto(false)}>×</button></div>
        <label>Descrição<input required value={formulario.descricao} onChange={(e) => alterarFormulario("descricao", e.target.value)} /></label>
        <div className="financas-form-row"><label>Valor<input required type="number" min="0.01" step="0.01" value={formulario.valor} onChange={(e) => alterarFormulario("valor", e.target.value)} /></label><label>Data<input required type="date" value={formulario.data} onChange={(e) => alterarFormulario("data", e.target.value)} /></label></div>
        <div className="financas-form-row"><label>Tipo<select value={formulario.tipo} onChange={(e) => alterarFormulario("tipo", e.target.value)}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></label><label>Categoria<select value={formulario.categoria} onChange={(e) => alterarFormulario("categoria", e.target.value)}>{CATEGORIAS.map((categoria) => <option key={categoria.value} value={categoria.value}>{categoria.label}</option>)}</select></label></div>
        <button className="financas-primary full">{editandoId ? "Salvar alterações" : "Cadastrar lançamento"}</button>
      </form></div>}
    </div>
  );
}

export default Financas;
