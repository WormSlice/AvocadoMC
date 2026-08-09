import React from 'react';
import { Minus, Square, X, Volume2, VolumeX, ShieldCheck, UserCheck, RefreshCw, Cpu, Monitor } from 'lucide-react';
import { Account } from '../types';
import { minimizeWindow, maximizeWindow, closeWindow, isElectronEnv } from '../utils/electronBridge';
import iconImg from '../assets/images/icono.png';

interface HeaderProps {
  activeAccount: Account | undefined;
  soundEffects: boolean;
  onToggleSound: () => void;
  onOpenAccountTab: () => void;
  onSimulateRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeAccount,
  soundEffects,
  onToggleSound,
  onOpenAccountTab,
  onSimulateRefresh,
  isRefreshing,
}) => {
  const isElectron = isElectronEnv();

  return (
    <header className="h-12 bg-[#0c1014] border-b border-[#1f2933] flex items-center justify-between px-4 select-none text-xs text-slate-300 z-50">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold tracking-wide text-emerald-400">
          <img src={iconImg} alt="AvocadoMC Icon" className="w-6 h-6 object-contain drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
          <span className="text-sm font-black text-white tracking-wider">
            AVOCADO<span className="text-emerald-400">MC</span>
          </span>
        </div>
      </div>

      {/* Right: Active Account & Window Controls */}
      <div className="flex items-center gap-3">
        {activeAccount ? (
          <button
            onClick={onOpenAccountTab}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 transition-all text-slate-200 group"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border border-emerald-400/40">
              <img
                src={activeAccount.skinUrl}
                alt={activeAccount.username}
                className="w-full h-full object-cover scale-150"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-semibold leading-tight text-white group-hover:text-emerald-300 transition-colors">
                {activeAccount.username}
              </span>
              <span className="text-[9px] text-emerald-400 uppercase tracking-wider font-mono">
                {activeAccount.type}
              </span>
            </div>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
          </button>
        ) : (
          <button
            onClick={onOpenAccountTab}
            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px]"
          >
            Iniciar Sesión
          </button>
        )}

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Native Electron Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={minimizeWindow}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-all duration-150 active:scale-90"
            title="Minimizar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={maximizeWindow}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-all duration-150 active:scale-90"
            title="Maximizar"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={closeWindow}
            className="p-1.5 hover:bg-rose-600/80 text-slate-400 hover:text-white rounded transition-all duration-150 active:scale-90"
            title="Cerrar launcher"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
