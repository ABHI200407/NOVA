'use client';
import React, { useRef, useEffect, useState } from 'react';
import { X, Plus, TriangleAlert, Info, CircleX, Trash2, Copy, CheckCircle, Globe } from 'lucide-react';
import { Message, PanelTab } from './types';
import type { EditorProblem } from './EditorArea';
import { BrowserPreview } from './BrowserPreview';

interface BottomPanelProps {
  activeTab: PanelTab;
  onTabChange: (t: PanelTab) => void;
  messages: Message[];
  onSend: (msg: string) => void;
  wsStatus: 'connected' | 'disconnected' | 'connecting';
  onApprove: (idx: number, approved: boolean) => void;
  onClear: () => void;
  problems: EditorProblem[];
  onJumpToProblem: (p: EditorProblem) => void;
  outputLines: string[];
}

const AGENT_COLORS: Record<string, string> = {
  Coder:'text-blue-400', Researcher:'text-yellow-400', Executor:'text-zinc-400',
  Supervisor:'text-white', Security:'text-orange-400', Performance:'text-cyan-400',
};
const AGENT_LABELS: Record<string, string> = {
  Coder:'Writer', Researcher:'Reviewer', Executor:'DevOps',
  Supervisor:'Nova Core', Security:'Security', Performance:'Perf',
};

