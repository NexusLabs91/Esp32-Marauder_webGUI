# Installation Guide

Welcome to the ESP32 Marauder Web GUI V2! This guide will help you install and run the application locally on your machine.

## Prerequisites

Before installing the project, ensure you have the following requirements installed:

1. **[Node.js](https://nodejs.org/)** (v14 or higher) - Required to use `npm` (Node Package Manager) and host the local server.
2. **A Web Serial compatible browser** - such as Google Chrome, Microsoft Edge, or Opera. (Note: Firefox and Safari do not support the Web Serial API yet).
3. **Hardware Drivers** - Ensure your OS has the proper CP210x or CH340 drivers installed to recognize your ESP32.

---

## Installation Steps

1. **Clone or Download the Repository**
   You can either download this project as a ZIP file and extract it, or use Git to clone it into your preferred directory:
   ```bash
   git clone https://github.com/NexusLabs91/Esp32-Marauder_webGUI.git
   cd Esp32-Marauder_webGUI
   ```

2. **Install Dependencies**
   Run the following command in your terminal inside the project folder to install the local web server package (`serve`):
   ```bash
   npm install
   ```

3. **Start the Local Server**
   Start the application by running:
   ```bash
   npm start
   ```

4. **Open the Dashboard**
   Once the server starts, it will output a local URL (usually `http://localhost:3000`). Open this link in your Chrome or Edge browser.

5. **Connect Your ESP32**
   - Plug your flashed ESP32 Marauder into a USB port.
   - On the web dashboard, select the correct baud rate (usually `115200`).
   - Click the **CONNECT** button.
   - Choose your ESP32's COM port from the browser prompt and click "Connect".

You are now ready to use the Marauder Console!

---

## Troubleshooting

- **"Access Denied" or COM Port in use:** Make sure no other program (like Arduino IDE or PuTTY) is currently connected to the ESP32 UART port.
- **Port doesn't show up in browser:** Verify you are using a data-capable USB cable (not just a charging power cable) and the correct CH340 / CP210X drivers are installed on your OS.
