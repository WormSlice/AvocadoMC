import React from 'react';
import { Instance } from '../../types';
import { Layers, Plus, Trash2, Play, Star, CheckCircle2 } from 'lucide-react';
import { InstanceIcon } from '../InstanceIcon';

interface InstancesTabProps {
  instances: Instance[];
  selectedInstance: Instance;
  onSelectInstance: (instance: Instance) => void;
  onOpenNewInstanceModal: () => void;
  onRemoveInstance: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onLaunchGame: () => void;
}

export const InstancesTab: React.FC<InstancesTabProps> = ({
  instances,
  selectedInstance,
  onSelectInstance,
  onOpenNewInstanceModal,
  onRemoveInstance,
  onToggleFavorite,
  onLaunchGame,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Gestor de Instancias y Perfiles de Modpack</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cambia fácilmente entre las 2 versiones oficiales del modpack (LITE y HIGH) o crea perfiles personalizados.
          </p>
        </div>

        <button
          onClick={onOpenNewInstanceModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nueva Instancia</span>
        </button>
      </div>

      {/* Grid of Instances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {instances.map((inst) => {
          const isSelected = selectedInstance.id === inst.id;
          const isLite = inst.modpackVersion === 'lite';

          return (
            <div
              key={inst.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-slate-900/90 border-emerald-500 shadow-xl shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-inner ${
                        isLite ? 'bg-amber-950/40 border-amber-800/80' : 'bg-emerald-950/40 border-emerald-800/80'
                      }`}
                    >
                      <InstanceIcon
                        iconName={inst.icon}
                        className={`w-6 h-6 ${isLite ? 'text-amber-400' : 'text-emerald-400'}`}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white leading-snug">{inst.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        MC {inst.minecraftVersion} • <span className="uppercase text-emerald-400 font-bold">{inst.loader}</span> • <span className="text-amber-300">Versión {inst.modpackVersion?.toUpperCase()}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleFavorite(inst.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-amber-400"
                    title="Favorito"
                  >
                    <Star className={`w-4 h-4 ${inst.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>
                </div>

                {inst.featuresSummary && (
                  <div className="mt-3 space-y-1">
                    {inst.featuresSummary.map((feat, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isLite ? 'text-amber-400' : 'text-emerald-400'}`} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="block text-[9px] text-slate-500 uppercase">Mods Instalados</span>
                    <span className="font-bold text-slate-200">{inst.modsCount} mods</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="block text-[9px] text-slate-500 uppercase">Memoria RAM</span>
                    <span className="font-bold text-emerald-400">{(inst.ramMb / 1024).toFixed(1)} GB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div className="text-[10px] text-slate-500 font-mono">
                  Jugado: {inst.lastPlayed || 'Nunca'}
                </div>

                <div className="flex items-center gap-2">
                  {instances.length > 2 && (
                    <button
                      onClick={() => onRemoveInstance(inst.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200"
                      title="Eliminar instancia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isSelected ? (
                    <button
                      onClick={onLaunchGame}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>JUGAR</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectInstance(inst)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                    >
                      Seleccionar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
