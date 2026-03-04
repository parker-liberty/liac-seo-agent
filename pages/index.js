import { useState } from "react";
import Head from "next/head";
import { OUTPUT_TYPES } from "../lib/brand";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [notes, setNotes] = useState("");
  const [outputType, setOutputType] = useState("blog");
  const [styleNotes, setStyleNotes] = useState("");
  const [showStyle, setShowStyle] = useState(false);
  const [status, setStatus] = useState("");
  const [research, setResearch] = useState("");
  const [copy, setCopy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [docUrl, setDocUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!keyword.trim()) { setError("Enter a keyword first."); return; }
    setError(""); setResearch(""); setCopy(""); setDocUrl("");
    setLoading(true); setStatus("Starting...");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, outputType, notes, styleNotes }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const event = JSON.parse(line.slice(5).trim());
            if (event.type === "status") setStatus(event.message);
            if (event.type === "research") setResearch(event.content);
            if (event.type === "copy") setCopy(event.content);
            if (event.type === "done") setStatus("Done!");
          } catch {}
        }
      }
    } catch (err) { setError("Generation failed."); }
    finally { setLoading(false); }
  };

  const saveToDoc = async () => {
    if (!copy) return;
    setSaving(true);
    try {
      const res = await fetch("/api/save-doc", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: copy, keyword, outputType, research }),
      });
      const data = await res.json();
      if (data.docUrl) setDocUrl(data.docUrl);
    } catch { setError("Failed to connect to Google Docs."); }
    finally { setSaving(false); }
  };

  const copyText = () => { navigator.clipboard.writeText(copy); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <>
      <Head><title>Liberty In a Can - SEO Agent</title></Head>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: #080808; color: #e8e2d6; font-family: Georgia, serif; min-height: 100vh; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div style={{ width: 320, background: "#0a0a0a", borderRight: "1px solid #161616", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid #161616" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#c8a84b", letterSpacing: 1 }}>LIBERTY IN A CAN</div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", textTransform: "uppercase", marginTop: 3 }}>SEO Copywriter Agent</div>
          </div>
          <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Content Type</div>
              {OUTPUT_TYPES.map(t => (
                <button key={t.id} onClick={() => setOutputType(t.id)} style={{ background: outputType === t.id ? "#130f08" : "none", border: `1px solid ${outputType === t.id ? "#c8a84b" : "#1e1e1e"}`, color: outputType === t.id ? "#c8a84b" : "#666", padding: "10px 14px", borderRadius: 3, cursor: "pointer", textAlign: "left", width: "100%", marginBottom: 6, display: "flex", alignItems: "center", gap: 10, fontFamily: "sans-serif" }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div><div style={{ fontSize: 11, opacity: 0.6 }}>{t.desc}</div></div>
                </button>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Primary Keyword</div>
              <input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()} placeholder="e.g. THC seltzer Florida" style={{ width: "100%", padding: "10px 12px", background: "#0f0f0f", border: "1px solid #222", color: "#e8e2d6", borderRadius: 3, fontFamily: "sans-serif", fontSize: 14, outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Context (optional)</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Target audience, tone, campaign context..." style={{ width: "100%", minHeight: 80, padding: "10px 12px", background: "#0f0f0f", border: "1px solid #222", color: "#e8e2d6", borderRadius: 3, fontFamily: "sans-serif", fontSize: 12, resize: "vertical", outline: "none" }} />
            </div>
            <div>
              <button onClick={() => setShowStyle(!showStyle)} style={{ background: "none", border: "1px solid #2a2a2a", color: "#666", padding: "8px 16px", borderRadius: 3, cursor: "pointer", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif", width: "100%" }}>{showStyle ? "Hide" : "Style Training Notes"}</button>
              {showStyle && <textarea value={styleNotes} onChange={e => setStyleNotes(e.target.value)} placeholder="Paste brand examples, word preferences..." style={{ width: "100%", minHeight: 100, padding: "10px 12px", background: "#0f0f0f", border: "1px solid #222", color: "#e8e2d6", borderRadius: 3, fontFamily: "monospace", fontSize: 12, resize: "vertical", marginTop: 8, outline: "none" }} />}
            </div>
            <button onClick={generate} disabled={loading} style={{ background: loading ? "#222" : "linear-gradient(135deg, #c8a84b, #9a7530)", border: "none", color: loading ? "#444" : "#fff", padding: "13px 28px", borderRadius: 3, cursor: loading ? "not-allowed" : "pointer", fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>{loading ? "Working..." : "Generate Copy"}</button>
            {error && <div style={{ fontSize: 12, color: "#e05c4a", fontFamily: "sans-serif" }}>{error}</div>}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 32px", borderBottom: "1px solid #161616", background: "#09090a", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 57 }}>
            <div style={{ fontSize: 11, color: "#444", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif" }}>Output {keyword && copy && <span style={{ color: "#c8a84b" }}>— {keyword}</span>}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {loading && <div style={{ fontSize: 12, color: "#c8a84b", fontFamily: "sans-serif" }}>{status}</div>}
              {copy && !loading && <>
                <button onClick={copyText} style={{ background: "none", border: "1px solid #333", color: "#666", padding: "6px 12px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontFamily: "sans-serif" }}>{copied ? "Copied" : "Copy"}</button>
                <button onClick={saveToDoc} disabled={saving} style={{ background: "none", border: "1px solid #333", color: "#666", padding: "6px 12px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontFamily: "sans-serif" }}>{saving ? "Saving..." : "Save to Google Doc"}</button>
              </>}
              {docUrl && <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#4a9a4a", textDecoration: "none", border: "1px solid #2a4a2a", padding: "6px 12px", borderRadius: 3, fontFamily: "sans-serif" }}>Open Doc</a>}
            </div>
          </div>
          <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
            {!copy && !loading && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16, opacity: 0.2 }}><div style={{ fontSize: 64 }}>🗽</div><div style={{ fontSize: 18, color: "#c8a84b" }}>Americas social alternative to alcohol.</div></div>}
            {loading && !copy && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", gap: 20 }}><div style={{ width: 40, height: 40, border: "2px solid #1a1a1a", borderTop: "2px solid #c8a84b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><div style={{ fontSize: 13, color: "#555", fontFamily: "sans-serif" }}>{status}</div></div>}
            {research && <div style={{ background: "#0c0c0c", border: "1px solid #1e1e1e", borderLeft: "2px solid #c8a84b", padding: "20px 24px", borderRadius: 3, fontSize: 13, lineHeight: 1.7, color: "#888", whiteSpace: "pre-wrap", marginBottom: 20, fontFamily: "sans-serif" }}>{research}</div>}
            {copy && <div style={{ background: "#0c0c0c", border: "1px solid #1e1e1e", padding: "28px 32px", borderRadius: 3, fontSize: 15, lineHeight: 1.85, color: "#e0dbd0", whiteSpace: "pre-wrap" }}>{copy}</div>}
          </div>
        </div>
      </div>
    </>
  );
                }
