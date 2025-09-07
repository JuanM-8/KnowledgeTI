import { Navigate } from "react-router-dom";
import { useAuth } from "./Authcontext.jsx";

export default function PrivateRoute({ children }) {
  const { isAuth } = useAuth();

  // Si está logueado, mostramos la página (children)
  // Si NO está logueado, lo mandamos al login
  return isAuth ? children : <Navigate to="/" replace />;
}
