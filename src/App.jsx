import { useState, useEffect, useRef } from "react";

const STORAGE_KEYS = {
  niche: "quotemint:niche",
  library: "quotemint:library",
  feedback: "quotemint:feedback",
  settings: "quotemint:settings",
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📸", color: "#E1306C" },
  { id: "tiktok", label: "TikTok", icon: "🎵", color: "#69C9D0" },
  { id: "youtube", label: "YouTube Shorts", icon: "▶️", color: "#FF0000" },
  { id: "twitter", label: "Twitter/X", icon: "✦", color: "#1DA1F2" },
  { id: "facebook", label: "Facebook", icon: "👥", color: "#1877F2" },
  { id: "threads", label: "Threads", icon: "◎", color: "#ABABAB" },
];

const TONES = [
  { id: "motivational", label: "🔥 Motivational", desc: "High energy, push-through-the-pain" },
  { id: "wisdom", label: "🧘 Wisdom", desc: "Deep, thoughtful, philosophical" },
  { id: "success", label: "💰 Success", desc: "Money mindset, entrepreneur" },
  { id: "healing", label: "💛 Healing", desc: "Emotional, self-love, recovery" },
  { id: "faith", label: "🙏 Faith", desc: "Spiritual, God-centered, hope" },
  { id: "savage", label: "⚡ Savage", desc: "Bold, unapologetic, boundaries" },
];

const NICHES = [
  "Mindset & Motivation", "Wealth & Business", "Self-Love & Healing",
  "Faith & Spirituality", "Women Empowerment", "Men's Strength",
  "Relationships", "Fitness & Health", "Mental Health", "Custom..."
];

