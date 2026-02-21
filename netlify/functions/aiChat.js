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
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3️⃣ Buscamos en tu knowledge base
    const { data: resultados } = await supabase
      .from("knowledge")
      .select("pregunta, solucion, categoria")
      .or(`pregunta.ilike.%${pregunta}%,solucion.ilike.%${pregunta}%`)
      .limit(5);

    // 4️⃣ Convertimos los resultados en contexto para la IA
    const contexto = resultados?.length
      ? resultados
          .map(
            (k) =>
              `Categoría: ${k.categoria}\nPregunta: ${k.pregunta}\nSolución: ${k.solucion}`
          )
          .join("\n\n---\n\n")
      : "No hay soluciones relacionadas en la base de datos.";

    // 5️⃣ Llamamos a Gemini (gratis)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Eres un asistente técnico de TI para KnowledgeTI.
Responde SOLO basándote en las soluciones de la base de conocimiento proporcionada.
Si la solución está en la base de datos úsala directamente.
Si no hay información suficiente dilo claramente.
Responde en español de forma clara y paso a paso si es necesario.

Base de conocimiento:
${contexto}

Pregunta: ${pregunta}`,
                },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();
    console.log("Respuesta de Gemini:", JSON.stringify(data));

    // 6️⃣ Extraemos el texto de la respuesta
    const respuesta = data.candidates[0].content.parts[0].text;

    // 7️⃣ Devolvemos la respuesta al frontend
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
