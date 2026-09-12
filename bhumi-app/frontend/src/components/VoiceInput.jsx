import React, { useState, useRef } from 'react';

// Voice-Based Data Entry: lets field workers speak instead of type.
// Uses the browser's built-in Web Speech API (no external service needed).
// Falls back gracefully with a message if the browser doesn't support it.
export default function VoiceInput({ onResult, lang = 'en-IN' }) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recognitionRef = useRef(null);

  function startListening() {
    if (!supported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  if (!supported) {
    return <span className="text-xs text-gray-400 italic">Voice input not supported in this browser</span>;
  }

  return (
    <button
      type="button"
      onClick={startListening}
      className={`px-2 py-1 rounded-md text-xs font-medium border ${
        listening ? 'bg-red-100 text-red-700 border-red-300 animate-pulse' : 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100'
      }`}
      title="Speak to fill this field"
    >
      🎤 {listening ? 'Listening…' : 'Speak'}
    </button>
  );
}
