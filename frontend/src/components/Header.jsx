import "./Header.css"
import { FaUserCircle } from "react-icons/fa";

function Header() {
    return (
        <header className="header">
            <h1>Vesto Finanças</h1>

            <div className="header-user">
                <span>João Gabriel</span>
                <FaUserCircle className="header-user-icon" />
            </div>
        </header>
    );
}

export default Header;
