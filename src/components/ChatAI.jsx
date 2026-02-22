import { useState, useRef, useEffect } from "react";
import "../styles/ChatIA.css";

export default function ChatIA() {
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarChat, setMostrarChat] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviar = async () => {
    if (!input.trim() || cargando) return;

    const pregunta = input;
    setInput("");

    const nuevosMensajes = [...mensajes, { rol: "user", texto: pregunta }];
    setMensajes(nuevosMensajes);
    setCargando(true);

    try {
      const res = await fetch("/.netlify/functions/aiChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pregunta,
          historial: nuevosMensajes, // 👈 mandamos todo el historial
        }),
      });

      const { respuesta, fuentes } = await res.json();

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
    <>
      <button className="btn-chat" onClick={() => setMostrarChat(true)}>
        <img src="IMG/moffyChat.png" alt="" />
      </button>
      {mostrarChat && (
        <div
          className="modalChat-overlay"
          onClick={() => setMostrarChat(false)}
        >
          <div className="chat-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="chat-mensajes">
              {mensajes.length === 0 && (
                <div className="chat-empty">
                  <p>
                    Hola soy Moffy tu asistente virtual, ¿en qué te puedo ayudar
                    hoy?
                  </p>
                  <p>Pregúntame cualquier problema técnico.</p>
                </div>
              )}

              {mensajes.map((m, i) => (
                <div key={i} className={`burbuja ${m.rol}`}>
                  <p>{m.texto}</p>
                </div>
              ))}

              {cargando && (
                <div className="burbuja assistant">
                  <span className="typing">●●●</span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="chat-input">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviar()}
                placeholder="Escribe tu problema..."
                disabled={cargando}
              />
              <button onClick={enviar} disabled={cargando}>
                {cargando ? "..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
