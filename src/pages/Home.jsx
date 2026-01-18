import "../styles/Home.css";
import { useState } from "react";
import { Cards } from "../components/Cards";
import data from "../Data.json";
import { useAuth0 } from "@auth0/auth0-react";

export function Home() {
  const { logout } = useAuth0();

  const [busqueda, setBusqueda] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  function normalizar(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  const resultadosFiltrados = data.filter((item) => {
    return (
      normalizar(item.problema).includes(normalizar(busqueda)) ||
      normalizar(item.solucion).includes(normalizar(busqueda)) ||
      normalizar(item.categoria).includes(normalizar(busqueda))
    );
  });

  const cat = ["", ...new Set(data.map((item) => item.categoria))].sort();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const payload = {
      pregunta: formData.get("pregunta"),
      respuesta: formData.get("respuesta"),
    };

    const res = await fetch("/.netlify/functions/crearSugerencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("¡Gracias por tu aporte!");
      setMostrarForm(false);
    } else {
      alert("Error al enviar");
    }
  };
  

  return (
    <>
      <button className="logout-btn" onClick={() => logout()}>
        Salir
      </button>

      <header>
        <h1>Preguntas y problemas comunes</h1>
        <div>
          <input
            className="search-input"
            type="text"
            value={busqueda}
            autoFocus
            placeholder="Introduce aqui tu pregunta o problema"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </header>

      <div className="nav">
        {cat.map((item) => (
          <button
            key={item}
            className="home-button"
            data-status={item}
            onClick={() => setBusqueda(item)}
          >
            {item === "" ? "Todas" : item}
          </button>
        ))}
      </div>

      <div className="containerCards">
        <Cards resultados={resultadosFiltrados} />
      </div>

      {/* Botón flotante */}
      <button className="fab" onClick={() => setMostrarForm(true)}>
        +
      </button>

      {/* Modal */}
      {mostrarForm && (
        <div className="modal-overlay" onClick={() => setMostrarForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>¿Tienes una solución nueva?</h2>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="pregunta"
                placeholder="Pregunta"
                required
              />

              <textarea name="respuesta" placeholder="Respuesta" required />

              <div className="modal-actions">
                <button type="button" onClick={() => setMostrarForm(false)}>
                  Cancelar
                </button>

                <button type="submit">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
