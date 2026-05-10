'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowRight, Hash, Code, FileText, Zap, Settings, Play, Bug, Palette } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand?: (id: string) => void;
  filePaths?: string[];
  onOpenFile?: (path: string) => void;
}

export function CommandPalette({ isOpen, onClose, onCommand, filePaths = [], onOpenFile }: CommandPaletteProps) {
  const dispatch = (id: string) => { onCommand?.(id); onClose(); };
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const COMMANDS: Command[] = [
    { id: 'new-file',     label: 'New File',                 icon: <FileText className="w-4 h-4" />,                          category: 'File',        shortcut: 'Ctrl+N',       action: () => dispatch('new-file') },
    { id: 'save',         label: 'Save File',                icon: <FileText className="w-4 h-4" />,                          category: 'File',        shortcut: 'Ctrl+S',       action: () => dispatch('save') },
    { id: 'close-tab',    label: 'Close Active Tab',         icon: <FileText className="w-4 h-4" />,                          category: 'File',        shortcut: 'Ctrl+W',       action: () => dispatch('close-tab') },
    { id: 'explorer',     label: 'Show Explorer',            icon: <FileText className="w-4 h-4" />,                          category: 'View',        shortcut: 'Ctrl+Shift+E', action: () => dispatch('explorer') },
    { id: 'search',       label: 'Find in Files',            icon: <Search className="w-4 h-4" />,                            category: 'View',        shortcut: 'Ctrl+Shift+F', action: () => dispatch('search') },
    { id: 'git',          label: 'Source Control',           icon: <ArrowRight className="w-4 h-4" />,                        category: 'View',        shortcut: 'Ctrl+Shift+G', action: () => dispatch('git') },
    { id: 'agents',       label: 'AI Agents Panel',          icon: <Zap className="w-4 h-4 text-blue-400" />,                 category: 'View',                                  action: () => dispatch('agents') },
    { id: 'extensions',   label: 'Extensions',               icon: <Zap className="w-4 h-4 text-purple-400" />,               category: 'View',                                  action: () => dispatch('extensions') },
    { id: 'terminal',     label: 'Toggle Terminal',          icon: <Code className="w-4 h-4" />,                              category: 'Terminal',    shortcut: 'Ctrl+`',       action: () => dispatch('terminal') },
    { id: 'problems',     label: 'Show Problems',            icon: <Code className="w-4 h-4" />,                              category: 'View',                                  action: () => dispatch('problems') },
    { id: 'output',       label: 'Show Output',              icon: <Code className="w-4 h-4" />,                              category: 'View',                                  action: () => dispatch('output') },
    { id: 'sidebar',      label: 'Toggle Sidebar',           icon: <ArrowRight className="w-4 h-4" />,                        category: 'View',        shortcut: 'Ctrl+B',       action: () => dispatch('sidebar') },
    { id: 'settings',     label: 'Open Settings',            icon: <Settings className="w-4 h-4" />,                          category: 'Preferences', shortcut: 'Ctrl+,',       action: () => dispatch('settings') },
    { id: 'theme-dark',   label: 'Theme: Dark (vs-dark)',    icon: <Palette className="w-4 h-4" />,                           category: 'Preferences',                           action: () => dispatch('theme-dark') },
    { id: 'theme-light',  label: 'Theme: Light (vs)',        icon: <Palette className="w-4 h-4" />,                           category: 'Preferences',                           action: () => dispatch('theme-light') },
    { id: 'theme-hc',     label: 'Theme: High Contrast',     icon: <Palette className="w-4 h-4" />,                           category: 'Preferences',                           action: () => dispatch('theme-hc') },
    { id: 'run-file',     label: 'Run Current File',         icon: <Play className="w-4 h-4 text-emerald-400" />,             category: 'Run',         shortcut: 'F5',           action: () => dispatch('run-file') },
    { id: 'run-tests',    label: 'Run Tests',                icon: <Play className="w-4 h-4 text-yellow-400" />,              category: 'Run',                                   action: () => dispatch('run-tests') },
    { id: 'debug-file',   label: 'Start Debug Session',      icon: <Bug className="w-4 h-4 text-orange-400" />,               category: 'Debug',                                 action: () => dispatch('debug-file') },
    { id: 'format',       label: 'Format Document',          icon: <Code className="w-4 h-4" />,                              category: 'Edit',        shortcut: 'Shift+Alt+F',  action: () => dispatch('format') },
    { id: 'find',         label: 'Find in File',             icon: <Search className="w-4 h-4" />,                            category: 'Edit',        shortcut: 'Ctrl+F',       action: () => dispatch('find') },
    { id: 'replace',      label: 'Replace in File',          icon: <Search className="w-4 h-4" />,                            category: 'Edit',        shortcut: 'Ctrl+H',       action: () => dispatch('replace') },
    { id: 'go-to-line',   label: 'Go to Line…',              icon: <Hash className="w-4 h-4" />,                              category: 'Go',          shortcut: 'Ctrl+G',       action: () => dispatch('go-to-line') },
    { id: 'go-symbol',    label: 'Go to Symbol…',            icon: <Hash className="w-4 h-4" />,                              category: 'Go',          shortcut: 'Ctrl+Shift+O', action: () => dispatch('go-symbol') },
    { id: 'go-def',       label: 'Go to Definition',         icon: <Hash className="w-4 h-4" />,                              category: 'Go',          shortcut: 'F12',          action: () => dispatch('go-def') },
    { id: 'nova-explain', label: 'Nova: Explain Code',       icon: <Zap className="w-4 h-4 text-purple-400" />,               category: 'Nova',                                  action: () => dispatch('nova-explain') },
    { id: 'nova-refactor',label: 'Nova: Refactor',           icon: <Zap className="w-4 h-4 text-yellow-400" />,               category: 'Nova',                                  action: () => dispatch('nova-refactor') },
    { id: 'nova-test',    label: 'Nova: Generate Unit Tests', icon: <Zap className="w-4 h-4 text-emerald-400" />,             category: 'Nova',                                  action: () => dispatch('nova-test') },
    { id: 'nova-fix',     label: 'Nova: Fix Diagnostics',    icon: <Zap className="w-4 h-4 text-red-400" />,                  category: 'Nova',                                  action: () => dispatch('nova-fix') },
    { id: 'clear-terminal',label:'Clear Terminal',           icon: <Code className="w-4 h-4" />,                              category: 'Terminal',                              action: () => dispatch('clear-terminal') },
  ];

  // If query starts with '>' → filter commands; else → fuzzy file search + commands
  const isCommandMode = query.startsWith('>');
  const q = isCommandMode ? query.slice(1).trim().toLowerCase() : query.toLowerCase();

  const fileResults = useMemo(() => {
    if (isCommandMode || !q) return [];
    return filePaths
      .filter(p => p.toLowerCase().includes(q))
      .slice(0, 20)
      .map(path => ({
        id: `open-${path}`,
        label: path.split('/').pop() ?? path,
        description: path,
        icon: <FileText className="w-4 h-4 text-blue-400" />,
        category: 'Open File',
        action: () => { onOpenFile?.(path); onClose(); },
      }));
  }, [q, isCommandMode, filePaths]);

  const cmdResults = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
  );

  const filtered: (Command | typeof fileResults[number])[] = isCommandMode
    ? cmdResults
    : [...fileResults, ...cmdResults];

  useEffect(() => {
    if (isOpen) { setTimeout(() => inputRef.current?.focus(), 10); setQuery(''); setSelectedIdx(0); }
  }, [isOpen]);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { filtered[selectedIdx]?.action(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]" onClick={onClose}>
      <div
        className="w-[620px] max-w-[90vw] bg-[#1a1a1f] border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a filename to open, or '>' for commands..."
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 outline-none text-sm"
          />
          <kbd className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Mode hint */}
        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-zinc-900 bg-[#111114] text-[11px] text-zinc-600">
          <span className={`px-1.5 py-0.5 rounded cursor-pointer hover:text-zinc-300 ${!isCommandMode ? 'bg-blue-600/30 text-blue-300' : 'hover:bg-zinc-800'}`} onClick={() => setQuery('')}>Files</span>
          <span className={`px-1.5 py-0.5 rounded cursor-pointer hover:text-zinc-300 ${isCommandMode ? 'bg-blue-600/30 text-blue-300' : 'hover:bg-zinc-800'}`} onClick={() => setQuery('> ')}>Commands</span>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-zinc-600 text-sm">No results for &quot;{query}&quot;</div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIdx(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIdx ? 'bg-blue-600/30 text-zinc-100' : 'text-zinc-300 hover:bg-zinc-800'}`}
              >
                <span className="text-zinc-500 flex-shrink-0">{cmd.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{cmd.label}</span>
                  {cmd.description && <span className="text-[11px] text-zinc-500 ml-2 truncate">{cmd.description}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-zinc-600 bg-zinc-800/80 px-1.5 py-0.5 rounded">{cmd.category}</span>
                  {'shortcut' in cmd && cmd.shortcut && (
                    <kbd className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">{cmd.shortcut}</kbd>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-4 text-[11px] text-zinc-600">
          <span><kbd className="bg-zinc-800 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-zinc-800 px-1 rounded">↵</kbd> select</span>
          <span><kbd className="bg-zinc-800 px-1 rounded">ESC</kbd> close</span>
          <span className="ml-auto">Type <kbd className="bg-zinc-800 px-1 rounded text-zinc-400">&gt;</kbd> for commands</span>
        </div>
      </div>
    </div>
  );
}
