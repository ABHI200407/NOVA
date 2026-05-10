'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface MenuBarProps {
  wsStatus: 'connected' | 'disconnected' | 'connecting';
  onCommand: (id: string) => void;
  onCmdPalette: () => void;
}

type MenuItem = { label: string; id?: string; shortcut?: string; separator?: boolean; disabled?: boolean };
type MenuDef = { label: string; items: MenuItem[] };

const MENUS: MenuDef[] = [
  {
    label: 'File', items: [
      { label: 'New File', id: 'new-file', shortcut: 'Ctrl+N' },
      { label: 'Open Folder…', id: 'open-folder', shortcut: 'Ctrl+K Ctrl+O' },
      { separator: true, label: '' },
      { label: 'Save', id: 'save', shortcut: 'Ctrl+S' },
      { label: 'Save All', id: 'save-all', shortcut: 'Ctrl+K S' },
      { separator: true, label: '' },
      { label: 'Close Tab', id: 'close-tab', shortcut: 'Ctrl+W' },
      { label: 'Close All Tabs', id: 'close-all', shortcut: 'Ctrl+K W' },
    ],
  },
  {
    label: 'Edit', items: [
      { label: 'Undo', id: 'undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', id: 'redo', shortcut: 'Ctrl+Y' },
      { separator: true, label: '' },
      { label: 'Find in File', id: 'find', shortcut: 'Ctrl+F' },
      { label: 'Find in Files', id: 'search', shortcut: 'Ctrl+Shift+F' },
      { label: 'Replace in File', id: 'replace', shortcut: 'Ctrl+H' },
      { separator: true, label: '' },
      { label: 'Format Document', id: 'format', shortcut: 'Shift+Alt+F' },
      { label: 'Go to Line', id: 'go-to-line', shortcut: 'Ctrl+G' },
    ],
  },
  {
    label: 'View', items: [
      { label: 'Command Palette', id: 'cmd-palette', shortcut: 'Ctrl+Shift+P' },
      { separator: true, label: '' },
      { label: 'Explorer', id: 'explorer', shortcut: 'Ctrl+Shift+E' },
      { label: 'Search', id: 'search-panel', shortcut: 'Ctrl+Shift+F' },
      { label: 'Source Control', id: 'git', shortcut: 'Ctrl+Shift+G' },
      { label: 'AI Agents', id: 'agents' },
      { label: 'Extensions', id: 'extensions' },
      { separator: true, label: '' },
      { label: 'Toggle Sidebar', id: 'sidebar', shortcut: 'Ctrl+B' },
      { label: 'Toggle Terminal', id: 'terminal', shortcut: 'Ctrl+`' },
      { separator: true, label: '' },
      { label: 'Settings', id: 'settings', shortcut: 'Ctrl+,' },
    ],
  },
  {
    label: 'Go', items: [
      { label: 'Go to File…', id: 'quick-open', shortcut: 'Ctrl+P' },
      { label: 'Go to Symbol…', id: 'go-symbol', shortcut: 'Ctrl+Shift+O' },
      { label: 'Go to Line…', id: 'go-to-line', shortcut: 'Ctrl+G' },
      { separator: true, label: '' },
      { label: 'Go to Definition', id: 'go-def', shortcut: 'F12' },
      { label: 'Go to References', id: 'go-refs', shortcut: 'Shift+F12' },
    ],
  },
  {
    label: 'Run', items: [
      { label: 'Run Current File', id: 'run-file', shortcut: 'F5' },
      { label: 'Run Nova Agent Task', id: 'nova-task', shortcut: 'Ctrl+Enter' },
      { separator: true, label: '' },
      { label: 'Nova: Explain Code', id: 'nova-explain' },
      { label: 'Nova: Refactor', id: 'nova-refactor' },
      { label: 'Nova: Generate Tests', id: 'nova-test' },
      { label: 'Nova: Fix Diagnostics', id: 'nova-fix' },
    ],
  },
  {
    label: 'Terminal', items: [
      { label: 'New Terminal', id: 'terminal', shortcut: 'Ctrl+`' },
      { label: 'Clear Terminal', id: 'clear-terminal' },
      { separator: true, label: '' },
      { label: 'Problems', id: 'problems' },
      { label: 'Output', id: 'output' },
    ],
  },
];

export function MenuBar({ wsStatus, onCommand, onCmdPalette }: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const dispatch = (id: string) => {
    setOpenMenu(null);
    if (id === 'cmd-palette') { onCmdPalette(); return; }
    onCommand(id);
  };

  return (
    <div ref={barRef} className="h-8 bg-[#0a0a0d] border-b border-zinc-800 flex items-center text-[12px] text-zinc-400 flex-shrink-0 select-none z-50">
      {/* Menus */}
      <div className="flex items-center">
        {MENUS.map(menu => (
          <div key={menu.label} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
              className={`px-3 h-8 hover:text-zinc-100 transition-colors ${openMenu === menu.label ? 'bg-zinc-800 text-zinc-100' : ''}`}
            >
              {menu.label}
            </button>
            {openMenu === menu.label && (
              <div className="absolute top-full left-0 mt-0 w-56 bg-[#1c1c1f] border border-zinc-700 rounded-b-lg shadow-2xl shadow-black/60 py-1 z-[100]">
                {menu.items.map((item, i) =>
                  item.separator
                    ? <div key={i} className="border-t border-zinc-800 my-1" />
                    : (
                      <button key={item.id ?? i}
                        disabled={item.disabled}
                        onClick={() => item.id && dispatch(item.id)}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] text-zinc-300 hover:bg-zinc-700/60 hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && <kbd className="text-[10px] text-zinc-600 font-mono">{item.shortcut}</kbd>}
                      </button>
                    )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Center title / cmd palette trigger */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={onCmdPalette}
          className="flex items-center gap-4 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 rounded-md px-4 py-0.5 text-zinc-500 hover:text-zinc-300 transition-colors text-[11px]"
        >
          <span>Nova IDE</span>
          <span className="text-zinc-700">Ctrl+Shift+P</span>
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 px-3 text-[11px]">
        {wsStatus === 'connected'
          ? <Wifi className="w-3 h-3 text-emerald-400" />
          : <WifiOff className="w-3 h-3 text-red-400" />}
        <span className={wsStatus === 'connected' ? 'text-emerald-400' : wsStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}>
          nova-core {wsStatus}
        </span>
      </div>
    </div>
  );
}
