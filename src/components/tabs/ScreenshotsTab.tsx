import React, { useState, useEffect } from 'react';
import { Camera, FolderOpen, Maximize2, X, Download, Copy, Check, RefreshCw } from 'lucide-react';

interface LocalScreenshot {
  name: string;
  url: string | null;
  date: Date;
  size: number;
}

export const ScreenshotsTab: React.FC = () => {
  const [screenshots, setScreenshots] = useState<LocalScreenshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<LocalScreenshot | null>(null);

  const loadScreenshots = async () => {
    setIsLoading(true);
    try {
      const files = await window.launcherAPI.getFolderContents('screenshots');
      const imageFiles = files
        .filter(f => !f.isDirectory && f.name.toLowerCase().endsWith('.png'))
        .sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

      const loaded: LocalScreenshot[] = [];
      for (const f of imageFiles) {
        const url = await window.launcherAPI.readLocalImage(`screenshots/${f.name}`);
        loaded.push({
          name: f.name,
          url,
          date: new Date(f.mtime),
          size: f.size
        });
      }
      setScreenshots(loaded);
    } catch(e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadScreenshots();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span>Galería de Capturas (Real)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Imágenes extraídas directamente de tu carpeta `.avocadomc/screenshots`.
          </p>
        </div>

        <button
          onClick={loadScreenshots}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Recargar</span>
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-32">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      )}

      {!isLoading && screenshots.length === 0 && (
        <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <p className="text-slate-400">No hay capturas en tu carpeta de screenshots aún.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {screenshots.map((sc) => (
          <div
            key={sc.name}
            onClick={() => setActiveItem(sc)}
            className="bg-slate-900/80 rounded-2xl overflow-hidden border border-slate-800 hover:border-emerald-500/50 transition-all group cursor-pointer"
          >
            <div className="h-44 overflow-hidden relative flex items-center justify-center bg-black/50">
              {sc.url ? (
                <img
                  src={sc.url}
                  alt={sc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <span className="text-xs text-slate-500">Error cargando imagen</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                <span className="text-[10px] text-emerald-300 font-mono font-bold">PNG</span>
                <span className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold">
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="p-3.5">
              <h3 className="text-xs font-bold text-white truncate">{sc.name}</h3>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                <span>{sc.date.toLocaleString()}</span>
                <span>{(sc.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setActiveItem(null)} />
          <div className="relative w-full max-w-5xl bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col md:flex-row">
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
              {activeItem.url && (
                <img src={activeItem.url} alt={activeItem.name} className="max-w-full max-h-[80vh] object-contain" />
              )}
            </div>

            <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-6">Detalles de Captura</h3>
              <div className="space-y-4 flex-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nombre del Archivo</span>
                  <span className="text-sm font-mono text-emerald-400 break-all">{activeItem.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Fecha</span>
                  <span className="text-sm font-medium text-slate-200">{activeItem.date.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Coordenadas y Bioma</span>
                  <span className="text-sm font-medium text-slate-400">Desconocido (Vanilla)</span>
                  <p className="text-[10px] text-slate-500 mt-1">Minecraft base no guarda estos metadatos en la imagen.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
