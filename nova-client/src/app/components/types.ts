export type Language = 'javascript' | 'typescript' | 'python' | 'json' | 'html' | 'css' | 'markdown' | 'rust' | 'go' | 'yaml';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  language?: Language;
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
  isModified?: boolean;
}

export interface Tab {
  id: string;
  fileId: string;
  name: string;
  language: Language;
  content: string;
  isPinned?: boolean;
  isModified?: boolean;
  isPreview?: boolean;
}

export interface Message {
  id: string;
  type: 'message' | 'tool_execution' | 'diff' | 'error' | 'approval_request' | 'info';
  content: string;
  role: 'user' | 'agent' | 'system';
  agentId?: string;
  status?: 'approved' | 'rejected';
  timestamp: Date;
}

export interface Agent {
  id: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  dotColor: string;
  isActive: boolean;
  status: 'idle' | 'thinking' | 'working' | 'done' | 'error';
  task?: string;
}

export interface GitChange {
  file: string;
  status: 'M' | 'A' | 'D' | 'R' | 'U';
  staged: boolean;
}

export interface Problem {
  id: string;
  file: string;
  line: number;
  col: number;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  source: string;
}

export type TaskStatus = 'queued' | 'working' | 'done' | 'failed';

export interface AgentTask {
  id: string;
  description: string;
  status: TaskStatus;
  agentId: string;
  agentLabel: string;
  result?: string;
  diff?: { original: string; modified: string; file: string; language: string };
  createdAt: number;
}

export type SidebarView = 'explorer' | 'search' | 'git' | 'agents' | 'extensions';
export type PanelTab = 'terminal' | 'problems' | 'output' | 'debug' | 'preview';
