import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, Copy, Search, ArrowDown, Check, ShieldAlert } from 'lucide-react';
import { LogEntry, LogType } from '../../types';

interface ConsoleTabProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const ConsoleTab: React.FC<ConsoleTabProps> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, filterType, searchTerm]);

  const handleCopy = () => {
    const text = filteredLogs.map((l) => `[${l.timestamp}] [${l.type}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    // Type Filter
    if (filterType === 'GAME' && log.type !== 'GAME') return false;
    if (filterType === 'LAUNCHER' && !['STATUS', 'SYNC', 'NEOFORGE', 'JAVA'].includes(log.type)) return false;
    if (filterType === 'ERROR' && log.type !== 'ERROR') return false;

    // Search Term Filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      return log.text.toLowerCase().includes(term) || log.type.toLowerCase().includes(term);
    }
    return true;
  });

  const getTypeBadgeStyle = (type: LogType) => {
    switch (type) {
      case 'GAME':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
      case 'STATUS':
        return 'text-sky-400 bg-sky-950/80 border-sky-800';
      case 'ERROR':
        return 'text-rose-400 bg-rose-950/80 border-rose-800';
      case 'SYNC':
        return 'text-cyan-400 bg-cyan-950/80 border-cyan-800';
      case 'NEOFORGE':
        return 'text-purple-400 bg-purple-950/80 border-purple-800';
      case 'JAVA':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      case 'DEBUG':
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getTextColor = (type: LogType) => {
    switch (type) {
      case 'GAME':
        return 'text-emerald-200';
      case 'ERROR':
        return 'text-rose-300 font-semibold';
      case 'STATUS':
        return 'text-sky-200';
      case 'SYNC':
        return 'text-cyan-200';
      case 'NEOFORGE':
        return 'text-purple-200';
      case 'JAVA':
        return 'text-amber-200';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-4 bg-[#0a0d12]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/30 rounded-xl">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white uppercase tracking-wider font-mono">Consola de Registros</h1>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Registros en vivo del Launcher, descargas y ejecución del proceso de Minecraft
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            title="Copiar registros al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={onClearLogs}
            className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold font-mono flex items-center gap-1.5 border border-rose-800/80 transition-all cursor-pointer"
            title="Limpiar todos los registros"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800 shrink-0">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: `Todos (${logs.length})` },
            { id: 'GAME', label: 'Juego' },
            { id: 'LAUNCHER', label: 'Launcher' },
            { id: 'ERROR', label: `Errores (${logs.filter((l) => l.type === 'ERROR').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filterType === tab.id
                  ? tab.id === 'ERROR'
                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Auto-scroll Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono w-44 sm:w-60"
            />
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-400 font-mono select-none cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <ArrowDown className={`w-3.5 h-3.5 ${autoScroll ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Auto-scroll</span>
          </label>
        </div>
      </div>

      {/* Main Terminal Window */}
      <div
        ref={logContainerRef}
        className="flex-1 bg-[#06080b] border border-slate-800/80 rounded-xl p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 select-text scrollbar-thin scrollbar-thumb-slate-800"
      >
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/40 py-0.5 px-1 rounded transition-colors group">
              <span className="text-[10px] text-slate-500 shrink-0 select-none pt-0.5">{log.timestamp}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 border border-opacity-50 ${getTypeBadgeStyle(log.type)}`}>
                {log.type}
              </span>
              <span className={`flex-1 break-all whitespace-pre-wrap ${getTextColor(log.type)}`}>
                {log.text}
              </span>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-600" />
            <p className="text-xs">No hay registros para mostrar {searchTerm ? 'que coincidan con la búsqueda' : ''}.</p>
          </div>
        )}
      </div>
    </div>
  );
};
