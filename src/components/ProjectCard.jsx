import React, { useState } from 'react';
import {
  Play,
  Square,
  ExternalLink,
  Terminal,
  Folder,
  Package,
  Hash,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown
} from 'lucide-react';
import LogDrawer from './LogDrawer';

export default function ProjectCard({
  project,
  status = 'stopped',
  detectedUrl,
  logs = [],
  customPort,
  selectedScript,
  onPortChange,
  onScriptChange,
  onRun,
  onStop,
  onOpenBrowser,
  onRemoveProject,
  onClearLogs,
}) {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [portInputValue, setPortInputValue] = useState(customPort || '5173');

  const isRunning = status === 'running';
  const isStarting = status === 'starting';
  const isError = status === 'error';

  const handlePortSubmit = () => {
    const num = parseInt(portInputValue, 10);
    if (!isNaN(num) && num > 0 && num < 65536) {
      onPortChange(project.id, num.toString());
    } else {
      setPortInputValue(customPort || '5173');
    }
  };

  // Color mapping for Package Managers
  const pmColors = {
    pnpm: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
    yarn: 'bg-blue-950/90 text-blue-300 border-blue-700/80',
    bun: 'bg-yellow-950/90 text-yellow-300 border-yellow-700/80',
    npm: 'bg-rose-950/90 text-rose-300 border-rose-700/80',
  };

  return (
    <div
      className={`glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all ${
        isRunning ? 'glass-card-running' : ''
      }`}
    >
      <div>
        {/* Top Info Bar */}
        <div className="flex items-start justify-between gap-3 mb-3">
          
          <div className="flex items-start space-x-3 min-w-0">
            <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
              isRunning ? 'bg-emerald-950/90 border-emerald-800/90 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <Folder className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-base font-bold text-slate-100 truncate" title={project.name}>{project.name}</h3>
                
                {/* Status Badge */}
                {isRunning && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 shadow-sm shrink-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-running"></span>
                    <span>Running</span>
                  </span>
                )}
                {isStarting && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/90 text-amber-300 border border-amber-800/80 shrink-0">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Starting...</span>
                  </span>
                )}
                {isError && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/90 text-rose-300 border border-rose-800/80 shrink-0">
                    <AlertCircle className="h-3 w-3" />
                    <span>Error</span>
                  </span>
                )}
                {!isRunning && !isStarting && !isError && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                    Stopped
                  </span>
                )}
              </div>

              {/* Path */}
              <p className="text-xs text-slate-400 truncate mt-1 font-mono" title={project.path}>
                {project.path}
              </p>
            </div>
          </div>

          {/* Remove Card Action */}
          <button
            onClick={() => onRemoveProject(project.id)}
            title="Remove project"
            className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800/80 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Configuration Row (Script & Custom Port) - STAYS STRICTLY INSIDE CARD */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 my-3.5 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800/90 overflow-hidden max-w-full">
          
          {/* Script Selector */}
          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center shrink-0">
              <Package className="h-3.5 w-3.5 mr-1 text-cyan-400" />
              Script:
            </span>
            <div className="relative min-w-0 flex-1">
              <select
                value={selectedScript || project.defaultScript || 'dev'}
                onChange={(e) => onScriptChange(project.id, e.target.value)}
                disabled={isRunning}
                className="w-full bg-slate-900 text-xs font-mono font-medium text-cyan-300 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500/50 disabled:opacity-60 appearance-none cursor-pointer pr-5 truncate"
              >
                {project.scriptKeys && project.scriptKeys.length > 0 ? (
                  project.scriptKeys.map((sc) => (
                    <option key={sc} value={sc}>
                      {sc}
                    </option>
                  ))
                ) : (
                  <option value="dev">dev</option>
                )}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Port Input & PM Badge */}
          <div className="flex items-center space-x-1.5 shrink-0 justify-end">
            <span className="text-xs font-semibold text-slate-400 flex items-center shrink-0">
              <Hash className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Port:
            </span>
            <input
              type="number"
              value={portInputValue}
              onChange={(e) => setPortInputValue(e.target.value)}
              onBlur={handlePortSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handlePortSubmit()}
              disabled={isRunning}
              className="w-16 bg-slate-900 text-xs font-mono font-semibold text-emerald-400 border border-slate-800 rounded-lg px-1.5 py-1 text-center focus:outline-none focus:border-emerald-500/50 disabled:opacity-60"
            />
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold border shrink-0 ${pmColors[project.packageManager || 'npm']}`}>
              {project.packageManager || 'npm'}
            </span>
          </div>

        </div>

        {/* Detected URL Row */}
        {detectedUrl && (
          <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/50 rounded-xl px-3 py-2 mb-3">
            <div className="flex items-center space-x-2 truncate">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-mono text-emerald-300 truncate">{detectedUrl}</span>
            </div>
            <button
              onClick={() => onOpenBrowser(detectedUrl)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-emerald-600/20 active:scale-95 shrink-0 ml-2"
            >
              <span>Open</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        
        {/* Toggle Log Drawer */}
        <button
          onClick={() => setIsLogOpen(!isLogOpen)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            isLogOpen
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          <span>Logs</span>
          {logs.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400 font-mono">
              {logs.length}
            </span>
          )}
        </button>

        {/* Run / Stop Main Control */}
        <div>
          {isRunning ? (
            <button
              onClick={() => onStop(project.id)}
              className="flex items-center space-x-1.5 px-4 py-1.5 btn-action-rose rounded-xl text-xs font-bold transition active:scale-95"
            >
              <Square className="h-3.5 w-3.5 fill-white" />
              <span>Stop Server</span>
            </button>
          ) : (
            <button
              onClick={() => onRun(project)}
              disabled={isStarting}
              className="flex items-center space-x-1.5 px-4 py-1.5 btn-action-emerald rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Run Dev</span>
            </button>
          )}
        </div>

      </div>

      {/* Expandable Live Terminal Drawer */}
      {isLogOpen && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <LogDrawer
            projectId={project.id}
            projectName={project.name}
            logs={logs}
            detectedUrl={detectedUrl}
            onClear={() => onClearLogs(project.id)}
            onOpenBrowser={() => onOpenBrowser(detectedUrl)}
          />
        </div>
      )}
    </div>
  );
}
