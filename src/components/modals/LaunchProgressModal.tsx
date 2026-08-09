import React, { useEffect, useState } from 'react';
import { LaunchProgress, Instance } from '../../types';
import { Terminal, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LaunchProgressModalProps {
  isOpen: boolean;
  progress: LaunchProgress;
  instance: Instance;
  onCancel: () => void;
}

export const LaunchProgressModal: React.FC<LaunchProgressModalProps> = ({
  isOpen,
  progress,
  instance,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-xl">
              {instance.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lanzando {instance.name}</h2>
              <p className="text-xs text-slate-400 font-mono">
                Minecraft {instance.minecraftVersion} • {instance.loader.toUpperCase()}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
            {progress.percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold">{progress.currentStep}</span>
            <span className="text-emerald-400">{progress.percentage}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 transition-all duration-300 rounded-full"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Console Log Window */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 font-mono text-[11px] h-48 overflow-y-auto space-y-1 text-slate-300 select-text">
          <div className="text-emerald-500 font-bold">
            [AVOCADO-JVM] Iniciando secuencia de lanzamiento de Minecraft...
          </div>
          {progress.logs.map((log, index) => (
            <div key={index} className="text-slate-300">
              <span className="text-slate-600">[LOG]</span> {log}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verificando hashes SHA-256 de assets</span>
          </div>

          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-bold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
