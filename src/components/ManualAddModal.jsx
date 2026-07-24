import React, { useState } from 'react';
import { X, FolderOpen, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ManualAddModal({ isOpen, onClose, onAddProject }) {
  const [manualPath, setManualPath] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleBrowseFolder = async () => {
    try {
      if (window.electronAPI) {
        const selected = await window.electronAPI.selectFolder();
        if (selected) {
          setManualPath(selected);
          setErrorMsg('');
        }
      }
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!manualPath.trim()) {
      setErrorMsg('Please select or enter a valid directory path.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      if (window.electronAPI) {
        const info = await window.electronAPI.inspectFolder(manualPath.trim());
        if (info) {
          onAddProject(info);
          setManualPath('');
          onClose();
        }
      } else {
        // Fallback demo mock if outside electron
        onAddProject({
          id: Buffer.from(manualPath).toString('base64'),
          name: manualPath.split('/').pop() || 'Custom Project',
          path: manualPath,
          packageManager: 'npm',
          scripts: { dev: 'vite' },
          defaultScript: 'dev',
        });
        setManualPath('');
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'No valid package.json found in the specified path.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-800/60 rounded-xl text-cyan-400">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Add Project Manually</h2>
            <p className="text-xs text-slate-400">Select or paste path to a project with package.json</p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start space-x-2 bg-rose-950/80 border border-rose-800/80 rounded-xl p-3 mb-4 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Project Directory Path
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="/home/user/Projects/my-app"
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition active:scale-95"
              >
                <FolderOpen className="h-4 w-4 text-cyan-400" />
                <span>Browse</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-600/25 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Inspecting...' : 'Add Project'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
