import React, { useState, useEffect } from "react";
import { GeminiNavbar } from "./components/GeminiNavbar";
import { GeminiSidebar } from "./components/GeminiSidebar";
import { GeminiChat, extractRunnableCode } from "./components/GeminiChat";
import { GeminiCanvas } from "./components/GeminiCanvas";
import { ProPuzzleModal } from "./components/ProPuzzleModal";
import { StudioSettings, ChatMessage, ModelId, CanvasLayoutMode, ChatSession, ProStatus } from "./types";

const DEFAULT_SETTINGS: StudioSettings = {
  model: "gemini-3.8-flash",
  temperature: 0.7,
  effort: "DEFAULT",
  topP: 0.95,
  topK: 40,
};

const INITIAL_CANVAS_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gemini Canvas Analytics</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #131314;
      color: #f0f4f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .card {
      background: #1e1f20;
      border: 1px solid #333538;
      border-radius: 20px;
      padding: 24px;
      width: 100%;
      max-width: 680px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .title { font-size: 20px; font-weight: 700; color: #fff; }
    .badge {
      background: rgba(66, 133, 244, 0.15);
      color: #8ab4f8;
      border: 1px solid rgba(66, 133, 244, 0.3);
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 600;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .metric-box {
      background: #282a2c;
      border-radius: 14px;
      padding: 14px;
      text-align: center;
    }
    .metric-val { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .metric-lbl { font-size: 11px; color: #9aa0a6; }
    .btn-row { display: flex; gap: 10px; }
    button {
      flex: 1;
      padding: 12px;
      border-radius: 12px;
      border: none;
      background: #3870e0;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: 0.2s;
    }
    button:hover { background: #4a82f0; transform: translateY(-1px); }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">Gemini iPad Canvas</div>
      <div class="badge">Live Sandbox</div>
    </div>
    <div class="metrics">
      <div class="metric-box">
        <div class="metric-val" id="val1">99.8%</div>
        <div class="metric-lbl">Model Accuracy</div>
      </div>
      <div class="metric-box">
        <div class="metric-val" id="val2">14ms</div>
        <div class="metric-lbl">Thinking Latency</div>
      </div>
      <div class="metric-box">
        <div class="metric-val" id="val3">Infinity</div>
        <div class="metric-lbl">Usage Capacity</div>
      </div>
    </div>
    <div class="btn-row">
      <button onclick="simulateMetrics()">Simulate Live Pulse</button>
    </div>
  </div>

  <script>
    function simulateMetrics() {
      const v1 = (98 + Math.random() * 1.9).toFixed(1) + "%";
      const v2 = Math.floor(10 + Math.random() * 8) + "ms";
      document.getElementById("val1").innerText = v1;
      document.getElementById("val2").innerText = v2;
    }
  </script>
</body>
</html>`;

export default function App() {
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Pro & Infinite Usage State
  const [proStatus, setProStatus] = useState<ProStatus>(() => {
    const isProSaved = typeof window !== "undefined" && localStorage.getItem("gemini_pro_unlimited") === "true";
    const usedSaved = typeof window !== "undefined" ? parseInt(localStorage.getItem("gemini_queries_used") || "0", 10) : 0;
    return {
      isPro: isProSaved,
      queriesUsed: usedSaved,
      freeLimit: 5,
      unlockedAt: isProSaved ? Date.now() : undefined,
    };
  });

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // If user is saved as Pro on load, ensure model is Gemini 3.1 Pro
  useEffect(() => {
    if (proStatus.isPro) {
      setSettings((prev) => ({
        ...prev,
        model: "gemini-3.1-pro-preview",
      }));
    }
  }, [proStatus.isPro]);

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => [
    {
      id: "sess_welcome",
      title: "New chat",
      timestamp: Date.now(),
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState("sess_welcome");
  const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({
    sess_welcome: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gemini Canvas State
  const [canvasCode, setCanvasCode] = useState<string>(INITIAL_CANVAS_CODE);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasTitle, setCanvasTitle] = useState<string>("Interactive Canvas");
  const [canvasLayout, setCanvasLayout] = useState<CanvasLayoutMode>("side");
  const [mobileTab, setMobileTab] = useState<"chat" | "canvas">("chat");

  // Health check on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setApiConnected(true);
        }
      })
      .catch((err) => {
        console.warn("API health check warning:", err);
      });
  }, []);

  const currentMessages = sessionMessages[activeSessionId] || [];

  // When user solves the Pro puzzle: grants Gemini 3.1 Pro for free + Infinite Usage!
  const handleProUnlock = () => {
    localStorage.setItem("gemini_pro_unlimited", "true");
    setProStatus((prev) => ({
      ...prev,
      isPro: true,
      unlockedAt: Date.now(),
    }));
    // Grant free Gemini 3.1 Pro model!
    setSettings((prev) => ({
      ...prev,
      model: "gemini-3.1-pro-preview",
      effort: "HIGH",
    }));
  };

  // Model selection handler with Pro gating
  const handleChangeModel = (newModel: ModelId) => {
    if (newModel === "gemini-3.1-pro-preview" && !proStatus.isPro) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setSettings((prev) => ({ ...prev, model: newModel }));
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check quota if not Pro
    if (!proStatus.isPro && proStatus.queriesUsed >= proStatus.freeLimit) {
      setIsUpgradeModalOpen(true);
      return;
    }

    // Safety fallback: if user is not Pro, do not allow Gemini 3.1 Pro
    const effectiveModel =
      !proStatus.isPro && settings.model === "gemini-3.1-pro-preview"
        ? "gemini-3.8-flash"
        : settings.model;

    setError(null);

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    const updated = [...currentMessages, userMessage];
    setSessionMessages((prev) => ({
      ...prev,
      [activeSessionId]: updated,
    }));

    // Increment query count if on free tier
    if (!proStatus.isPro) {
      const nextCount = proStatus.queriesUsed + 1;
      localStorage.setItem("gemini_queries_used", nextCount.toString());
      setProStatus((prev) => ({
        ...prev,
        queriesUsed: nextCount,
      }));
    }

    // Auto-update session title if it's the first message
    if (currentMessages.length === 0) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, title: text.slice(0, 26) + (text.length > 26 ? "..." : "") }
            : s
        )
      );
    }

    setIsLoading(true);

    try {
      const payload = {
        messages: updated.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        model: effectiveModel,
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        thinkingLevel: settings.effort,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      const assistantText = data.text || "No response generated.";

      const assistantMessage: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: assistantText,
        timestamp: Date.now(),
        elapsedMs: data.elapsedMs,
      };

      setSessionMessages((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || updated), assistantMessage],
      }));

      // If runnable code was returned in response, load into Canvas & open on the side
      const detected = extractRunnableCode(assistantText);
      if (detected) {
        setCanvasCode(detected);
        setCanvasTitle("Canvas App");
        setIsCanvasOpen(true);
        setMobileTab("canvas");
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Failed to communicate with Gemini API.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newId = `sess_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New chat",
      timestamp: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setSessionMessages((prev) => ({
      ...prev,
      [newId]: [],
    }));
    setError(null);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fallback: ChatSession = {
          id: `sess_${Date.now()}`,
          title: "New chat",
          timestamp: Date.now(),
        };
        setActiveSessionId(fallback.id);
        setSessionMessages({ [fallback.id]: [] });
        return [fallback];
      }
      if (id === activeSessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });

    setSessionMessages((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleOpenInCanvas = (code: string, title?: string) => {
    setCanvasCode(code);
    if (title) setCanvasTitle(title);
    setIsCanvasOpen(true);
    setMobileTab("canvas");
  };

  const handleToggleCanvas = () => {
    setIsCanvasOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen w-screen bg-[#131314] text-[#f0f4f9] overflow-hidden select-none font-sans">
      {/* Collapsible Gemini iPad Sidebar */}
      <GeminiSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        settings={settings}
        onChangeSettings={setSettings}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setIsSidebarOpen(false);
        }}
        onNewChat={() => {
          handleNewChat();
          setIsSidebarOpen(false);
        }}
        onDeleteSession={handleDeleteSession}
        isCanvasOpen={isCanvasOpen}
        onToggleCanvas={handleToggleCanvas}
        proStatus={proStatus}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Gemini iPad Navbar */}
        <GeminiNavbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          settings={settings}
          onChangeModel={handleChangeModel}
          apiConnected={apiConnected}
          isCanvasOpen={isCanvasOpen}
          onToggleCanvas={handleToggleCanvas}
          canvasLayout={canvasLayout}
          onChangeCanvasLayout={setCanvasLayout}
          onNewChat={handleNewChat}
          mobileTab={mobileTab}
          onChangeMobileTab={setMobileTab}
          proStatus={proStatus}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        />

        {/* Workspace Layout: Split on the Side or 100% Full Screen */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative bg-[#131314]">
          {/* Left Panel: Primary Gemini Chat */}
          {/* If Canvas is full screen, hide Chat completely so the text box never overlays Canvas! */}
          <div
            className={`flex-col overflow-hidden h-full min-w-0 ${
              isCanvasOpen && canvasLayout === "fullscreen"
                ? "hidden"
                : isCanvasOpen && canvasLayout === "side"
                ? "hidden md:flex md:w-1/2 lg:w-1/2 flex-1 border-r border-[#282a2c]"
                : isCanvasOpen && mobileTab === "canvas"
                ? "hidden md:flex"
                : "flex flex-1 w-full"
            }`}
          >
            <GeminiChat
              settings={settings}
              messages={currentMessages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onReset={() => {
                setSessionMessages((prev) => ({
                  ...prev,
                  [activeSessionId]: [],
                }));
              }}
              onOpenInCanvas={handleOpenInCanvas}
              error={error}
              proStatus={proStatus}
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            />
          </div>

          {/* Right / Main Panel: Gemini Canvas */}
          {isCanvasOpen && (
            <div
              className={`h-full min-w-0 overflow-hidden flex flex-col ${
                canvasLayout === "fullscreen"
                  ? "flex-1 w-full"
                  : mobileTab === "chat"
                  ? "hidden md:flex md:w-1/2 lg:w-1/2 flex-1"
                  : "flex flex-1 w-full md:w-1/2 lg:w-1/2"
              }`}
            >
              <GeminiCanvas
                code={canvasCode}
                isOpen={isCanvasOpen}
                onClose={() => setIsCanvasOpen(false)}
                title={canvasTitle}
                onCodeChange={(newCode) => setCanvasCode(newCode)}
                onRequestAIAssist={(prompt) => handleSendMessage(prompt)}
                isAILoading={isLoading}
                canvasLayout={canvasLayout}
                onChangeCanvasLayout={setCanvasLayout}
              />
            </div>
          )}
        </div>
      </div>

      {/* Gemini Pro Upgrade Puzzle Modal */}
      <ProPuzzleModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={handleProUnlock}
      />
    </div>
  );
}
