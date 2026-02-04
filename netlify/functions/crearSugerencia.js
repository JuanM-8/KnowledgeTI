import { createClient } from "@supabase/supabase-js";

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 👈 clave

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variables de entorno faltantes");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = event.body ? JSON.parse(event.body) : {};
    const { pregunta, respuesta } = body;

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

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, data }),
    };
  } catch (err) {
    console.error("ERROR REAL:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
