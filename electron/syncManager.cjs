const https = require('https');
const fs = require('fs');
const gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(fs);
const path = require('path');

function fetchJson(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'AvocadoMC-Launcher', ...headers } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); }
                    catch (e) { reject(e); }
                } else if (res.statusCode === 404) {
                    resolve(null);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
    });
}

function downloadFile(url, dest, onProgress) {
    return new Promise((resolve, reject) => {
        try {
            const dir = path.dirname(dest);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        } catch (err) {
            return reject(err);
        }

        const handleGet = (currentUrl) => {
            const req = https.get(currentUrl, { headers: { 'User-Agent': 'AvocadoMC-Launcher' } }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return handleGet(res.headers.location);
                }
                if (res.statusCode !== 200) {
                    return reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
                }

                let file;
                try {
                    file = fs.createWriteStream(dest);
                } catch (e) {
                    return reject(e);
                }

                file.on('error', (err) => {
                    try { file.close(); } catch(e){}
                    if (fs.existsSync(dest)) { try { fs.unlinkSync(dest); } catch(e){} }
                    reject(err);
                });

                const total = parseInt(res.headers['content-length'], 10);
                let downloaded = 0;

                res.on('data', (chunk) => {
                    downloaded += chunk.length;
                    if (onProgress && total) {
                        onProgress(downloaded, total);
                    }
                });

                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            });
            req.on('error', (err) => {
                if (fs.existsSync(dest)) { try { fs.unlinkSync(dest); } catch(e){} }
                reject(err);
            });
        };
        handleGet(url);
    });
}

async function downloadFileWithRetry(url, dest, onProgress, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await downloadFile(url, dest, onProgress);
            return;
        } catch (err) {
            console.warn(`[Sync] Attempt ${attempt}/${maxRetries} failed for ${dest}: ${err.message}`);
            if (attempt === maxRetries) {
                console.error(`[Sync] Skipped file after ${maxRetries} attempts: ${dest}`);
                return; // Continue with remaining files instead of stopping
            }
            await new Promise(r => setTimeout(r, 800 * attempt));
        }
    }
}

async function getLatestNeoForge1211() {
    console.log("Buscando última versión de NeoForge 1.21.1...");
    const data = await fetchJson('https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge');
    if (!data || !data.versions) throw new Error("No se pudo obtener las versiones de NeoForge");

    const versions1211 = data.versions.filter(v => v.startsWith('21.1.'));
    if (versions1211.length === 0) throw new Error("No se encontraron versiones 21.1.x de NeoForge");

    versions1211.sort((a, b) => {
        const pA = parseInt(a.split('.')[2]);
        const pB = parseInt(b.split('.')[2]);
        return pB - pA;
    });

    return versions1211[0];
}

