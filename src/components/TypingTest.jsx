import React, { useEffect, useRef, useState } from "react";
import Result from "./Result.jsx";

const TEST_DURATION = 40;
const PROMPT_WORD_TARGET = 50;

export default function TypingTest() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [keystrokes, setKeystrokes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const backspaceHoldStart = useRef(null);
  const [backspaceHoldMs, setBackspaceHoldMs] = useState(0);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // 🎙️ Track current word index
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    loadPrompt();
    return () => stopTimer();
  }, []);

  useEffect(() => {
    if (running && timeLeft <= 0) {
      stopTimer();
      setFinished(true);
    }
  }, [timeLeft, running]);

  async function loadPrompt() {
    setLoading(true);
    setFinished(false);
    setRunning(false);
    setTyped("");
    setKeystrokes(0);
    setBackspaceCount(0);
    setBackspaceHoldMs(0);
    setTimeLeft(TEST_DURATION);
    setCurrentWordIndex(0);

    try {
      const newPrompt = await fetchPrompt50Words();
      setPrompt(newPrompt.trim());

      // 🎙️ Speak the first word automatically
      const words = newPrompt.trim().split(/\s+/);
      if (words.length > 0) {
        setCurrentWordIndex(0);
        speakWord(words[0]);
      }
    } catch (e) {
      console.error("loadPrompt error:", e);
      setPrompt(fallbackPrompt());
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function startTimer() {
    if (running) return;
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((s) => Math.max(0, s - 1));
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Backspace") {
      setBackspaceCount((c) => c + 1);
      backspaceHoldStart.current = performance.now();
    }
  }

  function handleKeyUp(e) {
    if (e.key === "Backspace" && backspaceHoldStart.current) {
      const delta = performance.now() - backspaceHoldStart.current;
      setBackspaceHoldMs((ms) => ms + Math.round(delta));
      backspaceHoldStart.current = null;
    }
  }

  function handleChange(e) {
    const value = e.target.value;
    if (!running && value.length > 0 && !finished) startTimer();
    setTyped(value);
    setKeystrokes((k) => k + 1);

    // 🎙️ Word-by-word logic
    const words = prompt ? prompt.split(/\s+/).filter(Boolean) : [];
    const typedWords = value.trim().length > 0 ? value.trim().split(/\s+/) : [];

    if (
      words.length > 0 &&
      currentWordIndex < words.length &&
      typedWords[currentWordIndex] === words[currentWordIndex]
    ) {
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);

      if (words[nextIndex]) {
        speakWord(words[nextIndex]); // Speak only NEXT word
      }
    }
  }

  function computeMetrics() {
    const typedChars = typed.split("");
    const promptChars = prompt.split("");
    let correctChars = 0;
    let incorrectChars = 0;

    for (let i = 0; i < typedChars.length; i++) {
      if (typedChars[i] === promptChars[i]) correctChars++;
      else incorrectChars++;
    }

    const totalTyped = typed.length;
    const elapsedSec = TEST_DURATION - timeLeft;
    const effectiveMinutes = elapsedSec > 0 ? elapsedSec / 60 : 1 / 60;

    const wpm = Math.round((correctChars / 5) / effectiveMinutes);
    const accuracy =
      totalTyped === 0 ? 0 : Math.round((correctChars / totalTyped) * 100);

    return { correctChars, incorrectChars, totalTyped, wpm, accuracy };
  }

  function resetAll() {
    stopTimer();
    setFinished(false);
    setTyped("");
    setKeystrokes(0);
    setBackspaceCount(0);
    setBackspaceHoldMs(0);
    setTimeLeft(TEST_DURATION);
    setRunning(false);
    setCurrentWordIndex(0);
    inputRef.current?.focus();
  }

  // 🎙️ --- Voice Functions ---
  function speakWord(word) {
    if (!word) return;
    window.speechSynthesis.cancel(); // stop any previous speech
    const utter = new SpeechSynthesisUtterance(word);
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  }

  function stopVoice() {
    window.speechSynthesis.cancel();
  }

  const metrics = computeMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-start py-8 px-4">
      {/* Timer HUD */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
          ⚡ Typing Battle ⚡
        </h1>
        <div className="text-5xl font-extrabold text-yellow-400 tracking-widest drop-shadow-lg">
          {timeLeft}s
        </div>
        <div className="w-64 bg-gray-700 h-3 mt-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 to-red-500 h-3 transition-all"
            style={{ width: `${(timeLeft / TEST_DURATION) * 100}%` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-gray-800/70 border border-purple-500 rounded-xl p-4 mb-3 max-w-2xl shadow-lg">
        <p className="text-xs text-purple-300 mb-1">Prompt</p>
        {loading ? (
          <div className="animate-pulse text-slate-400">Loading prompt...</div>
        ) : (
          <HighlightedPrompt prompt={prompt} typed={typed} />
        )}
      </div>

      {/* 🎙️ Voice buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            const words = prompt.split(/\s+/);
            if (words[currentWordIndex]) {
              speakWord(words[currentWordIndex]);
            }
          }}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow hover:scale-105 transition"
        >
          🔊 Repeat Word
        </button>
        <button
          onClick={stopVoice}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold shadow hover:scale-105 transition"
        >
          ⏹ Stop
        </button>
      </div>

      {/* Input Box */}
      <textarea
        ref={inputRef}
        value={typed}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder="Type what you hear..."
        rows="4"
        className="w-full max-w-2xl border border-purple-500 rounded-lg p-3 text-lg resize-none bg-black/60 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        disabled={finished || loading}
      />

      {/* Controls */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={() => {
            if (finished) resetAll();
            else if (!running) startTimer();
            inputRef.current?.focus();
          }}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg hover:scale-105 transition"
        >
          {finished ? "Restart" : running ? "Running..." : "Start"}
        </button>
        <button
          onClick={stopTimer}
          className="px-5 py-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition"
        >
          Pause
        </button>
        <button
          onClick={loadPrompt}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:scale-105 transition"
        >
          New Prompt
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full">
        <Stat label="⚡ WPM" value={metrics.wpm} glow="from-yellow-400 to-orange-500" />
        <Stat label="🎯 Accuracy" value={`${metrics.accuracy}%`} glow="from-green-400 to-emerald-600" />
        <Stat label="✅ Correct" value={metrics.correctChars} glow="from-blue-400 to-cyan-500" />
        <Stat label="❌ Mistakes" value={metrics.incorrectChars} glow="from-red-500 to-pink-600" />
      </div>

      {/* Result */}
      {finished && (
        <div className="mt-6 w-full max-w-2xl">
          <Result
            metrics={metrics}
            backspaceCount={backspaceCount}
            backspaceHoldMs={backspaceHoldMs}
            keystrokes={keystrokes}
            onRetry={resetAll}
            onNewPrompt={loadPrompt}
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, glow }) {
  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-4 text-center shadow-md">
      <div className={`text-sm text-transparent bg-clip-text bg-gradient-to-r ${glow}`}>{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function HighlightedPrompt({ prompt, typed }) {
  const promptChars = prompt.split("");
  const typedChars = typed.split("");
  return (
    <div className="whitespace-pre-wrap text-lg leading-7">
      {promptChars.map((ch, i) => {
        const typedChar = typedChars[i];
        let cls = "text-gray-300";
        if (typedChar !== undefined) {
          cls = typedChar === ch ? "text-green-400" : "text-red-500 bg-red-900/40";
        }
        return (
          <span key={i} className={`${cls} select-none`}>
            {ch}
          </span>
        );
      })}
    </div>
  );
}

/* ----------------------
   OpenRouter Chat API fetch
   ---------------------- */
async function fetchPrompt50Words() {
  try {
    const API_KEY = import.meta.env.VITE_OPENROUTER_KEY;
    if (!API_KEY) throw new Error("Missing OpenRouter API key in VITE_OPENROUTER_KEY");

    const topics = [
      "video games and focus",
      "space adventures",
      "superheroes training",
      "sports motivation",
      "coding and creativity",
      "future technology",
      "magic and fantasy",
      "history of warriors",
      "travel and exploration",
      "mystery and puzzles",
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const nonce = Math.floor(Math.random() * 100000);

    const prompt = `Write a fun and engaging plain English paragraph of about ${PROMPT_WORD_TARGET} words. 
Topic: ${topic}. 
Make it sound fresh and unique. [GameID:${nonce}]`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        top_p: 0.95,
        max_tokens: 220,
      }),
    });

    if (!res.ok) throw new Error("OpenRouter fetch failed: " + (await res.text()));
    const data = await res.json();
    console.log("OpenRouter raw response:", data);

    let text = data?.choices?.[0]?.message?.content || "";
    text = text.replace(/\s+/g, " ").trim();

    if (!text) return fallbackPrompt();

    const words = text.split(/\s+/).slice(0, PROMPT_WORD_TARGET);
    return words.join(" ");
  } catch (err) {
    console.error("fetchPrompt50Words error:", err);
    return fallbackPrompt();
  }
}

function fallbackPrompt() {
  return "Practice makes perfect. Typing fast requires consistent daily practice and focusing on accuracy before speed. Keep your posture right and use all your fingers to type smoothly.";
}
