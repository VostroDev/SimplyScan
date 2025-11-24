# SimplyScan 🖨️

A modern, lightweight, and efficient desktop application for scanning documents on Windows. Built with **Electron**, **React**, and **WIA (Windows Image Acquisition)** integration.

![SimplyScan Screenshot](resources/icon.png)

## ✨ Features

*   **🔌 Auto-Detection:** Automatically detects connected scanners using Windows Image Acquisition (WIA).
*   **⚡ Fast Scanning:** Quick scanning directly from the application interface.
*   **📂 PDF Generation:** Compiles multiple scanned pages into a single, high-quality PDF document.
*   **🖱️ Drag & Drop Reordering:** Easily reorder scanned pages before saving using intuitive drag-and-drop.
*   **🖼️ Live Preview:** View scanned pages immediately.
*   **🧹 Session Management:** Automatic cleanup of temporary files to keep your system light.
*   **🎨 Modern UI:** Clean, responsive interface built with Tailwind CSS.

## 🛠️ Tech Stack

*   **Core:** [Electron](https://www.electronjs.org/)
*   **Frontend:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Build Tool:** [Vite](https://vitejs.dev/) (via electron-vite)
*   **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF)
*   **Drag & Drop:** [@dnd-kit](https://dndkit.com/)
*   **Native Integration:** PowerShell & WIA

## 📋 Prerequisites

*   **Operating System:** Windows 10 or Windows 11 (Required for WIA support).
*   **Hardware:** A scanner or printer/scanner combo connected and installed with WIA drivers (most modern scanners support this out of the box).
*   **Node.js:** v18+ (for development).

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/simplyscan.git
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

## 🔧 How It Works

1.  **Scanner Detection:** The app uses a bridge to PowerShell to query the `WIA.DeviceManager` COM object, listing all available scanning devices.
2.  **Scanning Process:** When a scan is triggered, a temporary PowerShell script is generated and executed to instruct the scanner to transfer an image.
3.  **Memory Management:** Scanned images are saved to a temporary directory and served via a custom `scan://` protocol to ensure low memory usage, even with many high-resolution pages.
4.  **PDF Assembly:** When saving, the application reads the temporary images and uses `jsPDF` to generate a multi-page PDF document.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Wilteq** - [wilteq.co.za](https://wilteq.co.za/)
