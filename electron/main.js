import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import treeKill from 'tree-kill';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
const runningProcesses = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#020617',
    title: 'Local Dev Server Manager',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Remove standard menu bar for sleek custom UI
  mainWindow.setMenuBarVisibility(false);

  if (process.env.VITE_DEV_SERVER_URL || process.argv.includes('--dev')) {
    const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(url);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ignore directories during recursive scanning
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  '.svelte-kit',
  'dist',
  'build',
  'out',
  'coverage',
  '.cache',
  'target',
  '.venv',
  'vendor',
  '.turbo',
  '.output'
]);

// Helper to detect package manager from lockfiles
async function detectPackageManager(dirPath) {
  try {
    if (existsSync(path.join(dirPath, 'pnpm-lock.yaml'))) return 'pnpm';
    if (existsSync(path.join(dirPath, 'yarn.lock'))) return 'yarn';
    if (existsSync(path.join(dirPath, 'bun.lockb')) || existsSync(path.join(dirPath, 'bun.lock'))) return 'bun';
    if (existsSync(path.join(dirPath, 'package-lock.json'))) return 'npm';
  } catch (e) {
    // fallback
  }
  return 'npm';
}

// Parse package.json safely
async function parsePackageJson(folderPath) {
  const pkgPath = path.join(folderPath, 'package.json');
  if (!existsSync(pkgPath)) return null;

  try {
    const content = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    const pm = await detectPackageManager(folderPath);

    // Extract scripts
    const scripts = pkg.scripts || {};
    const scriptKeys = Object.keys(scripts);
    
    // Pick primary default script (dev -> start -> first script)
    let defaultScript = '';
    if (scripts.dev) defaultScript = 'dev';
    else if (scripts.start) defaultScript = 'start';
    else if (scriptKeys.length > 0) defaultScript = scriptKeys[0];

    return {
      id: Buffer.from(folderPath).toString('base64'),
      name: pkg.name || path.basename(folderPath),
      version: pkg.version || '1.0.0',
      description: pkg.description || '',
      path: folderPath,
      packageManager: pm,
      scripts: scripts,
      scriptKeys: scriptKeys,
      defaultScript: defaultScript,
      hasPackageJson: true,
    };
  } catch (err) {
    console.error(`Failed to parse package.json at ${pkgPath}:`, err);
    return null;
  }
}

// Recursive directory scan
async function scanDirectoryRecursive(currentPath, results = [], depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return results;

  try {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    // Check if current directory has a package.json
    const hasPkg = entries.some(e => e.isFile() && e.name === 'package.json');
    if (hasPkg) {
      const info = await parsePackageJson(currentPath);
      if (info) {
        results.push(info);
      }
      // Do not recurse deeper into sub-projects unless desired
      return results;
    }

    // Recurse into subdirectories
    for (const entry of entries) {
      if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        const fullSubPath = path.join(currentPath, entry.name);
        await scanDirectoryRecursive(fullSubPath, results, depth + 1, maxDepth);
      }
    }
  } catch (err) {
    // Skip inaccessible folders
  }
  return results;
}

// --- IPC HANDLERS ---

// Open native Linux directory picker
ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Root Projects Folder'
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Scan directory recursively
ipcMain.handle('scan-directory', async (_event, rootPath) => {
  if (!rootPath || !existsSync(rootPath)) return [];
  const results = await scanDirectoryRecursive(rootPath);
  return results;
});

// Inspect a single manually added folder
ipcMain.handle('inspect-folder', async (_event, folderPath) => {
  if (!folderPath || !existsSync(folderPath)) {
    throw new Error('Directory path does not exist');
  }
  const info = await parsePackageJson(folderPath);
  if (!info) {
    throw new Error('No valid package.json found in the selected folder.');
  }
  return info;
});

