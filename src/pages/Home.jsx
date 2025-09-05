import { useState } from "react";
import "../styles/Home.css";
import { Cards } from "../components/Cards";

function Home() {
  const [count, setCount] = useState(0);

  return (
    <>
      <header>
        <div>
          <button>🌙</button>
        </div>
        <h1>Preguntas y problemas comunes</h1>
        <input
          className="search-input"
          type="text"
          autoFocus
          placeholder="Introduce aqui tu pregunta o problema"
        />
      </header>

      <div>
        <h2>Las preguntas más buscadas...</h2>
        <div className="containerCards">
          <Cards categoria={"Redes"} problema={"Clave Wifi Falacorp"} />
          <Cards categoria={"Redes"} problema={"Clave Wifi Falacorp"} />
          <Cards categoria={"Redes"} problema={"Clave Wifi Falacorp"} />
          <Cards categoria={"Redes"} problema={"Clave Wifi Falacorp"} />
          <Cards categoria={"Redes"} problema={"Clave Wifi Falacorp"} />
          <Cards categoria={"Redes"} problema={"Clave Wifi Falacorp"} />
        </div>
      </div>
    </>
  );
}

export default Home;
