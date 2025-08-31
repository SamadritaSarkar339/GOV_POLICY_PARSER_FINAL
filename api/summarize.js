// api/summarize.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

// Optional: tiny CORS for local dev with Vite
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Vercel sometimes gives body as string; normalize it
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { text } = body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing 'text' (string)" });
    }

    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: `Summarize this government policy/press release for citizens.
Return: a title, 5 concise bullets, any eligibility, and action steps.

TEXT:
${text}`,
    });

    const summary =
      resp.output_text ??
      (resp.choices?.[0]?.message?.content?.[0]?.text ?? "").toString();

    return res.status(200).json({ summary });
  } catch (err) {
    console.error("OpenAI error:", err);
    const msg = err?.response?.data?.error?.message || err?.message || "Server error";
    return res.status(500).json({ error: "Summarization failed.", details: msg });
  }
}