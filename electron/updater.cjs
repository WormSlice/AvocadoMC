const fs = require('fs');
const path = require('path');
const https = require('https');
const extract = require('extract-zip');

// URL del version.json en el repositorio de GitHub (RAW URL)
// El usuario debe cambiar esto por la URL de su repositorio.
const VERSION_URL = 'https://raw.githubusercontent.com/WormSlice/AvocadoMC/main/version.json';

function downloadFile(url, dest, onProgress) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        
        // Manejar redirecciones (GitHub usa redirecciones para raw files a veces)
        const request = https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest, onProgress).then(resolve).catch(reject);
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }

            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloadedSize = 0;

            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                if (onProgress && totalSize) {
                    onProgress((downloadedSize / totalSize) * 100);
                }
            });

            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function checkForUpdates(rootDir, sendStatus, sendProgress) {
    sendStatus("Comprobando actualizaciones...");
    
    try {
        // 1. Obtener version.json remoto
        const response = await fetch(VERSION_URL);
        if (!response.ok) {
            sendStatus("No se pudo obtener version.json del servidor (Verifica la URL).");
            return false;
        }
        const remoteVersion = await response.json();
        
        // 2. Leer version.json local
        const localVersionPath = path.join(rootDir, 'version.json');
        let localVersion = {};
        if (fs.existsSync(localVersionPath)) {
            localVersion = JSON.parse(fs.readFileSync(localVersionPath, 'utf8'));
        }
        
        // 3. Comparar versión del Modpack
        if (remoteVersion.modpackVersion !== localVersion.modpackVersion) {
            sendStatus(`Nueva versión del Modpack encontrada: ${remoteVersion.modpackVersion}`);
            
            const zipPath = path.join(rootDir, 'modpack_update.zip');
            sendStatus("Descargando modpack...");
            
            await downloadFile(remoteVersion.modpackUrl, zipPath, (progress) => {
                sendProgress(progress);
                sendStatus(`Descargando Modpack... ${Math.round(progress)}%`);
            });
            
            sendStatus("Extrayendo modpack (esto puede tardar unos minutos)...");
            await extract(zipPath, { dir: rootDir });
            
            // Borrar el zip descargado para ahorrar espacio
            fs.unlinkSync(zipPath);
            
            sendStatus("Modpack actualizado con éxito.");
            
            // Actualizar versión local
            localVersion.modpackVersion = remoteVersion.modpackVersion;
            localVersion.neoforgeVersion = remoteVersion.neoforgeVersion; // Actualizamos neoforgeVersion tambien
            fs.writeFileSync(localVersionPath, JSON.stringify(localVersion, null, 2));
            
            return {
                updated: true,
                neoforgeVersion: remoteVersion.neoforgeVersion
            };
        }
        
        sendStatus("El modpack está actualizado.");
        return {
            updated: false,
            neoforgeVersion: remoteVersion.neoforgeVersion || localVersion.neoforgeVersion
        };
        
    } catch (error) {
        sendStatus("Error al comprobar actualizaciones: " + error.message);
        console.error(error);
        return false;
    }
}

module.exports = { checkForUpdates };
