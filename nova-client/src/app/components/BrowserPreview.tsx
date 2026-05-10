'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Globe, RotateCcw, ArrowLeft, ArrowRight, X, Maximize2 } from 'lucide-react';

export function BrowserPreview() {
  const [url, setUrl] = useState('http://localhost:3000');
  const [input, setInput] = useState('http://localhost:3000');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(['http://localhost:3000']);
  const [histIdx, setHistIdx] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = (target: string) => {
    let u = target.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'http://' + u;
    setUrl(u); setInput(u); setLoading(true);
    setHistory(h => [...h.slice(0, histIdx + 1), u]);
    setHistIdx(i => i + 1);
  };

  const goBack = () => {
    if (histIdx > 0) { const u = history[histIdx - 1]; setUrl(u); setInput(u); setHistIdx(i => i - 1); setLoading(true); }
  };
  const goForward = () => {
    if (histIdx < history.length - 1) { const u = history[histIdx + 1]; setUrl(u); setInput(u); setHistIdx(i => i + 1); setLoading(true); }
  };
  const refresh = () => { setLoading(true); if (iframeRef.current) { iframeRef.current.src = url; } };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0e0e10]">
      {/* URL bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#111113] border-b border-zinc-800 flex-shrink-0">
        <button onClick={goBack} disabled={histIdx === 0} className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30 hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={goForward} disabled={histIdx >= history.length - 1} className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30 hover:bg-zinc-800 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button onClick={refresh} className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 rounded-md px-2 py-1">
          <Globe className="w-3 h-3 text-zinc-600 flex-shrink-0" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate(input)}
            className="flex-1 bg-transparent text-zinc-300 text-[12px] outline-none placeholder-zinc-600"
            placeholder="Enter URL..."
          />
          {input !== url && (
            <button onClick={() => navigate(input)} className="text-[11px] text-blue-400 hover:text-blue-300">Go</button>
          )}
        </div>
        <div className="flex gap-1">
          {['localhost:3000','localhost:8000'].map(h => (
            <button key={h} onClick={() => navigate('http://' + h)}
              className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded transition-colors whitespace-nowrap">
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* iframe */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600 animate-pulse z-10" />
        )}
        <iframe
          ref={iframeRef}
          src={url}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          className="w-full h-full border-none"
          title="Browser Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