// Start Project Server
ipcMain.handle('start-project', async (_event, options) => {
  const { projectId, projectPath, script, packageManager = 'npm', customPort } = options;

  if (runningProcesses.has(projectId)) {
    return { success: false, message: 'Server is already running' };
  }

  if (!existsSync(projectPath)) {
    return { success: false, message: 'Project path not found' };
  }

  // Construct environment variables with custom port
  const env = { ...process.env, FORCE_COLOR: '1' };
  if (customPort) {
    env.PORT = customPort.toString();
    env.VITE_PORT = customPort.toString();
  }

  // Build command string
  const pm = packageManager || 'npm';
  let cmdString = `${pm} run ${script}`;
  
  // Optionally append port flags for common dev runners if port specified
  if (customPort) {
    if (script === 'dev' || script === 'start') {
      // Append -- --port for npm/pnpm/yarn/bun if applicable
      cmdString += ` -- --port ${customPort}`;
    }
  }

  try {
    const child = spawn(cmdString, [], {
      cwd: projectPath,
      shell: true,
      env,
    });

    runningProcesses.set(projectId, {
      child,
      path: projectPath,
      script,
      port: customPort || null,
      detectedUrl: null,
    });

    // Send initial status
    if (mainWindow) {
      mainWindow.webContents.send('project-status', { projectId, status: 'running' });
    }

    const sendLog = (data, type = 'stdout') => {
      const text = data.toString();
      if (mainWindow) {
        mainWindow.webContents.send('project-log', { projectId, data: text, type });

        // Real-time URL Regex auto-detection
        // Matches e.g. http://localhost:5173, http://127.0.0.1:3000, http://0.0.0.0:8080
        const urlMatch = text.match(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0):\d+/i);
        if (urlMatch) {
          const detectedUrl = urlMatch[0];
          const proc = runningProcesses.get(projectId);
          if (proc) proc.detectedUrl = detectedUrl;
          mainWindow.webContents.send('project-url-detected', { projectId, url: detectedUrl });
        }
      }
    };

    child.stdout.on('data', (data) => sendLog(data, 'stdout'));
    child.stderr.on('data', (data) => sendLog(data, 'stderr'));

    child.on('error', (err) => {
      sendLog(`Failed to start process: ${err.message}\n`, 'stderr');
      runningProcesses.delete(projectId);
      if (mainWindow) {
        mainWindow.webContents.send('project-status', { projectId, status: 'error' });
      }
    });

    child.on('exit', (code, signal) => {
      sendLog(`\n[Process exited with code ${code ?? signal}]\n`, 'stdout');
      runningProcesses.delete(projectId);
      if (mainWindow) {
        mainWindow.webContents.send('project-status', { projectId, status: 'stopped' });
      }
    });

    return { success: true, pid: child.pid };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Stop Project Server cleanly using tree-kill
ipcMain.handle('stop-project', async (_event, projectId) => {
  const procInfo = runningProcesses.get(projectId);
  if (!procInfo || !procInfo.child) {
    return { success: false, message: 'No running process found for this project' };
  }

  return new Promise((resolve) => {
    const pid = procInfo.child.pid;
    treeKill(pid, 'SIGTERM', (err) => {
      if (err) {
        // Fallback to SIGKILL on Linux
        treeKill(pid, 'SIGKILL', () => {
          runningProcesses.delete(projectId);
          if (mainWindow) {
            mainWindow.webContents.send('project-status', { projectId, status: 'stopped' });
          }
          resolve({ success: true });
        });
      } else {
        runningProcesses.delete(projectId);
        if (mainWindow) {
          mainWindow.webContents.send('project-status', { projectId, status: 'stopped' });
        }
        resolve({ success: true });
      }
    });
  });
});

// Open external browser link
ipcMain.handle('open-external', async (_event, url) => {
  if (url) {
    await shell.openExternal(url);
  }
});

// App Lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Clean up all running processes before quit
  for (const [projectId, procInfo] of runningProcesses.entries()) {
    if (procInfo.child && procInfo.child.pid) {
      try {
        treeKill(procInfo.child.pid, 'SIGKILL');
      } catch (e) {}
    }
  }
  runningProcesses.clear();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
