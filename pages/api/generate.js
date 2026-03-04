import Anthropic from "@anthropic-ai/sdk";
import { BRAND_VOICE, OUTPUT_TYPES } from "../../lib/brand";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { keyword, outputType, notes, styleNotes } = req.body;
  if (!keyword) return res.status(400).json({ error: "Keyword is required" });
  const typeConfig = OUTPUT_TYPES.find((t) => t.id === outputType);
  if (!typeConfig) return res.status(400).json({ error: "Invalid output type" });
  const extraStyle = styleNotes ? `\n\nADDITIONAL STYLE NOTES:\n${styleNotes}` : "";
  const systemPrompt = BRAND_VOICE + extraStyle;
  try {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    const sendEvent = (type, data) => res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    sendEvent("status", { message: "Researching keyword data..." });
    const researchResponse = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: "You are an SEO research specialist. Search for data about the provided keyword and return a concise research brief: search intent, related keywords, competitor angles, content gaps. Focus on hemp THC beverages and alcohol alternatives.",
      messages: [{ role: "user", content: `Research SEO landscape for: "${keyword}". Find competitor content, search intent, related keywords. Return a brief research summary.` }],
    });
    const researchText = researchResponse.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    sendEvent("status", { message: "Writing your copy..." });
    sendEvent("research", { content: researchText });
    const writePrompt = `${typeConfig.prompt(keyword, notes)}\n\n---\nSEO RESEARCH BRIEF:\n${researchText}\n\nUse research to include related keywords and address search intent.`;
    const writeResponse = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: writePrompt }],
    });
    const copyText = writeResponse.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    sendEvent("copy", { content: copyText });
    sendEvent("done", { keyword, outputType });
    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Generation failed", detail: err.message });
  }
}
