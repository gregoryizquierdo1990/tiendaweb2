import React, { useState } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { useGeminiPanelOpen, useToggleGeminiPanel } from '../store/useAppStore';

export const GeminiPanel: React.FC = () => {
  const isOpen = useGeminiPanelOpen();
  const toggle = useToggleGeminiPanel();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResponse(data.text);
    } catch (e) {
      setResponse('Error al consultar Gemini.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-200 shadow-2xl z-[60] flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-900">
            <Bot className="w-5 h-5 text-indigo-600" />
            Gemini IA
        </div>
        <button onClick={toggle} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="text-sm text-slate-700 whitespace-pre-wrap">{response || 'Escribe una pregunta arriba...'}</div>
      </div>
      <div className="p-4 border-t border-slate-100">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 mb-2"
          placeholder="Pregúntale algo a Gemini..."
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar
        </button>
      </div>
    </div>
  );
};
