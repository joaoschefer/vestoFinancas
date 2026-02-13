import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Financas from "./pages/Financas";
import Investimentos from "./pages/Investimentos";
import Configuracoes from "./pages/Configuracoes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/financas" element={<Financas />} />
        <Route path="/investimentos" element={<Investimentos />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;