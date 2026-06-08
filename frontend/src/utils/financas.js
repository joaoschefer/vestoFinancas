export const CATEGORIAS = [
  { value: "alimentacao", label: "Alimentação", color: "#f97316" },
  { value: "transporte", label: "Transporte", color: "#3b82f6" },
  { value: "moradia", label: "Moradia", color: "#8b5cf6" },
  { value: "saude", label: "Saúde", color: "#ef4444" },
  { value: "educacao", label: "Educação", color: "#06b6d4" },
  { value: "lazer", label: "Lazer", color: "#ec4899" },
  { value: "salario", label: "Salário", color: "#14b8a6" },
  { value: "vendas", label: "Vendas", color: "#eab308" },
  { value: "outros", label: "Outros", color: "#64748b" },
];

export const formatarBRL = (valor) => Number(valor || 0).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatarDataBR = (data) => {
  if (!data) return "-";
  const [ano, mes, dia] = String(data).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
};

export const nomeCategoria = (valor) =>
  CATEGORIAS.find((categoria) => categoria.value === valor)?.label || "Outros";

export const corCategoria = (valor) =>
  CATEGORIAS.find((categoria) => categoria.value === valor)?.color || "#64748b";

export const tratarErroAutenticacao = (erro) => {
  if (erro.response?.status !== 401) return false;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  sessionStorage.setItem("auth_message", "Sua sessão não é mais válida. Entre novamente.");
  window.location.href = "/login";
  return true;
};
