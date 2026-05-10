'use client';
import React, { useState, useMemo } from 'react';
import { X, Eye, Table, Code, FileText, Image } from 'lucide-react';
import { Tab } from './types';

/* ── helpers ── */
function esc(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderMarkdown(md: string): string {
  let h = md
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_,__,code) =>
      `<pre style="background:#111;border:1px solid #3f3f46;border-radius:8px;padding:12px;overflow:auto;font-size:12px;color:#a1a1aa;font-family:monospace">${esc(code)}</pre>`)
    .replace(/`([^`]+)`/g, '<code style="background:#18181b;color:#93c5fd;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:.875em">$1</code>')
    .replace(/^### (.+)$/gm,'<h3 style="font-size:1rem;font-weight:700;color:#f4f4f5;margin:14px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm,'<h2 style="font-size:1.2rem;font-weight:700;color:#f4f4f5;margin:18px 0 8px">$1</h2>')
    .replace(/^# (.+)$/gm,'<h1 style="font-size:1.5rem;font-weight:800;color:#fff;margin:22px 0 10px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,'<strong style="color:#f4f4f5;font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g,'<em style="color:#d4d4d8">$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" style="color:#60a5fa;text-decoration:underline">$1</a>')
    .replace(/^---$/gm,'<hr style="border:none;border-top:1px solid #3f3f46;margin:14px 0"/>')
    .replace(/^> (.+)$/gm,'<blockquote style="border-left:3px solid #3b82f6;padding-left:10px;color:#a1a1aa;margin:8px 0">$1</blockquote>')
    .replace(/^[\-\*] (.+)$/gm,'<li style="color:#d4d4d8;margin:2px 0 2px 18px;list-style-type:disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm,'<li style="color:#d4d4d8;margin:2px 0 2px 18px;list-style-type:decimal">$1</li>');
  return h.split('\n\n').map(p => p.trim()
    ? (p.startsWith('<') ? p : `<p style="color:#d4d4d8;margin:0 0 10px;line-height:1.7">${p.replace(/\n/g,'<br>')}</p>`)
    : '').join('');
}

function CsvView({ content }: { content: string }) {
  const [sort, setSort] = useState<{ col: number; asc: boolean } | null>(null);
  const rows = useMemo(() => content.trim().split('\n').map(r =>
    r.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
  ), [content]);
  const headers = rows[0] ?? [];
  let data = rows.slice(1);
  if (sort) {
    data = [...data].sort((a, b) => {
      const va = a[sort.col] ?? ''; const vb = b[sort.col] ?? '';
      return sort.asc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }
  return (
    <div className="overflow-auto p-3">
      <div className="text-[11px] text-zinc-500 mb-2">{data.length} rows · {headers.length} columns · click headers to sort</div>
      <table className="text-sm border-collapse w-full">
        <thead>
          <tr>{headers.map((h, i) => (
            <th key={i} onClick={() => setSort(s => s?.col === i ? { col: i, asc: !s.asc } : { col: i, asc: true })}
              className="bg-zinc-800 text-zinc-200 px-3 py-2 text-left border border-zinc-700 font-semibold cursor-pointer hover:bg-zinc-700 whitespace-nowrap select-none">
              {h} {sort?.col === i ? (sort.asc ? '↑' : '↓') : ''}
            </th>
          ))}</tr>
        </thead>
        <tbody>{data.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-[#0e0e10]' : 'bg-zinc-900/40'}>
            {headers.map((_, j) => (
              <td key={j} className="px-3 py-1.5 text-zinc-300 border border-zinc-800/60 whitespace-nowrap">{row[j] ?? ''}</td>
            ))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function JsonNode({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  if (data === null) return <span className="text-zinc-500 font-mono text-sm">null</span>;
  if (typeof data === 'boolean') return <span className="text-orange-400 font-mono text-sm">{String(data)}</span>;
  if (typeof data === 'number') return <span className="text-emerald-400 font-mono text-sm">{data}</span>;
  if (typeof data === 'string') return <span className="text-yellow-300 font-mono text-sm">"{data}"</span>;
  const isArr = Array.isArray(data);
  const entries = isArr ? (data as unknown[]).map((v, i) => [i, v]) : Object.entries(data as object);
  return (
    <span>
      <button onClick={() => setOpen(o => !o)} className="text-zinc-500 hover:text-zinc-300 mr-1 font-mono text-xs">{open ? '▾' : '▸'}</button>
      <span className="text-zinc-500 font-mono text-sm">{isArr ? '[' : '{'}</span>
      {!open && <span className="text-zinc-600 font-mono text-xs"> {entries.length} {isArr ? 'items' : 'keys'} </span>}
      {open && (
        <div style={{ paddingLeft: 20 }}>
          {(entries as [string | number, unknown][]).map(([k, v], i) => (
            <div key={i} className="my-0.5">
              {!isArr && <><span className="text-blue-300 font-mono text-sm">"{k}"</span><span className="text-zinc-500 font-mono text-sm">: </span></>}
              <JsonNode data={v} depth={depth + 1} />
              {i < entries.length - 1 && <span className="text-zinc-600 font-mono text-sm">,</span>}
            </div>
          ))}
        </div>
      )}
      <span className="text-zinc-500 font-mono text-sm">{isArr ? ']' : '}'}</span>
    </span>
  );
}

interface PreviewPanelProps {
  tab: Tab;
  onClose: () => void;
}

export function PreviewPanel({ tab, onClose }: PreviewPanelProps) {
  const ext = tab.name.split('.').pop()?.toLowerCase() ?? '';
  const isImg = ['png','jpg','jpeg','gif','svg','webp','ico'].includes(ext);

  const header = (label: string, icon: React.ReactNode) => (
    <div className="h-8 flex items-center justify-between px-3 border-b border-zinc-800 bg-[#111113] flex-shrink-0">
      <div className="flex items-center gap-2 text-[12px] text-zinc-400">
        <span className="text-zinc-500">{icon}</span>
        <span className="font-medium text-zinc-200">{tab.name}</span>
        <span className="text-zinc-600">— {label}</span>
      </div>
      <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  if (ext === 'md') return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0e0e10] border-l border-zinc-800">
      {header('Markdown Preview', <Eye className="w-3.5 h-3.5" />)}
      <div className="flex-1 overflow-y-auto p-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(tab.content) }} />
    </div>
  );

  if (ext === 'html') return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0e0e10] border-l border-zinc-800">
      {header('HTML Preview', <Eye className="w-3.5 h-3.5" />)}
      <iframe srcDoc={tab.content} sandbox="allow-scripts allow-same-origin" className="flex-1 bg-white" title="HTML Preview" />
    </div>
  );

  if (ext === 'csv') return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0e0e10] border-l border-zinc-800">
      {header('CSV Table View', <Table className="w-3.5 h-3.5" />)}
      <div className="flex-1 overflow-auto"><CsvView content={tab.content} /></div>
    </div>
  );

  if (ext === 'json') {
    let parsed: unknown = null;
    let parseErr = '';
    try { parsed = JSON.parse(tab.content); } catch (e: unknown) { parseErr = String(e); }
    return (
      <div className="flex flex-col h-full overflow-hidden bg-[#0e0e10] border-l border-zinc-800">
        {header('JSON Tree View', <Code className="w-3.5 h-3.5" />)}
        <div className="flex-1 overflow-auto p-4">
          {parseErr
            ? <div className="text-red-400 text-sm font-mono">{parseErr}</div>
            : <JsonNode data={parsed} />}
        </div>
      </div>
    );
  }

  if (isImg) return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0e0e10] border-l border-zinc-800">
      {header('Image Preview', <Image className="w-3.5 h-3.5" />)}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="text-center">
          <div className="w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-4xl">🖼</div>
          <p className="text-zinc-400 text-sm">{tab.name}</p>
          <p className="text-zinc-600 text-xs mt-1">Binary image — open in OS viewer for full preview</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0e0e10] border-l border-zinc-800">
      {header('Preview', <FileText className="w-3.5 h-3.5" />)}
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        No preview available for .{ext} files
      </div>
    </div>
  );
}
