const https = require('https');
const fs = require('fs');
const gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(fs);
const path = require('path');
const crypto = require('crypto');

function getGitBlobSha(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const stat = fs.statSync(filePath);
        const content = fs.readFileSync(filePath);
        const header = Buffer.from(`blob ${stat.size}\0`);
        const hash = crypto.createHash('sha1');
        hash.update(header);
        hash.update(content);
        return hash.digest('hex');
    } catch (e) {
        return null;
    }
}

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

function isLfsPointer(filePath) {
    try {
        if (!fs.existsSync(filePath)) return false;
        const stat = fs.statSync(filePath);
        if (stat.size > 1024) return false;
        const buf = fs.readFileSync(filePath, 'utf8');
        return buf.includes('version https://git-lfs.github.com/spec/v1');
    } catch (e) {
        return false;
    }
}

function isValidJarFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) return false;
        const stat = fs.statSync(filePath);
        if (stat.size < 500) return false;
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(4);
        fs.readSync(fd, buffer, 0, 4, 0);
        fs.closeSync(fd);
        return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    } catch (e) {
        return false;
    }
}

function downloadFile(url, dest, onProgress, expectedSize = 0, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            return reject(new Error(`Demasiadas redirecciones (${redirectCount}) para URL: ${url}`));
        }

        try {
            const dir = path.dirname(dest);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        } catch (err) {
            return reject(err);
        }

        const tmpDest = dest + '.tmp';
        if (fs.existsSync(tmpDest)) {
            try { fs.unlinkSync(tmpDest); } catch(e){}
        }

        const req = https.get(url, {
            headers: {
                'User-Agent': 'AvocadoMC-Launcher',
                'Accept': '*/*'
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadFile(res.headers.location, dest, onProgress, expectedSize, redirectCount + 1)
                    .then(resolve)
                    .catch(reject);
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`Error de descarga HTTP ${res.statusCode} al obtener: ${url}`));
            }

            let file;
            try {
                file = fs.createWriteStream(tmpDest);
            } catch (e) {
                return reject(e);
            }

            const headerLength = parseInt(res.headers['content-length'], 10);
            const total = !isNaN(headerLength) && headerLength > 0 ? headerLength : expectedSize;
            let downloaded = 0;
            let finished = false;

            const cleanup = () => {
                try { file.close(); } catch(e){}
                if (fs.existsSync(tmpDest)) {
                    try { fs.unlinkSync(tmpDest); } catch(e){}
                }
            };

            res.on('data', (chunk) => {
                downloaded += chunk.length;
                if (onProgress && total) {
                    onProgress(downloaded, total);
                }
            });

            res.on('error', (err) => {
                if (finished) return;
                finished = true;
                cleanup();
                reject(new Error(`Error en stream de lectura HTTP: ${err.message}`));
            });

            file.on('error', (err) => {
                if (finished) return;
                finished = true;
                cleanup();
                reject(new Error(`Error escribiendo archivo temporal: ${err.message}`));
            });

            file.on('finish', () => {
                if (finished) return;
                finished = true;
                file.close(() => {
                    const actualBytes = fs.existsSync(tmpDest) ? fs.statSync(tmpDest).size : 0;

                    // Verify expected byte size if provided and non-LFS pointer (> 500 bytes)
                    if (expectedSize && expectedSize > 500 && actualBytes !== expectedSize) {
                        cleanup();
                        return reject(new Error(`INCOMPLETE_DOWNLOAD: Se esperaban ${expectedSize} bytes pero solo se descargaron ${actualBytes} bytes`));
                    }

                    if (total && total > 500 && actualBytes !== total) {
                        cleanup();
                        return reject(new Error(`INCOMPLETE_DOWNLOAD: Transferencia truncada (${actualBytes}/${total} bytes)`));
                    }

                    if (isLfsPointer(tmpDest)) {
                        cleanup();
                        return reject(new Error(`LFS_POINTER_DETECTED: El archivo descargado es un puntero Git LFS`));
                    }

                    if ((dest.toLowerCase().endsWith('.jar') || dest.toLowerCase().endsWith('.jar.disabled')) && !isValidJarFile(tmpDest)) {
                        cleanup();
                        return reject(new Error(`JAR_INVALID: El archivo JAR descargado no tiene una estructura ZIP/JAR válida`));
                    }

                    try {
                        if (fs.existsSync(dest)) {
                            fs.unlinkSync(dest);
                        }
                        fs.renameSync(tmpDest, dest);
                        resolve();
                    } catch (e) {
                        cleanup();
                        reject(new Error(`Error al reemplazar archivo destino: ${e.message}`));
                    }
                });
            });

            res.pipe(file);
        });

        req.setTimeout(45000, () => {
            req.destroy(new Error('Tiempo de espera agotado (Timeout) al descargar ' + url));
        });

        req.on('error', (err) => {
            if (fs.existsSync(tmpDest)) {
                try { fs.unlinkSync(tmpDest); } catch(e){}
            }
            reject(err);
        });
    });
}

