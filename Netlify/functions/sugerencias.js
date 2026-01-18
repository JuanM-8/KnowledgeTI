import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { pregunta, respuesta } = JSON.parse(event.body);

  if (!pregunta || !respuesta) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Datos incompletos" }),
    };
  }

  const { error } = await supabase
    .from("sugerencias")
    .insert([{ pregunta, respuesta }]);

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
}
