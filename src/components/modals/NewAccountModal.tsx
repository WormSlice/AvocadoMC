import React, { useState } from 'react';
import { Account, AccountType } from '../../types';
import { X, UserCheck, ShieldCheck, Key, Sparkles, CheckCircle2, QrCode } from 'lucide-react';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (acc: Account) => void;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
}) => {
  const [accountType, setAccountType] = useState<AccountType>('microsoft');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [msCode, setMsCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartMicrosoftAuth = async () => {
    setIsAuthenticating(true);
    try {
      const result = await window.launcherAPI.loginMicrosoft();
      if (result && result.success && result.account) {
        const newAcc: Account = {
          id: `acc-${Date.now()}`,
          username: result.account.username,
          uuid: result.account.uuid,
          type: 'microsoft',
          skinUrl: result.account.skinUrl,
          capes: result.account.capes,
          active: true,
          email: result.account.email || 'usuario.microsoft@outlook.com',
          lastUsed: 'Ahora mismo',
        };

        onAddAccount(newAcc);
        onClose();
      } else {
        console.error("Microsoft login failed:", result?.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCreateOfflineAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      const result = await window.launcherAPI.loginOffline(username.trim());
      if (result && result.success && result.account) {
        const newAcc: Account = {
          id: `acc-${Date.now()}`,
          username: result.account.username,
          uuid: result.account.uuid,
          type: 'offline',
          skinUrl: result.account.skinUrl,
          active: true,
          lastUsed: 'Ahora mismo',
        };

        onAddAccount(newAcc);
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-modal-pop">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Vincular Nueva Cuenta</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="p-4 grid grid-cols-3 gap-2 bg-slate-950/60 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setAccountType('microsoft')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
              accountType === 'microsoft'
                ? 'bg-sky-950/80 border-sky-500 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Microsoft</span>
          </button>

          <button
            onClick={() => setAccountType('offline')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
              accountType === 'offline'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Offline / Local</span>
          </button>

            <button
              onClick={() => setAccountType('mojang')}
              className={`flex-1 py-3 px-4 rounded-xl flex flex-col items-center gap-2 border transition-all ${
                accountType === 'mojang'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
              }`}
            >
              <Key size={20} />
              <span className="text-sm font-medium">QuarklCloud</span>
            </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {accountType === 'microsoft' && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Inicia sesión de forma segura con la autenticación oficial de Microsoft Xbox OAuth.
              </p>

              {isAuthenticating ? (
                <div className="bg-slate-950 p-6 rounded-xl border border-sky-500/40 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
                  <div className="text-sm font-bold text-white">Esperando autenticación de Microsoft...</div>
                  {msCode && (
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-sky-400 font-bold text-sm tracking-widest">
                      CÓDIGO: {msCode}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Sincronizando licencia oficial de Minecraft Java Edition...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Nombre de Usuario o Gamertag (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan_Pro2026"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950 text-white rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Correo de Microsoft</label>
                    <input
                      type="email"
                      placeholder="ejemplo@outlook.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 text-white rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    onClick={handleStartMicrosoftAuth}
                    className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Iniciar Sesión en Microsoft</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {accountType === 'offline' && (
            <form onSubmit={handleCreateOfflineAccount} className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Crea un nombre de usuario local para jugar sin conexión a internet o en servidores no-premium.
              </p>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Nombre de Usuario Offline</label>
                <input
                  type="text"
                  placeholder="Ej. Avocado_Player99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 text-white font-bold rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
              >
                <UserCheck className="w-4 h-4" />
                <span>Crear Cuenta Offline</span>
              </button>
            </form>
          )}

          {accountType === 'mojang' && (
            <div className="p-6">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-4 text-amber-200">
                <Sparkles className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-400 mb-1">Próximamente</h4>
                  <p className="text-sm opacity-90 leading-relaxed">
                    El sistema de cuentas QuarklCloud está en desarrollo. Pronto podrás iniciar sesión con este método.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
