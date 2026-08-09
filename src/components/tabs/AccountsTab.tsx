import React, { useState } from 'react';
import { Account } from '../../types';
import { UserCheck, Plus, Trash2, Check, Sparkles, Upload, Copy, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ReactSkinview3d } from 'react-skinview3d';
import { WalkingAnimation } from 'skinview3d';

interface AccountsTabProps {
  accounts: Account[];
  activeAccount: Account | undefined;
  onSetActiveAccount: (acc: Account) => void;
  onRemoveAccount: (id: string) => void;
  onOpenNewAccountModal: () => void;
  onUpdateSkinUrl: (accountId: string, newSkinUrl: string) => void;
  onUpdateCapeUrl: (accountId: string, newCapeUrl?: string) => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts,
  activeAccount,
  onSetActiveAccount,
  onRemoveAccount,
  onOpenNewAccountModal,
  onUpdateSkinUrl,
  onUpdateCapeUrl,
}) => {
  const [copiedUuid, setCopiedUuid] = useState(false);
  const [customSkinInput, setCustomSkinInput] = useState('');
  const [skinNotice, setSkinNotice] = useState<string | null>(null);

  const handleCopyUuid = () => {
    if (activeAccount) {
      navigator.clipboard.writeText(activeAccount.uuid);
      setCopiedUuid(true);
      setTimeout(() => setCopiedUuid(false), 2000);
    }
  };

  const handleApplyCustomSkin = () => {
    if (!activeAccount) return;
    if (!customSkinInput.trim()) return;

    // Check if username or direct URL
    let skinUrl = customSkinInput.trim();
    if (!skinUrl.startsWith('http')) {
      skinUrl = `https://mc-heads.net/body/${skinUrl}`;
    }

    onUpdateSkinUrl(activeAccount.id, skinUrl);
    setSkinNotice('¡Skin actualizada con éxito!');
    setCustomSkinInput('');
    setTimeout(() => setSkinNotice(null), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>Gestión de Cuentas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Vincula tus cuentas oficiales de Microsoft, Mojang o usuarios locales Offline para jugar en AvocadoMC.
          </p>
        </div>

        <button
          onClick={onOpenNewAccountModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Nueva Cuenta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Cuentas Vinculadas ({accounts.length})
          </h2>

          <div className="space-y-3">
            {accounts.map((acc) => {
              const isActive = activeAccount?.id === acc.id;
              return (
                <div
                  key={acc.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center">
                        <img
                          src={acc.skinUrl?.includes('mc-heads.net/body') ? acc.skinUrl : `https://mc-heads.net/avatar/${acc.uuid}`}
                          alt={acc.username}
                          className="w-full h-full object-cover scale-125"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{acc.username}</h3>
                          {isActive && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold font-mono">
                              ACTIVA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded uppercase font-bold ${
                              acc.type === 'microsoft'
                                ? 'bg-sky-950 text-sky-400 border border-sky-800'
                                : acc.type === 'mojang'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {acc.type}
                          </span>
                          <span>• {acc.lastUsed}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isActive && (
                        <button
                          onClick={() => onSetActiveAccount(acc)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 text-xs font-semibold"
                        >
                          Usar
                        </button>
                      )}

                      <button
                        onClick={() => onRemoveAccount(acc.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition-colors"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Account Detail & Skin/Cape Customizer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeAccount ? (
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 space-y-6">
              {/* Account Header */}
              <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-800 pb-6">
                <div className="bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden group h-[250px]">
                  <div className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold border border-emerald-500/30 z-10">
                    3D
                  </div>
                  <ReactSkinview3d
                    className="h-full w-full object-contain cursor-grab active:cursor-grabbing"
                    skinUrl={activeAccount.skinUrl?.includes('mc-heads.net/body') ? `https://crafatar.com/skins/${activeAccount.uuid}` : (activeAccount.skinUrl || `https://crafatar.com/skins/${activeAccount.uuid}`)}
                    capeUrl={activeAccount.capeUrl || `https://crafatar.com/capes/${activeAccount.uuid}`}
                    height={250}
                    width={200}
                    onReady={({ viewer }) => {
                      viewer.autoRotate = true;
                      viewer.autoRotateSpeed = 0.5;
                      viewer.animation = new WalkingAnimation();
                    }}
                  />
                </div>

                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs text-emerald-400 font-mono uppercase font-bold">Perfil Activo</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white">{activeAccount.username}</h2>
                  </div>

                  {/* UUID & Type Details */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-slate-500">UUID:</span>
                      <span className="bg-slate-950 px-2 py-1 rounded text-slate-300 border border-slate-800 text-[11px]">
                        {activeAccount.uuid}
                      </span>
                      <button
                        onClick={handleCopyUuid}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Copiar UUID"
                      >
                        {copiedUuid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {activeAccount.email && (
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-slate-500">Correo:</span>
                        <span className="text-slate-300">{activeAccount.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 text-xs font-semibold border border-emerald-800/80 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Sesión Válida (Token OAuth)
                    </span>
                  </div>
                </div>
              </div>

              {/* Skin Customizer Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Personalizar Aspecto / Skin
                </h3>

                {skinNotice && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700 text-xs font-semibold">
                    {skinNotice}
                  </div>
                )}

                {/* Custom Skin Input */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={async () => {
                      if (window.launcherAPI?.selectFile) {
                        const fileBase64 = await window.launcherAPI.selectFile({ filters: [{ name: 'Skins', extensions: ['png'] }] });
                        if (fileBase64) {
                          onUpdateSkinUrl(activeAccount.id, fileBase64);
                          setSkinNotice('Skin local aplicada.');
                        }
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar Local</span>
                  </button>
                  <input
                    type="text"
                    placeholder="URL de skin .png"
                    value={customSkinInput}
                    onChange={(e) => setCustomSkinInput(e.target.value)}
                    className="flex-1 bg-slate-950 text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    onClick={handleApplyCustomSkin}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Aplicar URL</span>
                  </button>
                </div>
              </div>

              {/* Capes Manager */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Capas Oficiales ({activeAccount.capes?.length || 0})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateCapeUrl(activeAccount.id, undefined)}
                    className={`p-3 rounded-xl border text-xs text-left flex items-center justify-between transition-all ${
                      !activeAccount.capeUrl
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span>Sin Capa</span>
                    {!activeAccount.capeUrl && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  {activeAccount.capes?.map((cape) => (
                    <button
                      key={cape.id}
                      onClick={() => onUpdateCapeUrl(activeAccount.id, cape.url)}
                      className={`p-3 rounded-xl border text-xs text-left flex items-center justify-between transition-all ${
                        activeAccount.capeUrl === cape.url
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span className="truncate pr-2">Capa {cape.alias}</span>
                      {activeAccount.capeUrl === cape.url && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-slate-800 text-slate-400 space-y-3">
              <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No hay ninguna cuenta seleccionada</h3>
              <p className="text-xs max-w-sm mx-auto">
                Selecciona una de las cuentas de la lista o agrega una nueva cuenta para comenzar a jugar.
              </p>
              <button
                onClick={onOpenNewAccountModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                + Agregar Cuenta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
