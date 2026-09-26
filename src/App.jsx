import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import ProjectCard from './components/ProjectCard';
import ManualAddModal from './components/ManualAddModal';
import { FolderSearch, Plus, Layers, AlertCircle, RefreshCw } from 'lucide-react';

const LOCAL_STORAGE_PROJECTS_KEY = 'dev_server_manager_projects_v1';
const LOCAL_STORAGE_ROOT_KEY = 'dev_server_manager_root_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'dev_server_manager_settings_v1';

export default function App() {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [scannedRootPath, setScannedRootPath] = useState(() => {
    return localStorage.getItem(LOCAL_STORAGE_ROOT_KEY) || '';
  });

  // Per-project user choices (selected script, port) that survive restarts
  const [projectSettings, setProjectSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [projectStates, setProjectStates] = useState({});
  const [projectLogs, setProjectLogs] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'running' | 'stopped'
  const [isScanning, setIsScanning] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Save projects & root to LocalStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(projectSettings));
    } catch (e) {}
  }, [projectSettings]);

  useEffect(() => {
    if (scannedRootPath) {
      localStorage.setItem(LOCAL_STORAGE_ROOT_KEY, scannedRootPath);
    }
  }, [scannedRootPath]);

  // Subscribe to Electron IPC events for logs, status, and detected URLs
  useEffect(() => {
    if (!window.electronAPI) return;

    const unbindLog = window.electronAPI.onProjectLog(({ projectId, data, type }) => {
      setProjectLogs((prev) => {
        const existing = prev[projectId] || [];
        return {
          ...prev,
          [projectId]: [...existing.slice(-1000), { data, type, timestamp: Date.now() }],
        };
      });
    });

    const unbindStatus = window.electronAPI.onProjectStatus(({ projectId, status }) => {
      setProjectStates((prev) => ({
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          status,
        },
      }));
    });

    const unbindUrl = window.electronAPI.onUrlDetected(({ projectId, url }) => {
      setProjectStates((prev) => ({
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          detectedUrl: url,
        },
      }));
    });

    return () => {
      if (unbindLog) unbindLog();
      if (unbindStatus) unbindStatus();
      if (unbindUrl) unbindUrl();
    };
  }, []);

  // --- ACTIONS ---

  // Scan Root Directory via Native File Dialog
  const handleScanFolder = async () => {
    if (!window.electronAPI) {
      alert('Scanning requires running inside the Electron app context.');
      return;
    }

    try {
      const rootFolder = await window.electronAPI.selectFolder();
      if (!rootFolder) return;

      setScannedRootPath(rootFolder);
      setIsScanning(true);

      const discovered = await window.electronAPI.scanDirectory(rootFolder);

      // Merge new projects with existing (by path)
      setProjects((existing) => {
        const pathMap = new Map(existing.map((p) => [p.path, p]));
        for (const item of discovered) {
          if (!pathMap.has(item.path)) {
            pathMap.set(item.path, item);
          } else {
            // Update details (scripts, package manager)
            const old = pathMap.get(item.path);
            pathMap.set(item.path, { ...old, ...item });
          }
        }
        return Array.from(pathMap.values());
      });
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Add Manual Project
  const handleAddProject = (newProject) => {
    setProjects((existing) => {
      const exists = existing.some((p) => p.path === newProject.path);
      if (exists) return existing;
      return [newProject, ...existing];
    });
  };

  // Run Dev Server
  const handleRunProject = async (project) => {
    const settings = projectSettings[project.id] || {};
    const script = settings.selectedScript || project.defaultScript || 'dev';
    const customPort = settings.port || '5173';

    setProjectStates((prev) => ({
      ...prev,
      [project.id]: {
        ...prev[project.id],
        status: 'starting',
      },
    }));

    if (window.electronAPI) {
      const res = await window.electronAPI.startProject({
        projectId: project.id,
        projectPath: project.path,
        script,
        packageManager: project.packageManager || 'npm',
        customPort,
      });

      if (!res.success) {
        setProjectStates((prev) => ({
          ...prev,
          [project.id]: {
            ...prev[project.id],
            status: 'error',
          },
        }));

        setProjectLogs((prev) => ({
          ...prev,
          [project.id]: [
            ...(prev[project.id] || []),
            { data: `Error starting project: ${res.message}\n`, type: 'stderr' },
          ],
        }));
      }
    }
  };

  // Stop Server
  const handleStopProject = async (projectId) => {
    if (window.electronAPI) {
      await window.electronAPI.stopProject(projectId);
    }
    setProjectStates((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        status: 'stopped',
        detectedUrl: null,
      },
    }));
  };

  // Stop All Running
  const handleStopAll = async () => {
    for (const project of projects) {
      const state = projectStates[project.id];
      if (state && state.status === 'running') {
        await handleStopProject(project.id);
      }
    }
  };

  // Port Change Handler
  const handlePortChange = (projectId, port) => {
    setProjectSettings((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        port,
      },
    }));
  };

  // Script Selection Change
  const handleScriptChange = (projectId, script) => {
    setProjectSettings((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        selectedScript: script,
      },
    }));
  };

  // Remove Project from List
  const handleRemoveProject = (projectId) => {
    if (projectStates[projectId]?.status === 'running') {
      handleStopProject(projectId);
    }
    setProjects((existing) => existing.filter((p) => p.id !== projectId));
    setProjectSettings((prev) => {
      const { [projectId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  // Open External Browser
  const handleOpenBrowser = (url) => {
    if (window.electronAPI && url) {
      window.electronAPI.openExternal(url);
    } else if (url) {
      window.open(url, '_blank');
    }
  };

  // Clear Logs for a Project
  const handleClearLogs = (projectId) => {
    setProjectLogs((prev) => ({
      ...prev,
      [projectId]: [],
    }));
  };

  // Filter & Search Computations
  const runningCount = Object.values(projectStates).filter((s) => s?.status === 'running').length;
  
  const activePorts = Object.entries(projectStates)
    .filter(([id, s]) => s?.status === 'running' && projectSettings[id]?.port)
    .map(([id]) => projectSettings[id].port);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.path.toLowerCase().includes(searchQuery.toLowerCase());

    const isRunning = projectStates[project.id]?.status === 'running';

    if (filterMode === 'running') return matchesSearch && isRunning;
    if (filterMode === 'stopped') return matchesSearch && !isRunning;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 selection:bg-cyan-500 selection:text-white">
      
      {/* Top Header Navbar */}
      <Header
        onScanFolder={handleScanFolder}
        onOpenManualAdd={() => setIsManualModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onStopAll={handleStopAll}
        runningCount={runningCount}
        isScanning={isScanning}
      />

      {/* Overview Stats Bar */}
      <StatsBar
        totalCount={projects.length}
        runningCount={runningCount}
        activePorts={activePorts}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        scannedRootPath={scannedRootPath}
      />

      {/* Main Card Grid */}
      <main className="flex-1 px-6 py-4">
        {filteredProjects.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center my-8 max-w-xl mx-auto border border-slate-800/80">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <FolderSearch className="h-8 w-8" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-100 mb-2">
              {projects.length === 0 ? 'No Projects Found Yet' : 'No Matching Projects'}
            </h2>
            
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {projects.length === 0
                ? 'Select a root directory (e.g. ~/Projects) to automatically scan for all web projects containing package.json, or add a project manually.'
                : 'Try adjusting your search query or filter mode.'}
            </p>

            {projects.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleScanFolder}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-cyan-600/25 active:scale-95 flex items-center space-x-2"
                >
                  <FolderSearch className="h-4 w-4" />
                  <span>Scan Projects Folder</span>
                </button>
                <button
                  onClick={() => setIsManualModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm border border-slate-700 transition active:scale-95 flex items-center space-x-1.5"
                >
                  <Plus className="h-4 w-4 text-cyan-400" />
                  <span>Add Manually</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const state = projectStates[project.id] || {};
              const settings = projectSettings[project.id] || {};
              const logs = projectLogs[project.id] || [];

              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  status={state.status || 'stopped'}
                  detectedUrl={state.detectedUrl}
                  logs={logs}
                  customPort={settings.port || '5173'}
                  selectedScript={settings.selectedScript || project.defaultScript || 'dev'}
                  onPortChange={handlePortChange}
                  onScriptChange={handleScriptChange}
                  onRun={handleRunProject}
                  onStop={handleStopProject}
                  onOpenBrowser={handleOpenBrowser}
                  onRemoveProject={handleRemoveProject}
                  onClearLogs={handleClearLogs}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Manual Project Addition Modal */}
      <ManualAddModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAddProject={handleAddProject}
      />

    </div>
  );
}
