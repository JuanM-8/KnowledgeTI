import "../styles/Home.css";
import { useState } from "react";
import { Cards } from "../components/Cards";
import data from "../Data.json";

export function Home() {
  const [busqueda, setBusqueda] = useState("");

  const resultadosFiltrados = data.filter((item) => {
    return (
      item.problema
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(
          busqueda
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        ) ||
      item.solucion
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(
          busqueda
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        ) ||
      item.categoria
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(
          busqueda
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        )
    );
  });
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
        <button onClick={() => setBusqueda("")} style={{color:"white"}}>Todas</button>
        <button
          onClick={() => setBusqueda("impresoras")}
          data-status="impresoras"
        >
          Impresoras
        </button>
        <button
          onClick={() => setBusqueda("datáfonos")}
          data-status="datáfonos"
        >
          Datáfonos
        </button>
        <button
          onClick={() => setBusqueda("servidores")}
          data-status="servidores"
        >
          Servidores
        </button>
        <button
          onClick={() => setBusqueda("contraseñas")}
          data-status="contraseñas"
        >
          Contraseñas
        </button>

        <button
          onClick={() => setBusqueda("aplicaciones")}
          data-status="aplicaciones"
        >
          Aplicaciones
        </button>

        <button
          onClick={() => setBusqueda("biométricos")}
          data-status="biométricos"
        >
          Biométricos
        </button>
        <button
          onClick={() => setBusqueda("soporte técnico")}
          data-status="soporte técnico"
        >
          Soporte técnico
        </button>
      </div>
      <div>
        <div className="containerCards">
          <Cards resultados={resultadosFiltrados} />
        </div>
      </div>
    </>
  );
}
