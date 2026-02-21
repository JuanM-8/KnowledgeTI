import { createClient } from "@supabase/supabase-js";

export async function handler(event) {
  // Esto permite que el frontend pueda llamar a esta función
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Cuando el navegador "pre-chequea" la conexión, respondemos OK
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers };

  try {
    // 1️⃣ Leemos la pregunta que mandó el usuario desde el frontend
    const { pregunta } = JSON.parse(event.body);

    // 2️⃣ Conectamos a Supabase (igual que en tus otras funciones)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 3️⃣ Buscamos en tu tabla "knowledge" registros que coincidan
    // ilike = búsqueda sin importar mayúsculas/minúsculas
    // % % = "contiene esta palabra en cualquier parte"
    const { data: resultados } = await supabase
      .from("knowledge")
      .select("pregunta, solucion, categoria")
      .or(`pregunta.ilike.%${pregunta}%,solucion.ilike.%${pregunta}%`)
      .limit(5);

    // 4️⃣ Convertimos los resultados en un texto que Claude pueda leer
    // Esto se llama "contexto" - es la información que le damos a la IA
    const contexto = resultados?.length
      ? resultados
          .map(
            (k) =>
              `Categoría: ${k.categoria}\nPregunta: ${k.pregunta}\nSolución: ${k.solucion}`,
          )
          .join("\n\n---\n\n")
      : "No hay soluciones relacionadas en la base de datos.";

    // 5️⃣ Llamamos a la API de Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY, // clave secreta, nunca en el frontend
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // modelo más rápido y económico
        max_tokens: 1024,
        // El "system" es como las instrucciones que le das al asistente
        system: `Eres un asistente técnico de TI para KnowledgeTI.
Responde SOLO basándote en las soluciones de la base de conocimiento.
Si la solución está en la base de datos, úsala directamente.
Si no hay información suficiente, dilo claramente.
Responde en español, de forma clara y paso a paso si es necesario.`,
        messages: [
          {
            role: "user",
            // Le pasamos el contexto + la pregunta original
            content: `Base de conocimiento:\n\n${contexto}\n\n---\n\nPregunta: ${pregunta}`,
          },
        ],
      }),
    });

    const data = await response.json();

    console.log("Respuesta de Claude:", JSON.stringify(data));
    // 6️⃣ Devolvemos la respuesta al frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        respuesta: data.content[0].text,
        fuentes: resultados, // también mandamos qué registros usó
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}

// ¿Qué aprendiste aquí?**
// - El patrón es siempre el mismo: recibir datos → procesar → devolver respuesta
// - El **system prompt** es cómo "entrenas" el comportamiento de la IA
// - El **contexto** es la técnica clave: en vez de entrenar un modelo desde cero, simplemente le pasas la información relevante en cada llamada
