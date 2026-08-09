const fs = require('fs');
const gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(fs);

process.on('uncaughtException', (err) => {
    console.error('[Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection]', reason);
});

const { app, BrowserWindow, ipcMain, session, dialog, shell } = require('electron');
const path = require('path');
const extract = require('extract-zip');
const { exec } = require('child_process');
const { Client } = require('minecraft-launcher-core');
const msmc = require('msmc');
const { v4: uuidv4 } = require('uuid');
const { checkForUpdates } = require('./updater.cjs');
const { ensureJava21 } = require('./javaManager.cjs');
const { getLatestNeoForge1211, installNeoForgeIfNeeded, syncModsFromGitHub } = require('./syncManager.cjs');
const DiscordRPC = require('discord-rpc');

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128 --optimize-for-size');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('renderer-process-limit', '1');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-background-networking');

let mainWindow;
const launcher = new Client();
const rootDir = path.join(app.getPath('appData'), '.avocadomc');
let gameProcess = null;

const logHistory = [];
const MAX_LOG_HISTORY = 2500;

function sendLog(type, text) {
    if (!text) return;
    const strText = String(text).trim();
    if (!strText) return;

    const entry = {
        id: uuidv4(),
        timestamp: new Date().toLocaleTimeString(),
        type: type,
        text: strText
    };

    logHistory.push(entry);
    if (logHistory.length > MAX_LOG_HISTORY) {
        logHistory.shift();
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('launcher-log', entry);
    }
    console.log(`[${type}] ${strText}`);
}

function sendStatus(msg) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('launcher-status', msg);
    }
    sendLog('STATUS', msg);
}

function sendProgress(prog) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress', prog);
    }
}

ipcMain.handle('get-logs', () => logHistory);
ipcMain.handle('clear-logs', () => {
    logHistory.length = 0;
    return true;
});

// Discord RPC Setup
const clientId = '123456789012345678';
DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });
let rpcReady = false;

rpc.on('ready', () => {
    rpcReady = true;
    try {
        rpc.setActivity({
            details: 'Navegando en el Launcher',
            state: 'AvocadoMC v2.4',
            largeImageKey: 'logo',
            largeImageText: 'AvocadoMC',
            instance: false,
        }).catch(() => {});
    } catch(e){}
});
try {
    rpc.login({ clientId }).catch(() => {});
} catch(e){}

let currentAuth = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        frame: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, '../icono.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: false,
            backgroundThrottling: true
        }
    });

    session.defaultSession.on('will-download', (event, item, webContents) => {
        if (item.getFilename().endsWith('.emotecraft') || item.getFilename().endsWith('.json')) {
            const emoteDir = path.join(rootDir, 'emotes');
            if (!fs.existsSync(emoteDir)) fs.mkdirSync(emoteDir, { recursive: true });
            item.setSavePath(path.join(emoteDir, item.getFilename()));
            item.once('done', (event, state) => {
                if (state === 'completed') {
                    sendLog('SYNC', 'Descargado emote: ' + item.getFilename());
                }
            });
        }
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('login-offline', async (event, username) => {
    currentAuth = {
        access_token: uuidv4(),
        client_token: uuidv4(),
        uuid: uuidv4(),
        name: username || 'Jugador',
        user_properties: '{}'
    };
    sendStatus(`Bienvenido, ${currentAuth.name}`);
    return {
        success: true,
        account: {
            uuid: currentAuth.uuid,
            username: currentAuth.name,
            type: 'offline',
            skinUrl: `https://mc-heads.net/skin/${currentAuth.name}`
        }
    };
});

ipcMain.handle('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
});

ipcMain.handle('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.handle('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
});

ipcMain.handle('get-installed-javas', async () => {
    const javaPaths = [];
    const searchDirs = [
        process.env.JAVA_HOME,
        'C:\\Program Files\\Java',
        'C:\\Program Files (x86)\\Java',
        'C:\\Program Files\\Eclipse Adoptium',
        'C:\\Program Files\\Amazon Corretto',
        'C:\\Program Files\\Microsoft\\jdk'
    ];

    for (const dir of searchDirs) {
        if (!dir || !fs.existsSync(dir)) continue;
        
        try {
            const directJava = path.join(dir, 'bin', 'java.exe');
            if (fs.existsSync(directJava)) {
                if (!javaPaths.includes(directJava)) javaPaths.push(directJava);
            }
            const directJavaw = path.join(dir, 'bin', 'javaw.exe');
            if (fs.existsSync(directJavaw)) {
                if (!javaPaths.includes(directJavaw)) javaPaths.push(directJavaw);
            }

            const subdirs = fs.readdirSync(dir);
            for (const sub of subdirs) {
                const subPath = path.join(dir, sub);
                if (fs.statSync(subPath).isDirectory()) {
                    const javaExe = path.join(subPath, 'bin', 'java.exe');
                    const javawExe = path.join(subPath, 'bin', 'javaw.exe');
                    if (fs.existsSync(javaExe) && !javaPaths.includes(javaExe)) javaPaths.push(javaExe);
                    if (fs.existsSync(javawExe) && !javaPaths.includes(javawExe)) javaPaths.push(javawExe);
                }
            }
        } catch (e) {
            console.error("Error scanning Java dir", dir, e);
        }
    }
    if (javaPaths.length === 0) javaPaths.push('java');
    return javaPaths;
});

