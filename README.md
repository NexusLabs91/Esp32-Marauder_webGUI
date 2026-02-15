# ESP32 Marauder Web GUI ☠️

![Project Status](https://img.shields.io/badge/Status-Active-green) ![License](https://img.shields.io/badge/License-MIT-blue)

A standalone, web-based control interface for the [ESP32 Marauder](https://github.com/justcallmekoko/ESP32Marauder). This tool uses the **Web Serial API** to connect directly to your ESP32 from the browser—no installation required.

![Screenshot of the GUI](./assets/screenshot_main.png)
_(Note: Upload a screenshot of your tool in action to an 'assets' folder)_

## ⚡ Features

- **Zero Install:** Runs entirely in the browser (Chrome, Edge, Opera).
- **Cyberpunk/Terminal Aesthetic:** Matrix-style styling with CRT flicker effects.
- **Full Control Suite:** \* WiFi Scanning (AP, Station, All)
  - Bluetooth/BLE Sniffing & Spamming
  - Attack Vectors (Deauth, Probe, Beacon Spam)
  - PCAP Sniffing Controls
- **Live Serial Terminal:** View output logs in real-time.

## 🚀 Usage

### Online (GitHub Pages)

**[> CLICK HERE TO LAUNCH GUI <](https://yourusername.github.io/your-repo-name)**

### Local Usage

1.  Download the `index.html` file.
2.  Open it in a chromium-based browser (Chrome/Edge).
3.  Connect your ESP32 via USB.
4.  Select the correct baud rate (default: `115200`).
5.  Click **CONNECT**.

## 🛠️ Requirements

- **Browser:** Chrome, Edge, or Opera (Firefox does not support Web Serial).
- **Hardware:** An ESP32 flashed with Marauder Firmware.
- **Drivers:** Ensure you have the CP210x or CH340 drivers installed for your ESP32.

## ⚠️ Disclaimer

This tool is for **educational purposes and authorized security testing only**. Usage of this tool for attacking targets without prior mutual consent is illegal. The developer assumes no liability and is not responsible for any misuse or damage caused by this program.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
