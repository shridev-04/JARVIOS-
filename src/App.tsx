import { useState, useEffect, useRef } from "react";
import { useLiveSession } from "./hooks/useLiveSession";
import { Motherboard } from "./components/Motherboard";
import { motion, AnimatePresence } from "motion/react";
import { 
  Power, Lock, Unlock, Key, UploadCloud, FileText, Send, 
  Calendar, Mail, RefreshCw, Cpu, Volume2, SlidersHorizontal, 
  Terminal, Globe, BookOpen, Clock, Activity, Settings2, Sparkles, AlertCircle, Download
} from "lucide-react";

export default function App() {
  const {
    sessionState,
    messages,
    volume,
    docsList,
    customApiKey,
    setCustomApiKey,
    speechSpeed,
    setSpeechSpeed,
    connectSession,
    disconnectSession,
    sendTextMessage,
    uploadContextDocument,
    user,
    accessToken,
    loginGoogle,
    logoutGoogle,
    needsAuth,
    notepadList,
    setNotepadList,
    addNotepadItem
  } = useLiveSession();

  const [inputText, setInputText] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [intelligenceValue, setIntelligenceValue] = useState(85);
  const [temperatureValue, setTemperatureValue] = useState(0.75);
  
  // Tab states and clipboard copy confirmation triggers
  const [activeRightTab, setActiveRightTab] = useState<"configs" | "notepad">("notepad");
  const [copiedId, setCopiedId] = useState<string>("");

  // Auto switch right sidebar tab to notepad whenever a new item is generated
  useEffect(() => {
    if (notepadList.length > 0) {
      setActiveRightTab("notepad");
    }
  }, [notepadList.length]);
  
  // Custom manual document drop/paste inputs
  const [dropTitle, setDropTitle] = useState("");
  const [dropText, setDropText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Ping ticker simulation
  const [latencyMs, setLatencyMs] = useState(14);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat terminal
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulated latency tick
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyMs((prev) => {
        const offset = Math.floor(Math.random() * 5) - 2;
        const next = prev + offset;
        return next > 4 ? (next < 25 ? next : 14) : 9;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleConnection = () => {
    if (sessionState === "disconnected") {
      connectSession();
    } else {
      disconnectSession();
    }
  };

  const handleKeySave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiKey(copiedKey);
    setShowKeyModal(false);
  };

  const handleDownloadPdf = (docTitle: string, dataUrl?: string) => {
    if (!dataUrl) return;
    try {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = docTitle;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Manual download invocation triggered failed:", err);
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendTextMessage(inputText);
    setInputText("");
  };

  // Process Document Injection
  const handleContextDocumentPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropText.trim()) return;
    setIsAnalyzing(true);
    
    // Auto-generate a clean, simple title from the first 25 characters of the text or fallback
    const firstLine = dropText.trim().split("\n")[0].trim().substring(0, 25);
    const resolvedTitle = firstLine ? firstLine : "Pasted Document";
    
    await uploadContextDocument(resolvedTitle, "text/plain", dropText);
    setDropTitle("");
    setDropText("");
    setIsAnalyzing(false);
  };

  // Fill in mock input for user to instantly test doc context seeding
  const selectQuickTemplate = (title: string, text: string) => {
    setDropTitle(title);
    setDropText(text);
  };

  return (
    <div id="jarvios-workspace" className="w-full h-screen bg-[#0A0A0B] text-[#E0E0E0] font-sans flex flex-col overflow-hidden select-none">
      
      {/* Upper Header Module */}
      <header className="h-16 border-b border-[#2A2A2D] flex items-center justify-between px-8 bg-[#0D0D0F]" id="jarvios-header">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#C5A267] rounded-sm flex items-center justify-center text-black font-bold font-mono">
            Ω
          </div>
          <div className="flex flex-col">
            <h1 className="font-serif italic text-xl text-[#F5F5F7] tracking-wider leading-none">
              JARVIOS <span className="text-[#707075] text-sm font-sans not-italic ml-2">/ Neural System Core v4.1</span>
            </h1>
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#C5A267] mt-1">Sophisticated Multimodal Environment</span>
          </div>
        </div>

        {/* Sync Indicator and Deploy Actions */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                sessionState === "disconnected" ? "bg-red-400" : "bg-emerald-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                sessionState === "disconnected" ? "bg-red-500" : "bg-emerald-500"
              }`}></span>
            </span>
            <span className="text-[#A0A0A5] font-mono text-xs uppercase tracking-wider">
              {sessionState === "disconnected" ? "AetherCore Offline" : "AetherCore Synchronized"}
            </span>
          </div>

          <button 
            onClick={() => {
              setCopiedKey(customApiKey);
              setShowKeyModal(true);
            }} 
            className="flex items-center gap-2 px-3 py-1.5 border border-[#2A2A2D] text-xs font-mono text-[#A0A0A5] hover:text-[#C5A267] hover:border-[#C5A267] transition-all bg-[#111114] rounded cursor-pointer"
          >
            {customApiKey ? <Unlock size={12} className="text-emerald-500" /> : <Lock size={12} className="text-[#C5A267]" />}
            <span>{customApiKey ? "API Key: Linked" : "Configure API Key"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace split panel layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Drawer / Side asset Column */}
        <aside className="w-76 border-r border-[#2A2A2D] bg-[#0D0D0F] p-4 flex flex-col gap-6 overflow-y-auto" id="sidebar-left">
          
          {/* Section A: Seeding context reference files */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#2A2A2D]">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#707075] font-bold">Document Seeder</p>
              <Sparkles size={11} className="text-[#C5A267]" />
            </div>

            <form onSubmit={handleContextDocumentPost} className="space-y-3 bg-[#111114] p-3 rounded border border-[#2A2A2D]">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#C5A267] block mb-1 font-bold">Document Content</label>
                <textarea 
                  placeholder="Paste manual project text, requirements, notice topics, or technical notes here..."
                  value={dropText}
                  onChange={(e) => setDropText(e.target.value)}
                  rows={5}
                  className="w-full bg-[#0A0A0B] border border-[#2A2A2D] rounded p-2 text-xs text-[#E0E0E0] focus:border-[#C5A267] outline-none font-sans resize-none"
                  required
                />
              </div>

              <div className="text-[10px] text-[#A0A0A5] leading-normal bg-[#0A0A0B] p-2 rounded border border-[#1E1E22]">
                <span className="text-[#C5A267] font-bold">💡 Voice Capability Tip:</span>
                <p className="mt-0.5 text-[#8E8E93]">Aap iski saari jankari bol kar (Microphone toggle karke) bhi Jarvios ko pradan kar sakte hain!</p>
              </div>

              <div className="flex gap-2 text-[9px] text-[#A0A0A5] pt-0.5">
                <span className="text-[#707075]">Quick:</span>
                <button 
                  type="button"
                  onClick={() => selectQuickTemplate("Aether_Initiative.text", "Project: JARVIOS\nFramework: React\nBidi Voice model is active over the alpha bridge.")}
                  className="hover:text-[#C5A267] underline"
                >
                  Project Info
                </button>
                <button 
                  type="button"
                  onClick={() => selectQuickTemplate("Calculus_Core.py", "def compute_voltage_ripple(f, C, V_out):\n    return V_out / (f * C * 1000)")}
                  className="hover:text-[#C5A267] underline"
                >
                  Python code
                </button>
              </div>

              <button 
                type="submit" 
                disabled={isAnalyzing}
                className="w-full py-1.5 bg-[#C5A267] hover:bg-[#B38E55] text-black font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <UploadCloud size={12} />
                <span>{isAnalyzing ? "Analyzing Core Code..." : "SEED INTEL BUFFER"}</span>
              </button>
            </form>
          </div>

          {/* Section B: Context files reviews list */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#707075] font-bold pb-1 border-b border-[#2A2A2D]">Active Context Files</p>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {docsList.length === 0 ? (
                <p className="text-[11px] text-[#707075] italic text-center py-2 bg-[#111114] rounded border border-dashed border-[#2A2A2D]">
                  No seed data uploaded yet
                </p>
              ) : (
                docsList.map((doc) => (
                  <div key={doc.id} className="flex flex-col gap-1 bg-[#151518]/60 p-2.5 rounded border border-[#222225] hover:border-[#C5A267]/40 transition-all">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#C5A267] font-mono truncate max-w-[150px] flex items-center gap-1.5" title={doc.title}>
                        <FileText size={11} className="opacity-80 shrink-0" />
                        {doc.title}
                      </span>
                      <span className="text-[10px] text-[#707075] font-mono">{doc.size}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-[#707075] font-mono">
                      <span className="uppercase">{doc.type} node</span>
                      <span>{doc.date}</span>
                    </div>
                    {doc.pdfDataUrl && (
                      <button
                        onClick={() => handleDownloadPdf(doc.title, doc.pdfDataUrl)}
                        className="mt-1.5 w-full py-1 bg-[#C5A267]/10 hover:bg-[#C5A267] text-[#C5A267] hover:text-black font-semibold text-[10px] uppercase font-mono tracking-wider rounded border border-[#C5A267]/25 hover:border-transparent transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Click to download your compiled PDF report"
                      >
                        <Download size={10} />
                        <span>Download PDF</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>


        </aside>

        {/* Central visual spotlight panel */}
        <section className="flex-1 bg-[#0A0A0B] flex flex-col relative overflow-hidden" id="central-view">
          
          {/* Header tab indicator */}
          <div className="flex items-center px-6 h-12 bg-[#111114] border-b border-[#2A2A2D] justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#C5A267]">AetherCore Spotlight Visualizer</span>
              <div className="flex gap-1.5 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1D]"></span>
              </div>
            </div>
            
            {/* Direct voice state indicators */}
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#A0A0A5] bg-[#0A0A0B] px-2.5 py-1 rounded border border-[#2A2A2D] flex items-center gap-2">
              <Activity size={10} className="text-[#C5A267] animate-pulse" />
              <span>Link Node: {sessionState}</span>
            </div>
          </div>

          {/* Spectacular central Canvas panel with glowing motherboard structure */}
          <div className="flex-1 relative">
            <Motherboard sessionState={sessionState} volume={volume} />

            {/* Glowing grand core power toggle button placement */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <motion.button
                onClick={handleToggleConnection}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-28 h-28 rounded-full border border-[#2A2A2D] bg-[#0D0D0F]/90 flex items-center justify-center cursor-pointer transition-all duration-300 relative ${
                  sessionState === "disconnected" 
                    ? "glow-toggle-off hover:border-[#707075]" 
                    : sessionState === "connecting"
                    ? "border-[#F5A623] shadow-[0_0_30px_rgba(245,166,35,0.3)] animate-pulse"
                    : sessionState === "listening"
                    ? "border-[#00D2FF] glow-toggle-on"
                    : "border-emerald-500 shadow-[0_0_35px_rgba(34,197,94,0.4)]"
                }`}
                style={{
                  borderWidth: sessionState !== "disconnected" ? "2.5px" : "1px"
                }}
              >
                <div className="flex flex-col items-center gap-1 z-10">
                  <Power size={32} className={`transition-colors ${
                    sessionState === "disconnected" 
                      ? "text-[#707075]" 
                      : sessionState === "connecting"
                      ? "text-[#F5A623]"
                      : sessionState === "listening"
                      ? "text-[#00D2FF]"
                      : "text-emerald-500"
                  }`} />
                  <span className="text-[8px] font-mono tracking-widest text-[#707075] uppercase mt-1">
                    {sessionState === "disconnected" ? "POWER OFF" : sessionState === "listening" ? "LISTENING" : sessionState === "connecting" ? "SYNCING..." : "SPEAKING"}
                  </span>
                </div>

                {/* Concentric rotating tech circles overlay */}
                <span className={`w-36 h-36 rounded-full absolute border border-dashed border-opacity-35 pointer-events-none transition-all duration-700 animate-[spin_40s_linear_infinite] ${
                  sessionState === "disconnected" ? "border-stone-800" : "border-[#C5A267]"
                }`} />
              </motion.button>
              
              <p className="text-[10px] text-[#A0A0A5] font-mono uppercase tracking-[0.2em] mt-6 text-center bg-[#0A0A0B]/80 px-3 py-1.5 rounded border border-[#1A1A1D]">
                {sessionState === "disconnected" ? "CLICK CORE RECONSTRUCT" : "neural voice link initialized."}
              </p>


            </div>
          </div>

          {/* Interactive terminal and text manual input panel */}
          <div className="h-64 border-t border-[#2A2A2D] bg-[#0D0D0F] flex flex-col p-4 relative" id="terminal-pane">
            
            {/* Terminal header tab line */}
            <div className="flex items-center justify-between border-b border-[#2A2A2D] pb-2 mb-2 text-xs">
              <span className="font-mono text-[#C5A267] flex items-center gap-1.5">
                <Terminal size={12} />
                CONSOLE_REALTIME_LOGS.log
              </span>
              <span className="text-[10px] text-[#707075] font-mono">ENCODED IN LINE_TURN_PCM</span>
            </div>

            {/* Scrolling transcript block */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 mb-3 bg-[#0A0A0B] p-3 rounded border border-[#2A2A2D] text-xs font-mono select-text">
              {messages.map((m) => (
                <div key={m.id} className="leading-relaxed flex gap-2">
                  <span className={`text-[10px] font-mono shrink-0 select-none ${
                    m.sender === "system" ? "text-amber-500" : m.sender === "jarvios" ? "text-emerald-500" : "text-blue-400"
                  }`}>
                    [{m.timestamp}] {m.sender === "system" ? "SYS" : m.sender === "jarvios" ? "JARVIOS" : "USER"}:
                  </span>
                  <p className={`flex-1 text-[11px] font-sans ${
                    m.sender === "system" 
                      ? "text-[#707075] italic" 
                      : m.sender === "jarvios" 
                      ? "text-[#F5F5F7]" 
                      : "text-blue-300"
                  }`}>
                    {m.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Override Keyboard texting control */}
            <form onSubmit={handleSendText} className="flex gap-2">
              <input 
                type="text" 
                placeholder={sessionState === "disconnected" ? "Please turn on JARVIOS Core to activate interface overrides..." : "Keypad bypass override: Ask a query or instruct JARVIOS manually..."}
                disabled={sessionState === "disconnected"}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-[#0A0A0B] text-xs font-sans text-[#E0E0E0] border border-[#2A2A2D] rounded px-3 py-2 outline-none focus:border-[#C5A267] disabled:opacity-45 transition-colors"
                id="keyboard-override-input"
              />
              <button 
                type="submit"
                disabled={sessionState === "disconnected" || !inputText.trim()}
                className="px-4 py-2 bg-[#2A2A2D] text-[#E0E0E0] hover:bg-[#C5A267] hover:text-black rounded text-xs font-mono tracking-widest transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
              >
                <span>TRANSMIT</span>
                <Send size={11} />
              </button>
            </form>
          </div>
        </section>

        {/* Right Panel / Configurations Panel */}
        <aside className="w-80 border-l border-[#2A2A2D] bg-[#0D0D0F] flex flex-col overflow-hidden" id="sidebar-right">
          
          {/* Tabs header inside the right sidebar */}
          <div className="flex border-b border-[#2A2A2D] bg-[#111114] select-none shrink-0" id="right-sidebar-tabs">
            <button
              id="tab-btn-notepad"
              onClick={() => setActiveRightTab("notepad")}
              className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-mono font-bold transition-all border-b-2 text-center cursor-pointer ${
                activeRightTab === "notepad"
                  ? "border-[#C5A267] text-[#C5A267] bg-[#151518]"
                  : "border-transparent text-[#707075] hover:text-[#A0A0A5]"
              }`}
            >
              Notepad ({notepadList.length})
            </button>
            <button
              id="tab-btn-configs"
              onClick={() => setActiveRightTab("configs")}
              className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-mono font-bold transition-all border-b-2 text-center cursor-pointer ${
                activeRightTab === "configs"
                  ? "border-[#C5A267] text-[#C5A267] bg-[#151518]"
                  : "border-transparent text-[#707075] hover:text-[#A0A0A5]"
              }`}
            >
              Core Configs
            </button>
          </div>

          {/* Tabs Body Container */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
            {activeRightTab === "notepad" ? (
              <div className="flex flex-col gap-4 flex-1" id="notepad-tab-content">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#707075] font-bold">Workspace Clipboard</p>
                  {notepadList.length > 0 && (
                    <button 
                      onClick={() => setNotepadList([])}
                      className="text-[9px] uppercase font-mono text-red-400 hover:text-red-300 transition-all underline cursor-pointer"
                    >
                      Clear Workspace
                    </button>
                  )}
                </div>

                {notepadList.length === 0 ? (
                  <div className="bg-[#111114] border border-[#2A2A2D] rounded p-4 text-center space-y-3" id="notepad-empty-state">
                    <BookOpen size={24} className="text-[#707075] mx-auto opacity-60" />
                    <p className="text-xs text-[#A0A0A5] leading-relaxed">
                      No active drafts or email topics processed.
                    </p>
                    <div className="text-[10px] text-[#707075] font-mono leading-relaxed bg-[#0A0A0B] p-3 rounded border border-[#1A1A1D] text-left space-y-1">
                      <p className="text-[#C5A267] font-bold">Safe Local Copy Mode:</p>
                      <p>Aap Jarvios ko ek email draft compile karne ko kahein. Direct mail send nahin hogi, balki uska saara topic yahan visual notepad me copy-paste ke liye available ho jayega!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4" id="notepad-list-items">
                    {notepadList.map((item) => (
                      <div key={item.id} className="bg-[#111114] border border-[#2A2A2D] rounded p-3.5 space-y-3 relative hover:border-[#C5A267]/40 transition-all text-xs font-mono">
                        <div className="flex justify-between items-center gap-1">
                          <span className="text-[9px] text-[#C5A267] border border-[#C5A267]/30 bg-[#C5A267]/5 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">EMAIL TOPIC</span>
                          <button 
                            onClick={() => setNotepadList((prev) => prev.filter((p) => p.id !== item.id))}
                            className="text-[#707075] hover:text-red-400 text-sm font-bold transition-colors w-5 h-5 flex items-center justify-center rounded hover:bg-[#1A1A1D]"
                          >
                            ×
                          </button>
                        </div>

                        {item.recipient && (
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-[#707075] uppercase block font-bold">Recipient:</span>
                            <span className="text-[#E0E0E0] select-all break-all">{item.recipient}</span>
                          </div>
                        )}

                        {item.subject && (
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-[#707075] uppercase block font-bold">Subject:</span>
                            <span className="text-[#E0E0E0] select-all font-sans font-medium leading-tight">{item.subject}</span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <span className="text-[9px] text-[#707075] uppercase block font-bold">Draft Content (Copyable):</span>
                          <textarea
                            readOnly
                            value={item.body}
                            className="w-full bg-[#0A0A0B] border border-[#2A2A2D] rounded p-2 text-[11px] font-sans text-[#E0E0E0] h-24 focus:border-[#C5A267] outline-none resize-none select-text leading-relaxed"
                          />
                        </div>

                        <button
                          onClick={() => {
                            const copyText = `To: ${item.recipient}\nSubject: ${item.subject}\n\n${item.body}`;
                            navigator.clipboard.writeText(copyText);
                            setCopiedId(item.id);
                            setTimeout(() => setCopiedId(""), 2200);
                          }}
                          className={`w-full py-2 tracking-wider rounded-sm text-[10px] uppercase transition-all cursor-pointer text-center font-mono flex items-center justify-center gap-1.5 ${
                            copiedId === item.id 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                              : "bg-[#C5A267] hover:bg-[#B38E55] text-black font-semibold"
                          }`}
                        >
                          <Send size={11} />
                          <span>{copiedId === item.id ? "COPIED TO CLIPBOARD!" : "COPY WHOLE CONTENT"}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-5" id="configs-tab-content">
                <div className="pb-1 border-b border-[#2A2A2D] flex items-center justify-between">
                  <h3 className="font-serif italic text-[#F5F5F7] text-[#C5A267] text-md">Intelligence Config</h3>
                  <Settings2 size={13} className="text-[#707075]" />
                </div>

                {/* Slider Controls */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] text-[#A0A0A5] font-mono uppercase tracking-wider mb-1.5">
                      <span>Core Temperature</span>
                      <span className="text-[#C5A267]">{temperatureValue.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0"
                      max="2"
                      step="0.05"
                      value={temperatureValue}
                      onChange={(e) => setTemperatureValue(parseFloat(e.target.value))}
                      className="w-full h-1 bg-[#2A2A2D] accent-[#C5A267] rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-[#A0A0A5] font-mono uppercase tracking-wider mb-1.5">
                      <span>Model Intelligence</span>
                      <span className="text-[#C5A267]">{intelligenceValue}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0"
                      max="100"
                      value={intelligenceValue}
                      onChange={(e) => setIntelligenceValue(parseInt(e.target.value))}
                      className="w-full h-1 bg-[#2A2A2D] accent-[#C5A267] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Voice configurations: speech speed Slow/Normal/Fast */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#707075] font-bold">Vocalization Engine</p>
                    <Volume2 size={12} className="text-[#707075]" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button 
                      onClick={() => setSpeechSpeed("slow")}
                      className={`py-1.5 rounded transition-all font-mono border text-[10px] uppercase tracking-wider cursor-pointer ${
                        speechSpeed === "slow" 
                          ? "bg-[#2A2A2D] text-[#C5A267] border-[#C5A267]" 
                          : "bg-[#111114] text-[#A0A0A5] border-transparent hover:border-[#2A2A2D]"
                      }`}
                    >
                      Slow
                    </button>
                    <button 
                      onClick={() => setSpeechSpeed("normal")}
                      className={`py-1.5 rounded transition-all font-mono border text-[10px] uppercase tracking-wider cursor-pointer ${
                        speechSpeed === "normal" 
                          ? "bg-[#2A2A2D] text-[#C5A267] border-[#C5A267]" 
                          : "bg-[#111114] text-[#A0A0A5] border-transparent hover:border-[#2A2A2D]"
                      }`}
                    >
                      Normal
                    </button>
                    <button 
                      onClick={() => setSpeechSpeed("fast")}
                      className={`py-1.5 rounded transition-all font-mono border text-[10px] uppercase tracking-wider cursor-pointer ${
                        speechSpeed === "fast" 
                          ? "bg-[#2A2A2D] text-[#C5A267] border-[#C5A267]" 
                          : "bg-[#111114] text-[#A0A0A5] border-transparent hover:border-[#2A2A2D]"
                      }`}
                    >
                      Fast
                    </button>
                  </div>
                </div>



                {/* Registered tool guidelines summaries list */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#707075] font-bold pb-1 border-b border-[#2A2A2D]">Bidi Functional Tools</p>
                  <div className="space-y-2 text-xs">
                    
                    <div className="p-2.5 bg-[#111114] border border-[#2A2A2D] rounded-sm flex gap-2">
                      <Globe size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-mono text-[10px] text-[#F5F5F7] tracking-wide uppercase">Browser & YT Routing</p>
                        <p className="text-[10px] text-[#A0A0A5] leading-relaxed">Opens site links and plays targeted video paths on YouTube directly.</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#111114] border border-[#2A2A2D] rounded-sm flex gap-2">
                      <BookOpen size={13} className="text-[#C5A267] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-mono text-[10px] text-[#F5F5F7] tracking-wide uppercase">Aether PDF Compiler</p>
                        <p className="text-[10px] text-[#A0A0A5] leading-relaxed">Compiles real-time layouts and compiles downloads utilizing jsPDF.</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#111114] border border-[#2A2A2D] rounded-sm flex gap-2">
                      <Clock size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-mono text-[10px] text-[#F5F5F7] tracking-wide uppercase">Persistent Memory</p>
                        <p className="text-[10px] text-[#A0A0A5] leading-relaxed">Learns users name credentials and persists memory references in HTML storage slots.</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Quick Vocal Commands suggestions checklist */}
                <div className="bg-[#151518]/60 p-3 rounded border border-[#222225] text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#C5A267] font-bold mb-1.5 font-mono">
                    <AlertCircle size={11} className="shrink-0" />
                    <span>Diagnostic Queries</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-[#A0A0A5] font-mono leading-relaxed list-disc list-inside">
                    <li>"Open google.com"</li>
                    <li>"Search on YouTube for classic ambient loops"</li>
                    <li>"Create a Google Doc for my plan"</li>
                    <li>"Compile a PDF report titled System Status"</li>
                    <li>"Learn my name, call me Tony"</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Footer Status Bar metrics */}
      <footer className="h-8 border-t border-[#2A2A2D] bg-[#0D0D0F] flex items-center px-4 justify-between text-[10px] text-[#707075] tracking-tight font-mono" id="jarvios-footer">
        <div className="flex gap-4">
          <span>UTF-8</span>
          <span>AETHER NODE SYSTEM: 3.10.12</span>
          <span className="text-[#C5A267]">● Active Relay Mode</span>
        </div>
        <div className="flex gap-4 items-center">
          <span>MEMORY: 1.4 GB / 32 GB</span>
          <span className="flex items-center gap-1.5 bg-[#111114] px-2 py-0.5 rounded border border-[#2A2A2D]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            LATENCY: {latencyMs}ms
          </span>
        </div>
      </footer>

      {/* Dynamic API Key Configuration Dialog */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0D0D0F] border border-[#2A2A2D] rounded-lg shadow-2xl overflow-hidden p-6"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2D] mb-4">
                <Key className="text-[#C5A267]" size={20} />
                <h3 className="text-sm font-semibold text-[#F5F5F7]">Configure Custom API Key Credentials</h3>
              </div>

              <p className="text-xs text-[#A0A0A5] leading-relaxed mb-4">
                By default, JARVIOS establishes state tunnels with the backend's secure `GEMINI_API_KEY`. 
                You can insert your personal **Google AI Studio API Key** to route bidirectional Live processes directly.
              </p>

              <form onSubmit={handleKeySave} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#707075] block mb-1.5">Personal API Key</label>
                  <input 
                    type="password" 
                    placeholder="AIzaSy..."
                    value={copiedKey}
                    onChange={(e) => setCopiedKey(e.target.value)}
                    className="w-full bg-[#0A0A0B] text-xs font-mono text-[#E0E0E0] border border-[#2A2A2D] rounded px-3 py-2 outline-none focus:border-[#C5A267] transition-all"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowKeyModal(false)}
                    className="px-3 py-1.5 text-xs text-[#A0A0A5] hover:text-[#F5F5F7] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-[#C5A267] hover:bg-[#B38E55] text-black font-semibold text-xs rounded transition-all cursor-pointer shadow-lg"
                  >
                    LINK KEY ACCESS
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