function TerminalPanel({ messages, onSend, onApprove, onClear }: Pick<BottomPanelProps,'messages'|'onSend'|'onApprove'|'onClear'>) {
  const [input, setInput] = useState('');
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setHist(h => [input, ...h.slice(0, 49)]);
    setHi(-1);
    onSend(input);
    setInput('');
  };

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { send(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); const next = Math.min(hi+1, hist.length-1); setHi(next); setInput(hist[next]??''); }
    if (e.key === 'ArrowDown') { e.preventDefault(); const next = Math.max(hi-1,-1); setHi(next); setInput(next===-1?'':hist[next]); }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text).catch(()=>{});

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[13px]">
        {messages.length === 0
          ? <div className="text-zinc-600">Nova Terminal — type below to instruct agents (↑↓ for history)</div>
          : messages.map((msg, idx) => (
            <div key={msg.id} className="group flex gap-2 items-start">
              <span className={`flex-shrink-0 mt-0.5 ${msg.role==='user'?'text-purple-400':AGENT_COLORS[msg.agentId??'']||'text-emerald-400'}`}>
                {msg.role==='user'?'❯':'✦'}
              </span>
              <div className="flex-1 min-w-0">
                {msg.agentId && <span className="text-[10px] text-zinc-600 uppercase tracking-widest mr-2 font-sans">{AGENT_LABELS[msg.agentId]||msg.agentId}</span>}
                <span className={msg.type==='error'?'text-red-400':msg.type==='tool_execution'?'text-emerald-400':msg.type==='diff'?'text-cyan-400':msg.role==='user'?'text-zinc-200':msg.type==='info'?'text-zinc-500':'text-zinc-400'}>
                  {msg.content}
                </span>
                {msg.type==='approval_request'&&!msg.status&&(
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={()=>onApprove(idx,true)} className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded transition-colors font-sans">✓ Approve</button>
                    <button onClick={()=>onApprove(idx,false)} className="px-3 py-1 bg-zinc-700 hover:bg-red-700 text-white text-xs rounded transition-colors font-sans">✗ Reject</button>
                  </div>
                )}
                {msg.status&&<span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-sans ${msg.status==='approved'?'bg-emerald-700/40 text-emerald-300':'bg-red-700/40 text-red-300'}`}>{msg.status}</span>}
              </div>
              <button onClick={()=>copy(msg.content)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-400 transition-all flex-shrink-0 mt-0.5">
                <Copy className="w-3 h-3"/>
              </button>
            </div>
          ))
        }
        <div ref={endRef}/>
      </div>
      <div className="border-t border-zinc-800 px-3 py-2 flex-shrink-0 bg-[#0e0e10]">
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 focus-within:border-zinc-600 transition-colors">
          <span className="text-purple-400 font-mono text-sm flex-shrink-0">❯</span>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={keyDown}
            placeholder="Instruct Nova agents... (↑↓ history, Enter to send)"
            className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-600 text-sm font-mono outline-none"/>
          {input&&<button onClick={()=>setInput('')} className="text-zinc-600 hover:text-zinc-400"><X className="w-3.5 h-3.5"/></button>}
        </div>
      </div>
    </div>
  );
}

function ProblemsPanel({ problems, onJump }: { problems: EditorProblem[]; onJump: (p: EditorProblem) => void }) {
  const icons = {
    error: <CircleX className="w-3.5 h-3.5 text-red-400 flex-shrink-0"/>,
    warning: <TriangleAlert className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0"/>,
    info: <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0"/>,
    hint: <Info className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0"/>,
  };
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
      {problems.length === 0
        ? <div className="text-zinc-600 text-sm p-2 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/>No problems detected.</div>
        : problems.map((p, i) => (
          <div key={i} onClick={()=>onJump(p)} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 cursor-pointer text-[13px] transition-colors">
            {icons[p.severity]}
            <span className="text-zinc-300 flex-1 min-w-0 break-words">{p.message}</span>
            <span className="text-zinc-600 text-[11px] whitespace-nowrap flex-shrink-0">{p.file}:{p.line}:{p.col}</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1 rounded flex-shrink-0">{p.source}</span>
          </div>
        ))
      }
    </div>
  );
}

export function BottomPanel({ activeTab, onTabChange, messages, onSend, wsStatus, onApprove, onClear, problems, onJumpToProblem, outputLines }: BottomPanelProps) {
  const wsColors = { connected:'bg-emerald-500', connecting:'bg-yellow-500 animate-pulse', disconnected:'bg-red-500' };
  const tabs: { id: PanelTab; label: string }[] = [
    { id:'terminal', label:'Terminal' },
    { id:'problems', label:`Problems ${(problems?.length ?? 0) > 0 ? `(${problems.length})` : ''}` },
    { id:'output', label:'Output' },
    { id:'debug', label:'Debug Console' },
    { id:'preview', label:'Browser' },
  ];

  return (
    <div className="flex flex-col border-t border-zinc-800 bg-[#111113] flex-shrink-0" style={{height:250}}>
      <div className="h-8 flex items-center border-b border-zinc-800 bg-[#0e0e10] px-2 flex-shrink-0">
        <div className="flex items-end gap-0 flex-1 overflow-x-auto h-full" style={{scrollbarWidth:'none'}}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>onTabChange(t.id)}
              className={`px-3 h-8 text-[12px] font-medium whitespace-nowrap border-t-2 transition-colors flex-shrink-0 ${activeTab===t.id?'border-t-blue-500 text-zinc-200 bg-[#111113]':'border-t-transparent text-zinc-500 hover:text-zinc-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${wsColors[wsStatus]}`}/>
          <span className="text-[10px] text-zinc-500">{wsStatus}</span>
          <button onClick={onClear} title="Clear" className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
          <button onClick={onClear} title="New Terminal" className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"><Plus className="w-3.5 h-3.5"/></button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab==='terminal' && <TerminalPanel messages={messages} onSend={onSend} onApprove={onApprove} onClear={onClear}/>}
        {activeTab==='problems' && <ProblemsPanel problems={problems} onJump={onJumpToProblem}/>}
        {activeTab==='output' && (
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[13px] text-zinc-400 space-y-0.5">
            {outputLines.map((l,i)=><div key={i}>{l}</div>)}
          </div>
        )}
        {activeTab==='debug' && <div className="flex-1 p-3 text-zinc-600 text-sm font-mono">No active debug session. Run your code to begin debugging.</div>}
        {activeTab==='preview' && <BrowserPreview />}
      </div>
    </div>
  );
}
