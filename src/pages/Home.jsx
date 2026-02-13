import "../styles/Home.css";
import { useState, useEffect } from "react";
import { Cards } from "../components/Cards";
import { useAuth0 } from "@auth0/auth0-react";

export function Home() {
  const { logout } = useAuth0();

  const [data, setData] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  // 🔄 Cargar datos desde Supabase (via Netlify Function)
  useEffect(() => {
    fetch("/.netlify/functions/getKnowledge")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error("Error cargando datos:", err));
  }, []);

  function normalizar(texto) {
    return (texto || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // 🧠 Campos donde se busca
  const camposBusqueda = ["problema", "solucion", "categoria"];

  // 🔍 Filtro dinámico
  const resultadosFiltrados = data.filter((item) =>
    camposBusqueda.some((campo) =>
      normalizar(item[campo]).includes(normalizar(busqueda)),
    ),
  );

  const cat = ["", ...new Set(data.map((item) => item.categoria || ""))].sort();

  // 📝 Enviar sugerencia
  const handleSubmit = async (e) => {
    e.preventDefault();

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
    }
  };

  return (
    <>
      <button className="logout-btn" onClick={() => logout()}>
        Salir
      </button>

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

                <button type="submit">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
