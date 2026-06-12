USE JARVIOS AI LINK -- https://jarvios.onrender.com/

# 🚀 JARVIOS - Live Speech-to-Speech AI Assistant

An advanced, real-time voice-to-voice AI assistant built leveraging the power of **Google AI Studio (Gemini Live API)**. **JARVIOS** acts as an intuitive, deeply conversational tutor and intelligent companion, designed to break down complex concepts and provide comprehensive, context-aware responses with high speed and natural cadence.

---

## 🌟 Key Features

* **Real-time Speech-to-Speech:** Low-latency voice interaction with seamless speech recognition and natural audio synthesis using Gemini's Live capabilities.
* **Intelligent Deep Explanations:** Powered by Google's cutting-edge LLMs to act as an expressive tutor, explaining tech, engineering, and logic in rich detail.
* **Interactive Motherboard UI:** A futuristic, cyber-themed dashboard layout featuring live connection status indicators and dynamic visualization components.
* **Secure Authentication:** Integrated with **Firebase Auth** for secure student and professional user access management.
* **Robust Real-time Backend:** Backed by a high-performance TypeScript Node server utilizing **WebSockets** for streaming live audio chunks efficiently.

---

## 🛠️ Tech Stack & Architecture

### Frontend
* **Framework:** React 18 with TypeScript & Vite (Ultra-fast builds)
* **Styling:** Tailwind CSS (Futuristic Dark Cyber Theme)
* **State & Hooks:** Custom `useLiveSession` management hook for real-time state synchronization.
* **Authentication:** Firebase Client SDK

### Backend
* **Runtime:** Node.js powered by `tsx` (TypeScript Execution)
* **Core API:** Google Gen AI Studio Live Session protocols
* **Communication:** WebSockets (`ws`) for fluid, full-duplex speech streaming

---

## 📁 Repository Structure

```text
JARVIOS--main/
├── src/
│   ├── components/
│   │   └── Motherboard.tsx    # Cyber-themed primary dashboard UI layout
│   ├── hooks/
│   │   └── useLiveSession.ts  # Custom React hook controlling the speech API stream
│   ├── lib/
│   │   └── firebaseAuth.ts    # Firebase secure initialization and login handlers
│   ├── App.tsx                # Application core layout container
│   ├── main.tsx               # Application entry point
│   └── types.ts               # Strict TypeScript interface declarations
├── server.ts                  # High-performance WebSocket proxy backend for Gemini Live
├── firebase-applet-config.json# Firebase configuration manifest
├── vite.config.ts             # Bundler configuration file
└── .env.example               # Environment variables template




