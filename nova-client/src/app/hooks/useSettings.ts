import { useState, useEffect } from 'react';

export type EditorSettings = {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all';
  theme: string;
  formatOnSave: boolean;
  autoSave: boolean;
  autoSaveDelay: number; // ms
  ligatures: boolean;
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  bracketPairColor: boolean;
  indentGuides: boolean;
};

const DEFAULTS: EditorSettings = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono','Fira Code',monospace",
  tabSize: 2,
  wordWrap: 'off',
  minimap: true,
  lineNumbers: 'on',
  renderWhitespace: 'selection',
  theme: 'vs-dark',
  formatOnSave: false,
  autoSave: false,
  autoSaveDelay: 1000,
  ligatures: true,
  cursorBlinking: 'smooth',
  bracketPairColor: true,
  indentGuides: true,
};

const KEY = 'nova_settings_v1';

function load(): EditorSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULTS);

  // Hydrate from localStorage on client
  useEffect(() => { setSettings(load()); }, []);

  const update = (patch: Partial<EditorSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const reset = () => {
    try { localStorage.removeItem(KEY); } catch {}
    setSettings(DEFAULTS);
  };

  return { settings, update, reset };
}
