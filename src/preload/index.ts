import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getScanners: () => ipcRenderer.invoke('get-scanners'),
  scanPage: (deviceId: string) => ipcRenderer.invoke('scan-page', deviceId),
  cleanupSession: () => ipcRenderer.invoke('cleanup-session'),
  savePdf: (pdfData: number[]) => ipcRenderer.invoke('save-pdf', pdfData),
  setHasUnsavedPages: (value: boolean) => ipcRenderer.send('set-has-unsaved-pages', value),
  forceClose: () => ipcRenderer.send('force-close'),
  onConfirmClose: (callback: () => void) => {
    ipcRenderer.on('confirm-close', callback)
    return () => ipcRenderer.removeListener('confirm-close', callback)
  },
  // Auto-updater APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  // Auto-updater event listeners
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update-checking', callback)
    return () => ipcRenderer.removeListener('update-checking', callback)
  },
  onUpdateAvailable: (callback: (info: unknown) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info))
    return () => ipcRenderer.removeAllListeners('update-available')
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on('update-not-available', callback)
    return () => ipcRenderer.removeListener('update-not-available', callback)
  },
  onUpdateDownloadProgress: (callback: (progress: unknown) => void) => {
    ipcRenderer.on('update-download-progress', (_, progress) => callback(progress))
    return () => ipcRenderer.removeAllListeners('update-download-progress')
  },
  onUpdateDownloaded: (callback: (info: unknown) => void) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info))
    return () => ipcRenderer.removeAllListeners('update-downloaded')
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update-error', (_, error) => callback(error))
    return () => ipcRenderer.removeAllListeners('update-error')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
