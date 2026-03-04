import Anthropic from "@anthropic-ai/sdk";
import { BRAND_VOICE, OUTPUT_TYPES } from "../../lib/brand";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { keyword, outputType, notes, styleNotes } = req.body;

  if (!keyword) return res.status(400).json({ error: "Keyword is required" });

  const typeConfig = OUTPUT_TYPES.find((t) => t.id === outputType);
  if (!typeConfig) return res.status(400).json({ error: "Invalid output type" });

  const extraStyle = styleNotes
    ? `\n\nADDITIONAL STYLE NOTES FROM TEAM:\n${styleNotes}`
    : "";

  const systemPrompt = BRAND_VOICE + extraStyle;

  try {
    // Phase 1: SEO Research with web search
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const sendEvent = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    sendEvent("status", { message: "🔍 Researching keyword data..." });

    // Research phase
    const researchResponse = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        },
      ],
      system: `You are an SEO research specialist. Search for data about the provided keyword and return a concise research brief including: search intent, related keywords/LSI terms, competitor angles, and content gaps. Focus on hemp THC beverages, cannabis drinks, and alcohol alternatives industry. Be brief and structured.`,
      messages: [
        {
          role: "user",
          content: `Research the SEO landscape for this keyword: "${keyword}". Search for: competitor content, search intent, related keywords, and what top-ranking content covers. Return a brief research summary I can use to write better content.`,
        },
      ],
    });

    const researchText = researchResponse.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    sendEvent("status", { message: "✍️ Writing your copy..." });
    sendEvent("research", { content: researchText });

    // Phase 2: Write the copy using research
    const writePrompt = `${typeConfig.prompt(keyword, notes)}

---
SEO RESEARCH BRIEF (use this to inform your writing):
${researchText}

Use the research to:
- Naturally include 2-3 of the strongest related keywords
- Address the most common search intent
- Fill any content gaps competitors miss
- Make the content stand out`;

    const writeResponse = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: writePrompt }],
    });

    const copyText = writeResponse.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    sendEvent("copy", { content: copyText });
    sendEvent("done", { keyword, outputType });

    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Generation failed", detail: err.message });
    }
  }
}
