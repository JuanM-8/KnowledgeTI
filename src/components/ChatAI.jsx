import { useState, useRef, useEffect } from "react";
import "../styles/ChatIA.css";

export function ChatIA() {
  // useState guarda datos que cuando cambian, actualizan la pantalla
  const [mensajes, setMensajes] = useState([]); // historial del chat
  const [input, setInput] = useState(""); // lo que el usuario está escribiendo
  const [cargando, setCargando] = useState(false); // para mostrar el "..."

  // useRef nos da acceso directo al DOM, aquí lo usamos para hacer scroll automático
  const bottomRef = useRef(null);

  // useEffect corre código cuando algo cambia - aquí hacemos scroll cada vez que llega un mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviar = async () => {
    if (!input.trim() || cargando) return;

    const pregunta = input;
    setInput("");

    // Agregamos el mensaje del usuario al historial inmediatamente
    setMensajes((prev) => [...prev, { rol: "user", texto: pregunta }]);
    setCargando(true);

    try {
      // Llamamos a nuestra Netlify Function
      const res = await fetch("/.netlify/functions/aiChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta }),
      });

      const { respuesta, fuentes } = await res.json();

      // Agregamos la respuesta de la IA al historial
      setMensajes((prev) => [
        ...prev,
        { rol: "assistant", texto: respuesta, fuentes },
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        { rol: "assistant", texto: "❌ Error al conectar con el asistente." },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <span>🤖 Asistente KnowledgeTI</span>
        <small>Basado en tu base de conocimiento</small>
      </div>

      <div className="chat-mensajes">
        {mensajes.length === 0 && (
          <div className="chat-empty">
            <p>👋 Hola, ¿en qué te puedo ayudar hoy?</p>
            <p>Pregúntame cualquier problema técnico.</p>
          </div>
        )}

        {mensajes.map((m, i) => (
          <div key={i} className={`burbuja ${m.rol}`}>
            <p>{m.texto}</p>
            {/* Si la IA encontró fuentes en tu KB, las mostramos */}
            {m.fuentes?.length > 0 && (
              <span className="fuentes-tag">
                📚 {m.fuentes.length} solución(es) de la KB
              </span>
            )}
          </div>
        ))}

        {cargando && (
          <div className="burbuja assistant">
            <span className="typing">●●●</span>
          </div>
        )}

        {/* Elemento invisible al final para hacer scroll hacia aquí */}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Escribe tu problema técnico..."
          disabled={cargando}
        />
        <button onClick={enviar} disabled={cargando}>
          {cargando ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
