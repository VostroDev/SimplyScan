# SimplyScan 🖨️

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)
![Electron](https://img.shields.io/badge/electron-38.1.2-47848f.svg)
![React](https://img.shields.io/badge/react-19.1.1-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.9.2-3178c6.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A modern, lightweight, and efficient desktop application for scanning documents on Windows. Built with **Electron**, **React**, and **WIA (Windows Image Acquisition)** integration.

<p align="center">
  <img src="resources/icon.png" alt="SimplyScan Logo" width="200"/>
</p>

## ✨ Features

*   **🔌 Auto-Detection:** Automatically detects connected scanners using Windows Image Acquisition (WIA).
*   **⚡ Fast Scanning:** Quick scanning directly from the application interface.
*   **📂 PDF Generation:** Compiles multiple scanned pages into a single, high-quality PDF document.
*   **🖱️ Drag & Drop Reordering:** Easily reorder scanned pages before saving using intuitive drag-and-drop.
*   **🖼️ Live Preview:** View scanned pages immediately.
*   **🧹 Session Management:** Automatic cleanup of temporary files to keep your system light.
*   **🎨 Modern UI:** Clean, responsive interface built with Tailwind CSS.
*   **🔔 Toast Notifications:** Helpful feedback messages for all user actions (scanning, refreshing, errors).
*   **🔄 Smart Refresh:** Visual feedback when refreshing scanner list with spinning icon and success notifications.
*   **📐 Responsive Design:** Minimum window size of 600x600 ensures optimal viewing experience.

## 🛠️ Tech Stack

*   **Core:** [Electron](https://www.electronjs.org/) `^38.1.2`
*   **Frontend:** [React](https://react.dev/) `^19.1.1` + [TypeScript](https://www.typescriptlang.org/) `^5.9.2`
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) `^3.4.17`
*   **Build Tool:** [Vite](https://vitejs.dev/) `^7.1.6` (via electron-vite `^4.0.1`)
*   **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF) `^3.0.4`
*   **Drag & Drop:** [@dnd-kit/core](https://dndkit.com/) `^6.3.1`
*   **Notifications:** [react-hot-toast](https://react-hot-toast.com/) `^2.6.0`
*   **Icons:** [Lucide React](https://lucide.dev/) `^0.554.0`
*   **Native Integration:** PowerShell & WIA

## 📋 Prerequisites

*   **Operating System:** Windows 10 or Windows 11 (Required for WIA support).
*   **Hardware:** A scanner or printer/scanner combo connected and installed with WIA drivers (most modern scanners support this out of the box).
*   **Node.js:** v18+ (for development).

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/vostrodev/simplyscan.git
cd simplyscan
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run in Development Mode

Starts the Electron app with Hot Module Replacement (HMR).

```bash
npm run dev
```

## 📦 Building for Production

To create a distributable Windows installer (`.exe`):

```bash
npm run build:win
```

The output files will be located in the `dist/` directory.

## 💡 Usage

1. **Connect Your Scanner:** Ensure your scanner is connected and properly installed with WIA drivers.
2. **Launch SimplyScan:** Open the application and wait for it to detect available scanners.
3. **Select Scanner:** Choose your scanner from the dropdown menu in the header.
4. **Refresh (Optional):** Click the refresh icon 🔄 to rescan for devices. You'll see a spinning animation and a toast notification confirming the refresh.
5. **Scan Pages:** Click the "Scan Page" button to scan each page. The scanned pages appear as thumbnails in the main area.
6. **Reorder Pages:** Drag and drop thumbnails to reorder them before saving.
7. **Delete Pages:** Click the ❌ button on any thumbnail to remove unwanted pages.
8. **Save as PDF:** Click "Save PDF" to generate and download your multi-page PDF document.
9. **Clear Session:** Click "Clear All" to remove all scanned pages and start fresh.

## 🔧 How It Works

1.  **Scanner Detection:** The app uses a bridge to PowerShell to query the `WIA.DeviceManager` COM object, listing all available scanning devices.
2.  **Scanning Process:** When a scan is triggered, a temporary PowerShell script is generated and executed to instruct the scanner to transfer an image.
3.  **Memory Management:** Scanned images are saved to a temporary directory and served via a custom `scan://` protocol to ensure low memory usage, even with many high-resolution pages.
4.  **PDF Assembly:** When saving, the application reads the temporary images and uses `jsPDF` to generate a multi-page PDF document.
5.  **User Feedback:** Toast notifications provide instant feedback for all actions, keeping users informed of the application state.

## 🐛 Troubleshooting

### No Scanners Found

*   Ensure your scanner is properly connected and powered on.
*   Check that your scanner has WIA-compatible drivers installed.
*   Try unplugging and reconnecting your scanner, then click the refresh button.
*   Some scanners may need to be set to "WIA mode" in their control panel.

### Scan Button Doesn't Work

*   If you see a toast notification saying "No scanner selected," click the refresh button to detect available scanners.
*   Make sure a scanner is selected in the dropdown menu.

### PowerShell Execution Issues

*   SimplyScan uses PowerShell scripts to communicate with WIA. Ensure PowerShell is available on your system.
*   The app uses `-ExecutionPolicy Bypass` for its temporary scripts, which is safe and only applies to the specific script being run.

### PDF Generation Failed

*   Ensure you have at least one scanned page before attempting to save.
*   Check that you have write permissions in your Downloads folder.
*   Try rescanning the pages if they appear corrupted.

## ⌨️ Development Scripts

```bash
npm run dev              # Start development server with HMR
npm run build            # Build for production (all platforms)
npm run build:win        # Build Windows installer
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run typecheck        # Type-check TypeScript files
```

## 📁 Project Structure

```
SimplyScan/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main entry point, IPC handlers
│   │   └── scanner.ts     # WIA scanner integration
│   ├── preload/           # Preload scripts for IPC bridge
│   │   └── index.ts       # Exposes safe APIs to renderer
│   └── renderer/          # React frontend
│       └── src/
│           ├── App.tsx    # Main React component
│           ├── components/
│           │   └── SortablePage.tsx  # Drag-drop page component
│           └── assets/    # Images, styles
├── resources/             # App icons and resources
└── package.json
```

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Wilteq** - [wilteq.co.za](https://wilteq.co.za/)

---

Built with ❤️ using Electron + React + TypeScript
