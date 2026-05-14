import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Financas from "./pages/Financas";
import Investimentos from "./pages/Investimentos";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        <Route path="/" element={ <PrivateRoute> <Dashboard /></PrivateRoute>} />
        <Route path="/financas" element={<PrivateRoute> <Financas /></PrivateRoute>} />
        <Route path="/investimentos" element={<PrivateRoute> <Investimentos /></PrivateRoute>} />
        <Route path="/configuracoes" element={<PrivateRoute> <Configuracoes /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;