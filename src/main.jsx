import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";

import App from "./pages/App.jsx";

import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Auth0Provider
      domain="dev-7t8d8ad8cja764ah.us.auth0.com"
      clientId="FyewTQtYzujPziWlo90dUZAKbfXQuFrQ"
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <span className="glow"></span>
      <App />
    </Auth0Provider>
  </BrowserRouter>,
);
