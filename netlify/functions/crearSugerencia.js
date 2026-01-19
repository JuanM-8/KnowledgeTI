import { createClient } from "@supabase/supabase-js";

export async function handler(event) {
  // Headers CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Manejar preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Verificar variables de entorno
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.error("Faltan variables de entorno");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Configuración del servidor incorrecta",
        }),
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
    );

    const { pregunta, respuesta } = JSON.parse(event.body);

    if (!pregunta || !respuesta) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Datos incompletos" }),
      };
    }

    const { data, error } = await supabase
      .from("sugerencias")
      .insert([{ pregunta, respuesta }]);

    if (error) {
      console.error("Error de Supabase:", error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, data }),
    };
  } catch (err) {
    console.error("Error general:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
