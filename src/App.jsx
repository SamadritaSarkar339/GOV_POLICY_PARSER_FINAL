// src/App.jsx
import React, { useState, useMemo } from "react";
import "./App.css";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [output, setOutput] = useState({
    summary: "",
    pros: [],
    cons: [],
    eligibility: [],
    actionSteps: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // helpers
  const ensureArray = (x) => (Array.isArray(x) ? x : x ? [String(x)] : []);
  const stripListSyntax = (s) =>
    String(s || "")
      .replace(/^\s*[-*•]\s+/gm, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "");
  const extractJSON = (text) => {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("No JSON block found in model response");
  };

  const handleSimplify = async () => {
    if (!inputText.trim()) {
      setError("Please paste some text to simplify.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // ⚠️ For local testing only. Prefer hitting your backend proxy.
      const OPENAI_API_KEY =import.meta.env.VITE_OPENAI_API_KEY;
      console.log(OPENAI_API_KEY);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Return ONLY valid JSON with keys: summary (string), pros (string[]), cons (string[]), eligibility (string[]), actionSteps (string[]).",
            },
            {
              role: "user",
              content:
                `Summarize the following government policy or press release in simple language. ` +
                `Provide concrete bullet points for pros, cons, eligibility, and action steps.\n\n${inputText}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${msg}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? "{}";
      const parsed = extractJSON(content);

      setOutput({
        summary: stripListSyntax(parsed.summary),
        pros: ensureArray(parsed.pros).map(stripListSyntax),
        cons: ensureArray(parsed.cons).map(stripListSyntax),
        eligibility: ensureArray(parsed.eligibility).map(stripListSyntax),
        actionSteps: ensureArray(parsed.actionSteps).map(stripListSyntax),
      });
    } catch (e) {
      console.error(e);
      setError("Couldn’t get a structured response. Try a shorter excerpt.");
    } finally {
      setLoading(false);
    }
  };

  const hasResults = useMemo(
    () =>
      output.summary ||
      output.pros.length ||
      output.cons.length ||
      output.eligibility.length ||
      output.actionSteps.length,
    [output]
  );

  return (
    <div className="shell">
      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <span className="logo">⚖️</span>
          <div>
            <h1>AI Public Policy Simplifier</h1>
            <p className="tag">
              Paste any government document or press release → get a citizen-friendly summary.
            </p>
          </div>
        </div>

        <a
          className="ctaLink"
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          aria-label="Open source link"
        >
          View Source
        </a>
      </header>

      {/* Content area */}
      <main className="container">
        <section className="twoCol">
          {/* Left: Input */}
          <div className="card inputCard">
            <div className="cardHead">
              <h2>Policy / Press Release</h2>
              <span className="hint">{inputText.length} chars</span>
            </div>

            <textarea
              className="textarea"
              placeholder="Paste the policy text here…"
              rows={14}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <div className="actions">
              <button className="btnPrimary" onClick={handleSimplify} disabled={loading}>
                {loading ? <span className="spinner" /> : "Simplify"}
              </button>
              <button
                className="btnGhost"
                onClick={() => {
                  setInputText("");
                  setOutput({ summary: "", pros: [], cons: [], eligibility: [], actionSteps: [] });
                  setError("");
                }}
                disabled={loading}
              >
                Clear
              </button>
            </div>

            {error && <div className="toast error">{error}</div>}
            {!error && loading && (
              <div className="toast info">Working on it… extracting key points.</div>
            )}
          </div>

          {/* Right: Output */}
          <div className="card outputCard">
            {!hasResults && !loading && (
              <div className="placeholder">
                <p>Results will appear here after you click <b>Simplify</b>.</p>
              </div>
            )}

            {loading && (
              <div className="skeletonWrap">
                <div className="skeleton title" />
                <div className="skeleton line" />
                <div className="skeleton line" />
                <div className="skeleton line short" />
              </div>
            )}

            {hasResults && !loading && (
              <>
                <h2 className="sectionTitle">Simplified Summary</h2>
                <div className="summary">
                  {output.summary
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((p, i) => (
                      <p key={i}>{p.trim()}</p>
                    ))}
                </div>

                <div className="pillGrid">
                  <PillList title="Pros" items={output.pros} tone="good" />
                  <PillList title="Cons" items={output.cons} tone="warn" />
                  <PillList title="Eligibility" items={output.eligibility} tone="info" />
                  <PillList title="Action Steps" items={output.actionSteps} tone="accent" ordered />
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Built with ❤️ BY SAMADRITA SARKAR for public understanding. © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

/* ---------- small presentational component ---------- */
function PillList({ title, items = [], tone = "info", ordered = false }) {
  if (!items.length) return null;
  const ListTag = ordered ? "ol" : "ul";
  return (
    <div className={`pillCol tone-${tone}`}>
      <h3>{title}</h3>
      <ListTag>
        {items.map((t, i) => (
          <li key={`${title}-${i}`}>{t}</li>
        ))}
      </ListTag>
    </div>
  );
}