async function downloadFileWithRetry(url, dest, onProgress, expectedSize = 0, maxRetries = 3) {
    let currentUrl = url;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await downloadFile(currentUrl, dest, onProgress, expectedSize);
            return;
        } catch (err) {
            console.warn(`[Sync] Intento ${attempt}/${maxRetries} falló para ${dest}: ${err.message}`);
            
            if (currentUrl.includes('raw.githubusercontent.com')) {
                currentUrl = currentUrl.replace('raw.githubusercontent.com', 'media.githubusercontent.com/media');
                console.log(`[Sync] Cambiando a URL de medios Git LFS: ${currentUrl}`);
            }

            if (attempt === maxRetries) {
                console.error(`[Sync] Archivo omitido tras ${maxRetries} intentos: ${dest}`);
                throw new Error(`No se pudo descargar el archivo completo (${dest}): ${err.message}`);
            }
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
}

async function getLatestNeoForge1211(rootDir) {
    if (rootDir) {
        const versionsDir = path.join(rootDir, 'versions');
        if (fs.existsSync(versionsDir)) {
            const dirs = fs.readdirSync(versionsDir).filter(d => d.startsWith('neoforge-21.1.'));
            if (dirs.length > 0) {
                dirs.sort().reverse();
                return dirs[0].replace('neoforge-', '');
            }
        }
    }

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
    const syncLockFile = path.join(rootDir, '.last_sync_sha');
    const manifestFile = path.join(rootDir, '.sync_manifest.json');

    let localSha = '';
    if (fs.existsSync(syncLockFile)) {
        try { localSha = fs.readFileSync(syncLockFile, 'utf8').trim(); } catch(e){}
    }

    let manifest = {};
    if (fs.existsSync(manifestFile)) {
        try {
            manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        } catch(e) {
            manifest = {};
        }
    }

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

    const validPrefixes = ['mods/', 'config/', 'shaderpacks/', 'resourcepacks/', 'emotes/', 'defaultconfigs/', 'xaero/'];
    const validRootFiles = ['options.txt', 'servers.dat'];

    const remoteFiles = treeData.tree.filter(item => {
        if (item.type !== 'blob') return false;
        const isPrefixed = validPrefixes.some(p => item.path.startsWith(p));
        const isRootFile = validRootFiles.includes(item.path);
        return isPrefixed || isRootFile;
    });

    const remotePathsSet = new Set(remoteFiles.map(f => f.path));

    // Cleanup local files in managed folders that no longer exist on GitHub
    const foldersToManage = ['mods', 'config', 'shaderpacks', 'resourcepacks', 'emotes', 'defaultconfigs'];
    let deletedCount = 0;

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
                        let isManaged = remotePathsSet.has(relPath);
                        // Also check if this is a .disabled mod whose enabled version exists on GitHub
                        if (!isManaged && relPath.endsWith('.disabled')) {
                            const activeRelPath = relPath.slice(0, -9);
                            if (remotePathsSet.has(activeRelPath)) {
                                isManaged = true;
                            }
                        }

                        if (!isManaged) {
                            try {
                                fs.unlinkSync(fullPath);
                                deletedCount++;
                                delete manifest[relPath];
                                console.log(`[Sync Cleanup] Mod/Archivo eliminado (ya no está en GitHub): ${relPath}`);
                            } catch(e){
                                console.error(`[Sync Cleanup Error] No se pudo eliminar ${relPath}:`, e.message);
                            }
                        }
                    }
                }
            };
            walkLocal(localFolder);
        }
    }

    if (deletedCount > 0) {
        console.log(`[Sync Cleanup] Se eliminaron ${deletedCount} archivos obsoletos.`);
    }

    // Determine files needing download or update
    const filesToDownload = [];

    for (const remoteFile of remoteFiles) {
        const relPath = remoteFile.path;
        const parts = relPath.split('/');
        const localPath = path.join(rootDir, ...parts);
        const disabledPath = localPath.endsWith('.jar') ? localPath + '.disabled' : null;

        let targetLocal = null;
        if (fs.existsSync(localPath)) {
            targetLocal = localPath;
        } else if (disabledPath && fs.existsSync(disabledPath)) {
            targetLocal = disabledPath;
        }

        let needs = false;

        if (!targetLocal) {
            needs = true;
        } else {
            // Check file validity
            if (targetLocal.toLowerCase().endsWith('.jar') || targetLocal.toLowerCase().endsWith('.jar.disabled')) {
                if (!isValidJarFile(targetLocal)) {
                    console.log(`[Sync] Archivo JAR inválido/corrupto en local: ${relPath}. Se re-descargará.`);
                    needs = true;
                }
            }

            if (!needs && isLfsPointer(targetLocal)) {
                console.log(`[Sync] Puntero LFS detectado en local: ${relPath}. Se re-descargará.`);
                needs = true;
            }

            // Check freshness via manifest SHA or Git SHA comparison
            if (!needs) {
                const recordedMeta = manifest[relPath];
                if (recordedMeta && recordedMeta.sha) {
                    if (recordedMeta.sha !== remoteFile.sha) {
                        console.log(`[Sync] Mod/Archivo actualizado en GitHub: ${relPath} (SHA antiguo: ${recordedMeta.sha}, nuevo: ${remoteFile.sha}). Se re-descargará.`);
                        needs = true;
                    }
                } else {
                    // No manifest entry yet: compute local SHA or fallback check
                    const stat = fs.statSync(targetLocal);
                    if (remoteFile.size < 500 && stat.size > 500) {
                        // Git LFS pointer in tree API, local is full binary download
                        manifest[relPath] = { sha: remoteFile.sha, size: stat.size };
                    } else {
                        const localSha1 = getGitBlobSha(targetLocal);
                        if (localSha1 && localSha1 === remoteFile.sha) {
                            manifest[relPath] = { sha: remoteFile.sha, size: stat.size };
                        } else {
                            console.log(`[Sync] Hash SHA diferido en local para: ${relPath}. Se re-descargará.`);
                            needs = true;
                        }
                    }
                }
            }
        }

        if (needs) {
            if (targetLocal && fs.existsSync(targetLocal)) {
                try { fs.unlinkSync(targetLocal); } catch(e){}
            }
            filesToDownload.push({ ...remoteFile, localPath });
        }
    }

    if (filesToDownload.length === 0) {
        if (treeData.sha) {
            try { fs.writeFileSync(syncLockFile, treeData.sha); } catch(e){}
        }
        try { fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2)); } catch(e){}
        sendStatus("Todos los archivos del modpack están actualizados.");
        sendProgress({ task: 100, total: 100, percent: 100 });
        return;
    }

    // Download missing / updated files continuously
    const totalCount = filesToDownload.length;
    for (let i = 0; i < totalCount; i++) {
        const item = filesToDownload[i];
        const currentPct = Math.round(((i + 1) / totalCount) * 100);
        sendStatus(`Sincronizando (${i + 1}/${totalCount}): ${item.path}`);
        sendProgress({ task: i + 1, total: totalCount, percent: currentPct });

        const encodedPath = item.path.split('/').map(encodeURIComponent).join('/');
        const rawUrl = `https://raw.githubusercontent.com/WormSlice/AvocadoMC/main/${encodedPath}`;
        
        try {
            await downloadFileWithRetry(rawUrl, item.localPath, null, item.size, 3);
            const finalSize = fs.existsSync(item.localPath) ? fs.statSync(item.localPath).size : item.size;
            manifest[item.path] = {
                sha: item.sha,
                size: finalSize,
                updatedAt: Date.now()
            };
        } catch(downloadErr) {
            console.error(`[Sync Error] Error descargando ${item.path}:`, downloadErr.message);
        }
    }

    if (treeData.sha) {
        try { fs.writeFileSync(syncLockFile, treeData.sha); } catch(e){}
    }
    try { fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2)); } catch(e){}

    sendStatus("Sincronización del modpack completada con éxito.");
    sendProgress({ task: totalCount, total: totalCount, percent: 100 });
}

module.exports = {
    getLatestNeoForge1211,
    installNeoForgeIfNeeded,
    syncModsFromGitHub
};
