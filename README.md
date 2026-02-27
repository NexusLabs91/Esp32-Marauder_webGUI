# ESP32 Marauder Web GUI ☠️

![Project Status](https://img.shields.io/badge/Status-Active-green) ![License](https://img.shields.io/badge/License-MIT-blue)

A standalone, web-based control interface for the [ESP32 Marauder](https://github.com/justcallmekoko/ESP32Marauder). This tool uses the **Web Serial API** to connect directly to your ESP32 from the browser—no installation required.

> **🆕 NEW IN V2:** The UI has been completely redesigned with a sleek, Cyberpunk/Netrunner aesthetic, and the codebase has been modularized to allow anyone to build and integrate their own custom UIs!

## ⚡ Features

- **Zero Install:** Runs entirely in the browser (Chrome, Edge, Opera).
- **Netrunner/Cyberpunk Aesthetic:** Modern dark-mode styling with cyan and red technical accents.
- **Full Control Suite:** 
  - WiFi Scanning (AP, Station, All)
  - Bluetooth/BLE Sniffing & Spamming
  - Attack Vectors (Deauth, Probe, Beacon Spam)
  - PCAP Sniffing Controls
  - Web USB Firmware Flashing
- **Live Serial Terminal:** View output logs in real-time.

## 🏗️ Modular Architecture 

The codebase is now fully modular, separating the core serial connection logic from the visual UI. This allows you (or your AI) to easily build a completely different user interface while keeping the complex connection and parsing logic intact!

- `marauder_client.js`: The core framework-agnostic JavaScript class that handles the Web Serial API (connecting, parsing streams, sending commands).
- `ui.jsx`: The React components and view logic.
- `styles.css`: All the Tailwind and custom Cyberpunk CSS.
- `index.html`: A lightweight shell that imports the above files. 

If you want to build your own UI, simply swap out `styles.css` and `ui.jsx`!

## 🚀 Usage

### Online (GitHub Pages)

**[> CLICK HERE TO LAUNCH GUI <](https://NexusLabs91.github.io/Esp32-Marauder_webGUI)**

### Local Usage

For complete installation and local hosting instructions, please refer to the **[Installation Guide](INSTALLATION_GUIDE.md)**!

**Quick Start:**
1. Clone the repository and run `npm install`.
2. Run `npm start` to host the local server.
3. Open the provided localhost URL in a chromium-based browser (Chrome/Edge).
4. Connect your ESP32 via USB and click **CONNECT**.

## 🛠️ Requirements

- **Browser:** Chrome, Edge, or Opera (Firefox does not support Web Serial).
- **Hardware:** An ESP32 flashed with Marauder Firmware.
- **Drivers:** Ensure you have the CP210x or CH340 drivers installed for your ESP32.

## ⚠️ Disclaimer

This tool is for **educational purposes and authorized security testing only**. Usage of this tool for attacking targets without prior mutual consent is illegal. The developer assumes no liability and is not responsible for any misuse or damage caused by this program.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
