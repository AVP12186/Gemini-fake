import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  ChevronDown,
  Columns,
  Check,
  Plus,
  Layers,
  MessageSquare,
  Sparkles,
  Infinity,
  Split,
  Maximize2,
  Minimize2,
  Lock,
} from "lucide-react";
import { StudioSettings, ModelId, CanvasLayoutMode, ProStatus } from "../types";
import { GeminiSparkle } from "./GeminiSparkle";

interface GeminiNavbarProps {
  onToggleSidebar: () => void;
  settings: StudioSettings;
  onChangeModel: (model: ModelId) => void;
  apiConnected: boolean;
  isCanvasOpen: boolean;
  onToggleCanvas: () => void;
  canvasLayout: CanvasLayoutMode;
  onChangeCanvasLayout: (layout: CanvasLayoutMode) => void;
  onNewChat?: () => void;
  mobileTab?: "chat" | "canvas";
  onChangeMobileTab?: (tab: "chat" | "canvas") => void;
  proStatus: ProStatus;
  onOpenUpgradeModal: () => void;
}

export const GeminiNavbar: React.FC<GeminiNavbarProps> = ({
  onToggleSidebar,
  settings,
  onChangeModel,
  apiConnected,
  isCanvasOpen,
  onToggleCanvas,
  canvasLayout,
  onChangeCanvasLayout,
  onNewChat,
  mobileTab = "chat",
  onChangeMobileTab,
  proStatus,
  onOpenUpgradeModal,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getModelDisplayName = (modelId: ModelId) => {
    switch (modelId) {
      case "gemini-3.8-flash":
        return "Gemini 3.8 Flash";
      case "gemini-3.1-pro-preview":
        return proStatus.isPro ? "Gemini 3.1 Pro ✦" : "Gemini 3.1 Pro (Pro)";
      case "gemini-3.1-flash-lite":
        return "Gemini 3.5 Lite";
      default:
        return modelId;
    }
  };

  const handleSelectModel = (id: ModelId) => {
    if (id === "gemini-3.1-pro-preview" && !proStatus.isPro) {
      // Free users cannot select Gemini 3.1 Pro until they upgrade via the puzzle
      setModelDropdownOpen(false);
      onOpenUpgradeModal();
      return;
    }
    onChangeModel(id);
    setModelDropdownOpen(false);
  };

  const remainingQueries = Math.max(0, proStatus.freeLimit - proStatus.queriesUsed);

  return (
    <header className="h-14 sm:h-16 border-b border-[#282a2c] bg-[#131314]/95 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 text-[#f0f4f9] select-none">
      {/* Left: iPad Hamburger & Gemini Brand */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-[#1e1f20] text-[#9aa0a6] hover:text-[#f0f4f9] transition-colors"
          title="Toggle Navigation Menu"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <GeminiSparkle size={22} className="shrink-0" />
          <span className="font-semibold text-base sm:text-lg text-white tracking-tight font-sans">
            Gemini
          </span>

          {/* Model Dropdown Picker - iPad Style with Pro Gating */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#f0f4f9] text-xs font-medium border border-[#333538] transition-colors"
            >
              <span className="truncate max-w-[130px] sm:max-w-none">
                {getModelDisplayName(settings.model)}
              </span>
              {settings.model === "gemini-3.1-pro-preview" && (
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              )}
              <ChevronDown className="w-3 h-3 text-[#9aa0a6] shrink-0" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#1e1f20] rounded-2xl shadow-2xl border border-[#333538] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa0a6] px-3 py-1.5 flex items-center justify-between">
                  <span>Gemini Models</span>
                  <span className="text-[9px] text-[#8ab4f8]">
                    {proStatus.isPro ? "Pro Unlocked" : "Free Tier"}
                  </span>
                </div>

                {/* Models List */}
                <div className="space-y-1">
                  {/* Gemini 3.8 Flash */}
                  <button
                    onClick={() => handleSelectModel("gemini-3.8-flash")}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between ${
                      settings.model === "gemini-3.8-flash"
                        ? "bg-[#282a2c] text-white font-medium border border-[#3c4043]"
                        : "text-[#c4c7c5] hover:bg-[#282a2c]/60 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold">Gemini 3.8 Flash</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-medium">
                          Free
                        </span>
                      </div>
                      <div className="text-[10px] text-[#9aa0a6] mt-0.5">
                        Fast multimodal model for coding and reasoning
                      </div>
                    </div>
                    {settings.model === "gemini-3.8-flash" && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    )}
                  </button>

                  {/* Gemini 3.5 / 3.1 Flash Lite */}
                  <button
                    onClick={() => handleSelectModel("gemini-3.1-flash-lite")}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between ${
                      settings.model === "gemini-3.1-flash-lite"
                        ? "bg-[#282a2c] text-white font-medium border border-[#3c4043]"
                        : "text-[#c4c7c5] hover:bg-[#282a2c]/60 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold">Gemini 3.5 Lite</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                          Free
                        </span>
                      </div>
                      <div className="text-[10px] text-[#9aa0a6] mt-0.5">
                        Ultra-fast, lowest latency responses
                      </div>
                    </div>
                    {settings.model === "gemini-3.1-flash-lite" && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    )}
                  </button>

                  {/* Gemini 3.1 Pro (Pro Exclusive) */}
                  <button
                    onClick={() => handleSelectModel("gemini-3.1-pro-preview")}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between ${
                      settings.model === "gemini-3.1-pro-preview"
                        ? "bg-gradient-to-r from-amber-950/40 to-purple-950/40 text-white font-medium border border-amber-500/40"
                        : proStatus.isPro
                        ? "text-[#c4c7c5] hover:bg-[#282a2c]/60 hover:text-white"
                        : "text-[#9aa0a6] hover:bg-[#282a2c]/60 cursor-pointer"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">Gemini 3.1 Pro</span>
                        {proStatus.isPro ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Free Pro
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/50 text-purple-300 font-medium border border-purple-500/40 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Pro Only
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#9aa0a6] mt-0.5">
                        {proStatus.isPro
                          ? "Deep reasoning & complex code unlocked"
                          : "Locked in Free tier. Solve puzzle to unlock for free!"}
                      </div>
                    </div>
                    {settings.model === "gemini-3.1-pro-preview" ? (
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : !proStatus.isPro ? (
                      <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-1" />
                    ) : null}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher (Chat vs. Canvas) */}
      {isCanvasOpen && (
        <div className="flex md:hidden items-center bg-[#1e1f20] p-0.5 rounded-full border border-[#333538]">
          <button
            onClick={() => onChangeMobileTab?.("chat")}
            className={`px-3 py-1 text-xs rounded-full transition-all flex items-center gap-1.5 ${
              mobileTab === "chat"
                ? "bg-[#282a2c] text-white font-semibold shadow-xs"
                : "text-[#9aa0a6]"
            }`}
          >
            <MessageSquare className="w-3 h-3 text-blue-400" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => onChangeMobileTab?.("canvas")}
            className={`px-3 py-1 text-xs rounded-full transition-all flex items-center gap-1.5 ${
              mobileTab === "canvas"
                ? "bg-[#282a2c] text-white font-semibold shadow-xs"
                : "text-[#9aa0a6]"
            }`}
          >
            <Columns className="w-3 h-3 text-emerald-400" />
            <span>Canvas</span>
          </button>
        </div>
      )}

      {/* Right: Pro Infinite Badge / Upgrade Button, Canvas Mode Switches, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pro Status or Upgrade Pill */}
        {proStatus.isPro ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-indigo-900/40 border border-blue-500/30 text-blue-200 text-xs font-medium shadow-xs">
            <Infinity className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white">Pro Unlimited</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
        ) : (
          <button
            onClick={onOpenUpgradeModal}
            className="flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition-all hover:scale-[1.02]"
            title="Solve puzzle to unlock Gemini 3.1 Pro and infinite usage"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Upgrade to Pro</span>
            <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {remainingQueries} left
            </span>
          </button>
        )}

        {/* New Chat Button */}
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#f0f4f9] text-xs font-medium flex items-center gap-1.5 border border-[#333538] transition-colors"
            title="New Chat"
          >
            <Plus className="w-4 h-4 text-[#9aa0a6]" />
            <span className="hidden md:inline">New chat</span>
          </button>
        )}

        {/* Canvas Layout Controls: Side vs Full Screen */}
        {isCanvasOpen ? (
          <div className="hidden md:flex items-center bg-[#1e1f20] p-0.5 rounded-xl border border-[#333538] gap-0.5">
            <button
              onClick={() => onChangeCanvasLayout("side")}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                canvasLayout === "side"
                  ? "bg-[#282a2c] text-white font-semibold shadow-xs"
                  : "text-[#9aa0a6] hover:text-white"
              }`}
              title="View Canvas on the side (Side-by-Side with Chat)"
            >
              <Split className="w-3.5 h-3.5 text-blue-400" />
              <span>Side</span>
            </button>
            <button
              onClick={() => onChangeCanvasLayout("fullscreen")}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                canvasLayout === "fullscreen"
                  ? "bg-[#282a2c] text-white font-semibold shadow-xs"
                  : "text-[#9aa0a6] hover:text-white"
              }`}
              title="Full Screen Canvas (Canvas takes over entire screen, no text box)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Full Screen</span>
            </button>
            <button
              onClick={onToggleCanvas}
              className="p-1 text-[#9aa0a6] hover:text-red-400 rounded-lg hover:bg-[#282a2c] transition-colors ml-0.5"
              title="Close Canvas"
            >
              <span className="text-xs px-1 font-bold">✕</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onToggleCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#1e1f20] text-[#c4c7c5] border border-[#333538] hover:bg-[#282a2c] hover:text-white transition-all shadow-xs"
            title="Open Gemini Canvas on the side"
          >
            <Split className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">Canvas</span>
          </button>
        )}

        {/* User profile avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0 ring-1 ring-[#333538]">
          A
        </div>
      </div>
    </header>
  );
};
