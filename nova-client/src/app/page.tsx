"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { ActivityBar } from "./components/ActivityBar";
import { Sidebar } from "./components/Sidebar";
import { TabBar } from "./components/TabBar";
import { EditorArea } from "./components/EditorArea";
import { BottomPanel } from "./components/BottomPanel";
import { StatusBar } from "./components/StatusBar";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsPanel } from "./components/SettingsPanel";
import { MenuBar } from "./components/MenuBar";
import { useFileSystem } from "./hooks/useFileSystem";
import { useWebSocket } from "./hooks/useWebSocket";
import { useSettings } from "./hooks/useSettings";
import { useTaskQueue } from "./hooks/useTaskQueue";
import type { FileNode, Agent, SidebarView, PanelTab, Language, AgentTask } from "./components/types";
import type { EditorProblem } from "./components/EditorArea";

const DEFAULT_AGENTS: Agent[] = [
  { id:'Supervisor', label:'Nova Core',  description:'Central orchestrator — routes all tasks', color:'#ffffff', bgColor:'bg-white',      dotColor:'bg-white',      isActive:false, status:'idle' },
  { id:'Coder',      label:'Writer',     description:'Writes, refactors and reviews code',     color:'#3b82f6', bgColor:'bg-blue-500',   dotColor:'bg-blue-400',   isActive:false, status:'idle' },
  { id:'Researcher', label:'Reviewer',   description:'Searches docs and synthesizes knowledge', color:'#eab308', bgColor:'bg-yellow-500', dotColor:'bg-yellow-400', isActive:false, status:'idle' },
  { id:'Executor',   label:'DevOps',     description:'Runs commands and manages CI/CD',        color:'#a1a1aa', bgColor:'bg-zinc-400',   dotColor:'bg-zinc-400',   isActive:false, status:'idle' },
  { id:'Security',   label:'Security',   description:'Audits code for vulnerabilities',        color:'#f97316', bgColor:'bg-orange-500', dotColor:'bg-orange-400', isActive:false, status:'idle' },
  { id:'Performance',label:'Perf',       description:'Profiles, optimizes and benchmarks',     color:'#06b6d4', bgColor:'bg-cyan-500',   dotColor:'bg-cyan-400',   isActive:false, status:'idle' },
];

