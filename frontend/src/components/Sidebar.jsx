import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
    return (
        <aside>
            <nav>
                <ul>
                    <li>
                        <Link to="/" className="nav-link">Dashboard</Link>
                    </li>
                    <li>
                        <Link to="/financas" className="nav-link">Finanças</Link>
                    </li>
                    <li>
                        <Link to="/investimentos" className="nav-link">Investimentos</Link>
                    </li>
                    <li>
                        <Link to="/configuracoes" className="nav-link">Configurações</Link>
                    </li>

                </ul>
            </nav>
        </aside>
    );
}

export default Sidebar;
