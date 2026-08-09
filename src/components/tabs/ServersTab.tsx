import React, { useState } from 'react';
import { MinecraftServer } from '../../types';
import { Server, Wifi, Play, Copy, Check, Sparkles, RefreshCw, Plus } from 'lucide-react';

interface ServersTabProps {
  servers: MinecraftServer[];
  onJoinServer: (server: MinecraftServer) => void;
  onAddCustomServer: (name: string, ip: string) => void;
}

export const ServersTab: React.FC<ServersTabProps> = ({
  servers,
  onJoinServer,
  onAddCustomServer,
}) => {
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvIp, setNewSrvIp] = useState('');

  const handleCopy = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName || !newSrvIp) return;
    onAddCustomServer(newSrvName, newSrvIp);
    setNewSrvName('');
    setNewSrvIp('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <span>Servidores y Multijugador</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Lista de servidores con verificación en tiempo real de ping y jugadores en línea. Un clic para entrar directo.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Servidor</span>
        </button>
      </div>

      {/* Server List Cards */}
      <div className="space-y-4">
        {servers.map((srv) => (
          <div
            key={srv.id}
            className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <img
                src={srv.iconUrl}
                alt={srv.name}
                className="w-14 h-14 rounded-2xl bg-slate-950 p-1 border border-slate-800 object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{srv.name}</h3>
                  {srv.featured && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono border border-emerald-500/40">
                      OFICIAL
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono text-emerald-400 bg-slate-950/80 px-2.5 py-1 rounded-lg inline-flex items-center gap-2 border border-slate-800">
                  <span>{srv.ip}</span>
                  <button
                    onClick={() => handleCopy(srv.ip)}
                    className="hover:text-white"
                    title="Copiar IP"
                  >
                    {copiedIp === srv.ip ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>
                </div>

                <div className="text-xs text-slate-300 font-mono pt-1">{srv.motd}</div>
              </div>
            </div>

            {/* Right Status & Join */}
            <div className="flex items-center justify-between w-full md:w-auto gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
              <div className="text-right font-mono">
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{srv.onlinePlayers} / {srv.maxPlayers}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Ping: <strong className="text-slate-300">{srv.pingMs} ms</strong> • {srv.version}
                </div>
              </div>

              <button
                onClick={() => onJoinServer(srv)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Entrar Directo</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Server Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateServer}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <span>Agregar Servidor Personalizado</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nombre del Servidor</label>
                <input
                  type="text"
                  placeholder="Ej. Mi Servidor Survival"
                  value={newSrvName}
                  onChange={(e) => setNewSrvName(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Dirección IP / Dominio</label>
                <input
                  type="text"
                  placeholder="Ej. mc.miservidor.com"
                  value={newSrvIp}
                  onChange={(e) => setNewSrvIp(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Guardar Servidor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
