import { NavLink } from "react-router-dom";
import { FiHome, FiDollarSign, FiTrendingUp, FiSettings } from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li>
            <NavLink to="/" className="nav-link">
              <FiHome className="nav-icon" />
              <span>Dashboard</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/financas" className="nav-link">
              <FiDollarSign className="nav-icon" />
              <span>Finanças</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/investimentos" className="nav-link">
              <FiTrendingUp className="nav-icon" />
              <span>Investimentos</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/configuracoes" className="nav-link">
              <FiSettings className="nav-icon" />
              <span>Configurações</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;