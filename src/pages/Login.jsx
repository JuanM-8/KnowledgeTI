import { useAuth0 } from "@auth0/auth0-react";
import "../styles/Login.css";
export default function Login() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="login-page">
      <div className="main-content">
        <main className="access-focus-card">
          <div className="brand-watermark">KNOWLEDGE TI</div>

          <h1>Knowledge TI</h1>

          <p className="slogan">
            Aplicación web desarrollada para centralizar preguntas frecuentes,
            soluciones y recursos técnicos de forma segura y organizada.
          </p>

          <button className="login-btn" onClick={() => loginWithRedirect()}>
            Entrar con Auth0 🔑
          </button>
        </main>
      </div>
    </div>
  );
}
