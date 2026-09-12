import React, { useState } from 'react';
import api from '../api/client';
import FeatureLayer from '../components/FeatureLayer.jsx';

export default function Chatbot() {
  const [landId, setLandId] = useState('');
  const [lang, setLang] = useState('en');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Namaste! 🙏 Send your Land ID to check compensation & possession status. Example: RJ-JPR-0001' },
  ]);

  async function send() {
    if (!landId.trim()) return;
    setMessages((m) => [...m, { from: 'user', text: landId }]);
    const res = await api.post('/chatbot/query', { land_id: landId, lang });
    setMessages((m) => [...m, { from: 'bot', text: res.data.reply }]);
    setLandId('');
  }

  return (
    <FeatureLayer id="chatbot" title="Farmer Chatbot" subtitle="Simulates the WhatsApp/SMS bot farmers use to check status.">
      <div className="max-w-md mx-auto">
      <div className="card">
        <div className="flex justify-end mb-2">
          <select className="input w-28 py-1 text-xs" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 h-80 overflow-y-auto space-y-2 mb-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                m.from === 'user' ? 'bg-brand-600 text-white' : 'bg-white border'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Enter Land ID e.g. RJ-JPR-0001"
            value={landId}
            onChange={(e) => setLandId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn-primary" onClick={send}>Send</button>
        </div>
      </div>
      </div>
    </FeatureLayer>
  );
}
