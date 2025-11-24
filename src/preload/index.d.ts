import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getScanners: () => Promise<{ id: string; name: string }[]>
      scanPage: (
        deviceId: string
      ) => Promise<{ success: boolean; path?: string; image?: string; error?: string }>
      cleanupSession: () => Promise<{ success: boolean }>
    }
  }
}
