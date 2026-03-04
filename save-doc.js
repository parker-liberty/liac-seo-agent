import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { content, keyword, outputType, research } = req.body;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/drive",
      ],
    });

    const docs = google.docs({ version: "v1", auth });
    const drive = google.drive({ version: "v3", auth });

    const date = new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });

    const docTitle = `LIAC SEO | ${outputType.toUpperCase()} | ${keyword} | ${date}`;

    // Create the doc
    const createRes = await docs.documents.create({
      requestBody: { title: docTitle },
    });

    const docId = createRes.data.documentId;

    // Move to shared folder if configured
    if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
      await drive.files.update({
        fileId: docId,
        addParents: process.env.GOOGLE_DRIVE_FOLDER_ID,
        fields: "id, parents",
      });
    }

    // Build document content
    const fullContent = [
      `LIBERTY IN A CAN — SEO COPY`,
      ``,
      `Type: ${outputType}`,
      `Keyword: ${keyword}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `COPY`,
      ``,
      content,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `SEO RESEARCH BRIEF`,
      ``,
      research || "No research data available.",
    ].join("\n");

    // Insert text into doc
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: fullContent,
            },
          },
        ],
      },
    });

    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

    res.json({ success: true, docUrl, docId, docTitle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Google Doc", detail: err.message });
  }
}
