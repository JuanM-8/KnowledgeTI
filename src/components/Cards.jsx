import "../styles/Cards.css";
export function Cards({ resultados }) {
  if (resultados.length === 0) {
    return (
      <p className="NoCoincidencia">No se encontraron coincidencias. 😟</p>
    );
  }
  return (
    <>
      {resultados.map((item) => (
        <div className="card">
          <h3 data-status={item.categoria}>{item.categoria}</h3>
          <h1>{item.problema}</h1>
          {item.solucion ? <p>{item.solucion}</p> : null}
          {item.link ? (
            <button className="btn-manual">
              <a href={item.link} target="_blank">
                Ver manual
              </a>
            </button>
          ) : null}
        </div>
      ))}
    </>
  );
}
