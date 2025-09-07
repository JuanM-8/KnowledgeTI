import { Link } from "react-router-dom";
import "../styles/NotFound.css";
export function NotFoundPage() {
  return (
    <>
      <div className="container-404">
        <div className="error">
          <h1>Error</h1>
          <h3>404</h3>
        <Link to={"/"}>
          <button className="login">Volver</button>
        </Link>
        </div>
        <div>
          <img src="../IMG/404.png" alt="" />
        </div>
        
      </div>
    </>
  );
}
