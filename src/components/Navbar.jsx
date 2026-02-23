import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "../styles/Navbar.css";
export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth0();

  const enDocs = location.pathname === "/docs";

  return (
    <header className="main-header">
      {!enDocs && <Link to="/docs">Documentación</Link>}

      {enDocs &&
        (isAuthenticated ? (
          <Link to="/">Volver</Link>
        ) : (
          <Link to="/login">Login</Link>
        ))}
      <span>
        Desarrollado por:{" "}
        <a href="https://portafoliojdm.netlify.app/" target="_BLANK">
          Juan Marin
        </a>
      </span>
    </header>
  );
}
