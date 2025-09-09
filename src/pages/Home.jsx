import "../styles/Home.css";
import { useState } from "react";
import { Cards } from "../components/Cards";
import data from "../Data.json";

export function Home() {
  const [busqueda, setBusqueda] = useState("");
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
  const cat = [
    "",...new Set(data.map(item =>item.categoria))
  ].sort()
  return (
    <>
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
        {cat.map((item) => {
          return (
            <button className="home-button" data-status={item} onClick={() => setBusqueda(item)}>
              {item == "" ? "Todas" : item}
            </button>
          );
        })}
      </div>
      <div>
        <div className="containerCards">
          <Cards resultados={resultadosFiltrados} />
        </div>
      </div>
    </>
  );
}
