import React, { useState, useEffect } from 'react';
import { Package, Search, Download, Trash2, CheckCircle2, RefreshCw, Layers, Sparkles } from 'lucide-react';

interface LocalFile {
  name: string;
  size: number;
}

export const ModsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'mods' | 'resourcepacks' | 'shaderpacks'>('mods');
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const result = await window.launcherAPI.getFolderContents(activeSubTab);
      const fileList = result
        .filter((f: any) => !f.isDirectory && (f.name.endsWith('.jar') || f.name.endsWith('.zip')))
        .map((f: any) => ({ name: f.name, size: f.size }));
      setFiles(fileList);
    } catch(e) {
      console.error(e);
      setFiles([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, [activeSubTab]);

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const subTabs = [
    { id: 'mods', label: 'Mods Instalados', icon: Package },
    { id: 'resourcepacks', label: 'Resource Packs', icon: Layers },
    { id: 'shaderpacks', label: 'Shaders', icon: Sparkles }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-4">
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Categorías</h2>
            <div className="space-y-2">
              {subTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 active:scale-95 font-bold text-xs ${
                    activeSubTab === tab.id
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'hover:bg-slate-800 text-slate-400 hover:translate-x-1 border border-transparent'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeSubTab === tab.id ? 'text-emerald-400' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={`Buscar en ${activeSubTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600 font-mono"
              />
            </div>
            <button
              onClick={loadFiles}
              className="p-3 bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-all text-slate-400 hover:text-emerald-400"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden flex-1 min-h-[400px]">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center p-12 opacity-50">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                <span className="text-sm font-mono text-emerald-400">Escaneando archivos...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 opacity-50 text-center">
                <Package className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-400 mb-2">Carpeta vacía</h3>
                <p className="text-sm text-slate-500">No se encontraron archivos en la carpeta `.{activeSubTab}`</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="p-4 rounded-tl-xl">Nombre del Archivo</th>
                      <th className="p-4 w-32">Tamaño</th>
                      <th className="p-4 w-24 text-center rounded-tr-xl">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                              {activeSubTab === 'mods' ? <Package className="w-4 h-4 text-emerald-400" /> : activeSubTab === 'resourcepacks' ? <Layers className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <span className="font-mono text-sm text-slate-300 group-hover:text-emerald-300 transition-colors">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </td>
                        <td className="p-4 text-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