async function generateQuoteWithAI(niche, platform, tone, feedback, previousQuotes) {
  const platformInstructions = {
    instagram: "Instagram post: include a punchy quote (1-3 lines), 3-5 line caption, 20-30 hashtags, and a CTA. Format for visual card.",
    tiktok: "TikTok video script: hook line, quote reveal moment, 3-5 second pause point, closing line for stitch/duet. Keep it 15-30 seconds.",
    youtube: "YouTube Shorts script: attention-grabbing opener, quote with dramatic pause, 2-3 lines of context, subscribe CTA. 45-60 seconds.",
    twitter: "Twitter/X post: punchy quote under 180 chars, optional 1-2 sentence expansion, 3-5 hashtags only.",
    facebook: "Facebook post: relatable opener sentence, full quote, 2-3 sentences of context/story, engagement question, 5-10 hashtags.",
    threads: "Threads post: conversational tone, quote + short personal reflection, no hashtags, end with a question.",
  };

  const recentQuotesList = previousQuotes && previousQuotes.length > 0
    ? `\nRecently generated quotes to AVOID repeating (vary the message and style):\n${previousQuotes.slice(-5).map(q => `- "${q.quote}"`).join("\n")}`
    : "";

  const feedbackInstruction = feedback
    ? `\nUser feedback from last week's review: "${feedback}". Adjust your output to reflect this.`
    : "";

  const systemPrompt = `You are QuoteMint — an elite quotes content strategist trained on the top 1% highest-performing quotes pages across all social media platforms. You have studied millions of viral quotes in every niche.

Your job: generate quotes that stop the scroll, create emotional resonance, drive saves/shares, and build loyal audiences that convert to income.

Rules:
- Every quote must feel REAL and lived-in, not generic AI fluff
- Use power words, rhythm, and contrast
- Match the platform's culture exactly
- Make it shareable — people share what makes them feel seen
- Avoid clichés like "believe in yourself" or "keep going"
- Every output must be monetization-ready

Always respond in this exact JSON format (no markdown, no backticks):
{
  "quote": "The main quote text",
  "hook": "One-line attention hook to use before the quote",
  "caption": "Platform-specific caption",
  "hashtags": ["tag1", "tag2"],
  "cta": "Call to action text",
  "postingTip": "Best time/strategy to post this",
  "visualDescription": "Describe the ideal background/image for this quote (for image generation)",
  "viralScore": 85,
  "whyItWorks": "Brief explanation of the psychology behind this quote"
}`;

  const userPrompt = `Generate a viral, monetization-ready quote for this setup:
- Niche: ${niche}
- Platform: ${PLATFORMS.find(p => p.id === platform)?.label || platform}
- Platform Instructions: ${platformInstructions[platform] || platformInstructions.instagram}
- Tone/Style: ${TONES.find(t => t.id === tone)?.label || tone} — ${TONES.find(t => t.id === tone)?.desc || ""}
${recentQuotesList}
${feedbackInstruction}

Make this feel authentic, emotionally charged, and built to drive saves, shares, and follows. This must be ready to post immediately.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(i => i.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Visual Score Bar ──
function ScoreBar({ score }) {
  const color = score >= 80 ? "#FFBE00" : score >= 60 ? "#FF8C42" : "#FF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{
        flex: 1, height: "6px", background: "#1a1a1a", borderRadius: "3px", overflow: "hidden"
      }}>
        <div style={{
          width: `${score}%`, height: "100%", background: color,
          borderRadius: "3px", transition: "width 1s ease",
          boxShadow: `0 0 8px ${color}88`
        }} />
      </div>
      <span style={{ color, fontWeight: "800", fontSize: "13px", minWidth: "36px" }}>{score}</span>
    </div>
  );
}

// ── Quote Card Preview ──
function QuotePreview({ result, platform, niche }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const fullText = platform === "tiktok" || platform === "youtube"
    ? `${result.hook}\n\n"${result.quote}"\n\n${result.caption}\n\n${result.cta}`
    : `"${result.quote}"\n\n${result.caption}\n\n${result.cta}\n\n${result.hashtags?.map(h => `#${h}`).join(" ")}`;

  const copyAll = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #0D0D0D 0%, #111111 100%)",
      border: "1px solid #2a2a2a",
      borderRadius: "20px",
      overflow: "hidden",
      animation: "slideUp 0.5s ease"
    }}>
      {/* Quote Card Visual */}
      <div style={{
        padding: "40px 36px",
        background: "linear-gradient(135deg, #111 0%, #1a1200 50%, #111 100%)",
        borderBottom: "1px solid #2a2a2a",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: "200px", height: "200px",
          background: "radial-gradient(circle, #FFBE0022, transparent 70%)",
          borderRadius: "50%"
        }} />
        <div style={{
          fontSize: "60px", fontFamily: "Georgia, serif",
          color: "#FFBE0044", lineHeight: 1,
          marginBottom: "12px"
        }}>"</div>
        <p style={{
          fontSize: "22px", fontWeight: "700", color: "#F5F0E0",
          lineHeight: 1.5, fontFamily: "'Playfair Display', Georgia, serif",
          margin: 0, position: "relative", zIndex: 1
        }}>{result.quote}</p>
        <div style={{
          marginTop: "16px",
          display: "flex", alignItems: "center", gap: "10px"
        }}>
          <div style={{ height: "2px", width: "30px", background: "#FFBE00" }} />
          <span style={{ color: "#FFBE00", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase" }}>{niche}</span>
        </div>
      </div>

      {/* Viral Score */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ color: "#888", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Viral Potential</span>
          <span style={{ color: "#FFBE00", fontSize: "11px", background: "#FFBE0011", padding: "2px 10px", borderRadius: "20px", border: "1px solid #FFBE0033" }}>
            {result.viralScore >= 85 ? "🔥 HIGH" : result.viralScore >= 70 ? "⚡ SOLID" : "📈 BUILD"}
          </span>
        </div>
        <ScoreBar score={result.viralScore} />
      </div>

      {/* Details */}
      <div style={{ padding: "20px 24px", display: "grid", gap: "16px" }}>
        {result.hook && (
          <InfoBlock icon="🎯" label="HOOK" value={result.hook} accent="#FF8C42" />
        )}
        <InfoBlock icon="✍️" label="CAPTION" value={result.caption} accent="#FFBE00" />
        {result.hashtags?.length > 0 && (
          <InfoBlock icon="#" label="HASHTAGS" value={result.hashtags.map(h => `#${h}`).join(" ")} accent="#69C9D0" />
        )}
        <InfoBlock icon="👆" label="CTA" value={result.cta} accent="#E1306C" />
        <InfoBlock icon="🖼️" label="IMAGE IDEA" value={result.visualDescription} accent="#9B59B6" />
        <InfoBlock icon="📅" label="POSTING TIP" value={result.postingTip} accent="#27AE60" />
        <InfoBlock icon="🧠" label="WHY IT WORKS" value={result.whyItWorks} accent="#FFBE00" />
      </div>

      {/* Copy Button */}
      <div style={{ padding: "0 24px 24px" }}>
        <button onClick={copyAll} style={{
          width: "100%", padding: "14px",
          background: copied ? "#27AE60" : "linear-gradient(135deg, #FFBE00, #FF8C42)",
          border: "none", borderRadius: "12px",
          color: copied ? "#fff" : "#000",
          fontWeight: "800", fontSize: "15px", cursor: "pointer",
          transition: "all 0.3s ease",
          letterSpacing: "0.5px"
        }}>
          {copied ? "✓ Copied to Clipboard!" : "📋 Copy Full Post"}
        </button>
      </div>
    </div>
  );
}

