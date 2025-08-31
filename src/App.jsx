// src/App.jsx
import { useState } from "react";
import { summarize } from "./lib/api";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSimplify() {
    setLoading(true);
    setError("");
    setOutputText("");
    try {
      // send to serverless function
      const { summary } = await summarize(inputText);
      setOutputText(summary);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ... your header ... */}

      <main className="container">
        <section className="twoCol">
          {/* LEFT: INPUT */}
          <div className="card inputCard">
            <div className="cardHead">
              <h2>Policy · Press Release</h2>
              <span className="hint">{inputText.length} chars</span>
            </div>

            <textarea
              className="textarea"
              placeholder="Paste the policy text here…"
              rows={14}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <div className="row gap">
              <button className="btn primary" onClick={onSimplify} disabled={loading || !inputText.trim()}>
                {loading ? "Summarizing…" : "Simplify"}
              </button>
              <button className="btn" onClick={() => { setInputText(""); setOutputText(""); setError(""); }}>
                Clear
              </button>
            </div>

            {error && <p className="error">{error}</p>}
          </div>

          {/* RIGHT: OUTPUT */}
          <div className="card outputCard">
            <div className="cardHead">
              <h2>Results</h2>
            </div>
            <pre className="output">{outputText || (loading ? "…" : "—")}</pre>
          </div>
        </section>
      </main>
    </>
  );
}