ipcMain.handle('select-file', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: options?.filters || []
    });
    if (canceled || filePaths.length === 0) {
        return null;
    }
    
    try {
        const filePath = filePaths[0];
        const fileData = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase().substring(1) || 'png';
        const base64Data = `data:image/${ext};base64,${fileData.toString('base64')}`;
        return base64Data;
    } catch (e) {
        console.error("Error reading selected file", e);
        return null;
    }
});

ipcMain.handle('get-folder-contents', async (event, folderName) => {
    const targetDir = path.join(rootDir, folderName);
    if (!fs.existsSync(targetDir)) return [];
    
    try {
        const files = fs.readdirSync(targetDir);
        return files.map(file => {
            const stat = fs.statSync(path.join(targetDir, file));
            return {
                name: file,
                isDirectory: stat.isDirectory(),
                size: stat.size,
                mtime: stat.mtime
            };
        });
    } catch(e) {
        return [];
    }
});

ipcMain.handle('read-local-image', async (event, imagePath) => {
    const fullPath = path.join(rootDir, imagePath);
    if (!fs.existsSync(fullPath)) return null;
    try {
        const buf = fs.readFileSync(fullPath);
        let mime = 'image/png';
        if (fullPath.toLowerCase().endsWith('.jpg') || fullPath.toLowerCase().endsWith('.jpeg')) mime = 'image/jpeg';
        return `data:${mime};base64,${buf.toString('base64')}`;
    } catch(e) {
        return null;
    }
});

ipcMain.handle('kill-game', () => {
    if (gameProcess) {
        exec(`taskkill /F /PID ${gameProcess.pid} /T`);
        gameProcess = null;
        sendStatus("Juego forzado a cerrarse.");
        if (rpcReady) {
            rpc.setActivity({
                details: 'Navegando en el Launcher',
                state: 'AvocadoMC v2.4',
                largeImageKey: 'logo',
                largeImageText: 'AvocadoMC',
                instance: false,
            }).catch(console.error);
        }
    }
});

ipcMain.handle('open-folder', (event, folderPath) => {
    const fullPath = path.join(rootDir, folderPath || '');
    if (fs.existsSync(fullPath)) {
        shell.openPath(fullPath);
    }
});

function getFolderSizeSync(dir) {
    let size = 0;
    try {
        const files = fs.readdirSync(dir);
        for (const f of files) {
            const p = path.join(dir, f);
            const stat = fs.statSync(p);
            if (stat.isDirectory()) size += getFolderSizeSync(p);
            else size += stat.size;
        }
    } catch(e) {}
    return size;
}

ipcMain.handle('get-folder-size', (event, folderPath) => {
    const fullPath = path.join(rootDir, folderPath || '');
    if (!fs.existsSync(fullPath)) return 0;
    const sizeBytes = getFolderSizeSync(fullPath);
    return (sizeBytes / 1024 / 1024 / 1024).toFixed(2);
});

ipcMain.handle('login-microsoft', async () => {
    try {
        const { Auth } = require("msmc");
        sendStatus("Abriendo ventana de inicio de sesión de Microsoft...");
        
        const authManager = new Auth("select_account");
        authManager.on("load", (asset, message) => {
            sendStatus("Autenticando: " + message);
        });

        const xboxManager = await authManager.launch("electron");
        const token = await xboxManager.getMinecraft();
        const mclc = token.mclc();
        const profile = token.profile;

        let profileCapes = profile?.capes || [];
        let profileSkin = profile?.skins?.[0]?.url || `https://mc-heads.net/skin/${mclc.uuid}`;

        currentAuth = mclc;
        const authPath = path.join(app.getPath('userData'), 'auth.json');
        fs.writeFileSync(authPath, JSON.stringify(currentAuth));
        
        sendStatus(`Bienvenido, ${currentAuth.name}`);
        return {
            success: true,
            account: {
                uuid: currentAuth.uuid,
                username: currentAuth.name,
                type: 'microsoft',
                skinUrl: profileSkin,
                capes: profileCapes,
                email: 'Cuenta Verificada de Xbox'
            }
        };
    } catch (e) {
        sendStatus("Error iniciando sesión: " + (e.message || e.name || String(e)));
        return { success: false, error: e.message };
    }
});



