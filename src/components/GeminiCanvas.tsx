import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Code,
  Eye,
  Columns,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  RefreshCw,
  CornerDownLeft,
  ChevronRight,
  FileCode,
  Split,
  ExternalLink,
} from "lucide-react";
import { CanvasLayoutMode } from "../types";

export type CanvasViewMode = "preview" | "split" | "code";

interface GeminiCanvasProps {
  code: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onCodeChange?: (newCode: string) => void;
  onRequestAIAssist?: (prompt: string) => void;
  isAILoading?: boolean;
  canvasLayout?: CanvasLayoutMode;
  onChangeCanvasLayout?: (layout: CanvasLayoutMode) => void;
}

export const GeminiCanvas: React.FC<GeminiCanvasProps> = ({
  code,
  isOpen,
  onClose,
  title = "Interactive Canvas",
  onCodeChange,
  onRequestAIAssist,
  isAILoading = false,
  canvasLayout = "side",
  onChangeCanvasLayout,
}) => {
  const [viewMode, setViewMode] = useState<CanvasViewMode>("preview");
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [editableCode, setEditableCode] = useState(code);
  const [isEditing, setIsEditing] = useState(false);
  const [canvasPrompt, setCanvasPrompt] = useState("");
  const [docTitle, setDocTitle] = useState(title);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external code changes
  useEffect(() => {
    setEditableCode(code);
    setPreviewKey((prev) => prev + 1);
  }, [code]);

  useEffect(() => {
    if (title) setDocTitle(title);
  }, [title]);

  if (!isOpen) return null;

  const handleRestartPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  const handleApplyCodeEdits = () => {
    onCodeChange?.(editableCode);
    setPreviewKey((prev) => prev + 1);
    setIsEditing(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editableCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, "-") || "canvas-app"}.html`;
    const blob = new Blob([editableCode], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([editableCode], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  };

  const handleSendPrompt = (promptText?: string) => {
    const promptToSend = promptText || canvasPrompt;
    if (!promptToSend.trim() || isAILoading) return;
    onRequestAIAssist?.(
      `Update this existing Gemini Canvas code (${docTitle}):\n${promptToSend}\n\nHere is the current code to modify:\n\`\`\`html\n${editableCode}\n\`\`\``
    );
    setCanvasPrompt("");
  };

  const lines = editableCode.split("\n");
  const isFullScreen = canvasLayout === "fullscreen";

  return (
    <div
      id="gemini-canvas-panel"
      className="flex-1 flex flex-col h-full min-h-0 w-full bg-[#131314] text-[#f0f4f9] overflow-hidden select-none"
    >
      {/* Canvas Top Bar - iPad Dark Mode */}
      <div className="px-3 sm:px-4 py-2.5 bg-[#1e1f20] border-b border-[#282a2c] flex items-center justify-between gap-2 shrink-0">
        {/* Left: Document Title & Badge */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 truncate max-w-[140px] sm:max-w-[200px]"
                title="Click to rename"
              />
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#282a2c] text-[#8ab4f8] border border-[#3c4043] shrink-0">
                Canvas
              </span>
            </div>
            <div className="text-[10px] text-[#9aa0a6] truncate hidden sm:block">
              {lines.length} lines &bull; Interactive Sandbox
            </div>
          </div>
        </div>

        {/* Middle: Preview / Split / Code view mode */}
        <div className="flex items-center bg-[#131314] p-0.5 rounded-xl border border-[#282a2c] shrink-0">
          <button
            onClick={() => setViewMode("preview")}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "preview"
                ? "bg-[#282a2c] text-white font-medium shadow-xs"
                : "text-[#9aa0a6] hover:text-white"
            }`}
            title="Preview only"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "split"
                ? "bg-[#282a2c] text-white font-medium shadow-xs"
                : "text-[#9aa0a6] hover:text-white"
            }`}
            title="Split: Preview & Code"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            onClick={() => setViewMode("code")}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "code"
                ? "bg-[#282a2c] text-white font-medium shadow-xs"
                : "text-[#9aa0a6] hover:text-white"
            }`}
            title="Code editor"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Code</span>
          </button>
        </div>

        {/* Right: Screen Mode (Side vs Full Screen) & Utilities */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Side / Full Screen Toggle */}
          {onChangeCanvasLayout && (
            <button
              onClick={() => onChangeCanvasLayout(isFullScreen ? "side" : "fullscreen")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131314] hover:bg-[#282a2c] border border-[#282a2c] hover:border-[#3c4043] text-xs font-medium text-[#c4c7c5] hover:text-white transition-colors"
              title={
                isFullScreen
                  ? "Switch to Side-by-Side view (Chat on left, Canvas on right)"
                  : "Switch to Full Screen (Canvas takes over entire screen, no text box)"
              }
            >
              {isFullScreen ? (
                <>
                  <Split className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden md:inline">Side View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden md:inline">Full Screen</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleRestartPreview}
            className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#9aa0a6] hover:text-white transition-colors"
            title="Restart Canvas execution"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#9aa0a6] hover:text-white transition-colors"
            title="Copy source code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#9aa0a6] hover:text-white transition-colors hidden sm:block"
            title="Download as standalone HTML"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#9aa0a6] hover:text-red-400 transition-colors ml-0.5"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Preview and/or Code */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row bg-[#0e0e10] min-h-0">
        {/* Preview Panel */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={`flex-1 flex flex-col h-full min-h-0 overflow-hidden relative ${
              viewMode === "split" ? "border-b md:border-b-0 md:border-r border-[#282a2c]" : ""
            }`}
          >
            {/* Bezel frame with iframe */}
            <div className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-center bg-[#090a0f] overflow-auto min-h-0">
              <div className="w-full h-full max-w-full rounded-2xl overflow-hidden border border-[#282a2c] bg-[#131314] shadow-2xl flex flex-col">
                {/* Simulated iPad App Title Bar */}
                <div className="h-7 bg-[#1e1f20] border-b border-[#282a2c] px-3 flex items-center justify-between text-[11px] text-[#9aa0a6] shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ea4335]/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#fbbc05]/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#34a853]/80" />
                    <span className="ml-2 font-mono text-[10px] text-[#c4c7c5]">
                      {docTitle}.html
                    </span>
                  </div>
                  <button
                    onClick={handleOpenInNewTab}
                    className="hover:text-white flex items-center gap-1 text-[10px]"
                    title="Open in new window"
                  >
                    <span>New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Sandboxed Interactive Frame */}
                {editableCode ? (
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    srcDoc={editableCode}
                    title="Gemini Canvas Live Runner"
                    sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
                    className="w-full flex-1 border-none bg-[#131314]"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#9aa0a6] p-6 text-center">
                    <Columns className="w-12 h-12 text-[#333538] mb-3" />
                    <div className="text-sm font-semibold text-white">
                      Canvas is empty
                    </div>
                    <div className="text-xs max-w-xs mt-1 text-[#9aa0a6]">
                      Ask Gemini to create an interactive web app or dashboard, or type your code directly in the editor.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Code Editor Panel */}
        {(viewMode === "code" || viewMode === "split") && (
          <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0e0e10] overflow-hidden">
            {/* Editor Sub-Header */}
            <div className="px-3 py-1.5 bg-[#18191b] border-b border-[#282a2c] flex items-center justify-between text-xs text-[#9aa0a6] shrink-0">
              <div className="flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono text-[11px] text-[#f0f4f9]">
                  Source Editor ({lines.length} lines)
                </span>
              </div>
              {isEditing && (
                <button
                  onClick={handleApplyCodeEdits}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Changes</span>
                </button>
              )}
            </div>

            {/* Code Textarea / Viewer */}
            <div className="flex-1 relative overflow-hidden flex min-h-0">
              {/* Line Numbers */}
              <div className="w-10 bg-[#131314] text-[#5f6368] font-mono text-xs py-3 text-right pr-2 select-none border-r border-[#282a2c] overflow-hidden shrink-0">
                {lines.map((_, i) => (
                  <div key={i} className="leading-5 text-[11px]">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Editable Code */}
              <textarea
                ref={textareaRef}
                value={editableCode}
                onChange={(e) => {
                  setEditableCode(e.target.value);
                  setIsEditing(true);
                }}
                spellCheck={false}
                className="flex-1 p-3 bg-transparent text-[#f0f4f9] font-mono text-xs leading-5 resize-none focus:outline-none overflow-auto whitespace-pre selection:bg-blue-600/30"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Canvas Assistant Bar */}
      <div className="p-3 bg-[#1e1f20] border-t border-[#282a2c] flex flex-col gap-2 shrink-0">
        {/* Prompt Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <span className="text-[#9aa0a6] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Quick Edits:
          </span>
          {[
            "Add dark mode theme toggle",
            "Make layout responsive",
            "Add reset button",
            "Add animated transitions",
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleSendPrompt(suggestion)}
              disabled={isAILoading}
              className="px-2.5 py-1 rounded-full bg-[#282a2c] hover:bg-[#333538] text-[#c4c7c5] hover:text-white border border-[#3c4043] shrink-0 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* AI Canvas Modification Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={canvasPrompt}
              onChange={(e) => setCanvasPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendPrompt()}
              placeholder="Ask Gemini to modify this canvas..."
              disabled={isAILoading}
              className="w-full bg-[#131314] text-xs text-[#f0f4f9] placeholder-[#9aa0a6] rounded-xl px-3 py-2 border border-[#333538] focus:outline-none focus:border-blue-500/80"
            />
          </div>
          <button
            onClick={() => handleSendPrompt()}
            disabled={!canvasPrompt.trim() || isAILoading}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              canvasPrompt.trim() && !isAILoading
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                : "bg-[#282a2c] text-[#5f6368] cursor-not-allowed"
            }`}
          >
            {isAILoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>Update</span>
          </button>
        </div>
      </div>
    </div>
  );
};
