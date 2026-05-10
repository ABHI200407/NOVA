'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { ChevronRight, WrapText, AlignLeft, SplitSquareHorizontal, Search, X } from 'lucide-react';
import { Tab } from './types';
import type { EditorSettings } from '../hooks/useSettings';
import type * as monacoNS from 'monaco-editor';
import { PreviewPanel } from './PreviewPanel';
import { DiffViewer } from './DiffViewer';

export type EditorProblem = {
  file: string; line: number; col: number;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string; source: string;
};

interface EditorAreaProps {
  tab: Tab | null;
  onCodeChange: (tabId: string, value: string) => void;
  onSave: (tabId: string, value: string) => void;
  onOpenSearch: () => void;
  onProblemsUpdate: (problems: EditorProblem[]) => void;
  onCursorChange?: (pos: { line: number; col: number; lines: number }) => void;
  settings: EditorSettings;
  pendingDiff?: { original: string; modified: string; file: string; language: string } | null;
  onAcceptDiff?: (newContent: string) => void;
  onRejectDiff?: () => void;
}

export function EditorArea({ tab, onCodeChange, onSave, onOpenSearch, onProblemsUpdate, onCursorChange, settings, pendingDiff, onAcceptDiff, onRejectDiff }: EditorAreaProps) {
  const editorRef = useRef<monacoNS.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monacoNS | null>(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1, lines: 0 });
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [splitPreview, setSplitPreview] = useState(false);
  const PREVIEWABLE = ['md','html','csv','json','png','jpg','jpeg','gif','svg','webp'];
  const canPreview = tab ? PREVIEWABLE.includes(tab.name.split('.').pop()?.toLowerCase() ?? '') : false;

  // Reactively update all Monaco options when settings change
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.updateOptions({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      tabSize: settings.tabSize,
      wordWrap: settings.wordWrap,
      minimap: { enabled: settings.minimap },
      lineNumbers: settings.lineNumbers,
      renderWhitespace: settings.renderWhitespace,
      fontLigatures: settings.ligatures,
      cursorBlinking: settings.cursorBlinking,
      bracketPairColorization: { enabled: settings.bracketPairColor },
      guides: { indentation: settings.indentGuides, bracketPairs: settings.bracketPairColor },
    });
  }, [settings]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setCursor(c => ({ ...c, lines: editor.getModel()?.getLineCount() ?? 0 }));

    editor.onDidChangeCursorPosition(e => {
      const pos = { line: e.position.lineNumber, col: e.position.column, lines: editor.getModel()?.getLineCount() ?? 0 };
      setCursor(pos);
      onCursorChange?.(pos);
    });
    editor.onDidChangeModelContent(() => {
      const lines = editor.getModel()?.getLineCount() ?? 0;
      setCursor(prev => { const next = { ...prev, lines }; onCursorChange?.(next); return next; });
    });

    // Ctrl+S → format (if enabled) then save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const val = editor.getValue();
      if (tab) {
        if (settings.formatOnSave) {
          editor.getAction('editor.action.formatDocument')?.run().then(() => {
            onSave(tab.id, editor.getValue());
          });
        } else {
          onSave(tab.id, val);
        }
      }
    });

    // F5 → run via terminal
    editor.addCommand(monaco.KeyCode.F5, () => {
      (window as any).__novaRunFile?.();
    });

    // Collect Monaco diagnostics → Problems panel
    monaco.editor.onDidChangeMarkers(() => {
      const all: EditorProblem[] = [];
      monaco.editor.getModels().forEach((m: monacoNS.editor.ITextModel) => {
        const markers = monaco.editor.getModelMarkers({ resource: m.uri });
        markers.forEach((mk: monacoNS.editor.IMarker) => all.push({
          file: m.uri.path.split('/').pop() ?? '',
          line: mk.startLineNumber, col: mk.startColumn,
          severity: mk.severity === monaco.MarkerSeverity.Error ? 'error'
            : mk.severity === monaco.MarkerSeverity.Warning ? 'warning'
            : mk.severity === monaco.MarkerSeverity.Info ? 'info' : 'hint',
          message: mk.message, source: mk.source ?? 'ts',
        }));
      });
      onProblemsUpdate(all);
    });
  };

  const jumpTo = useCallback((line: number) => {
    editorRef.current?.revealLineInCenter(line);
    editorRef.current?.setPosition({ lineNumber: line, column: 1 });
    editorRef.current?.focus();
  }, []);

  // Expose global helpers for external command dispatch
  useEffect(() => {
    (window as any).__novaJumpTo = jumpTo;
    (window as any).__novaGetSelection = () => editorRef.current?.getModel()?.getValueInRange(editorRef.current.getSelection()!) ?? '';
    (window as any).__novaEditorAction = (action: string) => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;
      switch (action) {
        case 'undo': editor.trigger('keyboard', 'undo', null); break;
        case 'redo': editor.trigger('keyboard', 'redo', null); break;
        case 'find': editor.getAction('actions.find')?.run(); break;
        case 'replace': editor.getAction('editor.action.startFindReplaceAction')?.run(); break;
        case 'format': editor.getAction('editor.action.formatDocument')?.run(); break;
        case 'go-to-line': editor.getAction('editor.action.gotoLine')?.run(); break;
        case 'go-symbol': editor.getAction('editor.action.quickOutline')?.run(); break;
        case 'go-def': editor.getAction('editor.action.revealDefinition')?.run(); break;
        case 'go-refs': editor.getAction('editor.action.referenceSearch.trigger')?.run(); break;
      }
    };
  }, [jumpTo]);

  const handleChange = (val: string | undefined) => {
    if (!tab) return;
    onCodeChange(tab.id, val ?? '');
    // Auto-save
    if (settings.autoSave) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => onSave(tab.id, val ?? ''), settings.autoSaveDelay);
    }
  };

  const format = () => editorRef.current?.getAction('editor.action.formatDocument')?.run();
  const openFindInFile = () => editorRef.current?.getAction('actions.find')?.run();

  if (!settings) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0e0e10] text-zinc-600 select-none gap-3">
      <div className="text-3xl">⚡</div>
      <p className="text-sm">Loading Nova IDE…</p>
    </div>
  );

  if (!tab) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0e0e10] text-zinc-600 select-none gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-zinc-800 text-3xl">⚡</div>
      <p className="text-zinc-500 text-sm">No file open — select from Explorer</p>
      <p className="text-zinc-700 text-xs">Press <kbd className="bg-zinc-800 px-1 rounded text-zinc-500 font-mono">Ctrl+P</kbd> to open a file</p>
      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
        {[['Ctrl+P','Quick Open'],['Ctrl+Shift+P','Command Palette'],['Ctrl+`','Terminal'],['Ctrl+B','Sidebar'],['Ctrl+,','Settings'],['F5','Run File']].map(([k,v]) => (
          <div key={k} className="flex items-center gap-2 text-zinc-600 bg-zinc-900/80 rounded px-2 py-1">
            <kbd className="text-zinc-400 bg-zinc-800 px-1 rounded font-mono text-[10px]">{k}</kbd>{v}
          </div>
        ))}
      </div>
    </div>
  );

  const crumbs = tab ? ['nova-project', ...tab.name.replace(/^f-/, '').split('/')].filter(Boolean) : [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0e0e10]">
      {/* Breadcrumb + toolbar */}
      <div className="h-7 flex items-center justify-between px-3 border-b border-zinc-800/50 bg-[#141416] flex-shrink-0">
        <div className="flex items-center gap-1 text-[12px] text-zinc-500 overflow-hidden min-w-0">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0 text-zinc-700" />}
              <span className={`truncate hover:text-zinc-200 cursor-pointer transition-colors ${i === crumbs.length - 1 ? 'text-zinc-300' : ''}`}>{c}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
          <button onClick={openFindInFile} title="Find in file (Ctrl+F)" className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"><Search className="w-3.5 h-3.5" /></button>
          <button onClick={format} title="Format Document (Shift+Alt+F)" className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"><AlignLeft className="w-3.5 h-3.5" /></button>
          {canPreview && (
            <button onClick={() => setSplitPreview(p => !p)} title="Toggle Preview" className={`p-1 rounded hover:bg-zinc-800 transition-colors ${splitPreview ? 'text-blue-400' : 'text-zinc-600 hover:text-zinc-300'}`}>
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
          {tab.isModified && (
            <span className="text-[10px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded ml-1">unsaved</span>
          )}
          {settings.autoSave && (
            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-1">auto-save on</span>
          )}
          <span className="text-[10px] text-zinc-600 ml-2 font-mono">Ln {cursor.line}, Col {cursor.col} · {cursor.lines} lines</span>
        </div>
      </div>

      {/* Monaco + optional split preview */}
      <div className="flex-1 overflow-hidden flex flex-row relative">
        {/* Diff overlay — takes over when agent proposes changes */}
        {pendingDiff && (
          <DiffViewer
            original={pendingDiff.original}
            modified={pendingDiff.modified}
            language={pendingDiff.language}
            filename={pendingDiff.file}
            onAccept={onAcceptDiff ?? (() => {})}
            onReject={onRejectDiff ?? (() => {})}
          />
        )}
        <div className={splitPreview && canPreview ? 'w-1/2' : 'flex-1'} style={{ overflow: 'hidden' }}>
          <Editor
            key={tab.id}
            height="100%"
            language={tab.language}
            theme={settings.theme}
            value={tab.content}
            onMount={handleMount}
            onChange={handleChange}
            options={{
              fontSize: settings.fontSize,
              fontFamily: settings.fontFamily,
              fontLigatures: settings.ligatures,
              tabSize: settings.tabSize,
              lineNumbers: settings.lineNumbers,
              minimap: { enabled: settings.minimap && !splitPreview, renderCharacters: false },
              wordWrap: settings.wordWrap,
              renderWhitespace: settings.renderWhitespace,
              bracketPairColorization: { enabled: settings.bracketPairColor },
              guides: { bracketPairs: settings.bracketPairColor, indentation: settings.indentGuides },
              cursorBlinking: settings.cursorBlinking,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorSmoothCaretAnimation: 'on',
              padding: { top: 12, bottom: 12 },
              suggest: { preview: true, showMethods: true, showFunctions: true, showClasses: true, showVariables: true, showKeywords: true },
              inlineSuggest: { enabled: true },
              folding: true,
              showFoldingControls: 'mouseover',
              matchBrackets: 'always',
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              formatOnPaste: true,
              renderLineHighlight: 'gutter',
              selectionHighlight: true,
              occurrencesHighlight: 'singleFile',
              links: true,
              colorDecorators: true,
              scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              quickSuggestions: { other: true, comments: false, strings: true },
              parameterHints: { enabled: true },
              hover: { enabled: true },
              lightbulb: { enabled: 'on' as any },
            }}
          />
        </div>
        {splitPreview && canPreview && (
          <div className="w-1/2 overflow-hidden">
            <PreviewPanel tab={tab} onClose={() => setSplitPreview(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
