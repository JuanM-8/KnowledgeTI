import "../styles/Cards.css";

export function Cards({ resultados }) {
  // 🔄 Aún cargando
  if (resultados === null || resultados === undefined) {
    return <p className="NoCoincidencia">Cargando...</p>;
  }

  // ❌ Sin resultados
  if (resultados.length === 0) {
    return <p className="NoCoincidencia">No se encontraron resultados</p>;
  }

  // ✅ Con resultados
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
