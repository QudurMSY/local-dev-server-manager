import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Trash2, Copy, ExternalLink, ArrowDown, Check } from 'lucide-react';
import { renderAnsiToHtml } from '../utils/ansi';

export default function LogDrawer({
  projectId,
  projectName,
  logs = [],
  detectedUrl,
  onClear,
  onOpenBrowser,
}) {
  const logEndRef = useRef(null);
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    const rawText = logs.map((l) => l.data).join('');
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800/90 overflow-hidden flex flex-col shadow-2xl">
      
      {/* Terminal Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs">
        
        <div className="flex items-center space-x-2">
          {/* Terminal Dots */}
          <div className="flex space-x-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="font-mono font-medium text-slate-300 flex items-center">
            <Terminal className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
            {projectName} logs
          </span>
          <span className="text-[10px] text-slate-500 font-mono">({logs.length} lines)</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          
          {detectedUrl && (
            <button
              onClick={onOpenBrowser}
              className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 transition text-[11px] font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60"
            >
              <span>{detectedUrl}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Auto-scroll Enabled' : 'Auto-scroll Disabled'}
            className={`p-1 rounded transition ${
              autoScroll ? 'text-cyan-400 bg-cyan-950/80' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="Copy logs to clipboard"
            className="p-1 text-slate-400 hover:text-white transition rounded hover:bg-slate-800"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={onClear}
            title="Clear terminal output"
            className="p-1 text-slate-400 hover:text-rose-400 transition rounded hover:bg-slate-800"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

        </div>

      </div>

      {/* Terminal Content Window */}
      <div
        ref={containerRef}
        className="p-3.5 font-mono text-[12.5px] leading-relaxed max-h-72 overflow-y-auto bg-[#070b14] text-slate-200 select-text"
      >
        {logs.length === 0 ? (
          <div className="py-6 text-center text-slate-600 text-xs italic">
            No terminal output logs recorded yet. Click "Run Dev" to start server.
          </div>
        ) : (
          logs.map((logItem, index) => {
            const html = renderAnsiToHtml(logItem.data);
            return (
              <div
                key={index}
                className={`whitespace-pre-wrap break-all ${
                  logItem.type === 'stderr' ? 'text-rose-300' : 'text-slate-200'
                }`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          })
        )}
        <div ref={logEndRef} />
      </div>

    </div>
  );
}
