const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcherAPI', {
    loginMicrosoft: () => ipcRenderer.invoke('login-microsoft'),
    loginOffline: (username) => ipcRenderer.invoke('login-offline', username),
    selectFile: (options) => ipcRenderer.invoke('select-file', options),
    getInstalledJavas: () => ipcRenderer.invoke('get-installed-javas'),
    getFolderContents: (folderName) => ipcRenderer.invoke('get-folder-contents', folderName),
    readLocalImage: (imagePath) => ipcRenderer.invoke('read-local-image', imagePath),
    killGame: () => ipcRenderer.invoke('kill-game'),
    openFolder: (path) => ipcRenderer.invoke('open-folder', path),
    getFolderSize: (path) => ipcRenderer.invoke('get-folder-size', path),
    playGame: (config) => ipcRenderer.invoke('play-game', config),
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
    closeWindow: () => ipcRenderer.invoke('window-close'),
    getLogs: () => ipcRenderer.invoke('get-logs'),
    clearLogs: () => ipcRenderer.invoke('clear-logs'),
    onProgress: (callback) => ipcRenderer.on('download-progress', (_event, data) => callback(data)),
    onStatus: (callback) => ipcRenderer.on('launcher-status', (_event, text) => callback(text)),
    onLog: (callback) => ipcRenderer.on('launcher-log', (_event, entry) => callback(entry))
});
