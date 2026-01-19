import { createClient } from "@supabase/supabase-js";

export async function handler(event) {
  // Permitir OPTIONS para CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Verificar variables de entorno
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.error("Faltan variables de entorno");
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Configuración incorrecta del servidor",
        }),
      };
    }

    const supabase = createClient(
      process.env.SUBASE_URL,
      process.env.SUPABASE_KEY,
    );

    const { pregunta, respuesta } = JSON.parse(event.body);

    if (!pregunta || !respuesta) {
      return {
        statusCode: 400,
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
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ ok: true, data }),
    };
  } catch (err) {
    console.error("Error general:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
