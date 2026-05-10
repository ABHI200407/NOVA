import { useState, useCallback, useEffect } from 'react';
import { FileNode, Language, Tab } from '../components/types';
import { INITIAL_FILES } from '../components/data';

const FS_KEY = 'nova_vfs_v2';

export type VFSFile = {
  id: string;
  name: string;
  path: string; // e.g. "src/main.ts"
  language: Language;
  content: string;
  isModified: boolean;
};

export type VFSDir = {
  id: string;
  name: string;
  path: string;
  isOpen: boolean;
  children: string[]; // ids
};

export type VFSEntry = VFSFile | VFSDir;

// Flatten the INITIAL_FILES tree into a path→content map
function flattenFiles(nodes: FileNode[], prefix = ''): Record<string, { language: Language; content: string }> {
  const result: Record<string, { language: Language; content: string }> = {};
  for (const node of nodes) {
    const path = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.type === 'file') {
      result[path] = { language: node.language ?? 'typescript', content: node.content ?? '' };
    } else if (node.children) {
      Object.assign(result, flattenFiles(node.children, path));
    }
  }
  return result;
}

// Build a tree from a flat map
function buildTree(map: Record<string, { language: Language; content: string; id: string }>, rootName: string): FileNode {
  const root: FileNode = { id: 'root', name: rootName, type: 'folder', isOpen: true, children: [] };
  const dirMap: Record<string, FileNode> = { '': root };

  const getOrCreateDir = (dirPath: string): FileNode => {
    if (dirMap[dirPath]) return dirMap[dirPath];
    const parts = dirPath.split('/');
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');
    const parent = getOrCreateDir(parentPath);
    const dir: FileNode = { id: `dir-${dirPath}`, name, type: 'folder', isOpen: true, children: [] };
    parent.children = parent.children ?? [];
    parent.children.push(dir);
    dirMap[dirPath] = dir;
    return dir;
  };

  for (const [path, { language, content, id }] of Object.entries(map)) {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    const dirPath = parts.slice(0, -1).join('/');
    const dir = getOrCreateDir(dirPath);
    dir.children = dir.children ?? [];
    dir.children.push({ id, name: fileName, type: 'file', language, content });
  }

  return root;
}

function loadFromStorage(): Record<string, { language: Language; content: string; id: string }> | null {
  try {
    const raw = localStorage.getItem(FS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToStorage(map: Record<string, { language: Language; content: string; id: string }>) {
  try { localStorage.setItem(FS_KEY, JSON.stringify(map)); } catch {}
}

function getInitialMap(): Record<string, { language: Language; content: string; id: string }> {
  const stored = loadFromStorage();
  if (stored) return stored;
  // Seed from INITIAL_FILES (skip root folder name)
  const flat = flattenFiles(INITIAL_FILES[0]?.children ?? INITIAL_FILES);
  const result: Record<string, { language: Language; content: string; id: string }> = {};
  for (const [path, { language, content }] of Object.entries(flat)) {
    result[path] = { language, content, id: `f-${path}` };
  }
  return result;
}

export function useFileSystem() {
  const [fileMap, setFileMap] = useState<Record<string, { language: Language; content: string; id: string }>>(getInitialMap);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Persist on change
  useEffect(() => { saveToStorage(fileMap); }, [fileMap]);

  const fileTree: FileNode = buildTree(fileMap, 'nova-project');

  const openFile = useCallback((path: string) => {
    const entry = fileMap[path];
    if (!entry) return;
    const tabId = `tab-${path}`;
    setTabs(prev => {
      const existing = prev.find(t => t.id === tabId);
      if (existing) { setActiveTabId(tabId); return prev; }
      const previewIdx = prev.findIndex(t => t.isPreview && !t.isModified);
      const newTab: Tab = {
        id: tabId, fileId: entry.id, name: path.split('/').pop()!,
        language: entry.language, content: entry.content,
        isPreview: true, isModified: false,
      };
      if (previewIdx !== -1) {
        const next = [...prev];
        next[previewIdx] = newTab;
        setActiveTabId(tabId);
        return next;
      }
      setActiveTabId(tabId);
      return [...prev, newTab];
    });
  }, [fileMap]);

  const saveFile = useCallback((tabId: string, content: string) => {
    const path = tabId.replace('tab-', '');
    setFileMap(prev => {
      const entry = prev[path];
      if (!entry) return prev;
      return { ...prev, [path]: { ...entry, content } };
    });
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, content, isModified: false, isPreview: false } : t));
  }, []);

  const markModified = useCallback((tabId: string, content: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, content, isModified: true, isPreview: false } : t));
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        const closed = prev.findIndex(t => t.id === tabId);
        setActiveTabId(next[Math.max(0, closed - 1)]?.id ?? null);
      }
      return next;
    });
  }, [activeTabId]);

  const pinTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isPinned: !t.isPinned } : t));
  }, []);

  const createFile = useCallback((path: string, language: Language = 'typescript') => {
    setFileMap(prev => {
      if (prev[path]) return prev;
      return { ...prev, [path]: { language, content: '', id: `f-${path}` } };
    });
    openFile(path);
  }, [openFile]);

  const deleteFile = useCallback((path: string) => {
    setFileMap(prev => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
    setTabs(prev => prev.filter(t => t.id !== `tab-${path}`));
  }, []);

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    setFileMap(prev => {
      const entry = prev[oldPath];
      if (!entry) return prev;
      const next = { ...prev };
      delete next[oldPath];
      next[newPath] = { ...entry, id: `f-${newPath}` };
      return next;
    });
    setTabs(prev => prev.map(t => {
      if (t.id === `tab-${oldPath}`) {
        return { ...t, id: `tab-${newPath}`, fileId: `f-${newPath}`, name: newPath.split('/').pop()! };
      }
      return t;
    }));
    if (activeTabId === `tab-${oldPath}`) setActiveTabId(`tab-${newPath}`);
  }, [activeTabId]);

  const searchFiles = useCallback((query: string, useRegex = false): Array<{ path: string; line: number; col: number; preview: string }> => {
    if (!query) return [];
    const results: Array<{ path: string; line: number; col: number; preview: string }> = [];
    for (const [path, { content }] of Object.entries(fileMap)) {
      const lines = content.split('\n');
      lines.forEach((lineText, idx) => {
        let match = false;
        let col = 1;
        try {
          if (useRegex) {
            const re = new RegExp(query, 'i');
            const m = re.exec(lineText);
            if (m) { match = true; col = m.index + 1; }
          } else {
            const ci = lineText.toLowerCase().indexOf(query.toLowerCase());
            if (ci !== -1) { match = true; col = ci + 1; }
          }
        } catch {}
        if (match) results.push({ path, line: idx + 1, col, preview: lineText.trim().slice(0, 80) });
      });
      if (results.length > 100) break;
    }
    return results;
  }, [fileMap]);

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;
  const filePaths = Object.keys(fileMap);

  return {
    fileTree, fileMap, tabs, activeTabId, activeTab, filePaths,
    openFile, saveFile, markModified, closeTab, pinTab,
    createFile, deleteFile, renameFile, searchFiles,
    setActiveTabId, setTabs,
  };
}
