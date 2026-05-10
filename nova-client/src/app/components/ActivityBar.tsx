'use client';
import React from 'react';
import { Files, Search, GitBranch, Bot, Puzzle, Settings, Zap, Play, TestTube, Bug } from 'lucide-react';
import { SidebarView } from './types';

interface ActivityBarProps {
  activeView: SidebarView | null;
  onViewChange: (view: SidebarView) => void;
  onSettings: () => void;
  onRunFile: () => void;
  onRunTests?: () => void;
  onDebug?: () => void;
}

const TOP_ITEMS = [
  { id: 'explorer' as SidebarView, icon: Files, label: 'Explorer (Ctrl+Shift+E)' },
  { id: 'search' as SidebarView, icon: Search, label: 'Search (Ctrl+Shift+F)' },
  { id: 'git' as SidebarView, icon: GitBranch, label: 'Source Control (Ctrl+Shift+G)' },
  { id: 'agents' as SidebarView, icon: Bot, label: 'AI Agents' },
  { id: 'extensions' as SidebarView, icon: Puzzle, label: 'Extensions' },
];

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap bg-zinc-800 text-zinc-100 text-xs px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-zinc-700">
      {children}
    </span>
  );
}

export function ActivityBar({ activeView, onViewChange, onSettings, onRunFile, onRunTests, onDebug }: ActivityBarProps) {
  return (
    <div className="flex flex-col items-center w-12 bg-[#111113] border-r border-zinc-800 flex-shrink-0 z-30">
      {/* Logo */}
      <div className="w-12 h-12 flex items-center justify-center border-b border-zinc-800 mb-1 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Zap className="w-4 h-4 text-white" fill="currentColor" />
        </div>
      </div>

      {/* Top nav */}
      <div className="flex flex-col items-center gap-1 flex-1 pt-1 overflow-hidden">
        {TOP_ITEMS.map(({ id, icon: Icon, label }) => (
          <button key={id} title={label} onClick={() => onViewChange(id)}
            className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 group flex-shrink-0 ${activeView === id ? 'text-zinc-100 bg-zinc-700/60' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'}`}>
            {activeView === id && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-blue-500" />}
            <Icon className="w-5 h-5" />
            <Tip>{label}</Tip>
          </button>
        ))}
      </div>

      {/* Bottom — all buttons wired */}
      <div className="flex flex-col items-center gap-1 pb-2 flex-shrink-0">
        <button onClick={onRunFile} title="Run current file (F5)"
          className="relative w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800/60 transition-all group">
          <Play className="w-5 h-5" />
          <Tip>Run File (F5)</Tip>
        </button>
        <button onClick={onRunTests} title="Run Tests"
          className="relative w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 hover:text-yellow-400 hover:bg-zinc-800/60 transition-all group">
          <TestTube className="w-5 h-5" />
          <Tip>Run Tests</Tip>
        </button>
        <button onClick={onDebug} title="Debug (F9)"
          className="relative w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 hover:text-orange-400 hover:bg-zinc-800/60 transition-all group">
          <Bug className="w-5 h-5" />
          <Tip>Debug (F9)</Tip>
        </button>
        <button onClick={onSettings} title="Settings (Ctrl+,)"
          className="relative w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all group">
          <Settings className="w-5 h-5" />
          <Tip>Settings (Ctrl+,)</Tip>
        </button>
      </div>
    </div>
  );
}
