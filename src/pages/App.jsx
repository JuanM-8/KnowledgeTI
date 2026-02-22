import { useAuth0 } from "@auth0/auth0-react";
import { Home } from "./Home";
import Login from "./Login";

export default function App() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return <div className="spinner"></div>;
  }

  return <>{isAuthenticated ? <Home /> : <Login />}</>;
}
