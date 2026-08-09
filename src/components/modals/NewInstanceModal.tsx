import React, { useState } from 'react';
import { Instance, LoaderType } from '../../types';
import { X, Layers, Plus, Sparkles, Cpu } from 'lucide-react';
import { InstanceIcon } from '../InstanceIcon';

interface NewInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateInstance: (instance: Instance) => void;
}

const LUCIDE_ICON_OPTIONS = ['Zap', 'Sparkles', 'Shield', 'Layers', 'Box', 'Flame', 'Cpu', 'Terminal', 'Star', 'Folder', 'Wifi', 'Camera'];

export const NewInstanceModal: React.FC<NewInstanceModalProps> = ({
  isOpen,
  onClose,
  onCreateInstance,
}) => {
  const [name, setName] = useState('');
  const [mcVersion, setMcVersion] = useState('1.21.1');
  const [loader, setLoader] = useState<LoaderType>('neoforge');
  const [icon, setIcon] = useState('Zap');
  const [ramMb, setRamMb] = useState(6144);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newInst: Instance = {
      id: `inst-${Date.now()}`,
      name: name.trim(),
      minecraftVersion: mcVersion,
      loader: loader,
      icon: icon,
      ramMb: ramMb,
      lastPlayed: 'Creado recientemente',
      totalPlayTimeMinutes: 0,
      modsCount: 0,
      isFavorite: false,
    };

    onCreateInstance(newInst);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col space-y-4 p-6 animate-modal-pop"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Crear Nueva Instancia de Minecraft</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Icon picker */}
          <div>
            <label className="text-slate-400 block mb-1">Ícono de la Instancia</label>
            <div className="flex flex-wrap gap-2">
              {LUCIDE_ICON_OPTIONS.map((iconKey) => (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => setIcon(iconKey)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                    icon === iconKey
                      ? 'bg-emerald-950 border-emerald-500 scale-110 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <InstanceIcon iconName={iconKey} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Nombre de la Instancia</label>
            <input
              type="text"
              placeholder="Ej. Mi Mundo Fabric 1.20.4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 text-white font-bold rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Version & Loader */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Versión de Minecraft</label>
              <select
                value={mcVersion}
                onChange={(e) => setMcVersion(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono font-bold"
              >
                <option value="1.21.1">1.21.1 (Tricky Trials)</option>
                <option value="1.20.4">1.20.4 (Trails & Tales)</option>
                <option value="1.20.1">1.20.1 (Estable Mods)</option>
                <option value="1.16.5">1.16.5 (Nether Update)</option>
                <option value="1.8.9">1.8.9 (PvP Clásico)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Cargador de Mods (Loader)</label>
              <select
                value={loader}
                onChange={(e) => setLoader(e.target.value as LoaderType)}
                className="w-full bg-slate-950 text-slate-200 rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono font-bold uppercase"
              >
                <option value="fabric">Fabric (Rendimiento)</option>
                <option value="forge">Forge (Gran biblioteca)</option>
                <option value="quilt">Quilt (Modular)</option>
                <option value="neoforge">NeoForge (Moderno)</option>
                <option value="vanilla">Vanilla (Sin mods)</option>
              </select>
            </div>
          </div>

          {/* RAM Allocation for this instance */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Memoria RAM dedicada</span>
              <span className="font-mono text-emerald-400 font-bold">{(ramMb / 1024).toFixed(1)} GB</span>
            </div>
            <input
              type="range"
              min="2048"
              max="16384"
              step="1024"
              value={ramMb}
              onChange={(e) => setRamMb(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Instancia</span>
          </button>
        </div>
      </form>
    </div>
  );
};
