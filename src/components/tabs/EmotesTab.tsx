import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Smile, Info } from 'lucide-react';

export const EmotesTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    const wv = webviewRef.current;
    if (wv) {
      const finishLoad = () => setIsLoading(false);
      wv.addEventListener('did-finish-load', finishLoad);
      return () => wv.removeEventListener('did-finish-load', finishLoad);
    }
  }, []);

  return (
    <div className="h-full flex flex-col p-8 pb-32 animate-fade-in relative overflow-hidden bg-slate-950">
      {/* Background Effect */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="relative mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl border border-emerald-500/30">
            <Smile className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 uppercase tracking-tight">
              Emotes
            </h1>
            <p className="text-slate-400 text-sm font-mono mt-1">
              Descarga emotes para usar dentro del juego con Emotecraft
            </p>
          </div>
        </div>
        
        <div className="bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 mt-4">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300 leading-relaxed">
            Explora la librería de <strong className="text-emerald-400">Redlance Emotes</strong>. 
            Cualquier emote que descargues haciendo clic en la página de abajo se guardará 
            <strong> automáticamente</strong> en tu carpeta del juego, listo para usar.
          </div>
        </div>
      </div>

      {/* Webview Container */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
            <span className="text-sm text-slate-400 font-mono animate-pulse">Cargando catálogo de emotes...</span>
          </div>
        )}
        
        <iframe
          src="https://emotes.redlance.org/emotes"
          className="flex-1 w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          title="Catálogo de Emotes"
        />
      </div>
    </div>
  );
};
