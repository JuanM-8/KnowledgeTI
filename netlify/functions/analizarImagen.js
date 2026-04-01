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

    // ── 1. Detectar tipo de imagen desde los primeros bytes del base64 ─────
    const primerosBytesHex = Buffer.from(imagen.slice(0, 8), "base64").toString(
      "hex",
    );
    let mediaType = "image/jpeg";
    if (primerosBytesHex.startsWith("89504e47")) mediaType = "image/png";
    else if (primerosBytesHex.startsWith("52494646")) mediaType = "image/webp";
    else if (primerosBytesHex.startsWith("47494638")) mediaType = "image/gif";

    // ── 2. Primera llamada a Groq Vision: leer el error de la imagen ───────
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
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mediaType};base64,${imagen}`,
                  },
                },
                {
                  type: "text",
                  text: `Analiza esta captura de pantalla de un error informático.
Extrae la siguiente información:
1. El texto exacto del mensaje de error (si lo hay)
2. El código de error (si lo hay, ej: 0x000000, Error 404, etc.)
3. El programa o sistema donde ocurre
4. En una sola frase: describe el tipo de problema técnico

Responde SOLO en este formato JSON exacto, sin texto adicional ni backticks:
{
  "textoError": "el texto del mensaje de error o no visible",
  "codigoError": "código de error o ninguno",
  "programa": "nombre del programa o sistema o no identificado",
  "descripcion": "descripción en una frase del problema"
}`,
                },
              ],
            },
          ],
        }),
      },
    );

    const lecturaData = await lecturaRes.json();

    // ── 3. Parsear la respuesta JSON de Groq ───────────────────────────────
    let infoError = {
      textoError: "no visible",
      codigoError: "ninguno",
      programa: "no identificado",
      descripcion: "Error no identificado",
    };

    try {
      const textoRespuesta = lecturaData.choices[0].message.content.trim();
      const jsonMatch = textoRespuesta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        infoError = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.log("No se pudo parsear JSON del primer paso, usando defaults");
    }

    // ── 4. Buscar en Supabase errores similares ────────────────────────────
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const terminosBusqueda = [
      infoError.textoError,
      infoError.codigoError,
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
          p !== "visible" &&
          p !== "ninguno" &&
          p !== "identificado",
      );

    const palabrasClave = [...new Set(terminosBusqueda)].slice(0, 5);

    let fuentes = [];
    if (palabrasClave.length > 0) {
      const filtros = palabrasClave
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

    // ── 5. Construir contexto de la base de conocimiento ──────────────────
    const contextoKB =
      fuentes.length > 0
        ? fuentes
            .map(
              (k) =>
                `Categoría: ${k.categoria}\nProblema: ${k.problema}\nSolución: ${k.solucion}`,
            )
            .join("\n\n---\n\n")
        : "No se encontraron casos similares en la base de conocimiento.";

    // ── 6. Segunda llamada a Groq Vision: generar la solución ─────────────
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
          max_tokens: 800,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mediaType};base64,${imagen}`,
                  },
                },
                {
                  type: "text",
                  text: `Eres un experto en soporte técnico de TI. El usuario tiene este error:

INFORMACIÓN DETECTADA EN LA IMAGEN:
- Mensaje de error: ${infoError.textoError}
- Código de error: ${infoError.codigoError}
- Programa/Sistema: ${infoError.programa}
- Descripción: ${infoError.descripcion}

${contexto ? `CONTEXTO ADICIONAL DEL USUARIO:\n${contexto}\n` : ""}

BASE DE CONOCIMIENTO INTERNA (casos similares resueltos anteriormente):
${contextoKB}

INSTRUCCIONES:
- Si hay casos similares en la base de conocimiento, úsalos como guía principal.
- Da una solución clara, paso a paso, en español.
- Sé directo y práctico, el usuario necesita resolver esto ahora.
- Si el error es crítico o requiere especialista, indícalo.
- Máximo 5 pasos claros y concisos.

Responde SOLO la solución paso a paso, sin repetir el error ni agregar introducciones largas.`,
                },
              ],
            },
          ],
        }),
      },
    );

    const solucionData = await solucionRes.json();
    const solucion = solucionData.choices[0].message.content;


    // ── 8. Responder al frontend ───────────────────────────────────────────
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        solucion,
        errorIdentificado:
          infoError.descripcion !== "Error no identificado"
            ? infoError.descripcion
            : `${infoError.programa} — ${infoError.textoError}`,
        categoria,
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
