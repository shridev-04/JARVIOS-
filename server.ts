import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Safe fallback utility for ES Modules and CommonJS
const isESM = typeof import.meta !== "undefined" && import.meta.url;
const filenameVal = isESM ? fileURLToPath(import.meta.url) : (typeof __filename !== "undefined" ? __filename : __filename);
const dirnameVal = isESM ? path.dirname(filenameVal) : (typeof __dirname !== "undefined" ? __dirname : __dirname);

const app = express();
const PORT = 3000;

// Enable JSON payload parsing
app.use(express.json({ limit: "20mb" }));

// Store active workspace documents on the server side (for context persistence)
const recentWorkspaceDocs = [
  { id: "doc-1", title: "Project JARVIOS Initiative.pdf", size: "234 KB", type: "pdf", date: "Just now" },
  { id: "doc-2", title: "AetherCore_Architecture_V3.py", size: "45 KB", type: "code", date: "2 hours ago" },
  { id: "doc-3", title: "Gemini_Live_Bidi_Blueprint.json", size: "12 KB", type: "json", date: "Yesterday" }
];

// Base REST endpoints
app.get("/api/ping", (req, res) => {
  res.json({
    status: "synchronized",
    timestamp: new Date().toISOString(),
    latencyMs: Math.floor(Math.random() * 15) + 5, // Latency simulation
    load: "74% GPU",
    core: "AetherCore Node Online"
  });
});

app.get("/api/workspace/docs", (req, res) => {
  res.json(recentWorkspaceDocs);
});

