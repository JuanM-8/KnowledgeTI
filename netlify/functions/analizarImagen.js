import { createClient } from "@supabase/supabase-js";

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (event.httpMethod !== "POST")
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };

  try {
    const { imagen, contexto } = JSON.parse(event.body);

    if (!imagen) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No se recibió imagen" }),
      };
    }

    // ── 1. Detectar tipo de imagen ─────────────────────────────────────────
    const primerosBytesHex = Buffer.from(imagen.slice(0, 8), "base64").toString(
      "hex",
    );
    let mediaType = "image/jpeg";
    if (primerosBytesHex.startsWith("89504e47")) mediaType = "image/png";
    else if (primerosBytesHex.startsWith("52494646")) mediaType = "image/webp";
    else if (primerosBytesHex.startsWith("47494638")) mediaType = "image/gif";

    // ── 2. Groq lee el error de la imagen ─────────────────────────────────
    const lecturaRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mediaType};base64,${imagen}` },
                },
                {
                  type: "text",
                  text: `Analiza esta captura de pantalla de un error informático.
Extrae:
1. El texto exacto del mensaje de error
2. El programa o sistema donde ocurre
3. Una frase corta describiendo el problema

Responde SOLO en este JSON sin texto extra ni backticks:
{
  "textoError": "texto del error o no visible",
  "programa": "nombre del programa o no identificado",
  "descripcion": "descripción breve del problema"
}`,
                },
              ],
            },
          ],
        }),
      },
    );

    const lecturaData = await lecturaRes.json();

    // ── 3. Parsear respuesta ───────────────────────────────────────────────
    let infoError = {
      textoError: "no visible",
      programa: "no identificado",
      descripcion: "error en pantalla",
    };

    try {
      const texto = lecturaData.choices[0].message.content.trim();
      const match = texto.match(/\{[\s\S]*\}/);
      if (match) infoError = JSON.parse(match[0]);
    } catch {
      // usa defaults
    }

    // ── 4. Buscar casos similares en Supabase ──────────────────────────────
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const palabrasClave = [
      infoError.textoError,
      infoError.programa,
      infoError.descripcion,
      contexto || "",
    ]
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (p) =>
          p.length > 3 &&
          !["visible", "ninguno", "identificado", "error"].includes(p),
      );

    const unicas = [...new Set(palabrasClave)].slice(0, 5);

    let fuentes = [];
    if (unicas.length > 0) {
      const filtros = unicas
        .map(
          (p) =>
            `problema.ilike.%${p}%,solucion.ilike.%${p}%,categoria.ilike.%${p}%`,
        )
        .join(",");

      const { data } = await supabase
        .from("knowledge")
        .select("problema, solucion, categoria")
        .or(filtros)
        .limit(4);

      fuentes = data || [];
    }

    // ── 5. Construir contexto de Supabase para la IA ───────────────────────
    const contextoKB =
      fuentes.length > 0
        ? fuentes
            .map((k) => `Problema: ${k.problema}\nSolución: ${k.solucion}`)
            .join("\n\n---\n\n")
        : "No hay casos similares en la base de conocimiento.";

    // ── 6. Groq genera la solución ─────────────────────────────────────────
    const solucionRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          max_tokens: 700,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mediaType};base64,${imagen}` },
                },
                {
                  type: "text",
                  text: `Eres un asistente de soporte técnico interno de una empresa.

ERROR DETECTADO EN LA IMAGEN:
- Mensaje: ${infoError.textoError}
- Programa: ${infoError.programa}
- Descripción: ${infoError.descripcion}
${contexto ? `\nCONTEXTO DEL USUARIO:\n${contexto}` : ""}

BASE DE CONOCIMIENTO INTERNA:
${contextoKB}

REGLAS ESTRICTAS:
- Responde ÚNICAMENTE con información de la base de conocimiento interna.
- Si la base de conocimiento tiene la solución, dala paso a paso.
- Si la base de conocimiento NO tiene información relacionada, responde exactamente esto: "No encontré solución para este error en la base de conocimiento de la empresa. Consulta con el administrador del sistema."
- NUNCA inventes soluciones ni uses conocimiento externo.
- NUNCA sugieras buscar en internet.`,
                },
              ],
            },
          ],
        }),
      },
    );

    const solucionData = await solucionRes.json();
    const solucion = solucionData.choices[0].message.content;

    // ── 7. Responder ───────────────────────────────────────────────────────
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        solucion,
        errorIdentificado: infoError.descripcion,
        coincidencias: fuentes.length,
        fuentes: fuentes.map((f) => ({
          problema: f.problema,
          categoria: f.categoria,
        })),
      }),
    };
  } catch (err) {
    console.error("Error en analizarImagen:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
