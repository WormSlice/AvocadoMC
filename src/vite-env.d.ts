/// <reference types="vite/client" />

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}
interface Window { launcherAPI: {
    loginMicrosoft: () => Promise<{ success: boolean; account?: any; error?: string }>;
      loginOffline: (username?: string) => Promise<any>;
      selectFile: (options: any) => Promise<string[] | null>;
      getInstalledJavas: () => Promise<string[]>;
      getFolderContents: (folderName: string) => Promise<any[]>;
      readLocalImage: (imagePath: string) => Promise<string | null>;
      killGame: () => Promise<void>;
      openFolder: (path?: string) => Promise<void>;
      getFolderSize: (path?: string) => Promise<string>;
      playGame: (config?: any) => Promise<void>;
    onStatus: (callback: (text: string) => void) => void;
    onProgress: (callback: (data: any) => void) => void; }
}
