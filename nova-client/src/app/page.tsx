"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Terminal, Folder, FileCode2, Settings, Zap, Shield, Play } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import Editor from "@monaco-editor/react";

// Agent Definitions
const AGENTS = {
  Coder: { color: "bg-blue-500", shadow: "shadow-[0_0_20px_rgba(59,130,246,0.6)]", label: "Writer" },
  Researcher: { color: "bg-yellow-500", shadow: "shadow-[0_0_20px_rgba(234,179,8,0.6)]", label: "Reviewer" },
  Executor: { color: "bg-zinc-400", shadow: "shadow-[0_0_20px_rgba(161,161,170,0.6)]", label: "DevOps" },
  Supervisor: { color: "bg-white", shadow: "shadow-[0_0_20px_rgba(255,255,255,0.8)]", label: "Nova Core" },
  Security: { color: "bg-orange-500", shadow: "shadow-[0_0_20px_rgba(249,115,22,0.6)]", label: "Security" },
  Performance: { color: "bg-cyan-500", shadow: "shadow-[0_0_20px_rgba(6,182,212,0.6)]", label: "Performance" }
};

export default function NovaIDE() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  
  // Editor state
  const [code, setCode] = useState('// Welcome to the Nova IDE\\n// Agents are standing by.\\n\\nfunction init() {\\n  console.log("Nova Core online.");\\n}\\n');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const websocket = new WebSocket("ws://127.0.0.1:8000/ws/chat");
    setWs(websocket);

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
      
      if (data.agentId) {
        setActiveAgent(data.agentId);
        // Reset active agent after 2 seconds if no new messages
        setTimeout(() => setActiveAgent(null), 2000);
      }
    };

    return () => websocket.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !ws) return;
    
    const userMsg = { type: "message", content: input, role: "user" };
    setMessages((prev) => [...prev, userMsg]);
    
    ws.send(JSON.stringify({ type: "message", content: input }));
    setInput("");
  };

  const handleApproval = (msgIdx: number, approved: boolean) => {
    if (!ws) return;
    const response = approved ? "User approved the action." : "User rejected the action.";
    setMessages((prev) => {
        const newMsg = [...prev];
        newMsg[msgIdx] = { ...newMsg[msgIdx], status: approved ? "approved" : "rejected" };
        newMsg.push({ type: "message", content: response, role: "user" });
        return newMsg;
    });
    ws.send(JSON.stringify({ type: "approval", content: response }));
  };

  // Agent Bubble Component
  const AgentBubble = ({ id, x, y }: { id: string, x: number, y: number }) => {
    const isActive = activeAgent === id;
    const config = AGENTS[id as keyof typeof AGENTS];
    if (!config) return null;

    return (
      <motion.div
        drag
        dragMomentum={true}
        animate={{ 
          x: isActive ? x + (Math.random() * 20 - 10) : x, 
          y: isActive ? y + (Math.random() * 20 - 10) : y,
          scale: isActive ? 1.2 : 1
        }}
        transition={{ type: "spring", stiffness: 50, damping: 10 }}
        className="absolute z-50 flex flex-col items-center cursor-grab active:cursor-grabbing"
      >
        <div className={`w-12 h-12 rounded-full ${config.color} ${isActive ? config.shadow : ''} border-2 border-[#121214] flex items-center justify-center transition-all duration-300`}>
           <Zap className={`w-5 h-5 ${id === 'Supervisor' ? 'text-black' : 'text-white'}`} />
        </div>
        <span className={`mt-2 text-[10px] font-bold tracking-wider uppercase ${isActive ? 'text-zinc-100' : 'text-zinc-500'} transition-colors`}>{config.label}</span>
      </motion.div>
    );
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      
      {/* Sidebar - Project Workspace */}
      <div className="w-64 bg-[#121214] border-r border-zinc-800 flex flex-col z-20">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" fill="currentColor" />
            </div>
            <h1 className="font-bold text-sm tracking-wide text-zinc-100">NOVA</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Workspace</h2>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 px-2 py-1.5 hover:bg-zinc-800 rounded-md cursor-pointer text-sm text-zinc-300">
              <Folder className="w-4 h-4 text-zinc-500" />
              <span>src</span>
            </div>
            <div className="flex items-center space-x-2 px-2 py-1.5 bg-blue-500/10 rounded-md cursor-pointer text-sm text-blue-400 ml-4">
              <FileCode2 className="w-4 h-4 text-blue-400" />
              <span>nova_core.js</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
             <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Nova Core Status</div>
             <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-xs text-zinc-300">Synchronized</span>
             </div>
        </div>
      </div>

      {/* Main Area: Split Editor and Terminal */}
      <div className="flex-1 flex flex-col relative bg-[#09090b]">
        
        {/* Floating Agent Bubbles Layer */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            <div className="pointer-events-auto">
                <AgentBubble id="Supervisor" x={600} y={50} />
                <AgentBubble id="Coder" x={150} y={150} />
                <AgentBubble id="Researcher" x={750} y={200} />
                <AgentBubble id="Executor" x={100} y={400} />
                <AgentBubble id="Security" x={300} y={50} />
                <AgentBubble id="Performance" x={850} y={400} />
            </div>
        </div>

        {/* Top Header */}
        <header className="h-10 border-b border-zinc-800 flex items-center px-4 bg-[#121214] z-10">
            <div className="flex space-x-4">
                <span className="text-xs text-zinc-400 hover:text-zinc-100 cursor-pointer transition-colors">nova_core.js</span>
            </div>
        </header>

        {/* Monaco Editor */}
        <div className="flex-1 relative z-0">
             <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    padding: { top: 24 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                }}
             />
        </div>

        {/* Bottom Panel: Chat and Terminal Feed */}
        <div className="h-72 border-t border-zinc-800 bg-[#121214] flex flex-col z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="h-8 border-b border-zinc-800 flex items-center px-4 space-x-6 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                <span className="text-blue-400 border-b border-blue-400 h-full flex items-center">Nova Terminal</span>
                <span className="hover:text-zinc-300 cursor-pointer transition-colors">Agent Logs</span>
                <span className="hover:text-zinc-300 cursor-pointer transition-colors">Problems</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
                {messages.length === 0 ? (
                    <div className="text-zinc-600 italic">No active processes. Awaiting user input...</div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex space-x-3 ${msg.role === 'user' ? 'text-zinc-300' : ''}`}>
                            <div className="flex-shrink-0 mt-0.5">
                                {msg.role === 'user' ? (
                                    <span className="text-purple-400">❯</span>
                                ) : (
                                    <span className={
                                        msg.agentId === 'Coder' ? 'text-blue-400' :
                                        msg.agentId === 'Researcher' ? 'text-yellow-400' :
                                        msg.agentId === 'Executor' ? 'text-zinc-400' :
                                        'text-white'
                                    }>✦</span>
                                )}
                            </div>
                            <div className="flex-1">
                                {msg.agentId && <span className="text-zinc-500 text-[10px] uppercase mr-2 font-sans tracking-widest">{AGENTS[msg.agentId as keyof typeof AGENTS]?.label || msg.agentId}</span>}
                                <span className={
                                    msg.type === 'error' ? 'text-red-400' :
                                    msg.type === 'tool_execution' ? 'text-green-400' :
                                    msg.type === 'diff' ? 'text-cyan-400' :
                                    msg.role === 'user' ? 'text-zinc-100' : 'text-zinc-400'
                                }>
                                    {msg.content}
                                </span>

                                {msg.type === "approval_request" && !msg.status && (
                                    <div className="flex space-x-3 mt-2">
                                        <button onClick={() => handleApproval(idx, true)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded shadow-md transition-colors font-sans">Approve</button>
                                        <button onClick={() => handleApproval(idx, false)} className="px-3 py-1 bg-zinc-700 hover:bg-red-500 text-white text-xs rounded shadow-md transition-colors font-sans">Reject</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-2 border-t border-zinc-800 bg-[#09090b]">
                <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 focus-within:border-zinc-600 transition-colors">
                    <span className="text-purple-400 font-mono text-sm">❯</span>
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend();
                        }}
                        placeholder="Instruct agents via Nova Core..."
                        className="flex-1 bg-transparent border-none text-zinc-100 placeholder-zinc-600 focus:ring-0 text-sm font-mono outline-none"
                    />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
