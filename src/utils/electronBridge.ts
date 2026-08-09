// Electron IPC Bridge & Native Desktop API Helper for AvocadoMC Launcher

export interface ElectronWindowAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  openDirectory: (pathString?: string) => Promise<string | null>;
  selectFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
  launchMinecraft: (payload: {
    instanceId: string;
    instanceName: string;
    version: string;
    loader: string;
    ramMb: number;
    username: string;
    uuid: string;
    token?: string;
    javaPath?: string;
    customJvmFlags?: string;
  }) => Promise<{ success: boolean; pid?: number; error?: string }>;
  getSystemInfo: () => Promise<{
    totalRamGb: number;
    freeRamGb: number;
    cpuModel: string;
    platform: string;
  }>;
  onGameLog?: (callback: (logLine: string) => void) => void;
  onGameExit?: (callback: (code: number) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronWindowAPI;
    ipcRenderer?: {
      send: (channel: string, ...args: any[]) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, listener: (...args: any[]) => void) => void;
    };
  }
}

/**
 * Checks if the launcher is running inside an Electron container environment
 */
export function isElectronEnv(): boolean {
  return (
    typeof window !== 'undefined' &&
    (Boolean(window.electronAPI) ||
      Boolean(window.ipcRenderer) ||
      navigator.userAgent.toLowerCase().includes('electron'))
  );
}

/**
 * Native Window Controls (Minimize, Maximize, Close)
 */
export function minimizeWindow(): void {
  if (window.launcherAPI?.minimizeWindow) {
    window.launcherAPI.minimizeWindow();
  } else {
    console.log('[Web Previa] Simulación: ventana minimizada');
  }
}

export function maximizeWindow(): void {
  if (window.launcherAPI?.maximizeWindow) {
    window.launcherAPI.maximizeWindow();
  } else {
    console.log('[Web Previa] Simulación: ventana maximizada');
  }
}

export function closeWindow(): void {
  if (window.launcherAPI?.closeWindow) {
    window.launcherAPI.closeWindow();
  } else {
    console.log('[Web Previa] Simulación: ventana cerrada');
  }
}

/**
 * Launch Minecraft via Electron IPC
 */
export async function launchGameNative(payload: {
  instanceId: string;
  instanceName: string;
  version: string;
  loader: string;
  ramMb: number;
  username: string;
  uuid: string;
  token?: string;
  javaPath?: string;
  customJvmFlags?: string;
}): Promise<{ success: boolean; pid?: number; message?: string }> {
  if (window.electronAPI?.launchMinecraft) {
    try {
      const res = await window.electronAPI.launchMinecraft(payload);
      return { success: res.success, pid: res.pid, message: res.error || 'Proceso iniciado' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al ejecutar IPC Electron' };
    }
  } else if (window.ipcRenderer?.invoke) {
    try {
      const res = await window.ipcRenderer.invoke('launch-minecraft', payload);
      return { success: true, pid: res?.pid || 1337, message: 'Invocación IPC exitosa' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // Web fallback simulation
  return {
    success: true,
    pid: Math.floor(Math.random() * 8000) + 1000,
    message: 'Lanzado en modo simulación Web',
  };
}

/**
 * Sample Electron `main.js` script generator
 */
export const ELECTRON_MAIN_JS_CODE = `// main.js - AvocadoMC Launcher Main Process for Electron
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { Client } = require('minecraft-launcher-core'); // optional helper

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 780,
    minWidth: 1024,
    minHeight: 640,
    frame: false, // Custom framing
    transparent: false,
    backgroundColor: '#0a0d12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load production bundle or local dev server URL
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window Controls IPC
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());

// Launch Minecraft IPC Handler
ipcMain.handle('launch-minecraft', async (event, payload) => {
  console.log('[AvocadoMC IPC] Lanzando Minecraft:', payload);
  // Aquí puedes usar @xmcl/core o minecraft-launcher-core para spawnear Java process
  return { success: true, pid: process.pid };
});
`;

export const ELECTRON_PRELOAD_JS_CODE = `// preload.js - AvocadoMC Launcher Preload Bridge
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  openDirectory: (path) => ipcRenderer.invoke('open-directory', path),
  selectFile: (filters) => ipcRenderer.invoke('select-file', filters),
  
  launchMinecraft: (payload) => ipcRenderer.invoke('launch-minecraft', payload),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  onGameLog: (callback) => ipcRenderer.on('game-log', (_event, log) => callback(log)),
  onGameExit: (callback) => ipcRenderer.on('game-exit', (_event, code) => callback(code)),
});
`;
