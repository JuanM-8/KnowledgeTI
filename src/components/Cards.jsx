import "../styles/Cards.css";

export function Cards({ resultados }) {
    if (resultados === null ) {
      return (
        <p className="NoCoincidencia">cargando</p>
      );

      
    }

    if (resultados.length === 0) {
      return <p className="NoCoincidencia">No resultados </p>;
    }

  return (
    <>
      {resultados.map((item) => {
        const categoriaNormalizada = (item.categoria || "")
          .toLowerCase()
          .trim();

        return (
          <div className="card" key={item.id || item.problema}>
            <h3 data-status={categoriaNormalizada}>
              {item.categoria || "Sin categoría"}
            </h3>

            <h1>{item.problema}</h1>

            {item.solucion && <p>{item.solucion}</p>}

            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-manual"
              >
                Ver manual
              </a>
            )}
          </div>
        );
      })}
    </>
  );
}
