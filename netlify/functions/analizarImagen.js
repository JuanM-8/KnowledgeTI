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

    // ── 2. Groq lee la imagen y extrae todo lo relevante ───────────────────
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
              role: "system",
              content: `Eres un técnico de soporte TI experto en leer capturas de pantalla.
Tu trabajo es analizar imágenes de errores o problemas informáticos y extraer
TODA la información relevante que ayude a identificar y solucionar el problema.
Debes leer TODO el texto visible: mensajes de error, nombres de usuario,
nombres de aplicaciones, códigos, URLs, versiones de sistema operativo, etc.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mediaType};base64,${imagen}` },
                },
                {
                  type: "text",
                  text: `Analiza esta imagen en detalle. Lee TODO el texto visible con atención especial a:
- Nombres de usuario que aparezcan en pantalla
- Nombres de aplicaciones o programas
- Mensajes de error exactos
- Sistema operativo visible

Responde SOLO este JSON sin texto extra ni backticks:
{
  "descripcionCompleta": "describe lo mas relevante que está pasando en la imagen",
  "textoVisible": "transcribe literalmente TODO el texto que puedas leer",
  "elementosClave": "los elementos más importantes: usuario exacto, app, error, sistema",
  "palabrasClave": "TODAS las palabras clave separadas por coma incluyendo nombres de usuario, apps y errores exactos"
}`,
                },
              ],
            },
          ],
        }),
      },
    );

    const lecturaData = await lecturaRes.json();

    // ── 3. Parsear respuesta de lectura ────────────────────────────────────
    let infoError = {
      descripcionCompleta: "error en pantalla",
      textoVisible: "",
      elementosClave: "",
      palabrasClave: "",
    };

    try {
      const texto = lecturaData.choices[0].message.content.trim();
      const match = texto.match(/\{[\s\S]*\}/);
      if (match) infoError = JSON.parse(match[0]);
    } catch {
      console.log(
        "No se pudo parsear JSON del paso de lectura, usando defaults",
      );
    }

    // ── 4. Buscar casos similares en Supabase ──────────────────────────────
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const stopWords = new Set([
      "your",
      "apps",
      "this",
      "with",
      "that",
      "from",
      "have",
      "cannot",
      "please",
      "available",
      "time",
      "again",
      "contact",
      "information",
      "para",
      "como",
      "esto",
      "esta",
      "pero",
      "cuando",
      "donde",
      "error",
      "the",
      "and",
      "not",
      "are",
      "logged",
      "field",
      "password",
      "reset",
    ]);

    const todosLosTerminos = [
      infoError.palabrasClave,
      infoError.elementosClave,
      infoError.textoVisible,
      contexto || "",
    ]
      .join(" ")
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((p) => p.length > 2 && !stopWords.has(p)); // <- bajé de 3 a 2 caracteres

    const palabrasClave = [...new Set(todosLosTerminos)].slice(0, 10); // <- subí a 10

    let fuentes = [];
    if (palabrasClave.length > 0) {
      // Busca cada palabra individualmente en problema Y solucion Y categoria
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

    console.log("Palabras buscadas:", palabrasClave);
    console.log("Resultados encontrados:", fuentes.length);
    // ── 5. Construir contexto de la base de conocimiento ──────────────────
    const contextoKB =
      fuentes.length > 0
        ? fuentes
            .map((k) => `Problema: ${k.problema}\nSolución: ${k.solucion}`)
            .join("\n\n---\n\n")
        : "No hay casos registrados en la base de conocimiento para este problema.";

    // ── 6. Groq genera la solución basada solo en Supabase ─────────────────
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
          max_tokens: 300,
          messages: [
            {
              role: "system",
              content: `Eres soporte técnico interno de una empresa.
REGLA 1: Solo puedes responder con información de la BASE DE CONOCIMIENTO que te dan.
REGLA 2: Si la base de conocimiento no tiene la solución exacta, responde SOLO esto: "No hay solución registrada para este caso. Contacta al administrador."
REGLA 3: Prohibido inventar, prohibido dar pasos genéricos, prohibido mencionar internet.
REGLA 4: Si encuentras la solución, respóndela en máximo 3 líneas.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mediaType};base64,${imagen}` },
                },
                {
                  type: "text",
                  text: `LO QUE SE VE EN LA IMAGEN:
${infoError.descripcionCompleta}

TEXTO VISIBLE EN LA IMAGEN:
${infoError.textoVisible}

ELEMENTOS CLAVE:
${infoError.elementosClave}
${contexto ? `\nCONTEXTO ADICIONAL DEL USUARIO: ${contexto}` : ""}

BASE DE CONOCIMIENTO INTERNA:
${contextoKB}

¿Hay solución en la base de conocimiento para este caso? Si sí, dala. Si no, di que no hay.`,
                },
              ],
            },
          ],
        }),
      },
    );

    const solucionData = await solucionRes.json();
    const solucion = solucionData.choices[0].message.content;

    // ── 7. Responder al frontend ───────────────────────────────────────────
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        solucion,
        errorIdentificado: infoError.descripcionCompleta,
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
