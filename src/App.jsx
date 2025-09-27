import React from "react";
import TypingTest from "./components/TypingTest.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Typing Test — Gemini</h1>
          <div className="text-sm text-slate-500">40 sec · ~50 words</div>
        </header>

        <TypingTest />
        
        <footer className="mt-6 text-xs text-slate-400">
          Tip: Use a real backend for Gemini key in production.
        </footer>
      </div>
    </div>
  );
}
