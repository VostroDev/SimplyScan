import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Printer, Save, Trash2, FileDown, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface Scanner {
  id: string;
  name: string;
}

interface ScannedPage {
  id: string;
  image: string;
  path: string;
}

function App(): JSX.Element {
  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [selectedScanner, setSelectedScanner] = useState<string>('');
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScanners();
  }, []);

  const loadScanners = async () => {
    try {
      const list = await window.api.getScanners();
      setScanners(list);
      if (list.length > 0) {
        setSelectedScanner(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load scanners", err);
      setError("Failed to load scanners. Ensure WIA is enabled.");
    }
  };

  const handleScan = async () => {
    if (!selectedScanner) return;
    setIsScanning(true);
    setError(null);

    try {
      const result = await window.api.scanPage(selectedScanner);
      if (result.success && result.image) {
        setPages(prev => [...prev, {
          id: uuidv4(),
          image: result.image!,
          path: result.path || ''
        }]);
      } else {
        setError(result.error || "Unknown scanning error");
      }
    } catch (err) {
      setError("Failed to communicate with scanner.");
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeletePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleSavePDF = async () => {
    if (pages.length === 0) return;
    setIsSaving(true);

    try {
      const doc = new jsPDF();
      
      pages.forEach((page, index) => {
        if (index > 0) doc.addPage();
        
        const imgProps = doc.getImageProperties(page.image);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        
        // Fit image to page while maintaining aspect ratio
        const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
        const w = imgProps.width * ratio;
        const h = imgProps.height * ratio;
        
        // Center image
        const x = (pdfWidth - w) / 2;
        const y = (pdfHeight - h) / 2;

        doc.addImage(page.image, 'JPEG', x, y, w, h);
      });

      doc.save(`scan-${new Date().toISOString().slice(0, 10)}.pdf`);
      
      // Optional: Clear pages after save or ask user?
      // For now, just notify.
    } catch (err) {
      console.error(err);
      setError("Failed to save PDF.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSession = () => {
    if (confirm("Are you sure you want to clear all scanned pages?")) {
      setPages([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
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
            {scanners.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button 
            onClick={loadScanners}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            title="Refresh Scanners"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-sm underline">Dismiss</button>
          </div>
        )}

        {pages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <Printer className="w-16 h-16 opacity-20" />
            <p className="text-lg">Ready to scan. Select a scanner and click "Scan Page".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pages.map((page, index) => (
              <div key={page.id} className="relative group bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                <div className="aspect-[1/1.41] overflow-hidden rounded-md bg-gray-100 relative">
                  <img src={page.image} alt={`Page ${index + 1}`} className="w-full h-full object-contain" />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button 
                    onClick={() => handleDeletePage(page.id)}
                    className="p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                    title="Delete Page"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 text-center text-sm text-gray-500">
                  Page {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="bg-white border-t px-6 py-4 flex items-center justify-between">
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
            disabled={isScanning || !selectedScanner}
            className={clsx(
              "flex items-center gap-2 px-6 py-2 rounded-md text-white font-medium transition-all shadow-sm",
              isScanning ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"
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
  );
}

export default App;
