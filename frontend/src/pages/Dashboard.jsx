import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import "./Dashboard.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import {
  corCategoria, formatarBRL, formatarDataBR, nomeCategoria, tratarErroAutenticacao,
} from "../utils/financas";

const inicioMes = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-01`;
const fimMes = (data) => new Date(data.getFullYear(), data.getMonth() + 1, 0).toISOString().slice(0, 10);

function Dashboard() {
  const [transacoes, setTransacoes] = useState([]);
  const [preferencias, setPreferencias] = useState({ meta_economia_mensal: 0, limite_gastos_mensal: 0 });
  const [carregando, setCarregando] = useState(true);

  const carregarTransacoes = useCallback(async () => {
    setCarregando(true);
    const hoje = new Date();
    const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    try {
      const [resTransacoes, resPreferencias] = await Promise.all([
        api.get("transacoes/", { params: { data_inicio: inicioMes(seisMesesAtras), data_fim: fimMes(hoje) } }),
        api.get("usuarios/preferencias/"),
      ]);
      setTransacoes(Array.isArray(resTransacoes.data) ? resTransacoes.data : []);
      setPreferencias(resPreferencias.data);
    } catch (erro) {
      console.error(erro);
      tratarErroAutenticacao(erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarTransacoes();
  }, [carregarTransacoes]);

  const dados = useMemo(() => {
    const hoje = new Date();
    const atual = inicioMes(hoje).slice(0, 7);
    const anterior = inicioMes(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)).slice(0, 7);
    const porMes = {};
    const categorias = {};

    transacoes.forEach((transacao) => {
      const mes = transacao.data.slice(0, 7);
      porMes[mes] ||= { entradas: 0, saidas: 0 };
      porMes[mes][transacao.tipo === "entrada" ? "entradas" : "saidas"] += Number(transacao.valor);
      if (mes === atual && transacao.tipo === "saida") {
        categorias[transacao.categoria] = (categorias[transacao.categoria] || 0) + Number(transacao.valor);
      }
    });

    const resumoAtual = porMes[atual] || { entradas: 0, saidas: 0 };
    const resumoAnterior = porMes[anterior] || { entradas: 0, saidas: 0 };
    const saldo = resumoAtual.entradas - resumoAtual.saidas;
    const saldoAnterior = resumoAnterior.entradas - resumoAnterior.saidas;
    const comparacao = saldoAnterior ? ((saldo - saldoAnterior) / Math.abs(saldoAnterior)) * 100 : null;

    const fluxo = Array.from({ length: 6 }, (_, indice) => {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + indice, 1);
      const chave = inicioMes(data).slice(0, 7);
      return {
        mes: data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        entrada: porMes[chave]?.entradas || 0,
        saida: porMes[chave]?.saidas || 0,
      };
    });

    const gastos = Object.entries(categorias)
      .map(([categoria, valor]) => ({ name: nomeCategoria(categoria), value: valor, color: corCategoria(categoria) }))
      .sort((a, b) => b.value - a.value);

    return { resumoAtual, saldo, comparacao, fluxo, gastos };
  }, [transacoes]);

  const progressoMeta = Number(preferencias.meta_economia_mensal)
    ? Math.min((dados.saldo / Number(preferencias.meta_economia_mensal)) * 100, 100)
    : 0;
  const progressoLimite = Number(preferencias.limite_gastos_mensal)
    ? Math.min((dados.resumoAtual.saidas / Number(preferencias.limite_gastos_mensal)) * 100, 100)
    : 0;

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-main">
        <Sidebar />
        <main className="dashboard-content">
          <header className="dashboard-header">
            <div><h2>Visão geral</h2><p>Resumo financeiro do mês atual.</p></div>
            <Link to="/financas" className="dashboard-action">Gerenciar lançamentos</Link>
          </header>

          <section className="dashboard-cards">
            <article><span>Saldo do mês</span><strong className={dados.saldo >= 0 ? "positive" : "negative"}>{formatarBRL(dados.saldo)}</strong><small>{dados.comparacao === null ? "Sem comparação anterior" : `${dados.comparacao >= 0 ? "+" : ""}${dados.comparacao.toFixed(1)}% comparado ao mês anterior`}</small></article>
            <article><span>Entradas do mês</span><strong className="positive">{formatarBRL(dados.resumoAtual.entradas)}</strong><small>Receitas registradas</small></article>
            <article><span>Saídas do mês</span><strong className="negative">{formatarBRL(dados.resumoAtual.saidas)}</strong><small>Despesas registradas</small></article>
            <article><span>Taxa de economia</span><strong>{dados.resumoAtual.entradas ? `${((dados.saldo / dados.resumoAtual.entradas) * 100).toFixed(1)}%` : "0,0%"}</strong><small>Percentual da renda preservado</small></article>
          </section>

          <section className="dashboard-grid">
            <article className="dashboard-panel">
              <h3>Fluxo dos últimos 6 meses</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dados.fluxo}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f7" /><XAxis dataKey="mes" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} fontSize={11} /><Tooltip formatter={(valor) => formatarBRL(valor)} /><Bar dataKey="entrada" name="Entradas" fill="#05cd99" radius={[5, 5, 0, 0]} /><Bar dataKey="saida" name="Saídas" fill="#ee5d50" radius={[5, 5, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </article>
            <article className="dashboard-panel">
              <h3>Gastos por categoria neste mês</h3>
              {dados.gastos.length ? <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={dados.gastos} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>{dados.gastos.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(valor) => formatarBRL(valor)} /></PieChart></ResponsiveContainer> : <div className="dashboard-empty">Nenhuma saída registrada neste mês.</div>}
            </article>
          </section>

          <section className="dashboard-goals">
            <article className="dashboard-panel">
              <div className="dashboard-goal-title"><div><h3>Meta de economia</h3><small>{formatarBRL(dados.saldo)} de {formatarBRL(preferencias.meta_economia_mensal)}</small></div><strong>{Math.max(progressoMeta, 0).toFixed(0)}%</strong></div>
              <div className="dashboard-progress"><span style={{ width: `${Math.max(progressoMeta, 0)}%` }} /></div>
            </article>
            <article className="dashboard-panel">
              <div className="dashboard-goal-title"><div><h3>Limite de gastos</h3><small>{formatarBRL(dados.resumoAtual.saidas)} de {formatarBRL(preferencias.limite_gastos_mensal)}</small></div><strong className={progressoLimite >= 100 ? "negative" : ""}>{progressoLimite.toFixed(0)}%</strong></div>
              <div className="dashboard-progress limit"><span style={{ width: `${progressoLimite}%` }} /></div>
            </article>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-title"><h3>Últimos lançamentos</h3><Link to="/financas">Ver todos</Link></div>
            <div className="dashboard-recent">
              {transacoes.slice(0, 5).map((transacao) => <div key={transacao.id}><span className={`dashboard-type ${transacao.tipo}`}>{transacao.tipo === "entrada" ? "+" : "-"}</span><p><strong>{transacao.descricao}</strong><small>{nomeCategoria(transacao.categoria)} · {formatarDataBR(transacao.data)}</small></p><b className={transacao.tipo === "entrada" ? "positive" : "negative"}>{transacao.tipo === "entrada" ? "+" : "-"} {formatarBRL(transacao.valor)}</b></div>)}
              {!carregando && !transacoes.length && <div className="dashboard-empty">Nenhum lançamento cadastrado.</div>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
