import React, { useState } from "react";
import {
  Plus,
  MessageSquare,
  Sparkles,
  Settings,
  HelpCircle,
  Sliders,
  Cpu,
  Zap,
  Flame,
  ChevronDown,
  ChevronRight,
  Trash2,
  Columns,
  Code2,
  Menu,
  RotateCcw,
  Infinity,
  ShieldCheck,
} from "lucide-react";
import { StudioSettings, ModelId, EffortLevel, ChatSession, ProStatus } from "../types";
import { GeminiSparkle } from "./GeminiSparkle";

interface GeminiSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  settings: StudioSettings;
  onChangeSettings: (settings: StudioSettings) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isCanvasOpen: boolean;
  onToggleCanvas: () => void;
  proStatus: ProStatus;
  onOpenUpgradeModal: () => void;
}

export const GeminiSidebar: React.FC<GeminiSidebarProps> = ({
  isOpen,
  onToggle,
  settings,
  onChangeSettings,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isCanvasOpen,
  onToggleCanvas,
  proStatus,
  onOpenUpgradeModal,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  const updateSetting = <K extends keyof StudioSettings>(
    key: K,
    val: StudioSettings[K]
  ) => {
    onChangeSettings({
      ...settings,
      [key]: val,
    });
  };

  const remainingQueries = Math.max(0, proStatus.freeLimit - proStatus.queriesUsed);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-[#1e1f20] border-r border-[#282a2c] flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? "w-68 sm:w-72" : "w-0 lg:w-[68px]"
        } overflow-hidden shrink-0 select-none text-[#f0f4f9]`}
      >
        {/* Header with Hamburger and Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#282a2c] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className="p-2 rounded-xl hover:bg-[#282a2c] text-[#9aa0a6] hover:text-white transition-colors"
              title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
            {isOpen && (
              <div className="flex items-center gap-2">
                <GeminiSparkle size={22} />
                <span className="font-semibold text-base text-white tracking-tight">
                  Gemini
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  iPad Dark
                </span>
              </div>
            )}
          </div>
        </div>

        {/* "+ New chat" pill button */}
        <div className="p-3 shrink-0">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-2xl bg-[#282a2c] hover:bg-[#333538] text-white text-sm font-medium transition-all shadow-xs border border-[#333538] ${
              !isOpen && "lg:px-2.5 lg:justify-center"
            }`}
            title="Start new chat"
          >
            <Plus className="w-4 h-4 text-white shrink-0" />
            {isOpen && <span>New chat</span>}
          </button>
        </div>

        {/* Canvas Quick Launcher Pill */}
        <div className="px-3 pb-2 shrink-0">
          <button
            onClick={onToggleCanvas}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium border transition-all ${
              isCanvasOpen
                ? "bg-blue-950/40 border-blue-500/50 text-blue-200 shadow-xs"
                : "bg-[#282a2c]/50 border-transparent text-[#c4c7c5] hover:bg-[#282a2c] hover:text-white"
            } ${!isOpen && "lg:px-2 lg:justify-center"}`}
            title="Toggle Gemini Canvas (Right Split View)"
          >
            <div className="flex items-center gap-2.5">
              <Columns className="w-4 h-4 text-blue-400 shrink-0" />
              {isOpen && <span>Gemini Canvas</span>}
            </div>
            {isOpen && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isCanvasOpen
                    ? "bg-blue-500/30 text-blue-200"
                    : "bg-[#333538] text-[#9aa0a6]"
                }`}
              >
                {isCanvasOpen ? "Open" : "Split View"}
              </span>
            )}
          </button>
        </div>

        {/* Middle Scrollable Section: Recent Chats & Settings */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
          {/* Recent Chats */}
          {isOpen && sessions.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-[#9aa0a6] px-2 mb-1.5">
                Recent Chats
              </div>
              <div className="space-y-1">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                      sess.id === activeSessionId
                        ? "bg-[#282a2c] text-white font-medium border border-[#3c4043]"
                        : "text-[#c4c7c5] hover:bg-[#282a2c]/60 hover:text-white"
                    }`}
                    onClick={() => onSelectSession(sess.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquare className="w-3.5 h-3.5 text-[#9aa0a6] shrink-0" />
                      <span className="truncate text-xs">{sess.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(sess.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 rounded transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model & Hyperparameters Drawer */}
          {isOpen && (
            <div className="bg-[#131314] rounded-2xl p-3 border border-[#282a2c] space-y-3">
              <button
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                className="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#9aa0a6] hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Model & Settings
                </span>
                {showSettingsDrawer ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              {showSettingsDrawer && (
                <div className="space-y-3 pt-1 border-t border-[#282a2c]">
                  {/* Model Picker */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#9aa0a6] mb-1 flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-blue-400" />
                      Gemini Model
                    </label>
                    <select
                      value={settings.model}
                      onChange={(e) => {
                        const val = e.target.value as ModelId;
                        if (val === "gemini-3.1-pro-preview" && !proStatus.isPro) {
                          onOpenUpgradeModal();
                          return;
                        }
                        updateSetting("model", val);
                      }}
                      className="w-full text-xs bg-[#1e1f20] border border-[#333538] rounded-xl px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-blue-400"
                    >
                      <option value="gemini-3.8-flash">Gemini 3.8 Flash (Free)</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.5 Lite (Free)</option>
                      <option value="gemini-3.1-pro-preview">
                        {proStatus.isPro ? "Gemini 3.1 Pro (Free Pro ✦)" : "Gemini 3.1 Pro (🔒 Pro Only)"}
                      </option>
                    </select>
                  </div>

                  {/* Reasoning Effort */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#9aa0a6] mb-1 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Reasoning Effort
                    </label>
                    <select
                      value={settings.effort}
                      onChange={(e) => updateSetting("effort", e.target.value as EffortLevel)}
                      className="w-full text-xs bg-[#1e1f20] border border-[#333538] rounded-xl px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-blue-400"
                    >
                      <option value="DEFAULT">Default (Balanced)</option>
                      <option value="HIGH">High (Deep Thinking & Code)</option>
                      <option value="LOW">Low (Fast)</option>
                      <option value="MINIMAL">Minimal</option>
                    </select>
                  </div>

                  {/* Temperature */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#9aa0a6] mb-1">
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3 h-3 text-orange-400" />
                        Temperature
                      </span>
                      <span className="font-mono font-semibold text-white">
                        {settings.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.05"
                      value={settings.temperature}
                      onChange={(e) =>
                        updateSetting("temperature", parseFloat(e.target.value))
                      }
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#282a2c] rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upgrade to Pro Challenge Banner (at bottom of sidebar) */}
        {isOpen && (
          <div className="p-3 shrink-0">
            {proStatus.isPro ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/40 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Infinity className="w-3.5 h-3.5 text-blue-400" />
                  <span>Gemini Advanced</span>
                </div>
                <div className="text-[11px] text-blue-200/80 mt-0.5">
                  Permanent Infinite Usage active.
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenUpgradeModal}
                className="w-full p-3 rounded-2xl bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-blue-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upgrade to Pro</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200">
                    {remainingQueries} free left
                  </span>
                </div>
                <div className="text-[11px] text-[#9aa0a6] mt-1 line-clamp-2">
                  Solve the Neural Alignment puzzle to unlock permanent infinite usage.
                </div>
              </button>
            )}
          </div>
        )}

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-[#282a2c] bg-[#131314] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0">
              A
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate">
                    Avi
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    proStatus.isPro ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-[#282a2c] text-[#9aa0a6]"
                  }`}>
                    {proStatus.isPro ? "PRO" : "FREE"}
                  </span>
                </div>
                <div className="text-[10px] text-[#9aa0a6] truncate">
                  {proStatus.isPro ? "Infinite Quota Active" : `${remainingQueries} queries left`}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
