import { ElectronAPI } from '@electron-toolkit/preload'

interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseName?: string
  releaseNotes?: string
}

interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getScanners: () => Promise<{ id: string; name: string }[]>
      scanPage: (
        deviceId: string
      ) => Promise<{ success: boolean; path?: string; image?: string; error?: string }>
      cleanupSession: () => Promise<{ success: boolean }>
      // Auto-updater methods
      checkForUpdates: () => Promise<{ available: boolean; info?: UpdateInfo; error?: string }>
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>
      installUpdate: () => Promise<void>
      // Auto-updater event listeners
      onUpdateChecking: (callback: () => void) => () => void
      onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void
      onUpdateNotAvailable: (callback: () => void) => () => void
      onUpdateDownloadProgress: (callback: (progress: UpdateProgress) => void) => () => void
      onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => () => void
      onUpdateError: (callback: (error: string) => void) => () => void
    }
  }
}
