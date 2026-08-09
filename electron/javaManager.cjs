const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');

const isWin = process.platform === 'win32';
const JAVA_21_URL = isWin
    ? "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse?project=jdk"
    : "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jre/hotspot/normal/eclipse?project=jdk";

const javaBinName = isWin ? 'java.exe' : 'java';

function checkJavaVersion(javaExecutable) {
    return new Promise((resolve) => {
        exec(`"${javaExecutable}" -version`, (error, stdout, stderr) => {
            if (error) {
                resolve(null);
                return;
            }
            const output = stderr.toString() || stdout.toString();
            const match = output.match(/version "([^"]+)"/);
            if (match) {
                resolve(match[1]);
            } else {
                resolve(null);
            }
        });
    });
}

async function findSystemJava21() {
    const pathsToCheck = ['java'];
    
    const commonDirs = isWin ? [
        'C:\\Program Files\\Java',
        'C:\\Program Files\\Eclipse Adoptium',
        'C:\\Program Files\\Amazon Corretto',
        'C:\\Program Files (x86)\\Java'
    ] : [
        '/usr/lib/jvm',
        '/usr/java',
        '/opt/java',
        '/usr/local/java'
    ];
    
    for (const dir of commonDirs) {
        if (fs.existsSync(dir)) {
            try {
                const subdirs = fs.readdirSync(dir);
                for (const subdir of subdirs) {
                    const exe = path.join(dir, subdir, 'bin', javaBinName);
                    if (fs.existsSync(exe)) {
                        pathsToCheck.push(exe);
                    }
                }
            } catch(e) {}
        }
    }
    
    for (const exe of pathsToCheck) {
        const version = await checkJavaVersion(exe);
        if (version && version.startsWith('21.')) {
            return { exe, version };
        }
    }
    
    return null;
}

function downloadJava(url, dest, sendStatus, sendProgress, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            return reject(new Error("Demasiadas redirecciones descargando Java"));
        }

        const tmpDest = dest + '.tmp';
        if (fs.existsSync(tmpDest)) {
            try { fs.unlinkSync(tmpDest); } catch(e){}
        }

        const request = https.get(url, { headers: { 'User-Agent': 'AvocadoMC-Launcher' } }, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return downloadJava(response.headers.location, dest, sendStatus, sendProgress, redirectCount + 1).then(resolve).catch(reject);
            }
            
            if (response.statusCode !== 200) {
                return reject(new Error(`Fallo al obtener Java de '${url}' (HTTP ${response.statusCode})`));
            }

            let file;
            try {
                file = fs.createWriteStream(tmpDest);
            } catch (e) {
                return reject(e);
            }

            const totalSize = parseInt(response.headers['content-length'], 10) || 45000000;
            let downloadedSize = 0;
            let finished = false;

            const cleanup = () => {
                try { file.close(); } catch(e){}
                if (fs.existsSync(tmpDest)) try { fs.unlinkSync(tmpDest); } catch(e){}
            };

            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                if (sendProgress) {
                    sendProgress((downloadedSize / totalSize) * 100);
                }
            });

            response.on('error', (err) => {
                if (finished) return;
                finished = true;
                cleanup();
                reject(err);
            });

            file.on('error', (err) => {
                if (finished) return;
                finished = true;
                cleanup();
                reject(err);
            });

            file.on('finish', () => {
                if (finished) return;
                finished = true;
                file.close(() => {
                    try {
                        if (fs.existsSync(dest)) fs.unlinkSync(dest);
                        fs.renameSync(tmpDest, dest);
                        resolve();
                    } catch (e) {
                        cleanup();
                        reject(e);
                    }
                });
            });

            response.pipe(file);
        });

        request.on('error', (err) => {
            if (fs.existsSync(tmpDest)) try { fs.unlinkSync(tmpDest); } catch(e){}
            reject(err);
        });
    });
}

async function ensureJava21(rootDir, sendStatus, sendProgress) {
    const javaDir = path.join(rootDir, 'runtime', 'java-21');
    const exePath = path.join(javaDir, 'bin', javaBinName);

    // 1. Verificar si ya tenemos Java descargado en el launcher
    if (fs.existsSync(exePath)) {
        return exePath;
    }

    // 1.5 Verificar caché de ruta de Java encontrada previamente
    const cacheFile = path.join(rootDir, '.java_path');
    if (fs.existsSync(cacheFile)) {
        try {
            const cachedExe = fs.readFileSync(cacheFile, 'utf8').trim();
            if (cachedExe && fs.existsSync(cachedExe)) {
                return cachedExe;
            }
        } catch(e){}
    }

    // 2. Buscar Java 21 en las carpetas de instalación del sistema
    sendStatus("Buscando Java 21 en el sistema...");
    const foundJava = await findSystemJava21();
    if (foundJava) {
        try { fs.writeFileSync(cacheFile, foundJava.exe); } catch(e){}
        sendStatus(`Java ${foundJava.version} detectado en: ${foundJava.exe}`);
        return foundJava.exe;
    }

    // 3. No hay Java 21, descargar
    sendStatus("Java 21 no encontrado. Descargando JRE 21 automáticamente (Necesario para 1.21.1)...");
    
    const runtimeDir = path.join(rootDir, 'runtime');
    if (!fs.existsSync(runtimeDir)) {
        fs.mkdirSync(runtimeDir, { recursive: true });
    }

    const zipPath = path.join(runtimeDir, 'java21.zip');
    
    try {
        await downloadJava(JAVA_21_URL, zipPath, sendStatus, (progress) => {
            sendProgress(progress);
            sendStatus(`Descargando Java 21... ${Math.round(progress)}%`);
        });

        sendStatus("Extrayendo Java...");
        const zip = new AdmZip(zipPath);
        
        // Adoptium zip structure is jdk-21.x.x+x-jre/...
        // We extract to runtime, then rename the extracted folder to 'java-21'
        zip.extractAllTo(runtimeDir, true);
        fs.unlinkSync(zipPath);

        // Encontrar la carpeta extraída
        const dirs = fs.readdirSync(runtimeDir).filter(f => f.startsWith('jdk-21') || f.startsWith('eclipse'));
        if (dirs.length > 0) {
            fs.renameSync(path.join(runtimeDir, dirs[0]), javaDir);
        }

        if (fs.existsSync(exePath)) {
            sendStatus("Java 21 instalado exitosamente.");
            return exePath;
        } else {
            throw new Error("No se pudo encontrar java.exe después de extraer.");
        }
    } catch (e) {
        sendStatus("Error instalando Java: " + e.message);
        console.error(e);
        return 'java'; // Fallback
    }
}

module.exports = { ensureJava21 };
