import { useState, useRef } from "react";
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
            if (event.type === "done") setStatus("✅ Done!");
          } catch {}
        }
      }
    } catch (err) {
      setError("Generation failed. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const saveToDoc = async () => {
    if (!copy) return;
    setSaving(true);
    try {
      const res = await fetch("/api/save-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: copy, keyword, outputType, research }),
      });
      const data = await res.json();
      if (data.docUrl) setDocUrl(data.docUrl);
      else setError("Failed to save doc: " + (data.error || "unknown error"));
    } catch {
      setError("Failed to connect to Google Docs.");
    } finally {
      setSaving(false);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Liberty In a Can — SEO Agent</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #080808;
          color: #e8e2d6;
          font-family: 'Source Sans 3', sans-serif;
          min-height: 100vh;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        ::selection { background: rgba(200, 168, 75, 0.3); }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        .btn-gold {
          background: linear-gradient(135deg, #c8a84b, #9a7530);
          border: none;
          color: #fff;
          padding: 13px 28px;
          border-radius: 3px;
          cursor: pointer;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          transition: opacity 0.2s;
          width: 100%;
        }
        .btn-gold:hover:not(:disabled) { opacity: 0.88; }
        .btn-gold:disabled { background: #222; color: #444; cursor: not-allowed; }

        .btn-ghost {
          background: none;
          border: 1px solid #2a2a2a;
          color: #666;
          padding: 8px 16px;
          border-radius: 3px;
          cursor: pointer;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          transition: all 0.15s;
        }
        .btn-ghost:hover { border-color: #c8a84b; color: #c8a84b; }

        .input-base {
          width: 100%;
          background: #0f0f0f;
          border: 1px solid #222;
          color: #e8e2d6;
          border-radius: 3px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus { border-color: #c8a84b; }
        .input-base::placeholder { color: #444; }

        .label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 8px;
          display: block;
        }

        .type-btn {
          background: none;
          border: 1px solid #1e1e1e;
          color: #666;
          padding: 11px 14px;
          border-radius: 3px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Source Sans 3', sans-serif;
        }
        .type-btn:hover { border-color: #333; color: #999; }
        .type-btn.active { background: #130f08; border-color: #c8a84b; color: #c8a84b; }

        .research-box {
          background: #0c0c0c;
          border: 1px solid #1e1e1e;
          border-left: 2px solid #c8a84b;
          padding: 20px 24px;
          border-radius: 3px;
          font-size: 13px;
          line-height: 1.7;
          color: #888;
          white-space: pre-wrap;
          animation: fadeIn 0.4s ease;
          margin-bottom: 20px;
        }

        .copy-box {
          background: #0c0c0c;
          border: 1px solid #1e1e1e;
          padding: 28px 32px;
          border-radius: 3px;
          font-size: 15px;
          line-height: 1.85;
          color: #e0dbd0;
          white-space: pre-wrap;
          font-family: 'Source Sans 3', sans-serif;
          animation: fadeIn 0.5s ease;
        }

        .copy-box h1, .copy-box h2, .copy-box h3 {
          font-family: 'Playfair Display', serif;
          color: #f5f0e8;
          margin: 20px 0 10px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #111;
          border: 1px solid #222;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          color: #c8a84b;
          animation: pulse 1.5s ease infinite;
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* Sidebar */}
        <div style={{
          width: 320,
          background: "#0a0a0a",
          borderRight: "1px solid #161616",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{
            padding: "28px 24px 24px",
            borderBottom: "1px solid #161616",
          }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              fontWeight: 900,
              color: "#c8a84b",
              letterSpacing: 1,
            }}>
              LIBERTY IN A CAN
            </div>
            <div style={{
              fontSize: 10,
              letterSpacing: 3,
              color: "#444",
              textTransform: "uppercase",
              marginTop: 3,
            }}>
              SEO Copywriter Agent
            </div>
          </div>

          <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" }}>

            {/* Content Type */}
            <div>
              <span className="label">Content Type</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {OUTPUT_TYPES.map(t => (
                  <button
                    key={t.id}
                    className={`type-btn ${outputType === t.id ? "active" : ""}`}
                    onClick={() => setOutputType(t.id)}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Keyword */}
            <div>
              <span className="label">Primary Keyword</span>
              <input
                className="input-base"
                style={{ padding: "10px 12px" }}
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && generate()}
                placeholder="e.g. THC seltzer Florida"
              />
            </div>

            {/* Notes */}
            <div>
              <span className="label">Context <span style={{ color: "#333" }}>/ Optional</span></span>
              <textarea
                className="input-base"
                style={{ padding: "10px 12px", minHeight: 80, resize: "vertical" }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Target audience, tone direction, product focus, campaign context..."
              />
            </div>

            {/* Style Notes toggle */}
            <div>
              <button className="btn-ghost" onClick={() => setShowStyle(!showStyle)} style={{ width: "100%" }}>
                {showStyle ? "▲" : "▼"} Style Training Notes
              </button>
              {showStyle && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    className="input-base"
                    style={{ padding: "10px 12px", minHeight: 100, resize: "vertical", fontSize: 12 }}
                    value={styleNotes}
                    onChange={e => setStyleNotes(e.target.value)}
                    placeholder={`Paste in brand examples, word preferences, style rules...\n\nExamples:\n- Never use "marijuana"\n- Always say "lift" not "high"\n- Mention no hangover when possible`}
                  />
                  <div style={{ fontSize: 10, color: "#444", marginTop: 6, letterSpacing: 0.5 }}>
                    These notes are added to every generation. Update anytime to refine the agent's voice.
                  </div>
                </div>
              )}
            </div>

            {/* Generate */}
            <button className="btn-gold" onClick={generate} disabled={loading}>
              {loading ? "Working..." : "Generate Copy"}
            </button>

            {error && (
              <div style={{ fontSize: 12, color: "#e05c4a", lineHeight: 1.5 }}>{error}</div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Top bar */}
          <div style={{
            padding: "16px 32px",
            borderBottom: "1px solid #161616",
            background: "#09090a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 57,
          }}>
            <div style={{ fontSize: 11, color: "#444", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Output
              {keyword && !loading && copy && (
                <span style={{ color: "#c8a84b", marginLeft: 12 }}>— {keyword}</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {loading && status && (
                <div className="status-pill">
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c8a84b" }} />
                  {status}
                </div>
              )}
              {copy && !loading && (
                <>
                  <button className="btn-ghost" onClick={copyText}>
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={saveToDoc}
                    disabled={saving}
                    style={{ borderColor: saving ? "#222" : "#2a2a2a" }}
                  >
                    {saving ? "Saving..." : "→ Google Doc"}
                  </button>
                </>
              )}
              {docUrl && (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 11,
                    color: "#4a9a4a",
                    textDecoration: "none",
                    border: "1px solid #2a4a2a",
                    padding: "8px 14px",
                    borderRadius: 3,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  ✓ Open Doc ↗
                </a>
              )}
            </div>
          </div>

          {/* Output area */}
          <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>

            {!copy && !loading && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "60vh",
                gap: 16,
                opacity: 0.2,
              }}>
                <div style={{ fontSize: 64 }}>🗽</div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20,
                  color: "#c8a84b",
                }}>
                  America's social alternative to alcohol.
                </div>
                <div style={{ fontSize: 13, color: "#888", letterSpacing: 1 }}>
                  Choose a type, enter a keyword, generate.
                </div>
              </div>
            )}

            {loading && !copy && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "50vh",
                gap: 20,
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  border: "2px solid #1a1a1a",
                  borderTop: "2px solid #c8a84b",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                <div style={{ fontSize: 13, color: "#555", letterSpacing: 1 }}>{status}</div>
              </div>
            )}

            {research && (
              <div>
                <div className="label" style={{ marginBottom: 10 }}>SEO Research Brief</div>
                <div className="research-box">{research}</div>
              </div>
            )}

            {copy && (
              <div>
                <div className="label" style={{ marginBottom: 10 }}>
                  Generated Copy — {OUTPUT_TYPES.find(t => t.id === outputType)?.label}
                </div>
                <div className="copy-box">{copy}</div>
                <div style={{
                  marginTop: 12,
                  fontSize: 11,
                  color: "#444",
                  display: "flex",
                  gap: 20,
                }}>
                  <span>{copy.split(" ").length} words</span>
                  <span>{copy.length} characters</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
