import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Folder & Scanning IPC
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanDirectory: (rootPath) => ipcRenderer.invoke('scan-directory', rootPath),
  inspectFolder: (folderPath) => ipcRenderer.invoke('inspect-folder', folderPath),
  
  // Process Management IPC
  startProject: (options) => ipcRenderer.invoke('start-project', options),
  stopProject: (projectId) => ipcRenderer.invoke('stop-project', projectId),
  
  // External Browser IPC
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Event Listeners for real-time streaming logs & status
  onProjectLog: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('project-log', handler);
    return () => ipcRenderer.removeListener('project-log', handler);
  },
  onProjectStatus: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('project-status', handler);
    return () => ipcRenderer.removeListener('project-status', handler);
  },
  onUrlDetected: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('project-url-detected', handler);
    return () => ipcRenderer.removeListener('project-url-detected', handler);
  }
});