function InfoBlock({ icon, label, value, accent }) {
  return (
    <div style={{
      background: "#0a0a0a",
      borderRadius: "12px",
      padding: "14px 16px",
      border: `1px solid ${accent}22`
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
        <span style={{ fontSize: "14px" }}>{icon}</span>
        <span style={{ color: accent, fontSize: "10px", fontWeight: "800", letterSpacing: "2px" }}>{label}</span>
      </div>
      <p style={{ color: "#D0C9B8", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>{value}</p>
    </div>
  );
}

// ── Library Card ──
function LibraryCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const platform = PLATFORMS.find(p => p.id === item.platform);
  return (
    <div style={{
      background: "#0D0D0D",
      border: "1px solid #1e1e1e",
      borderRadius: "16px",
      overflow: "hidden",
      transition: "border-color 0.2s ease",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#FFBE0033"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e1e"}
    >
      <div style={{ padding: "18px 20px", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span style={{
                background: `${platform?.color}22`, color: platform?.color,
                fontSize: "11px", fontWeight: "700", padding: "2px 10px",
                borderRadius: "20px", border: `1px solid ${platform?.color}44`
              }}>{platform?.icon} {platform?.label}</span>
              <span style={{
                background: "#FFBE0011", color: "#FFBE00",
                fontSize: "11px", fontWeight: "700", padding: "2px 10px",
                borderRadius: "20px", border: "1px solid #FFBE0022"
              }}>Score: {item.result?.viralScore}</span>
            </div>
            <p style={{ color: "#F0EAD6", fontSize: "14px", margin: 0, fontWeight: "600", lineHeight: 1.5 }}>
              "{item.result?.quote?.substring(0, 100)}{item.result?.quote?.length > 100 ? '...' : ''}"
            </p>
            <p style={{ color: "#555", fontSize: "11px", margin: "6px 0 0" }}>{item.savedAt}</p>
          </div>
          <span style={{ color: "#444", fontSize: "18px", userSelect: "none" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ paddingTop: "16px", display: "grid", gap: "10px" }}>
            <InfoBlock icon="✍️" label="CAPTION" value={item.result?.caption} accent="#FFBE00" />
            {item.result?.hashtags?.length > 0 && (
              <InfoBlock icon="#" label="HASHTAGS" value={item.result?.hashtags?.map(h => `#${h}`).join(" ")} accent="#69C9D0" />
            )}
            <InfoBlock icon="👆" label="CTA" value={item.result?.cta} accent="#E1306C" />
          </div>
          <button onClick={() => onDelete(item.id)} style={{
            marginTop: "14px", background: "transparent",
            border: "1px solid #333", borderRadius: "8px",
            color: "#666", fontSize: "12px", cursor: "pointer",
            padding: "6px 16px", transition: "all 0.2s"
          }}
            onMouseEnter={e => { e.target.style.borderColor = "#FF4444"; e.target.style.color = "#FF4444"; }}
            onMouseLeave={e => { e.target.style.borderColor = "#333"; e.target.style.color = "#666"; }}
          >Remove</button>
        </div>
      )}
    </div>
  );
}

// ── Main App ──
export default function QuoteMint() {
  const [tab, setTab] = useState("generate");
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("motivational");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [library, setLibrary] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [savedFeedback, setSavedFeedback] = useState("");
  const [settings, setSettings] = useState({ setupDone: false });
  const [storageReady, setStorageReady] = useState(false);
  const [weeklyNote, setWeeklyNote] = useState("");
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const resultRef = useRef(null);

  const activeNiche = niche === "Custom..." ? customNiche : niche;

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const lib = await window.storage.get(STORAGE_KEYS.library);
        if (lib) setLibrary(JSON.parse(lib.value));
      } catch {}
      try {
        const fb = await window.storage.get(STORAGE_KEYS.feedback);
        if (fb) {
          const parsed = JSON.parse(fb.value);
          setSavedFeedback(parsed.current || "");
          setFeedbackHistory(parsed.history || []);
        }
      } catch {}
      try {
        const s = await window.storage.get(STORAGE_KEYS.settings);
        if (s) {
          const parsed = JSON.parse(s.value);
          setSettings(parsed);
          if (parsed.niche) setNiche(parsed.niche);
          if (parsed.tone) setTone(parsed.tone);
          if (parsed.platform) setPlatform(parsed.platform);
        }
      } catch {}
      setStorageReady(true);
    })();
  }, []);

  const saveSettings = async () => {
    const s = { setupDone: true, niche, customNiche, tone, platform };
    setSettings(s);
    try { await window.storage.set(STORAGE_KEYS.settings, JSON.stringify(s)); } catch {}
  };

  const generate = async () => {
    if (!activeNiche) { setError("Please select or enter your niche first."); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const previousQuotes = library.filter(i => i.platform === platform).map(i => i.result);
      const res = await generateQuoteWithAI(activeNiche, platform, tone, savedFeedback, previousQuotes);
      setResult(res);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError("Generation failed. Please try again. " + (e.message || ""));
    }
    setLoading(false);
  };

  const saveToLibrary = async () => {
    if (!result) return;
    const item = {
      id: Date.now().toString(),
      platform,
      tone,
      niche: activeNiche,
      result,
      savedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    const updated = [item, ...library];
    setLibrary(updated);
    try { await window.storage.set(STORAGE_KEYS.library, JSON.stringify(updated.slice(0, 100))); } catch {}
  };

  const deleteFromLibrary = async (id) => {
    const updated = library.filter(i => i.id !== id);
    setLibrary(updated);
    try { await window.storage.set(STORAGE_KEYS.library, JSON.stringify(updated)); } catch {}
  };

  const saveFeedback = async () => {
    if (!weeklyNote.trim()) return;
    const newHistory = [
      { note: weeklyNote, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
      ...feedbackHistory.slice(0, 9)
    ];
    setSavedFeedback(weeklyNote);
    setFeedbackHistory(newHistory);
    setWeeklyNote("");
    try {
      await window.storage.set(STORAGE_KEYS.feedback, JSON.stringify({
        current: weeklyNote, history: newHistory
      }));
    } catch {}
  };

  const TABS = [
    { id: "generate", label: "Generate", icon: "⚡" },
    { id: "library", label: `Library ${library.length > 0 ? `(${library.length})` : ""}`, icon: "📚" },
    { id: "weekly", label: "Weekly Review", icon: "📊" },
    { id: "setup", label: "Setup", icon: "⚙️" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#F0EAD6",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px #FFBE0033; } 50% { box-shadow: 0 0 40px #FFBE0066; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        textarea, input, select { outline: none !important; }
        button:active { transform: scale(0.98); }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "20px 20px 0",
        background: "linear-gradient(180deg, #0D0D0D 0%, #080808 100%)",
        borderBottom: "1px solid #141414",
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{
              width: "40px", height: "40px",
              background: "linear-gradient(135deg, #FFBE00, #FF8C42)",
              borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", flexShrink: 0,
              animation: "glow 3s ease-in-out infinite"
            }}>✦</div>
            <div>
              <h1 style={{
                margin: 0, fontSize: "22px",
                fontFamily: "'Playfair Display', serif",
                fontWeight: "900", color: "#F5F0E0",
                letterSpacing: "-0.5px"
              }}>QuoteMint <span style={{ color: "#FFBE00" }}>AI</span></h1>
              <p style={{ margin: 0, color: "#555", fontSize: "11px", fontWeight: "500", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                {activeNiche || "Your Quotes Empire"}
              </p>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ color: "#FFBE00", fontSize: "22px", fontWeight: "900", lineHeight: 1 }}>{library.length}</div>
              <div style={{ color: "#555", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>Saved</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "2px", overflowX: "auto", paddingBottom: "1px" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                borderBottom: tab === t.id ? "2px solid #FFBE00" : "2px solid transparent",
                color: tab === t.id ? "#FFBE00" : "#555",
                fontWeight: "700", fontSize: "13px",
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                letterSpacing: "0.3px"
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* ── GENERATE TAB ── */}
        {tab === "generate" && (
          <div style={{ display: "grid", gap: "20px" }}>

            {/* Niche Quick Select */}
            <div>
              <label style={{ color: "#888", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                Your Niche
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: niche === "Custom..." ? "10px" : "0" }}>
                {NICHES.map(n => (
                  <button key={n} onClick={() => setNiche(n)} style={{
                    padding: "8px 16px",
                    background: niche === n ? "linear-gradient(135deg, #FFBE00, #FF8C42)" : "#111",
                    border: niche === n ? "none" : "1px solid #222",
                    borderRadius: "100px",
                    color: niche === n ? "#000" : "#888",
                    fontWeight: niche === n ? "800" : "500",
                    fontSize: "12px", cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}>{n}</button>
                ))}
              </div>
              {niche === "Custom..." && (
                <input
                  value={customNiche}
                  onChange={e => setCustomNiche(e.target.value)}
                  placeholder="e.g. Single Moms, Black Excellence, Teen Entrepreneurs..."
                  style={{
                    width: "100%", background: "#0D0D0D", border: "1px solid #2a2a2a",
                    borderRadius: "12px", padding: "14px 16px", color: "#F0EAD6",
                    fontSize: "14px", marginTop: "8px"
                  }}
                />
              )}
            </div>

            {/* Platform */}
            <div>
              <label style={{ color: "#888", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                Platform
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setPlatform(p.id)} style={{
                    padding: "12px 8px",
                    background: platform === p.id ? `${p.color}22` : "#0D0D0D",
                    border: platform === p.id ? `1px solid ${p.color}66` : "1px solid #1e1e1e",
                    borderRadius: "12px", color: platform === p.id ? p.color : "#666",
                    fontWeight: "700", fontSize: "12px", cursor: "pointer",
                    transition: "all 0.2s ease", textAlign: "center"
                  }}>
                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>{p.icon}</div>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label style={{ color: "#888", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                Tone / Style
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)} style={{
                    padding: "12px 14px", textAlign: "left",
                    background: tone === t.id ? "#FFBE0011" : "#0D0D0D",
                    border: tone === t.id ? "1px solid #FFBE0044" : "1px solid #1e1e1e",
                    borderRadius: "12px", cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}>
                    <div style={{ color: tone === t.id ? "#FFBE00" : "#888", fontWeight: "700", fontSize: "13px" }}>{t.label}</div>
                    <div style={{ color: "#444", fontSize: "11px", marginTop: "3px" }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Feedback Badge */}
            {savedFeedback && (
              <div style={{
                background: "#0D1A0D", border: "1px solid #27AE6033",
                borderRadius: "12px", padding: "12px 16px",
                display: "flex", gap: "10px", alignItems: "flex-start"
              }}>
                <span style={{ fontSize: "16px" }}>🧠</span>
                <div>
                  <div style={{ color: "#27AE60", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px" }}>AI is trained on your feedback</div>
                  <div style={{ color: "#666", fontSize: "12px" }}>"{savedFeedback.substring(0, 80)}{savedFeedback.length > 80 ? '...' : ''}"</div>
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: "#1A0D0D", border: "1px solid #FF444433", borderRadius: "12px", padding: "12px 16px", color: "#FF6B6B", fontSize: "13px" }}>
                ⚠️ {error}
              </div>
            )}

            {/* Generate Button */}
            <button onClick={generate} disabled={loading || !activeNiche} style={{
              padding: "18px",
              background: loading ? "#1a1a1a" : "linear-gradient(135deg, #FFBE00 0%, #FF8C42 100%)",
              border: "none", borderRadius: "16px",
              color: loading ? "#555" : "#000",
              fontWeight: "900", fontSize: "17px", cursor: loading ? "default" : "pointer",
              transition: "all 0.3s ease",
              letterSpacing: "0.5px",
              animation: !loading && activeNiche ? "glow 2s ease-in-out infinite" : "none"
            }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span style={{ display: "inline-block", width: "18px", height: "18px", border: "2px solid #444", borderTopColor: "#FFBE00", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Generating your quote...
                </span>
              ) : "⚡ Generate Quote Now"}
            </button>

            {/* Result */}
            {result && (
              <div ref={resultRef}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, color: "#888", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>Ready to Post</h3>
                  <button onClick={saveToLibrary} style={{
                    background: "#FFBE0011", border: "1px solid #FFBE0033",
                    borderRadius: "8px", color: "#FFBE00", fontSize: "12px",
                    fontWeight: "700", cursor: "pointer", padding: "6px 16px"
                  }}>+ Save to Library</button>
                </div>
                <QuotePreview result={result} platform={platform} niche={activeNiche} />
                <button onClick={generate} style={{
                  width: "100%", marginTop: "12px", padding: "14px",
                  background: "transparent", border: "1px solid #2a2a2a",
                  borderRadius: "12px", color: "#888", fontWeight: "700",
                  fontSize: "14px", cursor: "pointer", transition: "all 0.2s"
                }}
                  onMouseEnter={e => { e.target.style.borderColor = "#FFBE0044"; e.target.style.color = "#FFBE00"; }}
                  onMouseLeave={e => { e.target.style.borderColor = "#2a2a2a"; e.target.style.color = "#888"; }}
                >↺ Generate Another</button>
              </div>
            )}
          </div>
        )}

        {/* ── LIBRARY TAB ── */}
        {tab === "library" && (
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "800" }}>
                Content Library
              </h2>
              <span style={{ color: "#FFBE00", fontWeight: "700" }}>{library.length} saved</span>
            </div>
            {library.length === 0 ? (
              <div style={{
                background: "#0D0D0D", border: "1px dashed #222",
                borderRadius: "20px", padding: "60px 24px", textAlign: "center"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
                <p style={{ color: "#555", fontSize: "15px", margin: 0 }}>No saved quotes yet.<br />Generate and save your best ones here.</p>
              </div>
            ) : (
              library.map(item => (
                <LibraryCard key={item.id} item={item} onDelete={deleteFromLibrary} />
              ))
            )}
          </div>
        )}

        {/* ── WEEKLY REVIEW TAB ── */}
        {tab === "weekly" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "800" }}>
                Weekly Review
              </h2>
              <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>Come back weekly. Tell the AI what's working and it adjusts.</p>
            </div>

            {/* Stats Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {[
                { label: "Saved Quotes", value: library.length, icon: "📝" },
                { label: "Platforms Used", value: [...new Set(library.map(i => i.platform))].length, icon: "📡" },
                { label: "Feedback Rounds", value: feedbackHistory.length, icon: "🔄" },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: "#0D0D0D", border: "1px solid #1e1e1e",
                  borderRadius: "14px", padding: "16px 14px", textAlign: "center"
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>{stat.icon}</div>
                  <div style={{ color: "#FFBE00", fontSize: "24px", fontWeight: "900", lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Current Feedback */}
            <div style={{ background: "#0D0D0D", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 6px", color: "#F0EAD6", fontSize: "16px", fontWeight: "700" }}>
                🧠 Train the AI This Week
              </h3>
              <p style={{ color: "#555", fontSize: "12px", margin: "0 0 14px", lineHeight: 1.6 }}>
                What performed well? What flopped? What do you want more of? The AI reads this before every generation.
              </p>
              <textarea
                value={weeklyNote}
                onChange={e => setWeeklyNote(e.target.value)}
                placeholder={`Examples:\n• "The healing quotes got 3x more saves, give me more of those"\n• "Stop using the word 'grind', my audience doesn't connect"\n• "TikTok hooks need to be more personal and less preachy"\n• "Faith-based content popped off this week, lean into that"`}
                rows={6}
                style={{
                  width: "100%", background: "#0a0a0a",
                  border: "1px solid #2a2a2a", borderRadius: "12px",
                  padding: "14px", color: "#D0C9B8", fontSize: "13px",
                  lineHeight: 1.6, resize: "vertical", fontFamily: "inherit"
                }}
              />
              <button onClick={saveFeedback} disabled={!weeklyNote.trim()} style={{
                marginTop: "12px", width: "100%", padding: "14px",
                background: weeklyNote.trim() ? "linear-gradient(135deg, #FFBE00, #FF8C42)" : "#1a1a1a",
                border: "none", borderRadius: "12px",
                color: weeklyNote.trim() ? "#000" : "#444",
                fontWeight: "800", fontSize: "14px", cursor: weeklyNote.trim() ? "pointer" : "default",
                transition: "all 0.3s"
              }}>
                ✓ Save Feedback — AI Adjusts Next Run
              </button>
            </div>

            {/* Active Feedback */}
            {savedFeedback && (
              <div style={{ background: "#0D1A0D", border: "1px solid #27AE6033", borderRadius: "14px", padding: "16px" }}>
                <div style={{ color: "#27AE60", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>
                  ✓ Currently Active Feedback
                </div>
                <p style={{ color: "#888", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>"{savedFeedback}"</p>
              </div>
            )}

            {/* Feedback History */}
            {feedbackHistory.length > 0 && (
              <div>
                <h3 style={{ color: "#555", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
                  Previous Reviews
                </h3>
                <div style={{ display: "grid", gap: "8px" }}>
                  {feedbackHistory.map((f, i) => (
                    <div key={i} style={{
                      background: "#0D0D0D", border: "1px solid #1a1a1a",
                      borderRadius: "10px", padding: "12px 16px",
                      display: "flex", gap: "12px", alignItems: "flex-start"
                    }}>
                      <div style={{ color: "#333", fontSize: "12px", minWidth: "60px", marginTop: "2px" }}>{f.date}</div>
                      <p style={{ color: "#666", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>"{f.note}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roadmap Tips */}
            <div style={{ background: "#0D0D0D", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 14px", color: "#FFBE00", fontSize: "14px", fontWeight: "700" }}>💰 Monetization Roadmap</h3>
              <div style={{ display: "grid", gap: "10px" }}>
                {[
                  { phase: "Week 1–4", action: "Post 1x daily. Test 3 tones. Track saves & shares — not likes.", color: "#FFBE00" },
                  { phase: "Month 2–3", action: "Identify your top tone. Double down. Start building email list via link-in-bio.", color: "#FF8C42" },
                  { phase: "Month 3–6", action: "Affiliate links, digital products, or paid shoutouts. Niche stores convert.", color: "#E1306C" },
                  { phase: "6 Months+", action: "License your system. Sell it as a done-for-you service or digital product.", color: "#9B59B6" },
                ].map(m => (
                  <div key={m.phase} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span style={{
                      background: `${m.color}22`, color: m.color,
                      fontSize: "10px", fontWeight: "700", padding: "4px 10px",
                      borderRadius: "20px", border: `1px solid ${m.color}44`,
                      whiteSpace: "nowrap", marginTop: "1px"
                    }}>{m.phase}</span>
                    <p style={{ color: "#888", fontSize: "12px", margin: 0, lineHeight: 1.6 }}>{m.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SETUP TAB ── */}
        {tab === "setup" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "800" }}>
                Page Setup
              </h2>
              <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>Configure your defaults so every generation is dialed in.</p>
            </div>

            <div style={{ background: "#0D0D0D", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "24px", display: "grid", gap: "20px" }}>
              <div>
                <label style={{ color: "#888", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                  Default Niche
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {NICHES.map(n => (
                    <button key={n} onClick={() => setNiche(n)} style={{
                      padding: "8px 14px",
                      background: niche === n ? "linear-gradient(135deg, #FFBE00, #FF8C42)" : "#111",
                      border: niche === n ? "none" : "1px solid #222",
                      borderRadius: "100px", color: niche === n ? "#000" : "#888",
                      fontWeight: niche === n ? "800" : "500", fontSize: "12px", cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}>{n}</button>
                  ))}
                </div>
                {niche === "Custom..." && (
                  <input value={customNiche} onChange={e => setCustomNiche(e.target.value)}
                    placeholder="Your custom niche..."
                    style={{
                      width: "100%", marginTop: "10px", background: "#0a0a0a",
                      border: "1px solid #2a2a2a", borderRadius: "12px",
                      padding: "12px 16px", color: "#F0EAD6", fontSize: "14px"
                    }} />
                )}
              </div>

              <div>
                <label style={{ color: "#888", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                  Default Platform
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {PLATFORMS.map(p => (
                    <button key={p.id} onClick={() => setPlatform(p.id)} style={{
                      padding: "10px 8px",
                      background: platform === p.id ? `${p.color}22` : "#0a0a0a",
                      border: platform === p.id ? `1px solid ${p.color}66` : "1px solid #1e1e1e",
                      borderRadius: "10px", color: platform === p.id ? p.color : "#555",
                      fontWeight: "700", fontSize: "11px", cursor: "pointer", transition: "all 0.2s"
                    }}>{p.icon} {p.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: "#888", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                  Default Tone
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {TONES.map(t => (
                    <button key={t.id} onClick={() => setTone(t.id)} style={{
                      padding: "10px 12px", textAlign: "left",
                      background: tone === t.id ? "#FFBE0011" : "#0a0a0a",
                      border: tone === t.id ? "1px solid #FFBE0044" : "1px solid #1e1e1e",
                      borderRadius: "10px", cursor: "pointer", transition: "all 0.2s"
                    }}>
                      <div style={{ color: tone === t.id ? "#FFBE00" : "#666", fontWeight: "700", fontSize: "12px" }}>{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={async () => { await saveSettings(); setTab("generate"); }} style={{
                padding: "14px", background: "linear-gradient(135deg, #FFBE00, #FF8C42)",
                border: "none", borderRadius: "12px", color: "#000",
                fontWeight: "800", fontSize: "15px", cursor: "pointer"
              }}>
                ✓ Save Defaults & Start Generating
              </button>
            </div>

            {/* Platform Connection Reminder */}
            <div style={{ background: "#0D0D0D", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 12px", color: "#F0EAD6", fontSize: "15px", fontWeight: "700" }}>🔗 Auto-Posting Platforms</h3>
              <p style={{ color: "#666", fontSize: "12px", margin: "0 0 14px", lineHeight: 1.7 }}>
                For fully automated posting (like ClickGrow), connect these tools alongside QuoteMint. Each has free tiers to get started:
              </p>
              {[
                { name: "Buffer", desc: "Schedule to all platforms at once", badge: "Free tier" },
                { name: "Later", desc: "Visual calendar + auto-publish", badge: "Free tier" },
                { name: "Metricool", desc: "Post + analytics in one place", badge: "Free tier" },
                { name: "Make.com", desc: "Automate the full pipeline", badge: "Advanced" },
              ].map(tool => (
                <div key={tool.name} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: "1px solid #141414"
                }}>
                  <div>
                    <div style={{ color: "#D0C9B8", fontWeight: "600", fontSize: "13px" }}>{tool.name}</div>
                    <div style={{ color: "#555", fontSize: "11px" }}>{tool.desc}</div>
                  </div>
                  <span style={{ background: "#FFBE0011", color: "#FFBE00", fontSize: "10px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px", border: "1px solid #FFBE0022" }}>
                    {tool.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
