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
    // 1️⃣ Leemos la pregunta del usuario
    const { pregunta } = JSON.parse(event.body);

    // 2️⃣ Conectamos a Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 3️⃣ Dividimos la pregunta en palabras clave individuales
    // Esto mejora la búsqueda porque no busca la frase completa
    // sino cada palabra importante por separado
    const palabras = pregunta
      .toLowerCase()
      .split(" ")
      .filter((p) => p.length > 3); // ignoramos palabras cortas: "el", "de", "con", "que"

    // 4️⃣ Construimos los filtros para cada palabra
    const filtros = palabras
      .map(
        (p) =>
          `pregunta.ilike.%${p}%,solucion.ilike.%${p}%,categoria.ilike.%${p}%`,
      )
      .join(",");

    // 5️⃣ Buscamos en tu knowledge base con los filtros mejorados
    const { data: resultados } = await supabase
      .from("knowledge")
      .select("pregunta, solucion, categoria")
      .or(filtros)
      .limit(5);
console.log("Palabras buscadas:", palabras);
console.log("Filtros:", filtros);
console.log("Resultados Supabase:", JSON.stringify(resultados));
    // 6️⃣ Convertimos los resultados en contexto para la IA
    const contexto = resultados?.length
      ? resultados
          .map(
            (k) =>
              `Categoría: ${k.categoria}\nPregunta: ${k.pregunta}\nSolución: ${k.solucion}`,
          )
          .join("\n\n---\n\n")
      : "No hay soluciones relacionadas en la base de datos.";

    // 7️⃣ Llamamos a Groq
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
              content: `Eres un asistente técnico de TI para KnowledgeTI.
Responde SOLO basándote en las soluciones de la base de conocimiento proporcionada.
Si la solución está en la base de datos úsala directamente.
Si no hay información suficiente dilo claramente.
Responde en español de forma clara y paso a paso si es necesario.`,
            },
            {
              role: "user",
              content: `Base de conocimiento:\n\n${contexto}\n\nPregunta: ${pregunta}`,
            },
          ],
        }),
      },
    );

    const data = await response.json();
    console.log("Respuesta de Groq:", JSON.stringify(data));

    // 8️⃣ Extraemos el texto de la respuesta
    const respuesta = data.choices[0].message.content;

    // 9️⃣ Devolvemos la respuesta al frontend
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
