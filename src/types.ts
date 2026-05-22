export type SessionState = "disconnected" | "connecting" | "listening" | "speaking";

export interface ChatMessage {
  id: string;
  sender: "user" | "jarvios" | "system";
  text: string;
  timestamp: string;
}

export interface WorkspaceDoc {
  id: string;
  title: string;
  size: string;
  type: string;
  date: string;
  pdfDataUrl?: string;
}

export interface SystemMetrics {
  latencyMs: number;
  gpuUtilization: string;
  memoryUsage: string;
  syncStatus: string;
}

export interface NotepadItem {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
}

