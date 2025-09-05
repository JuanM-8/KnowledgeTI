import "../styles/Login.css";
import { Link } from "react-router-dom";

export function Login() {
  return (
    <>
      <div className="main">
        <h1>Iniciar Sesion</h1>
        <form action="">
          <input type="text" />
          <input type="text" />
          <Link to={"/home"}><button>Login</button></Link>

         
        </form>
      </div>
    </>
  );
}
