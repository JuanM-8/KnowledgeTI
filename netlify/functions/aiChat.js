import { createClient } from "@supabase/supabase-js";

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers };

  try {
    // 1️⃣ Leemos la pregunta Y el historial del usuario
    const { pregunta, historial } = JSON.parse(event.body);

    // 2️⃣ Conectamos a Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 3️⃣ Dividimos la pregunta en palabras clave individuales
    const palabras = pregunta
      .toLowerCase()
      .split(" ")
      .filter((p) => p.length > 3);

    // 4️⃣ Construimos los filtros para cada palabra
    const filtros = palabras
      .map(
        (p) =>
          `problema.ilike.%${p}%,solucion.ilike.%${p}%,categoria.ilike.%${p}%`,
      )
      .join(",");

    // 5️⃣ Buscamos en tu knowledge base
    const { data: resultados } = await supabase
      .from("knowledge")
      .select("problema, solucion, categoria")
      .or(filtros)
      .limit(5);

    console.log("Palabras buscadas:", palabras);
    console.log("Resultados Supabase:", JSON.stringify(resultados));

    // 6️⃣ Convertimos los resultados en contexto para la IA
    const contexto = resultados?.length
      ? resultados
          .map(
            (k) =>
              `Categoría: ${k.categoria}\nProblema: ${k.problema}\nSolución: ${k.solucion}`,
          )
          .join("\n\n---\n\n")
      : "No hay soluciones relacionadas en la base de datos.";

    // 7️⃣ Convertimos el historial al formato que entiende Groq
    // Ignoramos el último mensaje del user porque lo mandamos aparte con el contexto
    const historialFormateado = (historial || [])
      .slice(0, -1) // quitamos el último que es la pregunta actual
      .map((m) => ({
        role: m.rol === "user" ? "user" : "assistant",
        content: m.texto,
      }));

    // 8️⃣ Llamamos a Groq con el historial incluido
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `Eres un asistente técnico de TI para KnowledgeTI llamado Moffy.
Responde SOLO basándote en las soluciones de la base de conocimiento proporcionada.
Si la solución está en la base de datos úsala directamente.
Si una solución ya se intentó y no funcionó, sugiere una alternativa diferente.
Si no hay más soluciones disponibles dilo claramente.
Responde en español de forma clara y paso a paso si es necesario.`,
            },
            // aquí va todo el historial de la conversación
            ...historialFormateado,
            {
              role: "user",
              // la pregunta actual siempre va con el contexto de Supabase
              content: `Base de conocimiento:\n\n${contexto}\n\nPregunta: ${pregunta}`,
            },
          ],
        }),
      },
    );

    const data = await response.json();
    console.log("Respuesta de Groq:", JSON.stringify(data));

    // 9️⃣ Extraemos el texto de la respuesta
    const respuesta = data.choices[0].message.content;

    // 🔟 Devolvemos la respuesta al frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        respuesta,
        fuentes: resultados,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
