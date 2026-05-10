'use client';
import React, { useState, useCallback, useRef } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, FilePlus, FolderPlus, RefreshCw, Trash2, Pencil, Search, GitBranch, Plus, Minus, GitCommit, Check, X, Bot, Puzzle } from 'lucide-react';
import { FileNode, SidebarView, Agent, AgentTask } from './types';

// ── helpers ────────────────────────────────────────────────────────────────
function langColor(name: string) {
  const ext = name.split('.').pop() ?? '';
  const m: Record<string, string> = { ts: '#3178c6', tsx: '#3178c6', js: '#f7df1e', jsx: '#61dafb', py: '#3572A5', json: '#89e051', html: '#e34c26', css: '#563d7c', md: '#4078c0', rs: '#dea584', go: '#00ADD8', yaml: '#cb171e', yml: '#cb171e' };
  return m[ext] ?? '#a1a1aa';
}

// ── File node ──────────────────────────────────────────────────────────────
function TreeNode({ node, depth, selectedPath, onOpen, onDelete, onRename }: {
  node: FileNode; depth: number; selectedPath: string | null;
  onOpen: (n: FileNode) => void; onDelete: (n: FileNode) => void; onRename: (n: FileNode) => void;
}) {
  const [open, setOpen] = useState(node?.isOpen ?? depth === 0);
  if (!node) return null;
  const [hover, setHover] = useState(false);
  const isSelected = selectedPath === node.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-[3px] pr-1 rounded cursor-pointer text-[13px] select-none transition-colors ${isSelected ? 'bg-blue-600/25 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => node.type === 'folder' ? setOpen(o => !o) : onOpen(node)}
        onDoubleClick={() => node.type === 'file' && onRename(node)}
      >
        {node.type === 'folder'
          ? open ? <ChevronDown className="w-3 h-3 flex-shrink-0 text-zinc-600" /> : <ChevronRight className="w-3 h-3 flex-shrink-0 text-zinc-600" />
          : <span className="w-3 h-3 flex-shrink-0" />}
        {node.type === 'folder'
          ? open ? <FolderOpen className="w-4 h-4 flex-shrink-0 text-yellow-400/80" /> : <Folder className="w-4 h-4 flex-shrink-0 text-yellow-400/80" />
          : <span className="w-2 h-2 rounded-sm flex-shrink-0 mt-0.5" style={{ background: langColor(node.name) }} />}
        <span className="truncate flex-1">{node.name}</span>
        {hover && node.type === 'file' && (
          <div className="flex items-center gap-0.5 ml-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => onRename(node)} className="p-0.5 rounded hover:bg-zinc-700 text-zinc-600 hover:text-zinc-300 transition-colors"><Pencil className="w-3 h-3" /></button>
            <button onClick={() => onDelete(node)} className="p-0.5 rounded hover:bg-red-900/50 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
          </div>
        )}
      </div>
      {node.type === 'folder' && open && node.children?.map(c => (
        <TreeNode key={c.id} node={c} depth={depth + 1} selectedPath={selectedPath} onOpen={onOpen} onDelete={onDelete} onRename={onRename} />
      ))}
    </div>
  );
}

// ── Explorer ───────────────────────────────────────────────────────────────
function ExplorerPanel({ fileTree, selectedPath, onOpenFile, onCreateFile, onCreateFolder, onDeleteFile, onRenameFile }: {
  fileTree: FileNode; selectedPath: string | null;
  onOpenFile: (n: FileNode) => void; onCreateFile: (dir?: string) => void; onCreateFolder: () => void;
  onDeleteFile: (n: FileNode) => void; onRenameFile: (n: FileNode) => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between flex-shrink-0 border-b border-zinc-800/60">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Explorer</span>
        <div className="flex gap-1">
          <button title="New File" onClick={() => onCreateFile()} className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors"><FilePlus className="w-3.5 h-3.5" /></button>
          <button title="New Folder" onClick={onCreateFolder} className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors"><FolderPlus className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1 px-1">
        <TreeNode node={fileTree} depth={0} selectedPath={selectedPath} onOpen={onOpenFile} onDelete={onDeleteFile} onRename={onRenameFile} />
      </div>
    </div>
  );
}

