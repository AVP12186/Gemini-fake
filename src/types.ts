export type StudioMode = "chat-canvas";

export type ModelId = "gemini-3.8-flash" | "gemini-3.1-pro-preview" | "gemini-3.1-flash-lite";

export type EffortLevel = "DEFAULT" | "LOW" | "HIGH" | "MINIMAL";

export interface StudioSettings {
  model: ModelId;
  temperature: number;
  effort: EffortLevel;
  topP: number;
  topK: number;
  deepThinking?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  elapsedMs?: number;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
}

export type ScreenLayout = "single" | "dual" | "triple";
export type CanvasLayoutMode = "side" | "fullscreen";
export type CanvasAspect = "16:9" | "16:9-cinema" | "fill";

export interface ProStatus {
  isPro: boolean;
  queriesUsed: number;
  freeLimit: number;
  unlockedAt?: number;
}
