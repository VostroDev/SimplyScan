import { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import { v4 as uuidv4 } from 'uuid'
import { Loader2, Printer, FileDown, RefreshCw, Info, X, Download } from 'lucide-react'
import clsx from 'clsx'
import toast, { Toaster } from 'react-hot-toast'
import logo from './assets/logo.png'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable'
import { SortablePage } from './components/SortablePage'

interface Scanner {
  id: string
  name: string
}

interface ScannedPage {
  id: string
  image: string
  path: string
}

interface UpdateInfo {
  version: string
  releaseNotes?: string
}

interface UpdateProgress {
  percent: number
}

function App(): React.ReactElement {
  const [scanners, setScanners] = useState<Scanner[]>([])
  const [selectedScanner, setSelectedScanner] = useState<string>('')
  const [pages, setPages] = useState<ScannedPage[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update-related state
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    loadScanners()

    // Setup update event listeners
    const unsubUpdateAvailable = window.api.onUpdateAvailable((info) => {
      setUpdateInfo(info as UpdateInfo)
      setShowUpdateDialog(true)
      toast.success(`New version ${(info as UpdateInfo).version} available!`, {
        duration: 5000,
        icon: '🎉'
      })
    })

    const unsubUpdateDownloaded = window.api.onUpdateDownloaded((info) => {
      setUpdateDownloaded(true)
      setIsDownloadingUpdate(false)
      toast.success(`Update ${(info as UpdateInfo).version} ready to install!`, {
        duration: 0, // Don't auto-dismiss
        icon: '✅'
      })
    })

    const unsubUpdateProgress = window.api.onUpdateDownloadProgress((progress) => {
      setDownloadProgress((progress as UpdateProgress).percent)
    })

    const unsubUpdateError = window.api.onUpdateError((error) => {
      setIsDownloadingUpdate(false)
      toast.error(`Update error: ${error}`, {
        duration: 5000
      })
    })

    // Cleanup listeners on unmount
    return () => {
      unsubUpdateAvailable()
      unsubUpdateDownloaded()
      unsubUpdateProgress()
      unsubUpdateError()
    }
  }, [])

  const loadScanners = async (showToast = false): Promise<void> => {
    setIsRefreshing(true)
    try {
      const list = await window.api.getScanners()
      setScanners(list)
      if (list.length > 0) {
        setSelectedScanner(list[0].id)
      }
      if (showToast) {
        if (list.length > 0) {
          toast.success(`Found ${list.length} scanner${list.length > 1 ? 's' : ''}`, {
            duration: 3000,
            icon: '✓'
          })
        } else {
          toast.error('No scanners found', {
            duration: 3000,
            icon: '⚠️'
          })
        }
      }
    } catch (err) {
      console.error('Failed to load scanners', err)
      setError('Failed to load scanners. Ensure WIA is enabled.')
      if (showToast) {
        toast.error('Failed to refresh scanners', {
          duration: 3000
        })
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleScan = async (): Promise<void> => {
    if (!selectedScanner) {
      toast.error('No scanner selected. Please connect a scanner and refresh.', {
        duration: 4000,
        icon: '🖨️'
      })
      return
    }
    setIsScanning(true)
    setError(null)

    try {
      const result = await window.api.scanPage(selectedScanner)
      if (result.success && result.image) {
        setPages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            image: result.image!,
            path: result.path || ''
          }
        ])
      } else {
        setError(result.error || 'Unknown scanning error')
      }
    } catch (err) {
      setError('Failed to communicate with scanner.')
      console.error(err)
    } finally {
      setIsScanning(false)
    }
  }

  const handleDeletePage = (id: string): void => {
    setPages((prev) => prev.filter((p) => p.id !== id))
  }

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSavePDF = async (): Promise<void> => {
    if (pages.length === 0) return
    setIsSaving(true)

    try {
      const doc = new jsPDF()

      // For PDF generation with file URLs (scan://), jsPDF might need the data URL or base64.
      // Since we now use scan://, we might need to fetch the blob/base64 for jsPDF.

      for (let index = 0; index < pages.length; index++) {
        const page = pages[index]
        if (index > 0) doc.addPage()

        // Fetch the image data from the custom protocol
        const response = await fetch(page.image)
        const blob = await response.blob()
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })

        const imgProps = doc.getImageProperties(base64)
        const pdfWidth = doc.internal.pageSize.getWidth()
        const pdfHeight = doc.internal.pageSize.getHeight()

        const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height)
        const w = imgProps.width * ratio
        const h = imgProps.height * ratio
        const x = (pdfWidth - w) / 2
        const y = (pdfHeight - h) / 2

        doc.addImage(base64, 'JPEG', x, y, w, h)
      }

      doc.save(`scan-${new Date().toISOString().slice(0, 10)}.pdf`)

      // Optional: Clear pages after save or ask user?
      // For now, just notify.
    } catch (err) {
      console.error(err)
      setError('Failed to save PDF.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearSession = async (): Promise<void> => {
    if (confirm('Are you sure you want to clear all scanned pages?')) {
      setPages([])
      try {
        await window.api.cleanupSession()
      } catch (e) {
        console.error('Failed to cleanup session:', e)
      }
    }
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    setIsDownloadingUpdate(true)
    setShowUpdateDialog(false)
    toast.loading('Downloading update...', {
      duration: 0,
      id: 'update-download'
    })
    try {
      await window.api.downloadUpdate()
    } catch (error) {
      console.error('Failed to download update:', error)
      setIsDownloadingUpdate(false)
      toast.dismiss('update-download')
    }
  }

  const handleInstallUpdate = (): void => {
    window.api.installUpdate()
  }

  const handleDismissUpdate = (): void => {
    setShowUpdateDialog(false)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col text-gray-900">
      <Toaster position="top-right" />
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <Printer className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">SimplyScan</h1>
        </div>
        <div className="flex items-center gap-4">
          <select
            className="border rounded-md px-3 py-2 text-sm min-w-[200px]"
            value={selectedScanner}
            onChange={(e) => setSelectedScanner(e.target.value)}
            disabled={isScanning || scanners.length === 0}
          >
            {scanners.length === 0 && <option>No scanners found</option>}
            {scanners.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadScanners(true)}
            disabled={isRefreshing}
            className={clsx(
              'p-2 rounded-full transition-colors',
              isRefreshing ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
            )}
            title="Refresh Scanners"
          >
            <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
          </button>
          <button
            onClick={() => setShowAbout(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            title="About"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl relative">
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <img src={logo} alt="Wilteq Logo" className="h-16 object-contain" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">SimplyScan</h2>
                <p className="text-sm text-gray-500">Version 1.0.0</p>
              </div>
              <p className="text-gray-600 text-sm">
                Simple document scanning for Windows.
                <br />
                Built by Wilteq.
              </p>
              <a
                href="https://wilteq.co.za/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                wilteq.co.za
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Update Available Dialog */}
      {showUpdateDialog && updateInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Update Available</h2>
                <p className="text-gray-600 mb-4">
                  Version {updateInfo.version} is now available. Would you like to download it?
                </p>
                {updateInfo.releaseNotes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
                    {updateInfo.releaseNotes}
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleDismissUpdate}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleDownloadUpdate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Downloaded Dialog */}
      {updateDownloaded && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Update Ready</h2>
                <p className="text-gray-600 mb-4">
                  The update has been downloaded and is ready to install. The application will
                  restart to complete the installation.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setUpdateDownloaded(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleInstallUpdate}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Restart & Install
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Progress Toast */}
      {isDownloadingUpdate && downloadProgress > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 min-w-[300px] z-50">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="font-medium text-gray-800">Downloading Update</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(downloadProgress)}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">{Math.round(downloadProgress)}% complete</p>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-sm underline">
              Dismiss
            </button>
          </div>
        )}

        {pages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <Printer className="w-16 h-16 opacity-20" />
            <p className="text-lg">
              Ready to scan. Select a scanner and click &quot;Scan Page&quot;.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {pages.map((page, index) => (
                  <SortablePage
                    key={page.id}
                    id={page.id}
                    image={page.image}
                    index={index}
                    onDelete={handleDeletePage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="bg-white border-t px-6 py-4 flex items-center justify-between shrink-0">
        <div className="text-sm text-gray-500">
          {pages.length} page{pages.length !== 1 && 's'} scanned
        </div>

        <div className="flex items-center gap-3">
          {pages.length > 0 && (
            <button
              onClick={handleClearSession}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
              disabled={isScanning || isSaving}
            >
              Clear All
            </button>
          )}

          <button
            onClick={handleScan}
            disabled={isScanning}
            className={clsx(
              'flex items-center gap-2 px-6 py-2 rounded-md text-white font-medium transition-all shadow-sm',
              isScanning
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
            )}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Scan Page
              </>
            )}
          </button>

          {pages.length > 0 && (
            <button
              onClick={handleSavePDF}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm hover:shadow-md transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Save PDF
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

export default App