// ── Search ─────────────────────────────────────────────────────────────────
function SearchPanel({ onSearch, onOpenResult }: {
  onSearch: (q: string, regex: boolean) => Array<{ path: string; line: number; col: number; preview: string }>;
  onOpenResult: (path: string, line: number) => void;
}) {
  const [q, setQ] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [results, setResults] = useState<Array<{ path: string; line: number; col: number; preview: string }>>([]);

  const run = () => setResults(onSearch(q, useRegex));

  // Group by file
  const grouped = results.reduce<Record<string, typeof results>>((acc, r) => {
    (acc[r.path] ??= []).push(r); return acc;
  }, {});

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800/60 flex-shrink-0">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Search</span>
      </div>
      <div className="p-2 space-y-1.5 flex-shrink-0">
        <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded px-2 py-1 gap-2 focus-within:border-zinc-500">
          <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} placeholder="Search files (Enter)" className="bg-transparent flex-1 text-sm text-zinc-200 placeholder-zinc-600 outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer select-none">
            <input type="checkbox" checked={useRegex} onChange={e => setUseRegex(e.target.checked)} className="accent-blue-500" />
            Regex
          </label>
          <button onClick={run} className="ml-auto text-[11px] px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">Find</button>
        </div>
        {results.length > 0 && <div className="text-[11px] text-zinc-500">{results.length} results in {Object.keys(grouped).length} files</div>}
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-2">
        {Object.entries(grouped).map(([path, hits]) => (
          <div key={path}>
            <div className="text-[11px] text-blue-400 truncate px-1 mb-0.5 font-medium">{path}</div>
            {hits.map((r, i) => (
              <div key={i} onClick={() => onOpenResult(r.path, r.line)} className="text-[12px] font-mono text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 rounded px-2 py-1 cursor-pointer transition-colors mb-0.5">
                <span className="text-zinc-600 mr-2 select-none">{r.line}</span>{r.preview}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Git ────────────────────────────────────────────────────────────────────
function GitPanel({ onGitAction }: { onGitAction: (cmd: string, arg?: string) => void }) {
  const [msg, setMsg] = useState('');
  const [branch, setBranch] = useState('main');
  const [loading, setLoading] = useState(false);

  const run = async (cmd: string, arg?: string) => {
    setLoading(true);
    try { onGitAction(cmd, arg ?? msg); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800/60 flex-shrink-0">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Source Control</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Branch */}
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Current Branch</div>
          <div className="flex items-center gap-2 bg-zinc-800 rounded px-2 py-1.5 text-sm">
            <GitBranch className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-300 font-mono flex-1">{branch}</span>
            <button onClick={() => run('checkout', 'main')} className="text-[11px] text-zinc-500 hover:text-zinc-300">switch</button>
          </div>
        </div>
        {/* Actions */}
        <div className="grid grid-cols-2 gap-1.5">
          {[['Pull', 'pull'], ['Push', 'push'], ['Fetch', 'fetch'], ['Sync', 'sync']].map(([label, cmd]) => (
            <button key={cmd} disabled={loading} onClick={() => run(cmd)} className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 hover:text-zinc-100 transition-colors disabled:opacity-50">{label}</button>
          ))}
        </div>
        {/* Commit */}
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Commit</div>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Commit message..." rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500 resize-none" />
          <button disabled={!msg.trim() || loading} onClick={() => run('commit', msg)} className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs rounded transition-colors">
            <GitCommit className="w-3.5 h-3.5" /> Commit &amp; Push
          </button>
        </div>
        {/* Status note */}
        <p className="text-[11px] text-zinc-600 text-center">Git operations route to nova-core backend</p>
      </div>
    </div>
  );
}

// ── Agents + Task Queue ─────────────────────────────────────────────────────
function AgentsPanel({ agents, activeAgent, tasks, onAddTask, onRemoveTask, onReviewDiff, onClearCompleted }: {
  agents: Agent[]; activeAgent: string | null;
  tasks: AgentTask[]; onAddTask: (d: string) => void;
  onRemoveTask: (id: string) => void; onReviewDiff: (diff: AgentTask['diff']) => void;
  onClearCompleted: () => void;
}) {
  const [input, setInput] = useState('');
  const statusStyles: Record<string, string> = {
    working: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    thinking: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    done: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    error: 'bg-red-500/20 text-red-300 border-red-500/30',
    idle: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/30',
  };
  const taskStatusIcon: Record<string, string> = {
    queued: '⏳', working: '⚙', done: '✓', failed: '✗',
  };
  const taskStatusColor: Record<string, string> = {
    queued: 'text-zinc-400', working: 'text-blue-300', done: 'text-emerald-400', failed: 'text-red-400',
  };

  const submit = () => {
    if (!input.trim()) return;
    onAddTask(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800/60 flex-shrink-0 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">AI Agents</span>
        {tasks.some(t => t.status === 'done' || t.status === 'failed') && (
          <button onClick={onClearCompleted} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">clear done</button>
        )}
      </div>

      {/* Task submission */}
      <div className="p-2 border-b border-zinc-800/40 flex-shrink-0">
        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">Dispatch Task</div>
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Describe a task for Nova agents…"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-[12px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
          />
          <button onClick={submit} disabled={!input.trim()}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-[11px] rounded transition-colors font-medium whitespace-nowrap">
            Run
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Task queue */}
        {tasks.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider px-1">Task Queue ({tasks.length})</div>
            {tasks.map(t => (
              <div key={t.id} className={`rounded-lg border p-2.5 transition-all ${t.status === 'working' ? 'border-blue-500/40 bg-blue-500/5' : t.status === 'done' ? 'border-emerald-500/20 bg-emerald-500/5' : t.status === 'failed' ? 'border-red-500/20 bg-red-500/5' : 'border-zinc-800 bg-zinc-800/20'}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-base flex-shrink-0 mt-0.5 ${taskStatusColor[t.status]} ${t.status === 'working' ? 'animate-spin' : ''}`}>
                    {t.status === 'working' ? '⚙' : taskStatusIcon[t.status]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] text-zinc-300 font-medium truncate">{t.description}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-600">{t.agentLabel}</span>
                      <span className={`text-[10px] ${taskStatusColor[t.status]}`}>{t.status}</span>
                      {t.status === 'working' && <span className="text-[10px] text-blue-400 animate-pulse">Contemplating…</span>}
                    </div>
                    {t.status === 'done' && t.diff && (
                      <button onClick={() => onReviewDiff(t.diff)}
                        className="mt-1.5 text-[11px] px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">
                        Review Changes →
                      </button>
                    )}
                    {t.status === 'done' && !t.diff && (
                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{t.result?.slice(0, 80)}…</p>
                    )}
                  </div>
                  <button onClick={() => onRemoveTask(t.id)} className="text-zinc-700 hover:text-zinc-400 flex-shrink-0 transition-colors mt-0.5">×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agent cards */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider px-1">Agents</div>
          {agents.map(a => (
            <div key={a.id} className={`rounded-lg border p-2.5 transition-all duration-300 ${activeAgent === a.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800 bg-zinc-800/20'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.dotColor} ${activeAgent === a.id ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium text-zinc-200">{a.label}</span>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full border ${statusStyles[a.status]}`}>{a.status}</span>
              </div>
              <p className="text-[11px] text-zinc-500">{a.task || a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── Extensions ─────────────────────────────────────────────────────────────
const EXT_LIST = [
  { name: 'Python', publisher: 'Microsoft', icon: '🐍', installed: true },
  { name: 'ESLint', publisher: 'Microsoft', icon: '🔍', installed: true },
  { name: 'Prettier', publisher: 'Prettier', icon: '✨', installed: true },
  { name: 'GitLens', publisher: 'GitKraken', icon: '🔮', installed: false },
  { name: 'Docker', publisher: 'Microsoft', icon: '🐳', installed: false },
  { name: 'REST Client', publisher: 'Huachao', icon: '⚡', installed: false },
];

function ExtensionsPanel() {
  const [q, setQ] = useState('');
  const [installed, setInstalled] = useState<Record<string, boolean>>(
    Object.fromEntries(EXT_LIST.map(e => [e.name, e.installed]))
  );
  const filtered = EXT_LIST.filter(e => e.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800/60 flex-shrink-0">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Extensions</span>
      </div>
      <div className="p-2 flex-shrink-0">
        <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded px-2 py-1 gap-2 focus-within:border-zinc-500">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search extensions..." className="bg-transparent flex-1 text-sm text-zinc-200 placeholder-zinc-600 outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {filtered.map(ext => (
          <div key={ext.name} className="flex items-center gap-2.5 p-2 rounded hover:bg-zinc-800 transition-colors">
            <span className="text-xl flex-shrink-0">{ext.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-zinc-200 font-medium">{ext.name}</div>
              <div className="text-[11px] text-zinc-500">{ext.publisher}</div>
            </div>
            <button
              onClick={() => setInstalled(p => ({ ...p, [ext.name]: !p[ext.name] }))}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors flex-shrink-0 ${installed[ext.name] ? 'bg-zinc-700 hover:bg-red-900/50 text-zinc-400 hover:text-red-300' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
              {installed[ext.name] ? 'Uninstall' : 'Install'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Sidebar ───────────────────────────────────────────────────────────
interface SidebarProps {
  activeView: SidebarView | null;
  fileTree: FileNode;
  selectedPath: string | null;
  onOpenFile: (n: FileNode) => void;
  onCreateFile: (dir?: string) => void;
  onCreateFolder: () => void;
  onDeleteFile: (n: FileNode) => void;
  onRenameFile: (n: FileNode) => void;
  onSearch: (q: string, regex: boolean) => Array<{ path: string; line: number; col: number; preview: string }>;
  onOpenSearchResult: (path: string, line: number) => void;
  onGitAction: (cmd: string, arg?: string) => void;
  agents: Agent[];
  activeAgent: string | null;
  tasks: AgentTask[];
  onAddTask: (d: string) => void;
  onRemoveTask: (id: string) => void;
  onReviewDiff: (diff: AgentTask['diff']) => void;
  onClearCompleted: () => void;
}

export function Sidebar({ activeView, fileTree, selectedPath, onOpenFile, onCreateFile, onCreateFolder, onDeleteFile, onRenameFile, onSearch, onOpenSearchResult, onGitAction, agents, activeAgent, tasks, onAddTask, onRemoveTask, onReviewDiff, onClearCompleted }: SidebarProps) {
  if (!activeView || !fileTree) return null;
  return (
    <div className="w-60 bg-[#141416] border-r border-zinc-800 flex flex-col h-full flex-shrink-0 overflow-hidden">
      {activeView === 'explorer' && <ExplorerPanel fileTree={fileTree} selectedPath={selectedPath} onOpenFile={onOpenFile} onCreateFile={onCreateFile} onCreateFolder={onCreateFolder} onDeleteFile={onDeleteFile} onRenameFile={onRenameFile} />}
      {activeView === 'search' && <SearchPanel onSearch={onSearch} onOpenResult={onOpenSearchResult} />}
      {activeView === 'git' && <GitPanel onGitAction={onGitAction} />}
      {activeView === 'agents' && <AgentsPanel agents={agents} activeAgent={activeAgent} tasks={tasks} onAddTask={onAddTask} onRemoveTask={onRemoveTask} onReviewDiff={onReviewDiff} onClearCompleted={onClearCompleted} />}
      {activeView === 'extensions' && <ExtensionsPanel />}
    </div>
  );
}
