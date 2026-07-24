import React from 'react';
import { Layers, Activity, Power, Globe, Filter } from 'lucide-react';

export default function StatsBar({
  totalCount,
  runningCount,
  activePorts,
  filterMode,
  setFilterMode,
  scannedRootPath
}) {
  const stoppedCount = totalCount - runningCount;

  return (
    <div className="px-6 pt-5 pb-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel rounded-2xl p-4 border border-slate-800/60">
        
        {/* Metric Cards */}
        <div className="flex flex-wrap items-center gap-6">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Total Projects</p>
              <p className="text-lg font-bold text-slate-100">{totalCount}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Running Servers</p>
              <p className="text-lg font-bold text-emerald-400">{runningCount}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500">
              <Power className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Stopped</p>
              <p className="text-lg font-bold text-slate-300">{stoppedCount}</p>
            </div>
          </div>

          {activePorts.length > 0 && (
            <>
              <div className="h-8 w-px bg-slate-800 hidden md:block" />
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Active Ports</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {activePorts.map((port) => (
                      <span key={port} className="px-1.5 py-0.5 rounded text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                        :{port}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Root Path Badge & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {scannedRootPath && (
            <div className="hidden xl:flex items-center text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800/80 truncate max-w-[280px]">
              <span className="text-slate-500 mr-1.5">Root:</span>
              <span className="font-mono truncate">{scannedRootPath}</span>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterMode('running')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                filterMode === 'running'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Running ({runningCount})
            </button>
            <button
              onClick={() => setFilterMode('stopped')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                filterMode === 'stopped'
                  ? 'bg-slate-800 text-slate-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stopped ({stoppedCount})
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
