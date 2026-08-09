import React, { useEffect, useState } from 'react';
import { Home, Users, Settings, Package, Smile, Camera, FolderOpen, Terminal, Info } from 'lucide-react';
import { LauncherTab, LaunchProgress } from '../types';

interface SidebarProps {
  activeTab: LauncherTab;
  setActiveTab: (tab: LauncherTab) => void;
  instancesCount: number;
  installedModsCount: number;
  onLaunchClick: () => void;
  isLaunching: boolean;
  launchProgress?: LaunchProgress;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  instancesCount,
  installedModsCount,
  onLaunchClick,
  isLaunching,
  launchProgress,
}) => {
  const [folderSize, setFolderSize] = useState<string>('0.00');

  useEffect(() => {
    const fetchSize = async () => {
      if (window.launcherAPI && window.launcherAPI.getFolderSize) {
        const sizeGb = await window.launcherAPI.getFolderSize('');
        setFolderSize(sizeGb);
      }
    };
    fetchSize();
  }, []);

  const navItems = [
    { id: 'home' as LauncherTab, label: 'Inicio', icon: Home, badge: null },
    { id: 'accounts' as LauncherTab, label: 'Cuentas', icon: Users, badge: null },
    { id: 'settings' as LauncherTab, label: 'Configuración', icon: Settings, badge: null },
    { id: 'mods' as LauncherTab, label: 'Mods y Texturas', icon: Package, badge: `${installedModsCount}` },
    { id: 'emotes' as LauncherTab, label: 'Emotes', icon: Smile, badge: null },
    { id: 'screenshots' as LauncherTab, label: 'Capturas', icon: Camera, badge: null },
    { id: 'console' as LauncherTab, label: 'Consola', icon: Terminal, badge: 'LIVE' },
    { id: 'info' as LauncherTab, label: 'Info', icon: Info, badge: null },
  ];

  return (
    <aside className="w-56 bg-[#0e1318] border-r border-[#1f2933] flex flex-col justify-between select-none py-3 px-2 z-40">
      {/* Top Navigation Links */}
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
          Navegación
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:translate-x-1 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-emerald-400 scale-110' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    item.id === 'servers'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isActive
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Launch & Folder Card */}
      <div className="space-y-2 pt-3 border-t border-[#1f2933]">
        <div 
          onClick={() => window.launcherAPI?.openFolder?.('')}
          className="bg-[#12181f] p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[10px] truncate max-w-[110px]">.avocadomc</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{folderSize} GB</span>
        </div>
      </div>
    </aside>
  );
};
