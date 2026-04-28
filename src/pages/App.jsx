import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import Navbar from "../components/Navbar";
import { Home } from "./Home";
import Docs from "./Docs";
import Login from "./Login";

export default function App() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className="spinner"></div>;
  }

<<<<<<< HEAD
  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <Home /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/docs" element={<Docs />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
=======
  return <>{isAuthenticated ? <Login /> : <Home />}</>;
>>>>>>> pruebas
}
