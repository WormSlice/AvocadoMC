import React, { useState, useEffect } from 'react';
import {
  LauncherTab,
  Account,
  Instance,
  Mod,
  MinecraftServer,
  NewsItem,
  ScreenshotItem,
  LauncherSettings,
  LaunchProgress,
  LogEntry,
} from './types';
import {
  initialAccounts,
  initialInstances,
  initialMods,
  initialServers,
  initialNews,
  initialScreenshots,
  defaultSettings,
} from './data/initialData';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomeTab } from './components/tabs/HomeTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { InstancesTab } from './components/tabs/InstancesTab';
import { ModsTab } from './components/tabs/ModsTab';
import { EmotesTab } from './components/tabs/EmotesTab';
import { ScreenshotsTab } from './components/tabs/ScreenshotsTab';
import { ConsoleTab } from './components/tabs/ConsoleTab';
import { InfoTab } from './components/tabs/InfoTab';

import { NewAccountModal } from './components/modals/NewAccountModal';
import { NewInstanceModal } from './components/modals/NewInstanceModal';
import { LaunchProgressModal } from './components/modals/LaunchProgressModal';
import { MinecraftGameModal } from './components/modals/MinecraftGameModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<LauncherTab>('home');

  // Application Data States
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('avocadomc_accounts');
    return saved ? JSON.parse(saved) : initialAccounts;
  });

  useEffect(() => {
    localStorage.setItem('avocadomc_accounts', JSON.stringify(accounts));
  }, [accounts]);
  const [instances, setInstances] = useState<Instance[]>(initialInstances);
  const [selectedInstance, setSelectedInstance] = useState<Instance>(initialInstances[0]);
  const [mods, setMods] = useState<Mod[]>(initialMods);
  const [servers, setServers] = useState<MinecraftServer[]>(initialServers);
  const [news] = useState<NewsItem[]>(initialNews);
  const [screenshots] = useState<ScreenshotItem[]>(initialScreenshots);
  const [settings, setSettings] = useState<LauncherSettings>(defaultSettings);

  // Modals & Launch States
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isNewInstanceModalOpen, setIsNewInstanceModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverToJoinDirectly, setServerToJoinDirectly] = useState<MinecraftServer | null>(null);

  // Launch Simulation State
  const [isLaunching, setIsLaunching] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [launchProgress, setLaunchProgress] = useState<LaunchProgress>({
    status: 'idle',
    percentage: 0,
    currentStep: 'Iniciando...',
    logs: [],
  });

  // Active Account Helper
  const activeAccount = accounts.find((a) => a.active);

  // Sync with backend on startup
  useEffect(() => {
    if (activeAccount && activeAccount.type === 'offline') {
      window.launcherAPI?.loginOffline(activeAccount.username).catch(console.error);
    }
  }, []);

  // Sound effects toggle
  const handleToggleSound = () => {
    setSettings((prev) => ({ ...prev, soundEffects: !prev.soundEffects }));
  };

  // Sync / Refresh Simulation
  const handleSimulateRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  // Account Handlers
  const handleSetActiveAccount = async (accToActivate: Account) => {
    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        active: a.id === accToActivate.id,
      }))
    );
    // Tell backend about the account change so it can login
    if (accToActivate.type === 'offline') {
      await window.launcherAPI?.loginOffline(accToActivate.username);
    }
    // Note: Microsoft re-auth might be needed if token expired, 
    // but for now we just rely on the backend's currentAuth or require re-login.
  };

  const handleAddAccount = (newAcc: Account) => {
    setAccounts((prev) => [
      ...prev.map((a) => ({ ...a, active: false })),
      { ...newAcc, active: true },
    ]);
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateSkinUrl = (accountId: string, newSkinUrl: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, skinUrl: newSkinUrl } : a))
    );
  };

  const handleUpdateCapeUrl = (accountId: string, newCapeUrl?: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, capeUrl: newCapeUrl } : a))
    );
  };

  // Instance Handlers
  const handleCreateInstance = (newInst: Instance) => {
    setInstances((prev) => [newInst, ...prev]);
    setSelectedInstance(newInst);
  };

  const handleRemoveInstance = (id: string) => {
    setInstances((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      if (selectedInstance.id === id && filtered.length > 0) {
        setSelectedInstance(filtered[0]);
      }
      return filtered;
    });
  };

  const handleToggleFavoriteInstance = (id: string) => {
    setInstances((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isFavorite: !i.isFavorite } : i))
    );
  };

  // Mods Handlers
  const handleToggleInstallMod = (modId: string) => {
    setMods((prev) =>
      prev.map((m) => {
        if (m.id === modId) {
          const nextInstalled = !m.installed;
          // Update selected instance mod count
          setInstances((instPrev) =>
            instPrev.map((i) =>
              i.id === selectedInstance.id
                ? { ...i, modsCount: Math.max(0, i.modsCount + (nextInstalled ? 1 : -1)) }
                : i
            )
          );
          return { ...m, installed: nextInstalled };
        }
        return m;
      })
    );
  };

  // Settings Handlers
  const handleUpdateSettings = (newPartial: Partial<LauncherSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
  };

  // Server Handlers
  const handleAddCustomServer = (name: string, ip: string) => {
    const newSrv: MinecraftServer = {
      id: `srv-${Date.now()}`,
      name,
      ip,
      motd: `§aServidor Personalizado §7- ${ip}`,
      version: selectedInstance.minecraftVersion,
      onlinePlayers: Math.floor(Math.random() * 200) + 10,
      maxPlayers: 500,
      pingMs: Math.floor(Math.random() * 30) + 15,
      iconUrl: `https://picsum.photos/seed/${name}/128/128`,
      featured: false,
    };
    setServers((prev) => [newSrv, ...prev]);
  };

  const handleJoinServerDirectly = (server: MinecraftServer) => {
    setServerToJoinDirectly(server);
    startLaunchSequence();
  };

  // Console Logs State
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);

  const handleClearConsoleLogs = async () => {
    if (window.launcherAPI?.clearLogs) {
      await window.launcherAPI.clearLogs();
    }
    setConsoleLogs([]);
  };

  useEffect(() => {
    if (window.launcherAPI) {
      if (window.launcherAPI.getLogs) {
        window.launcherAPI.getLogs().then((existing) => {
          if (existing && Array.isArray(existing)) {
            setConsoleLogs(existing);
          }
        }).catch(console.error);
      }

      if (window.launcherAPI.onLog) {
        window.launcherAPI.onLog((entry: LogEntry) => {
          setConsoleLogs((prev) => [...prev, entry]);
        });
      }

      window.launcherAPI.onStatus((text: string) => {
        setLaunchProgress((prev) => {
          // Si el texto indica que el juego cerró, limpiamos el estado
          if (text.includes('Juego cerrado') || text.includes('Error')) {
            setIsLaunching(false);
            setIsGameRunning(false);
          }
          return {
            ...prev,
            currentStep: text,
            logs: [...prev.logs, `[STATUS] ${text}`],
          };
        });
      });

      window.launcherAPI.onProgress((data: any) => {
        setLaunchProgress((prev) => {
          let percentage = prev.percentage;
          if (typeof data === 'number') {
            percentage = data;
          } else if (data && typeof data.percent === 'number') {
            percentage = data.percent;
          } else if (data && data.total) {
            percentage = Math.round((data.task / data.total) * 100);
          }
          return {
            ...prev,
            status: 'downloading',
            percentage: percentage,
            currentStep: prev.currentStep,
          };
        });
      });
    }
  }, []);

  // Launch Sequence
  const startLaunchSequence = async () => {
    setIsLaunching(true);
    setLaunchProgress({
      status: 'preparing',
      percentage: 0,
      currentStep: 'Iniciando preparativos...',
      logs: ['[INIT] Conectando con Electron...'],
    });

    try {
      await window.launcherAPI.playGame({
        ramMb: settings.ramMb,
        javaPath: settings.javaPath,
        modpackVersion: selectedInstance.modpackVersion,
        customJvmArgs: settings.customJvmFlags,
        account: activeAccount,
      });
    } catch (err: any) {
      setLaunchProgress((prev) => ({
        ...prev,
        status: 'idle',
        currentStep: `Error al lanzar: ${err?.message || err}`,
        logs: [...prev.logs, `[ERROR] ${err?.message || err}`],
      }));
      setIsLaunching(false);
    }
  };

  const handleLaunchGame = () => {
    if (isGameRunning) {
      window.launcherAPI?.killGame();
      setIsGameRunning(false);
      setIsLaunching(false);
      return;
    }
    startLaunchSequence();
  };

  // Theme Determination
  const themeClass =
    settings.theme === 'light'
      ? 'bg-slate-100 text-slate-900'
      : settings.theme === 'emerald'
      ? 'bg-emerald-950 text-slate-100'
      : 'bg-[#0b0f14] text-slate-100';

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans ${themeClass} select-none`}>
      {/* Top Header */}
      <Header
        activeAccount={activeAccount}
        soundEffects={settings.soundEffects}
        onToggleSound={handleToggleSound}
        onOpenAccountTab={() => setActiveTab('accounts')}
        onSimulateRefresh={handleSimulateRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          installedModsCount={mods.filter((m) => m.installed).length}
          instancesCount={instances.length}
          activeAccountUsername={activeAccount?.username}
          onLaunchClick={startLaunchSequence}
          isLaunching={isLaunching}
          launchProgress={launchProgress}
        />

        {/* Central Content View */}
        <main key={activeTab} className="flex-1 flex flex-col overflow-hidden bg-[#0a0d12] animate-tab-fade">
          {activeTab === 'home' && (
            <HomeTab
              instances={instances}
              selectedInstance={selectedInstance}
              onSelectInstance={setSelectedInstance}
              activeAccount={activeAccount}
              news={news}
              servers={servers}
              settings={settings}
              onLaunchGame={handleLaunchGame}
              onOpenNewInstanceModal={() => setIsNewInstanceModalOpen(true)}
              onJoinServer={handleJoinServerDirectly}
              isLaunching={isLaunching}
              isGameRunning={isGameRunning}
              launchProgress={launchProgress}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsTab
              accounts={accounts}
              activeAccount={activeAccount}
              onSetActiveAccount={handleSetActiveAccount}
              onRemoveAccount={handleRemoveAccount}
              onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)}
              onUpdateSkinUrl={handleUpdateSkinUrl}
              onUpdateCapeUrl={handleUpdateCapeUrl}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetSettings={handleResetSettings}
            />
          )}

          {activeTab === 'mods' && (
            <ModsTab
              mods={mods}
              selectedInstance={selectedInstance}
              onToggleInstallMod={handleToggleInstallMod}
            />
          )}

          {activeTab === 'emotes' && (
            <EmotesTab />
          )}

          {activeTab === 'screenshots' && <ScreenshotsTab screenshots={screenshots} />}

          {activeTab === 'console' && (
            <ConsoleTab logs={consoleLogs} onClearLogs={handleClearConsoleLogs} />
          )}

          {activeTab === 'info' && <InfoTab />}
        </main>
      </div>

      {/* Modals */}
      <NewAccountModal
        isOpen={isNewAccountModalOpen}
        onClose={() => setIsNewAccountModalOpen(false)}
        onAddAccount={handleAddAccount}
      />

      <NewInstanceModal
        isOpen={isNewInstanceModalOpen}
        onClose={() => setIsNewInstanceModalOpen(false)}
        onCreateInstance={handleCreateInstance}
      />
    </div>
  );
}
