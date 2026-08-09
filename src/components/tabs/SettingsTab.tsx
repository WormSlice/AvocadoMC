import React, { useState } from 'react';
import { LauncherSettings } from '../../types';
import { Settings, Cpu, Monitor, Palette, Wifi, RotateCcw, Folder, Terminal, Sparkles, Check, Volume2, Download, Copy, Play, CheckCircle2, ShieldCheck, Laptop } from 'lucide-react';
import { isElectronEnv, minimizeWindow, maximizeWindow, closeWindow, launchGameNative, ELECTRON_MAIN_JS_CODE, ELECTRON_PRELOAD_JS_CODE } from '../../utils/electronBridge';

interface SettingsTabProps {
  settings: LauncherSettings;
  onUpdateSettings: (newSettings: Partial<LauncherSettings>) => void;
  onResetSettings: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const [subTab, setSubTab] = useState<'java' | 'game' | 'network'>('java');
  const [saveToast, setSaveToast] = useState(false);
  const [installedJavas, setInstalledJavas] = useState<string[]>([]);
  const [isScanningJava, setIsScanningJava] = useState(false);

  const isElectron = isElectronEnv();

  const handleSaveNotice = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const autoDetectJava = async () => {
    if (window.launcherAPI?.getInstalledJavas) {
      setIsScanningJava(true);
      try {
        const javas = await window.launcherAPI.getInstalledJavas();
        setInstalledJavas(javas);
      } catch(e) {
        console.error(e);
      } finally {
        setIsScanningJava(false);
      }
    } else {
      onUpdateSettings({ javaPath: 'auto' });
      handleSaveNotice();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Configuración del Launcher</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personaliza el rendimiento de Java, asignación de memoria RAM, gráficos, comportamiento y opciones de red.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveToast && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              ¡Guardado!
            </span>
          )}
          <button
            onClick={onResetSettings}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Opciones</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setSubTab('java')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'java'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Java y Memoria (RAM)</span>
        </button>

