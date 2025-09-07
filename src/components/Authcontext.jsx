import { createContext, useContext, useState } from "react";

// AuthContex llevará información a toda la app
const AuthContext = createContext();

// El "router WiFi" que envía la señal a toda la app. "children" son las partes de la app que usan la señal
export function AuthProvider({ children }) {
  const [isAuth, setIsAuth] = useState(false); //guarda si alguien está logueado (true) o no (false)...Empezamos con "no logueado"

  // Una función que "conecta" a la persona, cambiando la caja a "logueado"
  function login() {
    setIsAuth(true); // Ahora está logueado
  }

  // Enviamos la señal WiFi con la información (si está logueado, login, logout) a toda la app
  return (
    <AuthContext.Provider value={{ isAuth, login }}>
      {children} {/* Aquí van todas las partes de la app que usan la señal */}
    </AuthContext.Provider>
  );
}

// Un "cable" que conecta cualquier parte de la app a la señal WiFi para usar la información
export function useAuth() {
  return useContext(AuthContext); // Devuelve la información de la señal (isAuth, login, logout)
}
