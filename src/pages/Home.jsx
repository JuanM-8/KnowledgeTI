import "../styles/Home.css";
import { useState, useEffect } from "react";
import { Cards } from "../components/Cards";
import AnalizarError from "../components/AnalizarError";
import { useAuth0 } from "@auth0/auth0-react";

export function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    fetch("/.netlify/functions/getKnowledge")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch(() => setData([]));
  }, []);

  function normalizar(texto) {
    return (texto || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  const camposBusqueda = ["problema", "solucion", "categoria"];

  
  const resultadosFiltrados = data 
    ? data.filter((item) =>
        camposBusqueda.some((campo) =>
          normalizar(item[campo]).includes(normalizar(busqueda)),
        ),
      )
    : null; 

  const cat = ["", ...new Set(data.map((item) => item.categoria || ""))].sort();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const formData = new FormData(e.target);
    const payload = {
      pregunta: formData.get("pregunta"),
      respuesta: formData.get("respuesta"),
    };

    try {
      const res = await fetch("/.netlify/functions/crearSugerencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (res.ok) {
        alert("¡Gracias por tu aporte!");
        setMostrarForm(false);
        e.target.reset();
      } else {
        alert(`Error: ${responseData.error || "Error desconocido"}`);
      }
    } catch (error) {
      alert(`Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header>
        <h1>Preguntas y problemas comunes</h1>

        <input
          className="search-input"
          type="text"
          value={busqueda}
          autoFocus
          placeholder="Introduce aqui tu pregunta o problema"
          onChange={(e) => setBusqueda(e.target.value)}
        />
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

      <AnalizarError />

      <button className="fab" onClick={() => setMostrarForm(true)}>
        +
      </button>

      {mostrarForm && (
        <div className="modal-overlay" onClick={() => setMostrarForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>¿Sabes algún otro error?</h2>

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
                <button type="submit" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
