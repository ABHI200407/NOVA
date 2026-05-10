'use client';
import React from 'react';
import { X, Pin, Circle } from 'lucide-react';
import { Tab } from './types';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabPin: (id: string) => void;
}

const LANG_DOT: Record<string, string> = {
  typescript: 'bg-blue-400', javascript: 'bg-yellow-400', python: 'bg-green-400',
  json: 'bg-orange-400', html: 'bg-red-400', css: 'bg-purple-400',
  markdown: 'bg-sky-400', rust: 'bg-orange-500', go: 'bg-cyan-400', yaml: 'bg-rose-400',
};

export function TabBar({ tabs, activeTabId, onTabSelect, onTabClose, onTabPin }: TabBarProps) {
  return (
    <div className="h-9 flex items-end bg-[#0e0e10] border-b border-zinc-800 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;
        const dot = LANG_DOT[tab.language] || 'bg-zinc-400';
        return (
          <div
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`
              group relative flex items-center gap-1.5 h-9 px-3 border-r border-zinc-800 cursor-pointer 
              flex-shrink-0 max-w-[180px] select-none transition-colors duration-100
              ${isActive
                ? 'bg-[#1c1c1f] text-zinc-100 border-t-2 border-t-blue-500'
                : 'bg-[#0e0e10] text-zinc-500 hover:bg-[#161618] hover:text-zinc-300'
              }
            `}
          >
            {/* active top border filler */}
            {isActive && <span className="absolute inset-x-0 top-0 h-px bg-[#1c1c1f]" />}

            {/* lang dot */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot} ${tab.isPreview ? 'opacity-40' : ''}`} />

            {/* label */}
            <span className={`text-[13px] truncate ${tab.isPreview ? 'italic' : ''}`}>{tab.name}</span>

            {/* modified indicator */}
            {tab.isModified && !tab.isPreview && (
              <Circle className="w-2 h-2 text-orange-400 fill-orange-400 flex-shrink-0" />
            )}

            {/* pin / close */}
            <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">
              {tab.isPinned
                ? <Pin className="w-3 h-3 text-blue-400" fill="currentColor" />
                : (
                  <button
                    onClick={e => { e.stopPropagation(); onTabClose(tab.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-zinc-100 hover:bg-zinc-700 rounded p-0.5 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )
              }
            </div>
          </div>
        );
      })}
      {/* spacer */}
      <div className="flex-1 h-full" />
    </div>
  );
}