async function installNeoForgeIfNeeded(version, rootDir, javaPath, sendStatus, sendProgress) {
    const versionDir = path.join(rootDir, 'versions', `neoforge-${version}`);
    if (fs.existsSync(versionDir) && fs.existsSync(path.join(versionDir, `neoforge-${version}.json`))) {
        console.log(`NeoForge ${version} ya está instalado.`);
        return `neoforge-${version}`;
    }

    sendStatus(`Instalando NeoForge ${version}...`);
    const installerUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${version}/neoforge-${version}-installer.jar`;
    const tempInstallerPath = path.join(rootDir, `neoforge-${version}-installer.jar`);

    sendStatus(`Descargando instalador de NeoForge ${version}...`);
    await downloadFileWithRetry(installerUrl, tempInstallerPath, (downloaded, total) => {
        if (total) sendProgress({ task: downloaded, total: total, percent: Math.round((downloaded / total) * 100) });
    });

    const profilesPath = path.join(rootDir, 'launcher_profiles.json');
    if (!fs.existsSync(profilesPath)) {
        fs.writeFileSync(profilesPath, JSON.stringify({ profiles: {} }));
    }

    sendStatus(`Ejecutando instalador de NeoForge ${version}... esto tomará 1-2 minutos.`);
    
    return new Promise((resolve, reject) => {
        const { spawn } = require('child_process');
        const child = spawn(javaPath, ['-jar', tempInstallerPath, '--installClient', rootDir]);

        child.stdout.on('data', (data) => {
            const str = data.toString().trim();
            if (str) {
                console.log("[NeoForge Install]", str);
                const firstLine = str.split('\n')[0];
                if (firstLine.length < 80) {
                    sendStatus(`Instalando NeoForge: ${firstLine}`);
                }
            }
        });

        child.stderr.on('data', (data) => {
            console.error("[NeoForge Install Err]", data.toString());
        });

        child.on('close', (code) => {
            if (fs.existsSync(tempInstallerPath)) {
                try { fs.unlinkSync(tempInstallerPath); } catch(e){}
            }

            if (code === 0) {
                console.log("NeoForge instalado con éxito.");
                resolve(`neoforge-${version}`);
            } else {
                reject(new Error(`Fallo al instalar NeoForge (código de salida ${code})`));
            }
        });
    });
}

async function syncModsFromGitHub(rootDir, sendStatus, sendProgress) {
    sendStatus("Verificando archivos del modpack en GitHub...");

    let treeData = null;
    try {
        treeData = await fetchJson('https://api.github.com/repos/WormSlice/AvocadoMC/git/trees/main?recursive=1');
    } catch(e) {
        console.error("Error al obtener árbol de GitHub:", e);
    }

    if (!treeData || !treeData.tree || !Array.isArray(treeData.tree)) {
        console.log("No se pudo obtener el árbol de GitHub. Saltando sincronización.");
        return;
    }

    const validPrefixes = ['mods/', 'config/', 'shaderpacks/', 'resourcepacks/', 'emotes/', 'defaultconfigs/'];
    const validRootFiles = ['options.txt', 'servers.dat'];

    const remoteFiles = treeData.tree.filter(item => {
        if (item.type !== 'blob') return false;
        const isPrefixed = validPrefixes.some(p => item.path.startsWith(p));
        const isRootFile = validRootFiles.includes(item.path);
        return isPrefixed || isRootFile;
    });

    const remotePaths = remoteFiles.map(f => f.path);

    // Cleanup local files in managed folders that no longer exist on GitHub
    const foldersToManage = ['mods', 'config', 'shaderpacks', 'resourcepacks', 'emotes', 'defaultconfigs'];
    for (const folder of foldersToManage) {
        const localFolder = path.join(rootDir, folder);
        if (fs.existsSync(localFolder)) {
            const walkLocal = (dir) => {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
                    if (entry.isDirectory()) {
                        walkLocal(fullPath);
                        try {
                            if (fs.readdirSync(fullPath).length === 0) fs.rmdirSync(fullPath);
                        } catch(e){}
                    } else if (entry.isFile()) {
                        if (!remotePaths.includes(relPath)) {
                            try {
                                fs.unlinkSync(fullPath);
                                console.log(`[Sync Cleanup] File deleted: ${relPath}`);
                            } catch(e){}
                        }
                    }
                }
            };
            walkLocal(localFolder);
        }
    }

    // Determine files needing download
    const filesToDownload = [];
    for (const remoteFile of remoteFiles) {
        const parts = remoteFile.path.split('/');
        const localPath = path.join(rootDir, ...parts);
        let needs = true;
        if (fs.existsSync(localPath)) {
            const stat = fs.statSync(localPath);
            if (stat.size === remoteFile.size || (remoteFile.size < 500 && stat.size > 500)) {
                needs = false;
            }
        }
        if (needs) {
            filesToDownload.push({ ...remoteFile, localPath });
        }
    }

    if (filesToDownload.length === 0) {
        sendStatus("Todos los archivos del modpack están actualizados.");
        sendProgress({ task: 100, total: 100, percent: 100 });
        return;
    }

    // Download missing / updated files continuously without halting on single errors
    const totalCount = filesToDownload.length;
    for (let i = 0; i < totalCount; i++) {
        const item = filesToDownload[i];

        const currentPct = Math.round(((i + 1) / totalCount) * 100);
        sendStatus(`Sincronizando (${i + 1}/${totalCount}): ${item.path}`);
        sendProgress({ task: i + 1, total: totalCount, percent: currentPct });

        // Encode path components safely for GitHub raw URL
        const encodedPath = item.path.split('/').map(encodeURIComponent).join('/');
        const rawUrl = `https://raw.githubusercontent.com/WormSlice/AvocadoMC/main/${encodedPath}`;
        
        await downloadFileWithRetry(rawUrl, item.localPath, null, 3);
    }

    sendStatus("Sincronización del modpack completada con éxito.");
    sendProgress({ task: totalCount, total: totalCount, percent: 100 });
}

module.exports = {
    getLatestNeoForge1211,
    installNeoForgeIfNeeded,
    syncModsFromGitHub
};
