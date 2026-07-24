import React from 'react';
import { FolderSearch, Plus, Search, Square, Server } from 'lucide-react';

export default function Header({
  onScanFolder,
  onOpenManualAdd,
  searchQuery,
  setSearchQuery,
  onStopAll,
  runningCount,
  isScanning,
}) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-6 py-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Branding & Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/25 flex items-center justify-center shrink-0">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Server className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Local Dev Server Manager</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950/90 text-cyan-400 border border-cyan-800/60">
                Linux OS
              </span>
            </div>
            <p className="text-xs text-slate-400">One-click dev server runner, port manager & live logs</p>
          </div>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search Bar */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Scan Root Folder Button */}
          <button
            onClick={onScanFolder}
            disabled={isScanning}
            className="flex items-center space-x-2 px-3.5 py-2 btn-action-emerald rounded-xl font-semibold text-sm transition disabled:opacity-50 active:scale-95 shrink-0"
          >
            <FolderSearch className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Root Folder'}</span>
          </button>

          {/* Add Project Manually Button */}
          <button
            onClick={onOpenManualAdd}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl font-semibold text-sm transition active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4 text-cyan-400" />
            <span>Add Manual</span>
          </button>

          {/* Stop All Button (if servers running) */}
          {runningCount > 0 && (
            <button
              onClick={onStopAll}
              className="flex items-center space-x-1.5 px-3.5 py-2 btn-action-rose rounded-xl font-semibold text-sm transition active:scale-95 shrink-0"
            >
              <Square className="h-4 w-4 text-white fill-white" />
              <span>Stop All ({runningCount})</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
