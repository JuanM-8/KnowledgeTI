// Importo herramientas de React que voy a usar
import { createContext, useContext, useState } from "react";

// Creo un "Contexto": una cajita para guardar y compartir datos
const AuthContext = createContext();

// Este componente va a envolver a otros y darles acceso al "contexto"
export function AuthProvider({ children }) {
  // Creo una variable de estado: "isAuth" empieza en false (no logueado)
  // "setIsAuth" sirve para cambiar ese valor más adelante
  const [isAuth, setIsAuth] = useState(false);

  // Creo una función "login" que cambia isAuth a true (sí está logueado)
  function login() {
    setIsAuth(true);
  }

  // Devuelvo un "Provider": es el que reparte el contexto a los hijos
  // Dentro del value pongo qué datos quiero compartir: isAuth y login
  // {children} son todos los componentes hijos que envuelvo con este Provider
  return (
    <AuthContext.Provider value={{ isAuth, login }}>
      {children}
    </AuthContext.Provider>
  );
}

// Creo un "hook" personalizado: useAuth()
// Esto me deja acceder fácilmente a los datos guardados en el contexto
export function useAuth() {
  return useContext(AuthContext);
}