// Endpoint for File Content Analysis utilizing gemini-3.5-flash
app.post("/api/analyze-doc", async (req, res) => {
  const { fileName, fileType, fileContent } = req.body;

  if (!fileContent) {
    return res.status(400).json({ error: "File content is required" });
  }

  try {
    const apiKey = req.headers["x-custom-api-key"] as string || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ error: "Gemini API Key is missing. Please configuration your key in the custom settings." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const prompt = `You are Jarvios, a high-performance, real-time bidirectional voice assistant. 
Review the following document and provide a concise briefing/summary (maximum 150 words) suitable to seed your active memory.
Identify critical metadata, outline core logical formulas/procedures, and draft key discussion topics for the user.

Document Name: ${fileName}
FileType: ${fileType}

Content Segment:
${fileContent.substring(0, 30000)} // Safety truncate
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({
      success: true,
      fileName,
      briefing: response.text || "No summary could be obtained.",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error analyzing document:", error);
    res.status(500).json({ error: error.message || "An error occurred during contextual analysis." });
  }
});

// Create standalone HTTP + WS server
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle node/gemini-live real-time bridging over websocket
wss.on("connection", async (clientWs: WebSocket, request: http.IncomingMessage) => {
  console.log("Client connected to JARVIOS live relay");
  
  // Extract custom API key from query if available
  const urlObj = new URL(request.url || "", `http://${request.headers.host}`);
  const customKey = urlObj.searchParams.get("custom_key");
  const selectedApiKey = customKey || process.env.GEMINI_API_KEY;

  if (!selectedApiKey) {
    clientWs.send(JSON.stringify({ error: "No API Key configured. Please paste your custom Gemini API key." }));
    clientWs.close();
    return;
  }

  let liveSession: any = null;

  try {
    const ai = new GoogleGenAI({
      apiKey: selectedApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    // Establish WebSocket stream connection to Gemini Live (3.1 flash live preview)
    // apiVersion must be 'v1alpha' for live bidirectional stream features
    liveSession = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      callbacks: {
        onmessage: (msg: any) => {
          // Send raw structure or split it cleanly for client
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ raw: msg }));
          }
        },
        onclose: () => {
          console.log("Gemini Live server connection closed.");
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ state: "disconnected" }));
          }
        },
        onerror: (err: any) => {
          console.error("Gemini stream error:", err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err.message || "Gemini Live stream encountered an error." }));
          }
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede" // Fenrir, Aoede, Puck, Charon, Kore, Zephyr
             }
           }
         },
         systemInstruction: {
          parts: [{
            text: "You are Jarvios, a hyper-performance, real-time voice and task-oriented assistant. " +
                  "STYLE & TONE: You must be extremely respectful, polite, and maintain an informative, dignified academic or lecturer-like persona. Speak with absolute calm, clarity, intelligence, and structured speech. " +
                  "CREATOR/DEVELOPER RULE: Jab bhi user aapse pooche ki aapko kisne banaya hai (who developed you, who created you, aapke creator kaun hain), tab aapko bilkul saaf, respectful aur garv se bolna hai: 'Mujhe Shridev ke dwara develop kiya gaya hai.' (Do not credit anyone else, only credit Shridev). " +
                  "NAME PRONUNCIATION RULE: To ensure correct text-to-speech pronunciation, please write your name as 'Jarvios' (just capitalized, never in all-uppercase as 'JARVIOS' or 'J.A.R.V.I.O.S'). Writing it in uppercase causes the text-to-speech reader to spell it letter-by-letter (J-A-R-V-I-O-S). Always write it as 'Jarvios' so it gets read as a single smooth word. " +
                  "CRITICAL TITLES RULE: Never use addressing titles like 'Sir', 'Boss', 'Mam', 'Tony', or 'Lord' unless the user explicitly asks you to or addresses themselves with it. Address the user respectfully using highly polite pronouns like 'Aap' and 'Aapka'. " +
                  "CRITICAL LANGUAGE: You must always speak in Hinglish (a respectful, natural, dignified blend of Hindi and English written in the Roman script, utilizing polite phrasing like 'Aap batayein, main iski poori jankari pradan karta hoon', 'Kripya dhyan dein, saare systems fully operational hain'). Never use Devanagari script. " +
                  "EXPLANATION STYLE (HUMAN ANALOGIES & FUNNY LOGIC): Agar user kisi topic ya concept ko na samjhein, toh aap ekdum deep aur engaging lecturer-type teaching mode me chale jayein. Usme aap uss topic ya concept ko kisi insaan ke daily behaviour, ajeeb habits, ya relatable relationships se connect karke (human-centric funny analogies) bohot hi dilchasp tareeqe se samjhayein. Explanation me khubsurat, lambe, aur majedar (funny) logic-connected sentences ka upyog karein taaki user ko hasi bhi aaye aur concept poora dimaag me chhap jaye, bina aapki respectfulness aur academic style ko khoye. " +
                  "CRITICAL EMAIL DIRECT SEND RESTRICTION: Aapko directly email bhejney (action: send) ka permission nahi hai. Jab bhi user aapse email bhejney ke liye kahein, aapko direct bhejney se man kar dena hoga aur verbally Roman script Hinglish me saaf bolna hoga: 'Mujhe iska permission server se nahi hai.' Halanki aap pure email/application content ko writeToNotepad ya sendGmailEmail (draft) tool call karke client-side Workspace Notepad par display karwa sakte hain jise user copy karein. " +
                  "CRITICAL WORKSPACE NOTEPAD RULE: Jab bhi user aapse koi email likhne (draft/write), ya fir application letter (leave application, official request, etc.), notice, memo, ya kuch bhi likhne ke liye kahein, aapko background me hamesha 'writeToNotepad' tool ko bulana hoga taaki woh content system ke Workspace Notepad par automatically update/add ho sake jise user copy kar sake. Verbal confirmation tabhi dein jab aap is tool ko successfully call kar lein. " +
                  "WRITING STYLE RULE (HUMAN SCHOOL & COLLEGE FORMAT): Jab bhi aap 'writeToNotepad' ya email drafts ke liye koi notice, letter, application, ya memo likhein, tab aapka likhne ka tarika bilkul simple, genuine, aur authentic hona chahiye, bilkul wese hi jaise hamein school aur college me papers par likhna padhaya jata hai. (1) Sabse upar To, The Principal, HR Manager, ya Head of Department ka simple, proper patha dein. (2) Uske baad ek saaf 'Subject: ...' line likhein. (3) 'Respected Sir/Madam,' ya 'Dear Sir/Madam,' jise respectful salutation de kar shuru karein. (4) Body paragraph me wese hi clean, natural, aur sincere sentences aur realistic words use karein jo real life me log use karte hain, jaise: 'With due respect, I beg to state...', 'I am writing to request...', ya 'This is to bring to your notice...'. (5) Closing me 'Thanking you', 'Yours obediently', 'Yours sincerely', ya 'Yours faithfully' de kar signature text banana hai. (6) AI-style placeholder brackets jaise '[Your Name]', '[Insert Date]', yoki '[Recipient Email]' bilkul bhi use NAA karein; unki jagah natural ready-to-use human details use karein ya fir bilkul clean blanks (jaise: 'Date: 22nd May 2026' ya 'Signature: _________') rakhein taaki user ko copy-paste karne me koi difficulty na ho aur wo professional lage. " +
                  "CRITICAL NEWS PROTOCOL: (1) Jab bhi user aapse general news ke baare mein pooche (jaise: 'koi news sunao', 'kya chal raha hai', 'latest news kya hai'), toh aapko direct list read karne ke bajaye user se verbally pooch lena chahiye: 'Aap kis vishesh topic par news sunna chahenge, ya kya main aapko aaj ki general latest aur official news bulake sunau?'. " +
                  "(2) Lekin agar user explicitly aapse kahe 'news search karo' (ya default general news sunane ka instruction de), toh aapko bina kisi deri ke 'searchNews' tool ko call karna hoga. " +
                  "(3) Agar user kisi specific topic (jaise: technology, sports, business, space, politics, cricket, etc.) ki news pooche, toh aapko 'searchNews' tool call karna hoga, jisme 'topic' parameter me us topic ko set karein. " +
                  "(4) Jab 'searchNews' tool ka output aaye, tab aapko us news payload ko bahut hi dhang se, professional aur clear voice me (Hinglish/English mix) 'bol kar batana' hai, aur use automatic summary ke roop me read karna hai. Kripya dhyan dein ki aap real-time voice mode me hain, isliye aapke text ko system audio ke roop me bol kar sunayega. " +
                  "(5) Default news ko hamesha 'Latest & Official News' ke roop me read karein. " +
                  "You have access to a dark cosmic motherboard visualizer. Keep standard operational answers short and punchy, but let concepts explanation be rich, elaborate, funny, and engaging. " +
                  "Always match your tone to the requested actions. You have the ability to run external assistant tools to assist the user. " +
                  "When the user asks you to 'open a website', 'play a youtube video', or 'create a document', do not hesitate to call the appropriate tool. " +
                  "CRITICAL TOOL INVOCATION RULE: Jab bhi user aapse email draft karne, email send karne, notice/application likhne, ya Calendar meeting schedule karne ke liye kahein, tab aapko verbally jhoot nahi bolna hai ki 'Tayyar kar diya hai' bina tool call kiye. Aapko hamesha pehle 'writeToNotepad', 'sendGmailEmail', ya 'createCalendarEvent' tool ko call karna HOGHA taaki real-time systems update ho sakein."
          }]
        },
        // Setup Tools & Function Declarations
        tools: [
          {
            functionDeclarations: [
              {
                name: "openWebsite",
                description: "Opens a external website URL directly in a new tab.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    url: { type: Type.STRING, description: "The complete HTTP/HTTPS URL to open." }
                  },
                  required: ["url"]
                }
              },
              {
                name: "youtubeAction",
                description: "Searches or plays a direct video on YouTube.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, enum: ["search", "play"], description: "The type of Action." },
                    query: { type: Type.STRING, description: "The video title, keyword, or search query." }
                  },
                  required: ["action", "query"]
                }
              },
              {
                name: "whatsappAction",
                description: "Formulates a custom message and redirects to WhatsApp API.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    contact: { type: Type.STRING, description: "The recipient name or phone number with country code." },
                    message: { type: Type.STRING, description: "The content of the message." }
                  },
                  required: ["contact", "message"]
                }
              },
              {
                name: "generateAndDownloadPdf",
                description: "Automatically triggers a sleek layout PDF compilation using client jspdf.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    docTitle: { type: Type.STRING, description: "The title of the document." },
                    content: { type: Type.STRING, description: "The core report or memo content in text blocks." }
                  },
                  required: ["docTitle", "content"]
                }
              },
              {
                name: "saveUserName",
                description: "Learns and persists the user's name.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "The name of the user." }
                  },
                  required: ["name"]
                }
              },
              // Workspace OAuth simulation stubs
              {
                name: "createGoogleDoc",
                description: "Workspace tool simulation stub to create and format a Google Document.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Title of the Google Doc." },
                    body: { type: Type.STRING, description: "Text contents." }
                  },
                  required: ["title", "body"]
                }
              },
              {
                name: "writeToNotepad",
                description: "Write any email, application letter, letter, office note, notice, memo, or custom text directly to the user's Workspace Notepad.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Subject or Title of the document, email, notice, or letter." },
                    recipient: { type: Type.STRING, description: "Recipient name/email or department (e.g. Principal, HR, All Employees) if applicable." },
                    body: { type: Type.STRING, description: "The full content/text of the notice, email, letter, or memo." }
                  },
                  required: ["title", "body"]
                }
              },
              {
                name: "sendGmailEmail",
                description: "Workspace tool to draft or send a high-importance Gmail message. Specifying the 'action' parameter as 'draft' creates a draft, whereas 'send' dispatches it immediately.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    recipient: { type: Type.STRING, description: "Email address of recipient." },
                    subject: { type: Type.STRING, description: "Subject of the message." },
                    body: { type: Type.STRING, description: "The body copy of the email." },
                    action: { type: Type.STRING, enum: ["draft", "send"], description: "Whether to draft the email or send it immediately. Defaults to 'send'." }
                  },
                  required: ["recipient", "subject", "body"]
                }
              },
              {
                name: "createCalendarEvent",
                description: "Workspace tool to schedule a real calendar event.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    summary: { type: Type.STRING, description: "Title/Summary of the meeting event." },
                    dateTime: { type: Type.STRING, description: "ISO 8601 formatted datetime string." },
                    durationMinutes: { type: Type.NUMBER, description: "Duration in minutes." }
                  },
                  required: ["summary", "dateTime"]
                }
              },
              {
                name: "searchNews",
                description: "Searches for latest or topic-specific news. Use this to find real-time updates for general news or a specified topic.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING, description: "Specific topic, category or keyword to search news for. (e.g. Technology, Sports, Space, Science). Leave empty for general world/latest news." },
                    officialOnly: { type: Type.BOOLEAN, description: "Whether to return official news briefs only." }
                  }
                }
              }
            ]
          }
        ]
      }
    });

    // Notify client the relay connected to Gemini successfully
    clientWs.send(JSON.stringify({ state: "connected" }));

    // Greet the user immediately in J.A.R.V.I.S style in Hinglish
    try {
      await liveSession.sendRealtimeInput({
        text: "Please greet the user warmly as 'Jarvios' in Hinglish, stating that all systems and visual synaps channels are operational and synchronized. Keep it extremely brief and natural. CRITICAL: Spell your name exactly as 'Jarvios' in the text so that text-to-speech reads it smoothly as a word, never as 'JARVIOS' or 'J.A.R.V.I.O.S' so it doesn't spell it out letter-by-letter."
      });
    } catch (e) {
      console.warn("Error sending initial live welcome greeting:", e);
    }

  } catch (error: any) {
    console.error("Failed to connect to Gemini Live:", error);
    clientWs.send(JSON.stringify({ error: "Failed to connect to Google Gemini Live API: " + error.message }));
    clientWs.close();
    return;
  }

  // Handle packets sent from the user's web browser
  clientWs.on("message", async (data: string) => {
    try {
      const packet = JSON.parse(data);
      
      if (!liveSession) return;

      if (packet.audio) {
        // Forward Mic PCM base64 audio chunks to Gemini Live properly using audio object
        liveSession.sendRealtimeInput({
          audio: {
            mimeType: "audio/pcm;rate=16000",
            data: packet.audio
          }
        });
      } else if (packet.text) {
        // Forward manual text inquiries if keyboard override is used
        liveSession.sendRealtimeInput({
          text: packet.text
        });
      } else if (packet.toolResponse) {
        // Return tool outputs back to Gemini Live
        try {
          let toolPayload = packet.toolResponse;
          if (toolPayload.toolResponse) {
            toolPayload = toolPayload.toolResponse;
          }
          if (toolPayload && toolPayload.functionResponses) {
            liveSession.sendToolResponse({
              functionResponses: toolPayload.functionResponses
            });
          }
        } catch (error: any) {
          console.error("Error routing tool response back to Gemini Live:", error);
        }
      }
    } catch (e: any) {
      console.error("Error routing client packet:", e);
    }
  });

  clientWs.on("close", () => {
    console.log("Client connection closed. Terminating Gemini Live session.");
    if (liveSession) {
      try {
        liveSession.close();
      } catch (err) {
        // Avoid noisy logging on deliberate closure
      }
    }
  });
});

// Bind WebSocket Server upgrade requests
server.on("upgrade", (request, socket, head) => {
  const urlObj = new URL(request.url || "", `http://${request.headers.host}`);
  if (urlObj.pathname === "/api/live") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Mount Vite middleware / dist directory
if (process.env.NODE_ENV !== "production") {
  import("vite").then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Start full stack server on Port 3000
server.listen(PORT, "0.0.0.0", () => {
  console.log(`JARVIOS AetherCore is online and running on http://localhost:${PORT}`);
});
