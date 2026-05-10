'use client';
import React from 'react';
import { GitBranch, AlertTriangle, Info, Bell, Wifi, WifiOff, CheckCircle, X, Code } from 'lucide-react';

interface StatusBarProps {
  wsStatus: 'connected' | 'disconnected' | 'connecting';
  activeTabName?: string;
  language?: string;
  cursorLine?: number;
  cursorCol?: number;
  lineCount?: number;
  activeAgent?: string | null;
  errorCount?: number;
  warnCount?: number;
  branch?: string;
  encoding?: string;
  eol?: string;
}

const LANG_LABEL: Record<string, string> = {
  typescript: 'TypeScript', javascript: 'JavaScript', python: 'Python',
  json: 'JSON', html: 'HTML', css: 'CSS', markdown: 'Markdown',
  rust: 'Rust', go: 'Go', yaml: 'YAML',
};

export function StatusBar({
  wsStatus, activeTabName, language, cursorLine = 1, cursorCol = 1,
  lineCount = 0, activeAgent, errorCount = 0, warnCount = 1, branch = 'main',
  encoding = 'UTF-8', eol = 'LF'
}: StatusBarProps) {
  const wsColor = wsStatus === 'connected' ? 'text-emerald-400' : wsStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="h-6 bg-[#0a0a0d] border-t border-zinc-800 flex items-center px-2 text-[11px] flex-shrink-0 overflow-hidden select-none">
      {/* Left section */}
      <div className="flex items-center gap-3 flex-1 overflow-hidden">
        {/* Nova brand */}
        <div className="flex items-center gap-1 bg-blue-600/80 px-2 h-6 -ml-2 flex-shrink-0">
          <span className="text-white font-bold tracking-wide">NOVA</span>
        </div>

        {/* Branch */}
        <button className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0">
          <GitBranch className="w-3 h-3" />
          <span>{branch}</span>
        </button>

        {/* Errors / Warnings */}
        <button className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
          <span className="flex items-center gap-0.5">
            <X className="w-3 h-3 text-red-400" />
            <span className="text-red-400">{errorCount}</span>
          </span>
          <span className="flex items-center gap-0.5">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400">{warnCount}</span>
          </span>
        </button>

        {/* Active agent indicator */}
        {activeAgent && (
          <div className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/30 rounded px-2 py-0.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-300">{activeAgent} working…</span>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 flex-shrink-0 text-zinc-500">
        {/* WS status */}
        <div className={`flex items-center gap-1 ${wsColor}`}>
          {wsStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{wsStatus === 'connected' ? 'Nova Core connected' : wsStatus === 'connecting' ? 'Connecting…' : 'Disconnected'}</span>
        </div>

        {/* Cursor position */}
        {activeTabName && (
          <button className="hover:text-zinc-300 transition-colors">
            Ln {cursorLine}, Col {cursorCol}
          </button>
        )}

        {/* Lines */}
        {lineCount > 0 && (
          <span className="text-zinc-600">{lineCount} lines</span>
        )}

        {/* Encoding / EOL */}
        <button className="hover:text-zinc-300 transition-colors">{encoding}</button>
        <button className="hover:text-zinc-300 transition-colors">{eol}</button>

        {/* Language */}
        {language && (
          <button className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
            <Code className="w-3 h-3" />
            {LANG_LABEL[language] || language}
          </button>
        )}

        {/* Notifications */}
        <button className="hover:text-zinc-300 transition-colors">
          <Bell className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
