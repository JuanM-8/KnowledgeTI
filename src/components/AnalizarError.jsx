import { useState, useRef } from "react";
import "../styles/AnalizarError.css";

export default function AnalizarError() {
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [imagen, setImagen] = useState(null); // base64
  const [preview, setPreview] = useState(null); // URL para mostrar
  const [contexto, setContexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null); // { solucion, fuentes, categoria }
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  // ── Convertir archivo a base64 ─────────────────────────────────────────
  function leerArchivo(file) {
    if (!file || !file.type.startsWith("image/")) {
      setError("Solo se aceptan imágenes (PNG, JPG, WEBP, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 5 MB.");
      return;
    }
    setError(null);
    setResultado(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(",")[1]; // quita el prefijo data:image/...;base64,
      setImagen(base64);
      setPreview(e.target.result); // guarda la URL completa para <img>
    };
    reader.readAsDataURL(file);
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────
  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    leerArchivo(file);
  }

  // ── Selección por input file ───────────────────────────────────────────
  function onFileChange(e) {
    leerArchivo(e.target.files[0]);
  }
  // ── 7. Inferir la categoría del problema ──────────────────────────────
  let categoria = "Soporte Técnico";

  try {
    if (fuentes.length > 0) {
      const categorias = fuentes.map((f) => f.categoria).filter(Boolean);
      if (categorias.length > 0) {
        const frecuencia = categorias.reduce((acc, c) => {
          acc[c] = (acc[c] || 0) + 1;
          return acc;
        }, {});
        const entries = Object.entries(frecuencia);
        if (entries.length > 0) {
          categoria = entries.sort((a, b) => b[1] - a[1])[0][0];
        }
      }
    } else if (infoError.programa && infoError.programa !== "no identificado") {
      const prog = infoError.programa.toLowerCase();
      if (prog.includes("print") || prog.includes("impres"))
        categoria = "Impresoras";
      else if (
        prog.includes("red") ||
        prog.includes("network") ||
        prog.includes("internet")
      )
        categoria = "Servidores";
      else categoria = "Aplicaciones";
    }
  } catch {
    categoria = "Soporte Técnico";
  }

  // ── Enviar a la Netlify Function ───────────────────────────────────────
  async function analizar() {
    if (!imagen) {
      setError("Primero sube una imagen del error.");
      return;
    }
    setError(null);
    setCargando(true);
    setResultado(null);

    try {
      const res = await fetch("/.netlify/functions/analizarImagen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen, contexto }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || "Error en el servidor");
      }

      const data = await res.json();
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // ── Reiniciar ──────────────────────────────────────────────────────────
  function reset() {
    setImagen(null);
    setPreview(null);
    setContexto("");
    setResultado(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Cerrar panel ──────────────────────────────────────────────────────
  function cerrar() {
    setMostrarPanel(false);
    reset();
  }

  return (
    <>
      {/* ── Botón flotante ── */}
      <button
        className="fab-analizar"
        onClick={() => setMostrarPanel(true)}
        title="Analizar error con IA"
      >
        <span className="fab-analizar__icon">
          {/* Ícono de cámara / ojo */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        <span className="fab-analizar__label">Analizar error</span>
      </button>

      {/* ── Overlay + Panel ── */}
      {mostrarPanel && (
        <div className="ae-overlay" onClick={cerrar}>
          <div className="ae-panel" onClick={(e) => e.stopPropagation()}>
            {/* Cabecera */}
            <div className="ae-header">
              <div className="ae-header__left">
                <h2>Analizar error con IA</h2>
              </div>
              <button className="ae-close" onClick={cerrar}>
                ✕
              </button>
            </div>

            {/* Cuerpo */}
            <div className="ae-body">
              {/* Zona de carga de imagen */}
              {!preview ? (
                <div
                  className={`ae-dropzone ${dragging ? "ae-dropzone--active" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <svg
                    className="ae-dropzone__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M3 15l5-5 4 4 3-3 6 6" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                  </svg>
                  <p className="ae-dropzone__text">
                    Arrastra la captura de pantalla aquí
                    <br />
                    <span>o haz clic para seleccionar</span>
                  </p>
                  <p className="ae-dropzone__hint">
                    PNG · JPG · WEBP — máx. 5 MB
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onFileChange}
                  />
                </div>
              ) : (
                <div className="ae-preview">
                  <img src={preview} alt="Captura del error" />
                  <button className="ae-preview__remove" onClick={reset}>
                    ✕ Cambiar imagen
                  </button>
                </div>
              )}

              {/* Contexto adicional */}
              <textarea
                className="ae-contexto"
                placeholder="Contexto adicional (opcional): ¿qué estabas haciendo cuando ocurrió el error? ¿ya intentaste algo?"
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
                rows={3}
                disabled={cargando}
              />

              {/* Error */}
              {error && <div className="ae-error">⚠️ {error}</div>}

              {/* Botón analizar */}
              {!resultado && (
                <button
                  className="ae-btn-analizar"
                  onClick={analizar}
                  disabled={cargando || !imagen}
                >
                  {cargando ? (
                    <span className="ae-btn-analizar__loading">
                      <span className="ae-spinner" />
                      Analizando con IA...
                    </span>
                  ) : (
                    "🔍 Analizar error"
                  )}
                </button>
              )}

              {/* Resultado */}
              {resultado && (
                <div className="ae-resultado">
                  {/* Encabezado del resultado */}
                  <div className="ae-resultado__header">
                    <span className="ae-resultado__badge">
                      {resultado.categoria || "Error detectado"}
                    </span>
                    <span className="ae-resultado__confianza">
                      {resultado.coincidencias > 0
                        ? `${resultado.coincidencias} caso(s) similar(es) encontrado(s)`
                        : "Análisis basado en la imagen"}
                    </span>
                  </div>

                  {/* Título del error identificado */}
                  {resultado.errorIdentificado && (
                    <p className="ae-resultado__error-id">
                      <strong>Error detectado:</strong>{" "}
                      {resultado.errorIdentificado}
                    </p>
                  )}

                  {/* La solución */}
                  <div className="ae-resultado__solucion">
                    <h4>Solución</h4>
                    <p>{resultado.solucion}</p>
                  </div>

                  {/* Fuentes de Supabase si las hay */}
                  {resultado.fuentes && resultado.fuentes.length > 0 && (
                    <div className="ae-resultado__fuentes">
                      <h5>Casos similares en la base de conocimiento:</h5>
                      {resultado.fuentes.map((f, i) => (
                        <div key={i} className="ae-resultado__fuente">
                          <span className="ae-resultado__fuente-cat">
                            {f.categoria}
                          </span>
                          <span>{f.problema}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botón para analizar otra imagen */}
                  <button className="ae-btn-nuevo" onClick={reset}>
                    ↩ Analizar otro error
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}