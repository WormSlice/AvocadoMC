export type LauncherTab = 'home' | 'accounts' | 'mods' | 'emotes' | 'screenshots' | 'settings' | 'console' | 'info';

export type AccountType = 'microsoft' | 'mojang' | 'offline';

export interface Account {
  id: string;
  username: string;
  uuid: string;
  type: AccountType;
  skinUrl: string;
  capeUrl?: string;
  capes?: { id: string, state: string, url: string, alias: string }[];
  active: boolean;
  email?: string;
  lastUsed: string;
}

export type ModpackVersion = 'lite' | 'high';

export interface Instance {
  id: string;
  name: string;
  modpackVersion: ModpackVersion;
  minecraftVersion: string;
  loader: LoaderType;
  loaderVersion?: string;
  icon: string; // Lucide icon identifier e.g. 'Zap', 'Sparkles'
  ramMb: number;
  lastPlayed?: string;
  totalPlayTimeMinutes: number;
  modsCount: number;
  isFavorite?: boolean;
  customJvmArgs?: string;
  recommendedRamGb: number;
  featuresSummary: string[];
}

export interface Mod {
  id: string;
  name: string;
  author: string;
  description: string;
  downloads: string;
  version: string;
  loader: LoaderType[];
  categories: string[];
  iconUrl: string;
  installed?: boolean;
}

export interface MinecraftServer {
  id: string;
  name: string;
  ip: string;
  motd: string;
  version: string;
  onlinePlayers: number;
  maxPlayers: number;
  pingMs: number;
  iconUrl: string;
  featured?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  category: 'Actualización' | 'Evento' | 'Servidor' | 'Comunidad';
  date: string;
  summary: string;
  imageUrl: string;
  readTime: string;
}

export interface ScreenshotItem {
  id: string;
  title: string;
  instanceName: string;
  date: string;
  imageUrl: string;
  resolution: string;
}

export interface LauncherSettings {
  // Java & Memory
  ramMb: number;
  javaPath: string;
  jvmFlagsPreset: 'aikar' | 'balanced' | 'performance' | 'custom';
  customJvmFlags: string;

  // Display & Game
  resolutionWidth: number;
  resolutionHeight: number;
  fullscreen: boolean;
  gameDir: string;
  discordRpc: boolean;
  autoConnectServerIp: string;

  // Behavior & Theme
  theme: 'avocado-dark' | 'emerald-midnight' | 'obsidian-gold' | 'creamy-light';
  postLaunchBehavior: 'hide' | 'close' | 'keep';
  language: 'es' | 'en' | 'pt';
  enableBetaUpdates: boolean;
  soundEffects: boolean;

  // Download & Network
  downloadThreads: number;
  selectedCdn: 'official' | 'avocado-fast' | 'cloudflare';
  useProxy: boolean;
  proxyAddress: string;

  // Electron & Desktop Integration
  electronHardwareAccel: boolean;
  electronCloseToTray: boolean;
  electronAutoLaunch: boolean;
}

export type LaunchStatus = 'idle' | 'preparing' | 'downloading' | 'verifying' | 'launching' | 'running';

export interface LaunchProgress {
  status: LaunchStatus;
  percentage: number;
  currentStep: string;
  logs: string[];
}

export type LogType = 'STATUS' | 'GAME' | 'JAVA' | 'NEOFORGE' | 'SYNC' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  text: string;
}

declare global {
  interface Window {
    launcherAPI?: {
      loginMicrosoft: () => Promise<any>;
      loginOffline: (username: string) => Promise<any>;
      selectFile: (options: any) => Promise<string | null>;
      getInstalledJavas: () => Promise<string[]>;
      getFolderContents: (folderName: string) => Promise<any[]>;
      readLocalImage: (imagePath: string) => Promise<string | null>;
      killGame: () => Promise<void>;
      openFolder: (path?: string) => Promise<void>;
      getFolderSize: (path?: string) => Promise<string>;
      playGame: (config: any) => Promise<void>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      getLogs: () => Promise<LogEntry[]>;
      clearLogs: () => Promise<boolean>;
      onProgress: (callback: (data: any) => void) => void;
      onStatus: (callback: (text: string) => void) => void;
      onLog: (callback: (entry: LogEntry) => void) => void;
    };
  }
}
