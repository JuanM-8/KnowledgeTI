import "../styles/Login.css";
import { useAuth } from "../components/Authcontext.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Login() {
  const { login } = useAuth(); // traemos la función login() de la cajita mágica
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    // 🚨 validamos las credenciales falsas
    if (username === "admin" && password === "1234") {
      login(); // marcamos como logueado
      navigate("/home"); // redirigimos a la página Home
    } else {
      setError("Usuario o contraseña incorrectos 🚫");
    }
  }
  return (
    <div className="app">
      <div className="login-container">
        <h2>LOGIN</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="User"
            value={username}
            autoFocus
            onChange={(e) => setUsername(e.target.value.trim())}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="login" type="submit">Login</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}
