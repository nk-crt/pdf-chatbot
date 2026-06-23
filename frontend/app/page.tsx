"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [thinking, setThinking] = useState(false);
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Eye tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      setEyePos({ x: dx * 5, y: dy * 5 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blink interval
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function uploadPDF() {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("https://pdf-chatbot-production-61fb.up.railway.app/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log(data);
      setUploaded(true);
      alert("PDF Uploaded Successfully");
    } catch (err) {
      console.error(err);
      alert("Upload Failed");
    }
    setUploading(false);
  }

  async function askQuestion() {
    if (!question.trim()) return;
    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    const currentQuestion = question;
    setQuestion("");
    setThinking(true);
    try {
      const response = await fetch("https://pdf-chatbot-production-61fb.up.railway.app/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Backend Error" }]);
    }
    setThinking(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #0a0a0a;
          color: #e8e8e8;
          min-height: 100vh;
        }

        .page-bg {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(118,185,0,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 10% 80%, rgba(118,185,0,0.07) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 90% 80%, rgba(118,185,0,0.07) 0%, transparent 50%),
            #0a0a0a;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px 24px 60px;
        }

        /* Header */
        .header {
          text-align: center;
          margin-bottom: 56px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(118,185,0,0.12);
          border: 1px solid rgba(118,185,0,0.3);
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 500;
          color: #76B900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #76B900;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        .title {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: #f0f0f0;
        }
        .title span {
          background: linear-gradient(135deg, #76B900 0%, #a8e000 50%, #76B900 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle {
          margin-top: 14px;
          font-size: 16px;
          color: #666;
          font-weight: 400;
          letter-spacing: 0.01em;
        }

        /* Grid */
        .grid {
          display: grid;
          grid-template-columns: 1fr 280px 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .grid { grid-template-columns: 1fr; }
          .center-col { order: -1; }
        }

        /* Cards */
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 28px;
          backdrop-filter: blur(12px);
          transition: border-color 0.3s ease;
        }
        .card:hover {
          border-color: rgba(118,185,0,0.25);
        }
        .card-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #76B900;
          margin-bottom: 18px;
        }

        /* Upload */
        .drop-zone {
          border: 1.5px dashed rgba(118,185,0,0.3);
          border-radius: 14px;
          padding: 32px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          background: rgba(118,185,0,0.03);
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }
        .drop-zone:hover {
          border-color: rgba(118,185,0,0.6);
          background: rgba(118,185,0,0.06);
        }
        .drop-zone input[type="file"] {
          position: absolute; inset: 0;
          opacity: 0; cursor: pointer; width: 100%; height: 100%;
        }
        .drop-icon {
          width: 40px; height: 40px;
          margin: 0 auto 10px;
          background: rgba(118,185,0,0.15);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .drop-icon svg { color: #76B900; }
        .drop-text { font-size: 13px; color: #888; }
        .drop-text strong { color: #c0c0c0; }
        .file-name {
          font-size: 12px;
          color: #76B900;
          margin-top: 8px;
          padding: 6px 12px;
          background: rgba(118,185,0,0.1);
          border-radius: 8px;
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-primary {
          width: 100%;
          padding: 13px;
          background: #76B900;
          color: #000;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
        }
        .btn-primary:hover:not(:disabled) {
          background: #8ed400;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(118,185,0,0.35);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .upload-success {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #76B900;
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(118,185,0,0.08);
          border-radius: 8px;
          border: 1px solid rgba(118,185,0,0.2);
        }

        /* Character */
        .center-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding-top: 8px;
        }
        .char-wrap {
          animation: float 4s ease-in-out infinite;
          filter: drop-shadow(0 12px 32px rgba(118,185,0,0.25));
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        .char-status {
          font-size: 12px;
          color: #555;
          text-align: center;
          letter-spacing: 0.05em;
        }
        .char-status.active { color: #76B900; }

        /* Chat */
        .chat-messages {
          height: 340px;
          overflow-y: auto;
          margin-bottom: 16px;
          padding-right: 4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(118,185,0,0.3) transparent;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(118,185,0,0.3);
          border-radius: 2px;
        }
        .empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #444;
        }
        .empty-icon {
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .empty-text { font-size: 13px; color: #444; }

        .msg-row {
          display: flex;
          margin-bottom: 12px;
          animation: msg-in 0.25s ease;
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-row.user { justify-content: flex-end; }
        .msg-row.assistant { justify-content: flex-start; }
        .bubble {
          max-width: 82%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13.5px;
          line-height: 1.6;
          word-break: break-word;
        }
        .bubble.user {
          background: #76B900;
          color: #000;
          border-bottom-right-radius: 4px;
          font-weight: 500;
        }
        .bubble.assistant {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          color: #d0d0d0;
          border-bottom-left-radius: 4px;
        }
        .thinking-bubble {
          display: flex; align-items: center; gap: 5px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          border-bottom-left-radius: 4px;
        }
        .thinking-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #76B900;
          animation: thinking 1.2s ease-in-out infinite;
        }
        .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes thinking {
          0%,60%,100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        .chat-input-row {
          display: flex; gap: 10px; align-items: center;
        }
        .chat-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13.5px;
          color: #e8e8e8;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .chat-input::placeholder { color: #444; }
        .chat-input:focus {
          border-color: rgba(118,185,0,0.5);
          background: rgba(255,255,255,0.07);
        }
        .send-btn {
          width: 44px; height: 44px;
          background: #76B900;
          border: none; border-radius: 12px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .send-btn:hover { background: #8ed400; transform: scale(1.05); }
        .send-btn:active { transform: scale(0.97); }
        .send-btn svg { color: #000; }

        /* Glow line */
        .glow-line {
          width: 100%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(118,185,0,0.5), transparent);
          margin: 0 auto 48px;
        }
      `}</style>

      <div className="page-bg">
        <div className="container">

          {/* Header */}
          <div className="header">
            <div className="badge">
              <div className="badge-dot" />
              AI-Powered
            </div>
            <h1 className="title">
              Chat with your <span>PDF</span>
            </h1>
            <p className="subtitle">Upload any document and ask anything — instantly.</p>
          </div>

          <div className="glow-line" />

          {/* Main Grid */}
          <div className="grid">

            {/* Upload Card */}
            <div className="card">
              <div className="card-label">01 — Upload</div>

              <div className="drop-zone">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => { setFile(e.target.files?.[0] || null); setUploaded(false); }}
                />
                <div className="drop-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="drop-text">
                  <strong>Click to browse</strong> or drag & drop
                </div>
                <div className="drop-text" style={{ marginTop: 4, fontSize: 11 }}>PDF files only</div>
              </div>

              {file && (
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <span className="file-name">📄 {file.name}</span>
                </div>
              )}

              <button className="btn-primary" onClick={uploadPDF} disabled={uploading || !file}>
                {uploading ? "Uploading…" : "Upload PDF"}
              </button>

              {uploaded && (
                <div className="upload-success">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  PDF ready — start chatting!
                </div>
              )}

              <div style={{ marginTop: 28, padding: '16px', background: 'rgba(118,185,0,0.05)', borderRadius: 12, border: '1px solid rgba(118,185,0,0.1)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#76B900', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>How it works</div>
                {['Upload your PDF document', 'Ask any question about it', 'Get instant AI answers'].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(118,185,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#76B900', flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 12.5, color: '#777' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center Character */}
            <div className="center-col">
              <div className="char-wrap">
                <svg width="200" height="220" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    {/* Body gradient */}
                    <radialGradient id="bodyGrad" cx="40%" cy="35%" r="60%">
                      <stop offset="0%" stopColor="#8ecf00"/>
                      <stop offset="100%" stopColor="#4a7a00"/>
                    </radialGradient>
                    {/* Belly */}
                    <radialGradient id="bellyGrad" cx="50%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#1a1a1a"/>
                      <stop offset="100%" stopColor="#111"/>
                    </radialGradient>
                    {/* Glow under */}
                    <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#76B900" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#76B900" stopOpacity="0"/>
                    </radialGradient>
                    <radialGradient id="eyeGrad" cx="35%" cy="35%" r="60%">
                      <stop offset="0%" stopColor="#1e2a00"/>
                      <stop offset="100%" stopColor="#0a0a0a"/>
                    </radialGradient>
                  </defs>

                  {/* Ground glow */}
                  <ellipse cx="100" cy="208" rx="56" ry="10" fill="url(#shadowGrad)"/>

                  {/* Body */}
                  <ellipse cx="100" cy="130" rx="56" ry="62" fill="url(#bodyGrad)"/>

                  {/* Belly patch */}
                  <ellipse cx="100" cy="138" rx="32" ry="38" fill="url(#bellyGrad)" opacity="0.85"/>

                  {/* Left arm */}
                  <path d="M46 112 Q26 108 22 124 Q18 138 36 140 Q44 142 48 132" fill="#5a9a00" stroke="#3d6e00" strokeWidth="1"/>
                  {/* Right arm */}
                  <path d="M154 112 Q174 108 178 124 Q182 138 164 140 Q156 142 152 132" fill="#5a9a00" stroke="#3d6e00" strokeWidth="1"/>

                  {/* Left hand claw */}
                  <g fill="#3d6e00">
                    <ellipse cx="26" cy="124" rx="5" ry="3" transform="rotate(-30 26 124)"/>
                    <ellipse cx="21" cy="130" rx="5" ry="3" transform="rotate(-10 21 130)"/>
                    <ellipse cx="22" cy="138" rx="5" ry="3" transform="rotate(15 22 138)"/>
                  </g>
                  {/* Right hand claw */}
                  <g fill="#3d6e00">
                    <ellipse cx="174" cy="124" rx="5" ry="3" transform="rotate(30 174 124)"/>
                    <ellipse cx="179" cy="130" rx="5" ry="3" transform="rotate(10 179 130)"/>
                    <ellipse cx="178" cy="138" rx="5" ry="3" transform="rotate(-15 178 138)"/>
                  </g>

                  {/* Head */}
                  <circle cx="100" cy="80" r="46" fill="url(#bodyGrad)"/>

                  {/* Ear / crest bumps */}
                  <ellipse cx="68" cy="42" rx="9" ry="14" fill="#5a9a00" transform="rotate(-20 68 42)"/>
                  <ellipse cx="132" cy="42" rx="9" ry="14" fill="#5a9a00" transform="rotate(20 132 42)"/>

                  {/* Inner ear */}
                  <ellipse cx="68" cy="43" rx="5" ry="9" fill="#3d6e00" transform="rotate(-20 68 43)"/>
                  <ellipse cx="132" cy="43" rx="5" ry="9" fill="#3d6e00" transform="rotate(20 132 43)"/>

                  {/* Eye whites */}
                  <ellipse cx="84" cy="78" rx="14" ry="15" fill="#e8ffe0"/>
                  <ellipse cx="116" cy="78" rx="14" ry="15" fill="#e8ffe0"/>

                  {/* Pupils (follow mouse) */}
                  <circle cx={84 + eyePos.x} cy={78 + eyePos.y} r="9" fill="url(#eyeGrad)"/>
                  <circle cx={116 + eyePos.x} cy={78 + eyePos.y} r="9" fill="url(#eyeGrad)"/>

                  {/* Eye highlight */}
                  <circle cx={86 + eyePos.x} cy={75 + eyePos.y} r="3" fill="white" opacity="0.9"/>
                  <circle cx={118 + eyePos.x} cy={75 + eyePos.y} r="3" fill="white" opacity="0.9"/>

                  {/* Blink lids */}
                  {blinking && (
                    <>
                      <ellipse cx="84" cy="78" rx="14" ry="15" fill="#5a9a00"/>
                      <ellipse cx="116" cy="78" rx="14" ry="15" fill="#5a9a00"/>
                    </>
                  )}

                  {/* Nostrils */}
                  <ellipse cx="95" cy="90" rx="3" ry="2" fill="#3d6e00" opacity="0.6"/>
                  <ellipse cx="105" cy="90" rx="3" ry="2" fill="#3d6e00" opacity="0.6"/>

                  {/* Smile */}
                  {!thinking ? (
                    <path d="M88 98 Q100 108 112 98" fill="none" stroke="#3d6e00" strokeWidth="2.5" strokeLinecap="round"/>
                  ) : (
                    /* Thinking face - small o */
                    <ellipse cx="100" cy="100" rx="6" ry="7" fill="none" stroke="#3d6e00" strokeWidth="2"/>
                  )}

                  {/* Feet */}
                  <ellipse cx="82" cy="192" rx="18" ry="8" fill="#4a7a00"/>
                  <ellipse cx="118" cy="192" rx="18" ry="8" fill="#4a7a00"/>

                  {/* Toe claws */}
                  <g fill="#3d6e00">
                    <ellipse cx="68" cy="194" rx="5" ry="3" transform="rotate(-15 68 194)"/>
                    <ellipse cx="76" cy="198" rx="5" ry="3"/>
                    <ellipse cx="85" cy="199" rx="5" ry="3" transform="rotate(10 85 199)"/>
                  </g>
                  <g fill="#3d6e00">
                    <ellipse cx="108" cy="199" rx="5" ry="3" transform="rotate(-10 108 199)"/>
                    <ellipse cx="117" cy="198" rx="5" ry="3"/>
                    <ellipse cx="126" cy="194" rx="5" ry="3" transform="rotate(15 126 194)"/>
                  </g>

                  {/* NVIDIA-like logo on belly */}
                  <text x="100" y="148" textAnchor="middle" fontSize="9" fontWeight="700" fill="#76B900" fontFamily="Inter, sans-serif" letterSpacing="2" opacity="0.7">PDFIX</text>

                  {/* Thinking bubbles */}
                  {thinking && (
                    <>
                      <circle cx="136" cy="58" r="5" fill="#76B900" opacity="0.9">
                        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="0.8s" repeatCount="indefinite" begin="0s"/>
                      </circle>
                      <circle cx="148" cy="46" r="7" fill="#76B900" opacity="0.8">
                        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.8s" repeatCount="indefinite" begin="0.15s"/>
                      </circle>
                      <circle cx="162" cy="32" r="9" fill="#76B900" opacity="0.7">
                        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="0.8s" repeatCount="indefinite" begin="0.3s"/>
                      </circle>
                    </>
                  )}
                </svg>
              </div>

              <div className={`char-status ${thinking ? 'active' : ''}`}>
                {thinking ? '⚡ Processing...' : uploaded ? '✦ Ready to chat' : '◈ Waiting for PDF'}
              </div>

              {/* Stats row */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ background: 'rgba(118,185,0,0.07)', border: '1px solid rgba(118,185,0,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#76B900' }}>{messages.filter(m => m.role === 'user').length}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Questions asked</div>
                </div>
                <div style={{ background: 'rgba(118,185,0,0.07)', border: '1px solid rgba(118,185,0,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#76B900' }}>{messages.filter(m => m.role === 'assistant').length}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Answers given</div>
                </div>
              </div>
            </div>

            {/* Chat Card */}
            <div className="card">
              <div className="card-label">02 — Chat</div>

              <div className="chat-messages">
                {messages.length === 0 && !thinking ? (
                  <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <p className="empty-text">Ask anything about your PDF</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <div key={i} className={`msg-row ${msg.role}`}>
                        <div className={`bubble ${msg.role}`}>{msg.content}</div>
                      </div>
                    ))}
                    {thinking && (
                      <div className="msg-row assistant">
                        <div className="thinking-bubble">
                          <div className="thinking-dot"/>
                          <div className="thinking-dot"/>
                          <div className="thinking-dot"/>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef}/>
                  </>
                )}
              </div>

              <div className="chat-input-row">
                <input
                  className="chat-input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your PDF…"
                />
                <button className="send-btn" onClick={askQuestion} disabled={thinking || !question.trim()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>

              <p style={{ fontSize: 11, color: '#3a3a3a', marginTop: 10, textAlign: 'center' }}>
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}