        <button
          onClick={() => setSubTab('game')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'game'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Juego y Pantalla</span>
        </button>

        <button
          onClick={() => setSubTab('network')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'network'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>Red y Descargas</span>
        </button>
      </div>

      {/* Subtab Content Area */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 space-y-6">
        {/* SUBTAB 1: JAVA & MEMORY */}
        {subTab === 'java' && (
          <div className="space-y-6">
            {/* RAM Allocation Slider */}
            <div className="space-y-3 bg-slate-950/70 p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    Asignación de Memoria RAM
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define la cantidad máxima de memoria para el proceso de Minecraft.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {(settings.ramMb / 1024).toFixed(1)} GB
                  </span>
                  <span className="text-xs text-slate-500 font-mono block">({settings.ramMb} MB)</span>
                </div>
              </div>

              <input
                type="range"
                min="1024"
                max="16384"
                step="512"
                value={settings.ramMb}
                onChange={(e) => {
                  onUpdateSettings({ ramMb: parseInt(e.target.value) });
                  handleSaveNotice();
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 GB (Mínimo)</span>
                <span className="text-emerald-400 font-bold">4 - 8 GB (Recomendado para Modpacks)</span>
                <span>16 GB (Máximo Sistema)</span>
              </div>
            </div>

            {/* Java Executable Path */}
            <div className="space-y-3 bg-slate-950/70 p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Folder className="w-4 h-4 text-emerald-400" />
                    Ruta del Ejecutable de Java (JVM)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecciona un Java instalado en tu PC, ingresa una ruta manualmente, o usa "auto".
                  </p>
                </div>

                <button
                  onClick={autoDetectJava}
                  disabled={isScanningJava}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isScanningJava ? 'Buscando...' : 'Escanear PC'}</span>
                </button>
              </div>

              {installedJavas.length > 0 && (
                <div className="mt-2 mb-3">
                  <label className="text-xs text-slate-400 block mb-1">Versiones Detectadas:</label>
                  <select
                    className="w-full bg-slate-900 text-slate-200 text-xs font-mono rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-emerald-500"
                    onChange={(e) => {
                      onUpdateSettings({ javaPath: e.target.value });
                      handleSaveNotice();
                    }}
                    value={installedJavas.includes(settings.javaPath) ? settings.javaPath : (settings.javaPath === 'auto' ? 'auto' : '')}
                  >
                    <option value="" disabled hidden>Selecciona una opción...</option>
                    <option value="auto">Descargar/Usar Automático (Recomendado)</option>
                    {installedJavas.map((jpath, i) => (
                      <option key={i} value={jpath}>{jpath}</option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="text"
                value={settings.javaPath}
                placeholder="Ruta manual ej: C:\Archivos de programa\Java\bin\java.exe o 'auto'"
                onChange={(e) => {
                  onUpdateSettings({ javaPath: e.target.value });
                  handleSaveNotice();
                }}
                className="w-full bg-slate-900 text-slate-200 text-xs font-mono rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-emerald-500 mt-2"
              />
            </div>

            {/* JVM Flags Presets */}
            <div className="space-y-3 bg-slate-950/70 p-5 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Argumentos de Optimización JVM
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { 
                    id: 'aikar', 
                    name: 'Aikar Flags (Recomendado)', 
                    desc: 'Optimiza el Garbage Collector para cero tirones de FPS.',
                    flags: '-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=8 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1'
                  },
                  { 
                    id: 'performance', 
                    name: 'Máximo FPS', 
                    desc: 'Soporte multihilo agresivo para procesadores modernos.',
                    flags: '-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M -XX:+UseStringDeduplication -XX:+UseCompressedOops -Dsun.java2d.opengl=true -Dsun.java2d.d3d=true -Dsun.java2d.noddraw=true -XX:+OptimizeStringConcat -Dsun.rmi.dgc.server.gcInterval=2147483646 -Dsun.rmi.dgc.client.gcInterval=2147483646'
                  },
                  { 
                    id: 'custom', 
                    name: 'Personalizados', 
                    desc: 'Escribe tus propios parámetros de JVM manuales.',
                    flags: settings.customJvmFlags
                  },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onUpdateSettings({ 
                        jvmFlagsPreset: preset.id as any,
                        customJvmFlags: preset.id === 'custom' ? settings.customJvmFlags : preset.flags
                      });
                      handleSaveNotice();
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.jvmFlagsPreset === preset.id
                        ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-1">{preset.name}</div>
                    <div className="text-[10px] text-slate-400">{preset.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <label className="text-[11px] text-slate-400 font-mono mb-1 block">Argumentos Activos:</label>
                <textarea
                  rows={3}
                  value={settings.customJvmFlags}
                  onChange={(e) => {
                    onUpdateSettings({ 
                      jvmFlagsPreset: 'custom',
                      customJvmFlags: e.target.value 
                    });
                    handleSaveNotice();
                  }}
                  className="w-full bg-slate-900 text-emerald-400 text-xs font-mono rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: GAME & DISPLAY */}
        {subTab === 'game' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Resolution */}
              <div className="space-y-3 bg-slate-950/70 p-5 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  Resolución del Juego
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Ancho (px)</label>
                    <input
                      type="number"
                      value={settings.resolutionWidth}
                      onChange={(e) => {
                        onUpdateSettings({ resolutionWidth: parseInt(e.target.value) || 1920 });
                        handleSaveNotice();
                      }}
                      className="w-full bg-slate-900 text-slate-200 text-xs font-mono rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Alto (px)</label>
                    <input
                      type="number"
                      value={settings.resolutionHeight}
                      onChange={(e) => {
                        onUpdateSettings({ resolutionHeight: parseInt(e.target.value) || 1080 });
                        handleSaveNotice();
                      }}
                      className="w-full bg-slate-900 text-slate-200 text-xs font-mono rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.fullscreen}
                    onChange={(e) => {
                      onUpdateSettings({ fullscreen: e.target.checked });
                      handleSaveNotice();
                    }}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-slate-300">Iniciar siempre en Pantalla Completa</span>
                </label>
              </div>

              {/* Game Directory */}
              <div className="space-y-3 bg-slate-950/70 p-5 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  Directorio del Juego (.minecraft)
                </h3>

                <input
                  type="text"
                  value={settings.gameDir}
                  onChange={(e) => {
                    onUpdateSettings({ gameDir: e.target.value });
                    handleSaveNotice();
                  }}
                  className="w-full bg-slate-900 text-slate-200 text-xs font-mono rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-emerald-500"
                />

                <label className="flex items-center gap-3 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.discordRpc}
                    onChange={(e) => {
                      onUpdateSettings({ discordRpc: e.target.checked });
                      handleSaveNotice();
                    }}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    Discord Rich Presence ("Jugando a AvocadoMC")
                  </span>
                </label>
              </div>
            </div>

            {/* Auto connect server */}
            <div className="space-y-2 bg-slate-950/70 p-5 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-white">Auto-Conectar a Servidor al Iniciar</h3>
              <p className="text-xs text-slate-400">
                Opcional: Entra directamente a la IP indicada apenas abra Minecraft.
              </p>
              <input
                type="text"
                placeholder="Ejemplo: play.avocadomc.net"
                value={settings.autoConnectServerIp}
                onChange={(e) => {
                  onUpdateSettings({ autoConnectServerIp: e.target.value });
                  handleSaveNotice();
                }}
                className="w-full bg-slate-900 text-slate-200 text-xs font-mono rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* SUBTAB 4: NETWORK & DOWNLOADS */}
        {subTab === 'network' && (
          <div className="space-y-6">
            <div className="space-y-3 bg-slate-950/70 p-5 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Velocidad y Hilos de Descarga
              </h3>
              <p className="text-xs text-slate-400">
                Aumenta los hilos si tienes una conexión de fibra óptica de alta velocidad.
              </p>

              <div className="flex items-center gap-4 pt-2">
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="2"
                  value={settings.downloadThreads}
                  onChange={(e) => {
                    onUpdateSettings({ downloadThreads: parseInt(e.target.value) });
                    handleSaveNotice();
                  }}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-sm font-bold text-emerald-400 font-mono">{settings.downloadThreads} Hilos</span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/70 p-5 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-white">Servidor Espejo CDN para Descargas</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'avocado-fast', title: '🥑 Avocado Fast CDN (Global)', speed: 'Ultra Rápido' },
                  { id: 'official', title: '📦 Servidores Mojang Oficial', speed: 'Estándar' },
                  { id: 'cloudflare', title: '⚡ Cloudflare Edge CDN', speed: 'Baja Latencia' },
                ].map((cdn) => (
                  <button
                    key={cdn.id}
                    onClick={() => {
                      onUpdateSettings({ selectedCdn: cdn.id as any });
                      handleSaveNotice();
                    }}
                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                      settings.selectedCdn === cdn.id
                        ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white">{cdn.title}</div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-mono">{cdn.speed}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
