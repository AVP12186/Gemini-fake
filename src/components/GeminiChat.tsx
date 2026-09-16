import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  User,
  Copy,
  Check,
  Zap,
  Clock,
  Play,
  CornerDownLeft,
  AlertCircle,
  Code2,
  Columns,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Plus,
  Mic,
  Infinity,
  Terminal,
  FileText,
  Search,
  CheckCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { StudioSettings, ChatMessage, ProStatus } from "../types";
import { GeminiSparkle } from "./GeminiSparkle";

interface GeminiChatProps {
  settings: StudioSettings;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onReset: () => void;
  onOpenInCanvas: (code: string, title?: string) => void;
  error?: string | null;
  proStatus: ProStatus;
  onOpenUpgradeModal: () => void;
}

const GEMINI_SUGGESTIONS = [
  {
    title: "Interactive Canvas Dashboard",
    desc: "Build a responsive data dashboard with charts and real-time filters",
    prompt: "Create an interactive sales analytics dashboard in a single self-contained HTML/CSS/JS block with sleek dark mode aesthetics, interactive charts, and live filters for Gemini Canvas",
    icon: Columns,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    title: "Modular Code Architecture",
    desc: "Generate clean TypeScript utility types and state machines",
    prompt: "Write a complete, well-typed TypeScript implementation of an undo/redo history manager with unit tests and immutability",
    icon: Terminal,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    title: "Deep Quantum Reasoning",
    desc: "Explain complex algorithms and computational complexity",
    prompt: "Explain how transformer self-attention mechanisms compute query-key-value dot products, and provide an intuitive step-by-step example with ASCII matrix diagrams",
    icon: Sparkles,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "Strategic Product Blueprint",
    desc: "Draft technical specifications and rollout strategy",
    prompt: "Draft a comprehensive technical architecture blueprint for an offline-first mobile sync engine with conflict resolution",
    icon: FileText,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
];

// Helper to extract runnable HTML or wrap JavaScript code into runnable HTML
export function extractRunnableCode(markdown: string): string | null {
  const htmlMatch = /```html([\s\S]*?)```/i.exec(markdown);
  if (htmlMatch && htmlMatch[1].trim()) {
    return htmlMatch[1].trim();
  }

  const jsMatch = /```(?:javascript|js)([\s\S]*?)```/i.exec(markdown);
  if (jsMatch && jsMatch[1].trim()) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #131314; color: #f0f4f9; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; }
    canvas { background: #1e1f20; border: 1px solid #333538; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    button { padding: 10px 20px; background: #3870e0; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    try {
      ${jsMatch[1].trim()}
    } catch(err) {
      document.body.innerHTML += '<p style="color:#ef4444; font-family: monospace;">Runtime Error: ' + err.message + '</p>';
    }
  </script>
</body>
</html>`;
  }

  return null;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({
  settings,
  messages,
  isLoading,
  onSendMessage,
  onReset,
  onOpenInCanvas,
  error,
  proStatus,
  onOpenUpgradeModal,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;

    // Check quota if not Pro
    if (!proStatus.isPro && proStatus.queriesUsed >= proStatus.freeLimit) {
      onOpenUpgradeModal();
      return;
    }

    onSendMessage(inputText);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const remaining = Math.max(0, proStatus.freeLimit - proStatus.queriesUsed);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full relative bg-[#131314] text-[#f0f4f9] overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {messages.length === 0 ? (
            /* Gemini iPad Welcoming Hero */
            <div className="h-full flex flex-col justify-center py-6 sm:py-10">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <GeminiSparkle size={34} />
                  <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#4285f4] via-[#9b72cf] to-[#d96570] bg-clip-text text-transparent tracking-tight">
                    Hello, Avi
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-medium text-[#9aa0a6]">
                  How can I help you today?
                </h2>
              </div>

              {/* iPad Gemini Prompt Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GEMINI_SUGGESTIONS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(item.prompt)}
                      className="p-3.5 rounded-2xl border border-[#282a2c] bg-[#1e1f20] hover:bg-[#282a2c] hover:border-[#3c4043] shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group h-28"
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-semibold text-xs sm:text-sm text-[#f0f4f9] group-hover:text-blue-400 transition-colors line-clamp-1">
                          {item.title}
                        </div>
                        <div className={`p-1.5 rounded-xl border ${item.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-[11px] text-[#9aa0a6] line-clamp-2">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              const codeToRun = !isUser ? extractRunnableCode(msg.content) : null;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1e1f20] border border-[#333538] shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                      <GeminiSparkle size={16} />
                    </div>
                  )}

                  <div className={`max-w-[92%] sm:max-w-[85%] ${isUser ? "" : "flex-1"}`}>
                    <div
                      className={`rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                        isUser
                          ? "bg-[#282a2c] text-[#f0f4f9] rounded-tr-sm ml-auto border border-[#3c4043]"
                          : "bg-[#1e1f20] border border-[#282a2c] text-[#f0f4f9] shadow-md"
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div>
                          {/* Gemini Canvas Ready Banner */}
                          {codeToRun && (
                            <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-purple-950/40 border border-blue-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                                  <Columns className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-2">
                                    <span>Gemini Canvas Ready</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                      Side View / Full Screen
                                    </span>
                                  </div>
                                  <div className="text-xs text-[#9aa0a6] mt-0.5">
                                    Live interactive preview alongside chat
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => onOpenInCanvas(codeToRun, "Canvas Application")}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0 hover:scale-[1.02]"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Open Canvas</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Markdown Message Body */}
                          <div className="markdown-body space-y-3 prose prose-invert prose-sm max-w-none text-[#e3e3e3]">
                            <ReactMarkdown
                              components={{
                                pre({ children }) {
                                  return (
                                    <div className="relative group my-3">
                                      <pre className="p-3.5 rounded-2xl bg-[#0e0e10] text-[#f0f4f9] overflow-x-auto text-xs font-mono leading-relaxed border border-[#282a2c]">
                                        {children}
                                      </pre>
                                    </div>
                                  );
                                },
                                code({ className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  return (
                                    <code
                                      className={`${
                                        match
                                          ? "font-mono text-blue-300"
                                          : "bg-[#282a2c] text-[#f0f4f9] px-1.5 py-0.5 rounded font-mono text-xs border border-[#3c4043]"
                                      }`}
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>

                          {/* Message Footer */}
                          <div className="mt-4 pt-2.5 border-t border-[#282a2c] flex items-center justify-between text-xs text-[#9aa0a6]">
                            <div className="flex items-center gap-3 font-mono text-[11px]">
                              {msg.elapsedMs && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#9aa0a6]" />
                                  {msg.elapsedMs}ms
                                </span>
                              )}
                              <span className="text-[#8ab4f8]">{settings.model}</span>
                            </div>

                            <button
                              onClick={() => handleCopy(msg.content, msg.id)}
                              className="flex items-center gap-1.5 text-[#9aa0a6] hover:text-white transition-colors text-xs p-1 rounded-lg hover:bg-[#282a2c]"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold shadow-md ring-1 ring-[#3c4043]">
                      A
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1e1f20] border border-[#333538] shadow-sm flex items-center justify-center shrink-0">
                <GeminiSparkle size={16} className="animate-spin" />
              </div>
              <div className="bg-[#1e1f20] border border-[#282a2c] rounded-2xl px-4 py-2.5 text-xs text-[#c4c7c5] flex items-center gap-2.5 shadow-md">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span className="text-[#f0f4f9] font-medium">
                  Gemini is thinking...
                </span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-2xl text-xs text-red-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-white">Unable to generate response</div>
                <div className="text-red-300 mt-0.5">{error}</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Signature Gemini iPad Floating Bottom Input Bar - strictly contained */}
      <div className="px-3 pb-3 pt-1 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent shrink-0 w-full">
        <div className="max-w-3xl mx-auto w-full">
          {/* Quota Status / Upgrade Callout */}
          <div className="mb-1.5 flex items-center justify-center text-center text-xs">
            {proStatus.isPro ? (
              <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-medium">
                <Infinity className="w-3.5 h-3.5 text-blue-400" />
                <span>Gemini 3.1 Pro &bull; Infinite Usage Active</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
            ) : (
              <button
                onClick={onOpenUpgradeModal}
                className="group flex items-center gap-1.5 text-[11px] text-[#9aa0a6] hover:text-white transition-colors"
              >
                <span>Free Tier: <strong>{remaining}</strong> prompts remaining</span>
                <span className="text-[#3c4043]">&bull;</span>
                <span className="text-blue-400 group-hover:underline flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Upgrade to Pro for Free Gemini 3.1 Pro & Infinite Usage
                </span>
              </button>
            )}
          </div>

          {/* The iPad Curved Input Capsule */}
          <div className="bg-[#1e1f20] rounded-[26px] border border-[#333538] p-2.5 sm:p-3 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-2xl transition-all relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={adjustTextareaHeight}
              onKeyDown={handleKeyDown}
              placeholder={
                !proStatus.isPro && remaining === 0
                  ? "Quota reached! Solve the puzzle to unlock infinite usage..."
                  : "Ask Gemini or build interactive Canvas apps..."
              }
              className="w-full text-xs sm:text-sm text-[#f0f4f9] placeholder-[#9aa0a6] bg-transparent border-none focus:outline-none resize-none max-h-36 px-2 pt-1"
              disabled={isLoading || (!proStatus.isPro && remaining === 0)}
            />

            {/* Bottom actions row inside input bar */}
            <div className="flex items-center justify-between pt-1.5 px-1 mt-1 border-t border-[#282a2c]">
              {/* Left Tools Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowToolsMenu(!showToolsMenu)}
                  className="p-1.5 rounded-full hover:bg-[#282a2c] text-[#9aa0a6] hover:text-white transition-colors"
                  title="Add tools / attachments"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Tools Popover */}
                {showToolsMenu && (
                  <div className="absolute bottom-16 left-3 bg-[#1e1f20] border border-[#333538] rounded-2xl p-2 shadow-2xl z-40 w-56 flex flex-col gap-1 text-xs text-[#f0f4f9]">
                    <button
                      onClick={() => {
                        setInputText("Create an interactive canvas application: ");
                        setShowToolsMenu(false);
                        textareaRef.current?.focus();
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#282a2c] text-left transition-colors"
                    >
                      <Columns className="w-4 h-4 text-blue-400" />
                      <span>Generate Canvas App</span>
                    </button>
                    <button
                      onClick={() => {
                        setInputText("Deep Research and synthesize: ");
                        setShowToolsMenu(false);
                        textareaRef.current?.focus();
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#282a2c] text-left transition-colors"
                    >
                      <Search className="w-4 h-4 text-purple-400" />
                      <span>Deep Research</span>
                    </button>
                    <button
                      onClick={() => {
                        onOpenUpgradeModal();
                        setShowToolsMenu(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#282a2c] text-left transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Pro Upgrade Puzzle</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Mic & Send Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="p-1.5 rounded-full hover:bg-[#282a2c] text-[#9aa0a6] hover:text-white transition-colors"
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSend}
                  disabled={(!inputText.trim() && (proStatus.isPro || remaining > 0)) || isLoading}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                    !proStatus.isPro && remaining === 0
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105"
                      : inputText.trim() && !isLoading
                      ? "bg-[#e3e3e3] text-[#131314] hover:bg-white hover:scale-105 shadow-md"
                      : "bg-[#282a2c] text-[#5f6368] cursor-not-allowed"
                  }`}
                  title={!proStatus.isPro && remaining === 0 ? "Upgrade to Pro" : "Send (Enter)"}
                  aria-label="Send message"
                >
                  {!proStatus.isPro && remaining === 0 ? (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  ) : (
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-[#9aa0a6] mt-1 truncate">
            Gemini may display inaccurate info, so double-check its responses.
          </div>
        </div>
      </div>
    </div>
  );
};