export default function NovaIDE() {
  const fs = useFileSystem();
  const ws = useWebSocket();
  const { settings, update: updateSettings, reset: resetSettings } = useSettings();
  const tq = useTaskQueue(fs.activeTab, ws.status, ws.sendMessage);
  const [pendingDiff, setPendingDiff] = useState<AgentTask['diff'] | null>(null);

  const [sidebarView, setSidebarView] = useState<SidebarView | null>('explorer');
  const [panelTab, setPanelTab] = useState<PanelTab>('terminal');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [problems, setProblems] = useState<EditorProblem[]>([]);
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  // Cursor position tracked from EditorArea
  const [cursor, setCursor] = useState({ line: 1, col: 1, lines: 0 });

  const outputLines = [
    '> Nova Core v1.0.0 initializing…',
    '✓ Supervisor agent ready',
    '→ Coder, Researcher, Executor, Security, Performance agents loaded',
    '✓ Virtual file system mounted (localStorage)',
    `⚙ Connecting to ws://127.0.0.1:8000/ws/chat — status: ${ws.status}`,
  ];

  // Sync active agent
  useEffect(() => {
    if (ws.activeAgent) {
      setAgents(prev => prev.map(a => a.id === ws.activeAgent
        ? { ...a, isActive: true, status: 'working', task: ws.messages.at(-1)?.content?.slice(0, 60) }
        : a));
    } else {
      setAgents(prev => prev.map(a => a.isActive ? { ...a, isActive: false, status: 'idle', task: undefined } : a));
    }
  }, [ws.activeAgent]);

  // ── Central command dispatcher ────────────────────────────────────────
  const handleCommand = useCallback((id: string) => {
    setCmdOpen(false);
    switch (id) {
      // ── File ──
      case 'new-file': handleCreateFile(); break;
      case 'open-folder': {
        ws.sendMessage('[info] Folder open requires a backend with filesystem access. Use the Explorer + icons to create files.');
        setPanelTab('terminal');
        break;
      }
      case 'save': { const t = fs.activeTab; if (t) fs.saveFile(t.id, t.content); break; }
      case 'save-all': fs.tabs.forEach(t => fs.saveFile(t.id, t.content)); break;
      case 'close-tab': { if (fs.activeTabId) fs.closeTab(fs.activeTabId); break; }
      case 'close-all': [...fs.tabs].forEach(t => fs.closeTab(t.id)); break;

      // ── Edit ──
      case 'undo': (window as any).__novaEditorAction?.('undo'); break;
      case 'redo': (window as any).__novaEditorAction?.('redo'); break;
      case 'find': (window as any).__novaEditorAction?.('find'); break;
      case 'replace': (window as any).__novaEditorAction?.('replace'); break;
      case 'format': (window as any).__novaEditorAction?.('format'); break;
      case 'go-to-line': (window as any).__novaEditorAction?.('go-to-line'); break;

      // ── Go ──
      case 'go-symbol': (window as any).__novaEditorAction?.('go-symbol'); break;
      case 'go-def': (window as any).__novaEditorAction?.('go-def'); break;
      case 'go-refs': (window as any).__novaEditorAction?.('go-refs'); break;

      // ── View / panels ──
      case 'explorer': setSidebarView(v => v === 'explorer' ? null : 'explorer'); break;
      case 'search': case 'search-panel': setSidebarView('search'); break;
      case 'git': setSidebarView('git'); break;
      case 'agents': setSidebarView('agents'); break;
      case 'extensions': setSidebarView('extensions'); break;
      case 'sidebar': setSidebarView(v => v ? null : 'explorer'); break;
      case 'terminal': setPanelTab('terminal'); break;
      case 'problems': setPanelTab('problems'); break;
      case 'output': setPanelTab('output'); break;
      case 'debug': setPanelTab('debug'); break;
      case 'clear-terminal': ws.clearMessages(); break;
      case 'settings': setSettingsOpen(true); break;
      case 'cmd-palette': setCmdOpen(true); break;
      case 'quick-open': setCmdOpen(true); break;

      // ── Theme shortcuts ──
      case 'theme-dark': updateSettings({ theme: 'vs-dark' }); break;
      case 'theme-light': updateSettings({ theme: 'vs' }); break;
      case 'theme-hc': updateSettings({ theme: 'hc-black' }); break;

      // ── Run ──
      case 'run-file': handleRunFile(); break;
      case 'run-tests': {
        setPanelTab('terminal');
        ws.sendMessage('[tests] Running test suite — connect nova-core backend to execute real tests.');
        break;
      }
      case 'debug-file': {
        setPanelTab('debug');
        ws.sendMessage('[debug] Debug session started. Connect nova-core backend for live breakpoints.');
        break;
      }

      // ── Nova AI ──
      case 'nova-task': setPanelTab('terminal'); break;
      case 'nova-explain': {
        const code = (window as any).__novaGetSelection?.() || 'the current file';
        ws.sendMessage(`Nova: Explain this code in detail:\n${code}`);
        setPanelTab('terminal');
        break;
      }
      case 'nova-refactor': {
        const code = (window as any).__novaGetSelection?.() || 'the current file';
        ws.sendMessage(`Nova: Refactor this code for clarity and performance:\n${code}`);
        setPanelTab('terminal');
        break;
      }
      case 'nova-test': {
        const tab = fs.activeTab;
        ws.sendMessage(`Nova: Generate comprehensive unit tests for: ${tab?.name ?? 'the current file'}`);
        setPanelTab('terminal');
        break;
      }
      case 'nova-fix': {
        ws.sendMessage(`Nova: Fix all ${problems.length} diagnostic(s) in ${fs.activeTab?.name ?? 'the current file'}`);
        setPanelTab('terminal');
        break;
      }
    }
  }, [fs, ws, updateSettings, problems]);

  // ── Run current file ──────────────────────────────────────────────────
  const handleRunFile = useCallback(async () => {
    const tab = fs.activeTab;
    if (!tab) { ws.sendMessage('[run] No file open.'); setPanelTab('terminal'); return; }
    setPanelTab('terminal');
    ws.sendMessage(`[run] ${tab.name}`);
    try {
      const res = await fetch('http://127.0.0.1:8000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: tab.name, content: tab.content, language: tab.language }),
      });
      const data = await res.json();
      ws.sendMessage(`[output] ${data.output ?? data.error ?? 'done'}`);
    } catch {
      ws.sendMessage('[run] nova-core offline — start the backend to execute code remotely.');
    }
  }, [fs.activeTab, ws]);

  // Expose run + editor actions globally
  useEffect(() => { (window as any).__novaRunFile = handleRunFile; }, [handleRunFile]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.shiftKey && e.key === 'P') { e.preventDefault(); setCmdOpen(true); }
      if (ctrl && !e.shiftKey && e.key === 'p') { e.preventDefault(); setCmdOpen(true); }
      if (e.key === 'Escape') { setCmdOpen(false); setSettingsOpen(false); }
      if (ctrl && e.key === 'b') { e.preventDefault(); setSidebarView(v => v ? null : 'explorer'); }
      if (ctrl && e.key === '`') { e.preventDefault(); setPanelTab('terminal'); }
      if (ctrl && e.shiftKey && e.key === 'G') { e.preventDefault(); setSidebarView('git'); }
      if (ctrl && e.shiftKey && e.key === 'F') { e.preventDefault(); setSidebarView('search'); }
      if (ctrl && e.shiftKey && e.key === 'E') { e.preventDefault(); setSidebarView('explorer'); }
      if (ctrl && e.key === ',') { e.preventDefault(); setSettingsOpen(true); }
      if (ctrl && e.key === 'n') { e.preventDefault(); handleCreateFile(); }
      if (ctrl && e.key === 'w') { e.preventDefault(); if (fs.activeTabId) fs.closeTab(fs.activeTabId); }
      if (e.key === 'F5') { e.preventDefault(); handleRunFile(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [fs.activeTabId, fs.closeTab, handleRunFile]);

  // ── File operations ───────────────────────────────────────────────────
  const handleOpenFile = useCallback((node: FileNode) => {
    if (node.type === 'folder') return;
    // node.id is like "f-src/main.ts", path is "src/main.ts"
    const path = node.id.startsWith('f-') ? node.id.slice(2) : node.id;
    fs.openFile(path);
  }, [fs]);

  const handleCreateFile = useCallback(() => {
    const name = window.prompt('New file path (e.g. src/utils.ts):');
    if (!name?.trim()) return;
    const n = name.trim();
    const lang: Language = n.endsWith('.py') ? 'python' : n.endsWith('.json') ? 'json'
      : n.endsWith('.md') ? 'markdown' : n.endsWith('.html') ? 'html'
      : n.endsWith('.css') ? 'css' : n.endsWith('.go') ? 'go'
      : n.endsWith('.rs') ? 'rust' : n.endsWith('.yaml') || n.endsWith('.yml') ? 'yaml'
      : 'typescript';
    fs.createFile(n, lang);
  }, [fs]);

  const handleCreateFolder = useCallback(() => {
    const name = window.prompt('New folder path (e.g. src/utils):');
    if (!name?.trim()) return;
    // Create a placeholder .gitkeep inside the folder
    fs.createFile(`${name.trim()}/.gitkeep`, 'markdown');
  }, [fs]);

  const handleDeleteFile = useCallback((node: FileNode) => {
    if (!window.confirm(`Delete "${node.name}"?`)) return;
    const path = node.id.startsWith('f-') ? node.id.slice(2) : node.id;
    fs.deleteFile(path);
  }, [fs]);

  const handleRenameFile = useCallback((node: FileNode) => {
    const oldPath = node.id.startsWith('f-') ? node.id.slice(2) : node.id;
    const newPath = window.prompt('Rename to:', oldPath);
    if (!newPath || newPath === oldPath) return;
    fs.renameFile(oldPath, newPath.trim());
  }, [fs]);

  // ── Search ────────────────────────────────────────────────────────────
  const handleOpenSearchResult = useCallback((path: string, line: number) => {
    fs.openFile(path);
    setTimeout(() => { (window as any).__novaJumpTo?.(line); }, 200);
  }, [fs]);

  // ── Git ───────────────────────────────────────────────────────────────
  const handleGitAction = useCallback(async (cmd: string, arg?: string) => {
    setPanelTab('terminal');
    ws.sendMessage(`[git] ${cmd}${arg ? ': ' + arg : ''}`);
    try {
      const res = await fetch(`http://127.0.0.1:8000/git/${cmd}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: arg }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      ws.sendMessage(`[git] ✓ ${cmd}: ${data.output ?? 'ok'}`);
    } catch {
      ws.sendMessage(`[git] ${cmd} — backend not reachable. Run nova-core to enable git ops.`);
    }
  }, [ws]);

  // ── Problems jump ─────────────────────────────────────────────────────
  const handleJumpToProblem = useCallback((p: EditorProblem) => {
    (window as any).__novaJumpTo?.(p.line);
  }, []);

  const activeTab = fs.activeTab;

  return (
    <div className="flex flex-col h-screen bg-[#0e0e10] text-zinc-100 overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* ── Real menu bar ──────────────────────────────────────────────── */}
      <MenuBar wsStatus={ws.status} onCommand={handleCommand} onCmdPalette={() => setCmdOpen(true)} />

      {/* ── Workspace ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar
          activeView={sidebarView}
          onViewChange={v => setSidebarView(prev => prev === v ? null : v)}
          onSettings={() => setSettingsOpen(true)}
          onRunFile={handleRunFile}
          onRunTests={() => handleCommand('run-tests')}
          onDebug={() => handleCommand('debug-file')}
        />
        <Sidebar
          activeView={sidebarView}
          fileTree={fs.fileTree}
          selectedPath={activeTab ? `f-${activeTab.id.replace('tab-', '')}` : null}
          onOpenFile={handleOpenFile}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
          onSearch={fs.searchFiles}
          onOpenSearchResult={handleOpenSearchResult}
          onGitAction={handleGitAction}
          agents={agents}
          activeAgent={ws.activeAgent}
          tasks={tq.tasks}
          onAddTask={tq.addTask}
          onRemoveTask={tq.removeTask}
          onReviewDiff={diff => { setPendingDiff(diff ?? null); }}
          onClearCompleted={tq.clearCompleted}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TabBar
            tabs={fs.tabs}
            activeTabId={fs.activeTabId}
            onTabSelect={fs.setActiveTabId}
            onTabClose={fs.closeTab}
            onTabPin={fs.pinTab}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <EditorArea
              tab={activeTab}
              onCodeChange={fs.markModified}
              onSave={fs.saveFile}
              onOpenSearch={() => setSidebarView('search')}
              onProblemsUpdate={setProblems}
              onCursorChange={setCursor}
              settings={settings}
              pendingDiff={pendingDiff}
              onAcceptDiff={newContent => {
                if (activeTab) { fs.saveFile(activeTab.id, newContent); }
                setPendingDiff(null);
              }}
              onRejectDiff={() => setPendingDiff(null)}
            />
            <BottomPanel
              activeTab={panelTab}
              onTabChange={setPanelTab}
              messages={ws.messages}
              onSend={ws.sendMessage}
              wsStatus={ws.status}
              onApprove={ws.approve}
              onClear={ws.clearMessages}
              problems={problems}
              onJumpToProblem={handleJumpToProblem}
              outputLines={outputLines}
            />
          </div>
        </div>
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <StatusBar
        wsStatus={ws.status}
        activeTabName={activeTab?.name}
        language={activeTab?.language}
        cursorLine={cursor.line}
        cursorCol={cursor.col}
        lineCount={cursor.lines}
        activeAgent={ws.activeAgent}
        errorCount={problems.filter(p => p.severity === 'error').length}
        warnCount={problems.filter(p => p.severity === 'warning').length}
        branch="main"
      />

      {/* ── Overlays ───────────────────────────────────────────────────── */}
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onCommand={handleCommand}
        filePaths={fs.filePaths}
        onOpenFile={path => fs.openFile(path)}
      />
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
        onReset={resetSettings}
      />
    </div>
  );
}
