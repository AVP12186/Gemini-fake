import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, Zap, CheckCircle2, RotateCw, HelpCircle, Lock, Infinity, ArrowRight, ShieldCheck } from "lucide-react";
import { GeminiSparkle } from "./GeminiSparkle";

interface ProPuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface NodeState {
  id: number;
  name: string;
  angle: number; // 0, 90, 180, 270
  target: number;
  label: string;
  symbol: string;
}

export const ProPuzzleModal: React.FC<ProPuzzleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [nodes, setNodes] = useState<NodeState[]>([
    { id: 0, name: "Alpha", angle: 270, target: 90, label: "Quantum Source", symbol: "✦" },
    { id: 1, name: "Beta", angle: 0, target: 180, label: "Neural Flux", symbol: "◈" },
    { id: 2, name: "Gamma", angle: 270, target: 0, label: "Logic Matrix", symbol: "❖" },
    { id: 3, name: "Delta", angle: 180, target: 90, label: "Infinite Nexus", symbol: "♾" },
  ]);

  const [isSolved, setIsSolved] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  const [moves, setMoves] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play subtle sound effects on interaction
  const playBeep = (freq: number, type: OscillatorType = "sine", duration: number = 0.1) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const playVictoryChime = () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => {
        playBeep(freq, "sine", 0.35);
      }, idx * 100);
    });
  };

  // Check solved status
  const alignedCount = nodes.filter((n) => n.angle === n.target).length;
  const resonancePercent = Math.round((alignedCount / nodes.length) * 100);

  useEffect(() => {
    if (alignedCount === nodes.length && !isSolved) {
      setIsSolved(true);
      playVictoryChime();
    }
  }, [alignedCount, nodes.length, isSolved]);

  if (!isOpen) return null;

  const handleRotate = (id: number) => {
    if (isSolved) return;
    setMoves((m) => m + 1);
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === id) {
          const newAngle = (node.angle + 90) % 360;
          const isTarget = newAngle === node.target;
          playBeep(isTarget ? 660 : 440, "sine", 0.08);
          return { ...node, angle: newAngle };
        }
        return node;
      })
    );
  };

  const handleAutoSolve = () => {
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        angle: node.target,
      }))
    );
  };

  const handleReset = () => {
    setIsSolved(false);
    setMoves(0);
    setNodes([
      { id: 0, name: "Alpha", angle: 270, target: 90, label: "Quantum Source", symbol: "✦" },
      { id: 1, name: "Beta", angle: 0, target: 180, label: "Neural Flux", symbol: "◈" },
      { id: 2, name: "Gamma", angle: 270, target: 0, label: "Logic Matrix", symbol: "❖" },
      { id: 3, name: "Delta", angle: 180, target: 90, label: "Infinite Nexus", symbol: "♾" },
    ]);
  };

  const handleClaimPro = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#1e1f20] border border-[#333538] rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col gap-5 text-[#f0f4f9]">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <GeminiSparkle size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Gemini Advanced Challenge
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Infinite Usage Pro
                </span>
              </div>
              <p className="text-xs text-[#9aa0a6] mt-0.5">
                Align the Neural Matrix to activate permanent unlimited access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#282a2c] hover:bg-[#333538] text-[#9aa0a6] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Puzzle Description & Resonance Meter */}
        <div className="bg-[#131314] rounded-2xl p-3.5 border border-[#282a2c] flex flex-col gap-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9aa0a6] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Neural Resonance:
            </span>
            <span className={`font-mono font-bold ${resonancePercent === 100 ? "text-emerald-400" : "text-blue-400"}`}>
              {resonancePercent}% Calibrated
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-[#282a2c] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                resonancePercent === 100
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                  : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
              }`}
              style={{ width: `${resonancePercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9aa0a6] pt-1">
            <span>Tap each node to rotate beam alignment</span>
            <span>Moves: {moves}</span>
          </div>
        </div>

        {/* Interactive Neural Grid */}
        <div className="relative z-10 p-4 bg-[#131314] rounded-2xl border border-[#282a2c] flex flex-col items-center">
          {/* Circuit visual tracks */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-xs relative">
            {nodes.map((node) => {
              const isAligned = node.angle === node.target;
              return (
                <button
                  key={node.id}
                  onClick={() => handleRotate(node.id)}
                  disabled={isSolved}
                  className={`group relative p-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border ${
                    isAligned
                      ? "bg-blue-950/40 border-blue-500/60 shadow-[0_0_15px_rgba(66,133,244,0.3)]"
                      : "bg-[#1e1f20] border-[#333538] hover:border-[#5f6368] hover:bg-[#282a2c]"
                  }`}
                >
                  {/* Status Indicator Pip */}
                  <span
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full transition-colors ${
                      isAligned ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-zinc-600"
                    }`}
                  />

                  {/* Rotatable Node Core */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#282a2c] border border-[#3c4043] transition-transform duration-300 shadow-inner group-hover:scale-105"
                    style={{ transform: `rotate(${node.angle}deg)` }}
                  >
                    <div className="relative flex items-center justify-center w-full h-full">
                      {/* Directional Laser Beam */}
                      <div
                        className={`absolute top-1 w-1.5 h-4 rounded-full ${
                          isAligned ? "bg-blue-400 shadow-[0_0_8px_#60a5fa]" : "bg-zinc-500"
                        }`}
                      />
                      <span className="text-lg font-bold text-white select-none">
                        {node.symbol}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-center">
                    <div className="text-xs font-semibold text-[#f0f4f9]">{node.name}</div>
                    <div className="text-[10px] text-[#9aa0a6]">{node.label}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hint explanation */}
          {hintActive && (
            <div className="mt-3 p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/60 text-xs text-blue-200 text-center animate-in fade-in duration-200">
              💡 <strong>Quantum Telemetry:</strong> Flow flows clockwise starting from Alpha pointing Right (90°), Beta pointing Down (180°), Gamma pointing Up (0°), and Delta pointing Right (90°).
            </div>
          )}
        </div>

        {/* Solved Victory Banner or Action Controls */}
        {isSolved ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/60 flex flex-col items-center text-center gap-3 relative z-10 animate-in zoom-in-95 duration-300 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                <span>Resonance 100% Calibrated</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h4>
              <p className="text-xs text-emerald-200/90 mt-1 max-w-sm">
                Congratulations! You solved the Gemini Neural Alignment puzzle. Permanent infinite usage and Gemini Advanced Reasoning are now unlocked for your account.
              </p>
            </div>
            <button
              onClick={handleClaimPro}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#131314] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all"
            >
              <Infinity className="w-4 h-4" />
              <span>Activate Infinite Pro Usage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1 relative z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHintActive(!hintActive)}
                className="px-3 py-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs text-[#9aa0a6] hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Hint</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs text-[#9aa0a6] hover:text-white transition-colors"
                title="Reset Puzzle"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAutoSolve}
              className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Align</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
