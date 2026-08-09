import React, { useState, useEffect } from 'react';
import { Account, Instance, MinecraftServer } from '../../types';
import { Play, Volume2, VolumeX, Maximize, X, Shield, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface MinecraftGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: Instance;
  account: Account | undefined;
  serverToJoin?: MinecraftServer | null;
}

export const MinecraftGameModal: React.FC<MinecraftGameModalProps> = ({
  isOpen,
  onClose,
  instance,
  account,
  serverToJoin,
}) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'multiplayer'>('menu');
  const [blocksMined, setBlocksMined] = useState(0);
  const [fps, setFps] = useState(240);
  const [selectedBlock, setSelectedBlock] = useState('🥑 Block');

  useEffect(() => {
    if (serverToJoin) {
      setGameState('playing');
    } else {
      setGameState('menu');
    }
  }, [serverToJoin]);

  // Simulate FPS fluctuation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setFps(230 + Math.floor(Math.random() * 25));
    }, 1500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-2 sm:p-6 select-none animate-fade-in">
      {/* Minecraft Window Container */}
      <div className="w-full max-w-5xl h-[85vh] bg-[#121212] border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col relative font-mono">
        {/* Window Bar */}
        <div className="h-8 bg-[#1e1e1e] border-b border-slate-800 px-3 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-200">
              Minecraft {instance.minecraftVersion} - Avocado Client ({instance.loader.toUpperCase()})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-emerald-400">
            <span>FPS: {fps} (Sodium + Iris Shaders)</span>
            <button
              onClick={onClose}
              className="px-2 py-0.5 rounded bg-rose-900/80 hover:bg-rose-700 text-white font-bold"
              title="Cerrar juego y volver al launcher"
            >
              CERRAR JUEGO (ESC)
            </button>
          </div>
        </div>

        {/* Game Canvas / Dirt Background */}
        <div
          className="flex-1 relative flex flex-col items-center justify-center bg-repeat"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(16,30,20,0.85) 0%, rgba(8,12,10,0.98) 100%), url('https://picsum.photos/seed/mcdirt/400/400')`,
            backgroundSize: '128px',
          }}
        >
          {gameState === 'menu' && (
            <div className="flex flex-col items-center justify-center space-y-6 max-w-md w-full px-4 text-center z-10">
              {/* Title Logo */}
              <div className="space-y-1">
                <div className="text-4xl sm:text-5xl font-black text-amber-400 tracking-wider drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] border-b-4 border-amber-600 pb-1">
                  MINECRAFT
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono tracking-widest uppercase bg-slate-950/80 px-3 py-1 rounded-md border border-emerald-500/50 inline-block shadow-lg">
                  🥑 AVOCADO EDITION {instance.minecraftVersion}
                </div>
              </div>

              {/* Main Menu Buttons */}
              <div className="w-full space-y-2.5 pt-4">
                <button
                  onClick={() => setGameState('playing')}
                  className="w-full py-3 bg-[#4a6b32] hover:bg-[#5a823d] border-2 border-[#73a34f] text-white font-bold text-sm shadow-md active:translate-y-0.5 transition-all"
                >
                  UN JUGADOR (Mundo Survival)
                </button>

                <button
                  onClick={() => setGameState('playing')}
                  className="w-full py-3 bg-[#2e5c3e] hover:bg-[#386e4b] border-2 border-[#488e61] text-emerald-200 font-bold text-sm shadow-md active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>UNIRSE A AVOCADO NETWORK SMP</span>
                </button>

                <button
                  onClick={() => alert('Abriendo Opciones de Minecraft...')}
                  className="w-full py-2.5 bg-[#3c3c3c] hover:bg-[#4d4d4d] border-2 border-[#5c5c5c] text-slate-200 font-bold text-xs"
                >
                  OPCIONES Y SHADERS
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-[#522929] hover:bg-[#6e3737] border-2 border-[#8a4545] text-rose-200 font-bold text-xs"
                >
                  SALIR DEL JUEGO
                </button>
              </div>

              {/* Player Tag */}
              <div className="text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded border border-slate-800">
                Jugando como: <strong className="text-emerald-400">{account ? account.username : 'Jugador'}</strong>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="flex flex-col items-center justify-between h-full w-full p-6 z-10 text-center">
              {/* Top HUD */}
              <div className="flex items-center justify-between w-full bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">🥑 Avocado SMP</span>
                  <span>|</span>
                  <span>Coordenadas: X: 142 Y: 68 Z: -890</span>
                </div>
                <div className="text-amber-400 font-bold">Bloques Minados: {blocksMined}</div>
              </div>

              {/* Interactive Block World Simulation */}
              <div className="flex flex-col items-center justify-center my-auto space-y-4">
                <div
                  onClick={() => setBlocksMined((prev) => prev + 1)}
                  className="w-40 h-40 bg-gradient-to-br from-emerald-600 via-green-700 to-emerald-950 border-4 border-emerald-400 rounded-2xl shadow-2xl flex flex-col items-center justify-center cursor-pointer transform hover:scale-105 active:scale-95 transition-all select-none group"
                >
                  <span className="text-6xl group-hover:rotate-12 transition-transform">🥑</span>
                  <span className="text-xs font-bold text-emerald-200 mt-2">¡Haz Clic para Minar!</span>
                </div>
                <p className="text-xs text-slate-300 bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-800">
                  Simulación activa de juego en tiempo real • Shaders activados
                </p>
              </div>

              {/* Bottom HUD / Hotbar */}
              <div className="flex items-center gap-2 bg-slate-950/90 p-2 rounded-xl border border-slate-800">
                {['🥑 Bloque', '🗡️ Espada', '⛏️ Pico', '🍎 Manzana Golden', '🏹 Arco', '🛡️ Escudo'].map((item, idx) => (
                  <button
                    key={item}
                    onClick={() => setSelectedBlock(item)}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                      selectedBlock === item
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-slate-500 text-[9px] block">[{idx + 1}]</span>
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
