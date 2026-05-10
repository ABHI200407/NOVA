'use client';
import React, { useState } from 'react';
import { X, RotateCcw, ChevronRight } from 'lucide-react';
import type { EditorSettings } from '../hooks/useSettings';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdate: (patch: Partial<EditorSettings>) => void;
  onReset: () => void;
}

type Section = 'editor' | 'appearance' | 'autosave' | 'about';

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] text-zinc-400 mb-1">{children}</div>;
}
function Desc({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-zinc-600 mt-0.5">{children}</p>;
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between py-3 border-b border-zinc-800/60">{children}</div>;
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-blue-600' : 'bg-zinc-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 outline-none focus:border-zinc-500 cursor-pointer">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function NumberInput({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  return (
    <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max} step={step}
      className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 outline-none focus:border-zinc-500 text-right" />
  );
}

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'editor', label: 'Editor' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'autosave', label: 'Auto Save' },
  { id: 'about', label: 'About Nova' },
];

export function SettingsPanel({ isOpen, onClose, settings, onUpdate, onReset }: SettingsPanelProps) {
  const [section, setSection] = useState<Section>('editor');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex" onClick={onClose}>
      <div className="flex-1" />
      <div className="w-[680px] max-w-full h-full bg-[#18181b] border-l border-zinc-800 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-5 border-b border-zinc-800 flex-shrink-0">
          <h2 className="font-semibold text-zinc-100 text-sm">Settings</h2>
          <div className="flex items-center gap-2">
            <button onClick={onReset} className="flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800">
              <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
            </button>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Nav */}
          <div className="w-44 bg-[#111113] border-r border-zinc-800 py-2 flex-shrink-0">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-left transition-colors ${section === s.id ? 'text-zinc-100 bg-blue-600/20 border-l-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border-l-2 border-transparent'}`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">

            {section === 'editor' && <>
              <Row>
                <div><Label>Font Size</Label><Desc>Editor font size in pixels</Desc></div>
                <NumberInput value={settings.fontSize} onChange={v => onUpdate({ fontSize: v })} min={8} max={32} />
              </Row>
              <Row>
                <div><Label>Font Family</Label><Desc>Monospace font for the editor</Desc></div>
                <Select value={settings.fontFamily} onChange={v => onUpdate({ fontFamily: v })} options={[
                  { value: "'JetBrains Mono','Fira Code',monospace", label: 'JetBrains Mono' },
                  { value: "'Fira Code',monospace", label: 'Fira Code' },
                  { value: "'Cascadia Code',monospace", label: 'Cascadia Code' },
                  { value: "Consolas,monospace", label: 'Consolas' },
                  { value: "'Courier New',monospace", label: 'Courier New' },
                  { value: "monospace", label: 'System Monospace' },
                ]} />
              </Row>
              <Row>
                <div><Label>Tab Size</Label><Desc>Number of spaces per tab indent</Desc></div>
                <NumberInput value={settings.tabSize} onChange={v => onUpdate({ tabSize: v })} min={1} max={8} />
              </Row>
              <Row>
                <div><Label>Word Wrap</Label><Desc>Wrap long lines at viewport edge</Desc></div>
                <Toggle checked={settings.wordWrap === 'on'} onChange={v => onUpdate({ wordWrap: v ? 'on' : 'off' })} />
              </Row>
              <Row>
                <div><Label>Line Numbers</Label><Desc>Show line numbers in the gutter</Desc></div>
                <Select value={settings.lineNumbers} onChange={v => onUpdate({ lineNumbers: v as any })} options={[
                  { value: 'on', label: 'On' },
                  { value: 'off', label: 'Off' },
                  { value: 'relative', label: 'Relative' },
                ]} />
              </Row>
              <Row>
                <div><Label>Font Ligatures</Label><Desc>Enable programming ligatures (e.g. =&gt;, !==)</Desc></div>
                <Toggle checked={settings.ligatures} onChange={v => onUpdate({ ligatures: v })} />
              </Row>
              <Row>
                <div><Label>Format on Save</Label><Desc>Auto-format document when you press Ctrl+S</Desc></div>
                <Toggle checked={settings.formatOnSave} onChange={v => onUpdate({ formatOnSave: v })} />
              </Row>
              <Row>
                <div><Label>Render Whitespace</Label><Desc>Show whitespace character markers</Desc></div>
                <Select value={settings.renderWhitespace} onChange={v => onUpdate({ renderWhitespace: v as any })} options={[
                  { value: 'none', label: 'None' },
                  { value: 'selection', label: 'Selection' },
                  { value: 'boundary', label: 'Boundary' },
                  { value: 'all', label: 'All' },
                ]} />
              </Row>
              <Row>
                <div><Label>Bracket Pair Colorization</Label><Desc>Color matching bracket pairs</Desc></div>
                <Toggle checked={settings.bracketPairColor} onChange={v => onUpdate({ bracketPairColor: v })} />
              </Row>
              <Row>
                <div><Label>Indent Guides</Label><Desc>Show vertical indentation guidelines</Desc></div>
                <Toggle checked={settings.indentGuides} onChange={v => onUpdate({ indentGuides: v })} />
              </Row>
              <Row>
                <div><Label>Cursor Animation</Label><Desc>Cursor blinking animation style</Desc></div>
                <Select value={settings.cursorBlinking} onChange={v => onUpdate({ cursorBlinking: v as any })} options={[
                  { value: 'smooth', label: 'Smooth' },
                  { value: 'blink', label: 'Blink' },
                  { value: 'phase', label: 'Phase' },
                  { value: 'expand', label: 'Expand' },
                  { value: 'solid', label: 'Solid' },
                ]} />
              </Row>
            </>}

            {section === 'appearance' && <>
              <Row>
                <div><Label>Color Theme</Label><Desc>Editor color scheme</Desc></div>
                <Select value={settings.theme} onChange={v => onUpdate({ theme: v })} options={[
                  { value: 'vs-dark', label: 'Dark (vs-dark)' },
                  { value: 'vs', label: 'Light (vs)' },
                  { value: 'hc-black', label: 'High Contrast Dark' },
                  { value: 'hc-light', label: 'High Contrast Light' },
                ]} />
              </Row>
              <Row>
                <div><Label>Minimap</Label><Desc>Show code minimap overview on the right</Desc></div>
                <Toggle checked={settings.minimap} onChange={v => onUpdate({ minimap: v })} />
              </Row>
            </>}

            {section === 'autosave' && <>
              <Row>
                <div><Label>Auto Save</Label><Desc>Automatically save files after editing</Desc></div>
                <Toggle checked={settings.autoSave} onChange={v => onUpdate({ autoSave: v })} />
              </Row>
              <Row>
                <div><Label>Auto Save Delay (ms)</Label><Desc>Milliseconds to wait before auto-saving</Desc></div>
                <NumberInput value={settings.autoSaveDelay} onChange={v => onUpdate({ autoSaveDelay: v })} min={200} max={10000} step={100} />
              </Row>
            </>}

            {section === 'about' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">⚡</div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100">Nova IDE</h3>
                    <p className="text-sm text-zinc-500">Version 1.0.0</p>
                    <p className="text-xs text-zinc-600 mt-1">Multi-Agent AI Development Environment</p>
                  </div>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4 space-y-2 text-[12px] text-zinc-500">
                  <div className="flex justify-between"><span>Monaco Editor</span><span className="text-zinc-400">v0.52</span></div>
                  <div className="flex justify-between"><span>Next.js</span><span className="text-zinc-400">v16</span></div>
                  <div className="flex justify-between"><span>React</span><span className="text-zinc-400">v19</span></div>
                  <div className="flex justify-between"><span>Backend</span><span className="text-zinc-400">nova-core (FastAPI)</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