ipcMain.handle('play-game', async (event, config) => {
    if (!currentAuth) {
        const authPath = path.join(app.getPath('userData'), 'auth.json');
        if (fs.existsSync(authPath)) {
            try {
                currentAuth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
            } catch(e) {}
        }
        if (!currentAuth && config?.account && config.account.type === 'offline') {
            currentAuth = {
                access_token: config.account.uuid,
                client_token: config.account.uuid,
                uuid: config.account.uuid,
                name: config.account.username,
                user_properties: '{}'
            };
        }
    }

    if (!currentAuth) {
        sendStatus("Debes iniciar sesión primero.");
        return;
    }

    try {
        if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir, { recursive: true });
        
        const updateResult = await checkForUpdates(rootDir, sendStatus, sendProgress);
        
        let finalJavaPath = config?.javaPath;
        if (!finalJavaPath || finalJavaPath === 'auto' || !fs.existsSync(finalJavaPath)) {
            finalJavaPath = await ensureJava21(rootDir, sendStatus, sendProgress);
        }
        
        let neoforgeVersion = "21.1.244";
        try {
            neoforgeVersion = await getLatestNeoForge1211(rootDir);
        } catch (e) {
            console.error("Error al obtener la última versión de NeoForge:", e);
            sendStatus("Usando versión NeoForge predeterminada debido a error de red.");
        }

        const nfVersionString = await installNeoForgeIfNeeded(neoforgeVersion, rootDir, finalJavaPath, sendStatus, sendProgress);

        try {
            await syncModsFromGitHub(rootDir, sendStatus, sendProgress);
        } catch (e) {
            console.error("Error sincronizando mods de GitHub:", e);
            sendStatus("Error sincronizando mods: " + e.message);
        }

        // MOD TOGGLING LITE VS HIGH
        const modsDir = path.join(rootDir, 'mods');
        if (fs.existsSync(modsDir)) {
            const mods = fs.readdirSync(modsDir);
            for (const mod of mods) {
                const lower = mod.toLowerCase();
                const isTarget = lower.includes('distanthorizons') || lower.includes('iris') || lower.includes('oculus');
                if (isTarget) {
                    const fullPath = path.join(modsDir, mod);
                    if (config?.modpackVersion === 'lite') {
                        if (mod.endsWith('.jar')) fs.renameSync(fullPath, fullPath + '.disabled');
                    } else {
                        if (mod.endsWith('.disabled')) fs.renameSync(fullPath, fullPath.replace('.disabled', ''));
                    }
                }
            }
        }
        
        // OPTIONS.TXT MANIPULATION
        const optionsPath = path.join(rootDir, 'options.txt');
        if (fs.existsSync(optionsPath)) {
            let optsTxt = fs.readFileSync(optionsPath, 'utf8');
            if (config?.modpackVersion === 'lite') {
                optsTxt = optsTxt.replace(/renderDistance:\d+/, 'renderDistance:10');
            }
            fs.writeFileSync(optionsPath, optsTxt);
        }

        const ramMb = config?.ramMb || 4096;
        let customArgs = [
            '--add-opens', 'java.base/java.util.jar=ALL-UNNAMED',
            '--add-opens', 'java.base/java.lang.invoke=ALL-UNNAMED',
            '--add-exports', 'java.base/sun.security.util=ALL-UNNAMED',
            '--add-exports', 'jdk.naming.dns/com.sun.jndi.dns=java.naming',
            '-Djava.awt.headless=false'
        ];

        if (config?.customJvmArgs) {
            const sanitizedJvmArgs = config.customJvmArgs.replace(/-XX:SurvivingRatio=\d+/g, '-XX:SurvivorRatio=8');
            const extraArgs = sanitizedJvmArgs.split(' ').map(a => a.trim()).filter(Boolean);
            for (const arg of extraArgs) {
                if (!customArgs.includes(arg)) {
                    customArgs.push(arg);
                }
            }
        } else {
            customArgs.push(
                '-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled', '-XX:MaxGCPauseMillis=200', 
                '-XX:+UnlockExperimentalVMOptions', '-XX:+DisableExplicitGC', '-XX:+AlwaysPreTouch', 
                '-XX:G1NewSizePercent=30', '-XX:G1MaxNewSizePercent=40', '-XX:G1HeapRegionSize=8M', 
                '-XX:G1ReservePercent=20', '-XX:G1HeapWastePercent=5', '-XX:G1MixedGCCountTarget=4', 
                '-XX:InitiatingHeapOccupancyPercent=15', '-XX:G1MixedGCLiveThresholdPercent=90', 
                '-XX:G1RSetUpdatingPauseTimePercent=5', '-XX:SurvivorRatio=8', 
                '-XX:+PerfDisableSharedMem', '-XX:MaxTenuringThreshold=1'
            );
        }

        // Parse NeoForge JSON to extract module-path arguments
        const nfJsonPath = path.join(rootDir, 'versions', nfVersionString, `${nfVersionString}.json`);
        if (fs.existsSync(nfJsonPath)) {
            try {
                const nfData = JSON.parse(fs.readFileSync(nfJsonPath, 'utf8'));
                if (nfData.arguments && nfData.arguments.jvm) {
                    const libDir = path.join(rootDir, 'libraries').replace(/\\/g, '/');
                    const sep = path.delimiter || ';';
                    for (let arg of nfData.arguments.jvm) {
                        if (typeof arg === 'string') {
                            let parsedArg = arg
                                .replace(/\$\{library_directory\}/g, libDir)
                                .replace(/\$\{classpath_separator\}/g, sep)
                                .replace(/\$\{version_name\}/g, nfVersionString);
                            
                            customArgs.push(parsedArg);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to parse NeoForge JSON for JVM args", err);
            }
        }

        let opts = {
            clientPackage: null,
            authorization: currentAuth,
            root: rootDir,
            javaPath: finalJavaPath,
            version: {
                number: "1.21.1",
                type: "release",
                custom: nfVersionString
            },
            memory: {
                max: `${ramMb}M`,
                min: `${Math.floor(ramMb / 2)}M`
            },
            customArgs: customArgs
        };

        sendStatus("Iniciando Minecraft...");
        
        launcher.removeAllListeners('debug');
        launcher.removeAllListeners('data');
        launcher.removeAllListeners('progress');
        launcher.removeAllListeners('download-status');
        launcher.removeAllListeners('close');

        launcher.on('debug', (e) => sendLog('DEBUG', e));
        launcher.on('data', (e) => sendLog('GAME', e));
        launcher.on('progress', (e) => sendProgress((e.task / e.total) * 100));
        launcher.on('download-status', (e) => {
            const currentMB = e.current ? (e.current / 1024 / 1024).toFixed(2) : 0;
            const totalMB = e.total ? (e.total / 1024 / 1024).toFixed(2) : 0;
            sendStatus(`Descargando: ${e.name || e.type} (${currentMB} MB / ${totalMB} MB)`);
        });

        gameProcess = await launcher.launch(opts);

        if (global.gc) {
            try { global.gc(); } catch(e){}
        }

        if (gameProcess) {
            if (gameProcess.stdout) {
                gameProcess.stdout.on('data', (data) => {
                    sendLog('GAME', data.toString());
                });
            }
            if (gameProcess.stderr) {
                gameProcess.stderr.on('data', (data) => {
                    sendLog('ERROR', data.toString());
                });
            }
        }
        
        if (rpcReady) {
            rpc.setActivity({
                details: `Jugando AvocadoMC (${config?.modpackVersion === 'lite' ? 'LITE' : 'HIGH'})`,
                state: 'En el modpack',
                startTimestamp: Date.now(),
                largeImageKey: 'logo',
                largeImageText: 'AvocadoMC',
                instance: false,
            }).catch(console.error);
        }

        launcher.on('close', (e) => {
            gameProcess = null;
            sendStatus("Juego cerrado.");
            sendLog('STATUS', 'El proceso del juego ha finalizado.');
            if (rpcReady) {
                rpc.setActivity({
                    details: 'Navegando en el Launcher',
                    state: 'AvocadoMC v2.4',
                    largeImageKey: 'logo',
                    largeImageText: 'AvocadoMC',
                    instance: false,
                }).catch(console.error);
            }
        });

    } catch (e) {
        gameProcess = null;
        sendStatus("Error al lanzar: " + e.message);
    }
});
