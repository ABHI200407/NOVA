'use client';
import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Check, X, GitBranch, FileText } from 'lucide-react';

interface DiffViewerProps {
  original: string;
  modified: string;
  language: string;
  filename: string;
  onAccept: (newContent: string) => void;
  onReject: () => void;
}

export function DiffViewer({ original, modified, language, filename, onAccept, onReject }: DiffViewerProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#0e0e10] border border-blue-500/40 rounded-none">
      {/* Header */}
      <div className="h-10 flex items-center gap-3 px-4 bg-[#111113] border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600/30 flex items-center justify-center">
            <GitBranch className="w-3 h-3 text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-zinc-100">Nova Proposed Changes</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[11px] text-blue-300">Review before applying</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <FileText className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[12px] text-zinc-400 font-mono">{filename}</span>
          <span className="text-[11px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded ml-1">− original</span>
          <span className="text-[11px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+ proposed</span>
        </div>
      </div>

      {/* Diff editor */}
      <div className="flex-1 overflow-hidden">
        <DiffEditor
          original={original}
          modified={modified}
          language={language}
          theme="vs-dark"
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            padding: { top: 8 },
            renderIndicators: true,
            ignoreTrimWhitespace: false,
          }}
        />
      </div>

      {/* Action bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#111113] border-t border-zinc-800 flex-shrink-0">
        <p className="text-[12px] text-zinc-500">
          Accept to apply changes to the file, or reject to discard.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
          <button
            onClick={() => onAccept(modified)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium"
          >
            <Check className="w-3.5 h-3.5" /> Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
}
