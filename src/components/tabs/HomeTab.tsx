import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Instance, NewsItem, MinecraftServer, Account, LauncherSettings, LaunchProgress } from '../../types';
import { InstanceIcon } from '../InstanceIcon';
import defaultBannerImg from '../../assets/images/avocadomc_banner_1785781776564.jpg';
import liteBgImg from '../../assets/images/lite_bg.png';
import highBgImg from '../../assets/images/high_bg.png';

interface HomeTabProps {
  instances: Instance[];
  selectedInstance: Instance;
  onSelectInstance: (instance: Instance) => void;
  activeAccount: Account | undefined;
  news: NewsItem[];
  servers: MinecraftServer[];
  settings: LauncherSettings;
  onLaunchGame: () => void;
  onOpenNewInstanceModal: () => void;
  onJoinServer: (server: MinecraftServer) => void;
  isLaunching?: boolean;
  isGameRunning?: boolean;
  launchProgress?: LaunchProgress;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  instances,
  selectedInstance,
  onSelectInstance,
  onLaunchGame,
  isLaunching,
  isGameRunning,
  launchProgress,
}) => {
  const isLite = selectedInstance.modpackVersion === 'lite';
  const bgImage = isLite ? liteBgImg : highBgImg;

  return (
    <div className="h-full flex flex-col p-6 text-slate-200">
      {/* Hero Banner Section with Active Profile - Takes up all space */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl bg-slate-900 group flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.55] transition-all duration-700"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/65 to-transparent" />

        <div className="relative z-10 p-8 flex flex-col h-full">
          {/* Top badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-slate-900/80 text-slate-300 font-mono text-sm border border-slate-700/60 backdrop-blur-md">
                Minecraft {selectedInstance.minecraftVersion}
              </span>
            </div>

            {/* Quick Version Toggle Selector */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
              {instances.map((inst) => {
                const active = inst.id === selectedInstance.id;
                return (
                  <button
                    key={inst.id}
                    onClick={() => {
                        if (!isLaunching && !isGameRunning) {
                            onSelectInstance(inst);
                        }
                    }}
                    disabled={isLaunching || isGameRunning}
                    className={`px-4 py-2 rounded-lg text-sm font-bold font-mono flex items-center gap-2 transition-all ${
                      active
                        ? inst.modpackVersion === 'lite'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                    } ${(isLaunching || isGameRunning) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <InstanceIcon iconName={inst.icon} className="w-4 h-4" />
                    <span>VERSION {inst.modpackVersion.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1" />

          {/* Bottom Controls inside Hero */}
          <div className="mt-8 flex flex-col items-center justify-center gap-8 pb-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <span
                  className={`text-xs px-3 py-1 rounded font-mono font-bold uppercase ${
                    isLite
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {isLite ? 'PC Básica / Laptop (3-4GB RAM)' : 'PC Gaming / Shaders (6-8GB RAM)'}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-wide mt-2 drop-shadow-2xl flex items-center justify-center gap-4">
                <InstanceIcon iconName={selectedInstance.icon} className="w-12 h-12 text-emerald-400" />
                <span>{selectedInstance.name}</span>
              </h1>

              {/* Quick specs pill list */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                {selectedInstance.featuresSummary.map((feat, idx) => (
                  <span
                    key={idx}
                    className="text-sm bg-slate-950/80 border border-slate-800/80 px-4 py-1.5 rounded-full text-slate-200 flex items-center gap-2 font-sans shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Main PLAY / STOP Button */}
            <div className="mt-8">
              {isGameRunning ? (
                  <button
                    onClick={onLaunchGame}
                    className="px-16 py-5 rounded-2xl font-black text-2xl uppercase tracking-widest shadow-2xl transition-all transform bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-red-500/40 hover:scale-105 active:scale-95 border-b-4 border-red-700 hover:border-red-600 active:border-b-0 active:translate-y-1"
                  >
                    DETENER JUEGO
                  </button>
              ) : (
                  <button
                    onClick={onLaunchGame}
                    disabled={isLaunching}
                    className={`px-16 py-5 rounded-2xl font-black text-2xl uppercase tracking-widest shadow-2xl transition-all transform ${
                      isLaunching
                        ? 'bg-emerald-600/40 text-white/40 cursor-not-allowed border border-emerald-500/20'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-500/40 hover:scale-105 active:scale-95 border-b-4 border-emerald-700 hover:border-emerald-600 active:border-b-0 active:translate-y-1'
                    }`}
                  >
                    {isLaunching ? 'DESCARGANDO / LANZANDO...' : `JUGAR ${selectedInstance.modpackVersion.toUpperCase()}`}
                  </button>
              )}
            </div>
          </div>
        </div>

        {/* Full-width Edge-to-Edge Progress Bar at bottom of Hero Banner Container */}
        {isLaunching && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-slate-950/95 border-t border-emerald-500/40 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-mono mb-2 px-1">
              <span className="text-emerald-400 font-bold truncate max-w-[80%]">
                {launchProgress?.currentStep || 'Sincronizando modpack...'}
              </span>
              <span className="text-emerald-300 font-black text-sm">
                {launchProgress?.percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-emerald-500/30 shadow-inner">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full transition-all duration-300 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                style={{ width: `${Math.max(launchProgress?.percentage || 0, 3)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
