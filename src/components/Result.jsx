import React from "react";

export default function Result({
  metrics,
  backspaceCount,
  backspaceHoldMs,
  keystrokes,
  onRetry,
  onNewPrompt,
}) {
  return (
    <div className="bg-gray-800/70 border border-purple-500 rounded-xl p-6 shadow-lg text-center">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
        🏆 Game Over! 🏆
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Stat label="⚡ WPM" value={metrics.wpm} />
        <Stat label="🎯 Accuracy" value={`${metrics.accuracy}%`} />
        <Stat label="✅ Correct" value={metrics.correctChars} />
        <Stat label="❌ Mistakes" value={metrics.incorrectChars} />
        <Stat label="⌨️ Keystrokes" value={keystrokes} />
        <Stat label="⌫ Backspaces" value={backspaceCount} />
      </div>

      <div className="text-sm text-slate-400 mb-4">
        Backspace held for {(backspaceHoldMs / 1000).toFixed(2)}s
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg hover:scale-105 transition"
        >
          🔄 Retry
        </button>
        <button
          onClick={onNewPrompt}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 text-black font-bold shadow-lg hover:scale-105 transition"
        >
          🆕 New Prompt
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-3 text-center">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-xl font-extrabold text-yellow-300">{value}</div>
    </div>
  );
}
