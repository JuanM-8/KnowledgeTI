import { createRoot } from "react-dom/client";
import { Footer } from "./components/Footer.jsx";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./pages/App.jsx";

import "./styles/index.css";
createRoot(document.getElementById("root")).render(
  <Auth0Provider
    domain="dev-7t8d8ad8cja764ah.us.auth0.com"
    clientId="FyewTQtYzujPziWlo90dUZAKbfXQuFrQ"
    authorizationParams={{
      prompt: "login",
      redirect_uri: window.location.origin,
    }}
  >
    <Footer></Footer>

    <span className="glow"></span>
    <App />
  </Auth0Provider>,
);
