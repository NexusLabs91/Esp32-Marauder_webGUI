/**
 * MarauderClient.js
 * Core logic for interacting with the ESP32 Marauder via Web Serial API.
 * This file is UI-agnostic and simply provides a clean JavaScript API.
 */
class MarauderClient {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;

        // Callbacks that the UI can hook into
        this.onConnect = null;
        this.onDisconnect = null;
        this.onLog = null;
        this.onError = null;
    }

    async connect(baudRate = 115200) {
        if (!navigator.serial) {
            this._dispatchError("Web Serial API not supported. Use Chrome/Edge.");
            return;
        }
        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: parseInt(baudRate) });

            const textEncoder = new TextEncoderStream();
            textEncoder.readable.pipeTo(this.port.writable).catch(e => console.warn("Writer closed", e));
            this.writer = textEncoder.writable.getWriter();

            const textDecoder = new TextDecoderStream();
            this.port.readable.pipeTo(textDecoder.writable).catch(e => console.warn("Reader closed", e));
            this.reader = textDecoder.readable.getReader();

            this.isConnected = true;
            if (this.onConnect) this.onConnect();
            
            this._dispatchLog("[SYS] MarauderFW Connection Established", "success");
            
            // Start listening for incoming data in the background
            this._readLoop();
        } catch (error) {
            this._dispatchError(`Connection failed: ${error.message}`);
        }
    }

    async disconnect() {
        try {
            if (this.reader) {
                await this.reader.cancel();
                this.reader = null;
            }
            if (this.writer) {
                await this.writer.close();
                this.writer = null;
            }
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
        } catch (e) {
            console.error("Disconnect error:", e);
        } finally {
            this.isConnected = false;
            if (this.onDisconnect) this.onDisconnect();
            this._dispatchLog("[SYS] Console Disconnected", "warn");
        }
    }

    async _readLoop() {
        let buffer = "";
        try {
            while (this.isConnected && this.reader) {
                const { value, done } = await this.reader.read();
                if (done) break;
                buffer += value;
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep the incomplete line in the buffer
                
                for (const line of lines) {
                    const cleaned = line.replace(/\r/g, '');
                    if (cleaned.trim() !== '') {
                        this._dispatchLog(cleaned, this._autoColorize(cleaned));
                    }
                }
            }
        } catch (error) {
            this._dispatchError(`Stream closed/error: ${error.message}`);
            this.disconnect();
        } finally {
            if (this.reader) {
                try {
                    this.reader.releaseLock();
                } catch(e) {}
            }
        }
    }

    async sendCommand(cmd) {
        if (!this.writer || !this.isConnected) {
            this._dispatchError("Not connected to device");
            return;
        }
        try {
            await this.writer.write(cmd + "\r\n");
            this._dispatchLog(`> ${cmd}`, "info");
        } catch (e) {
            this._dispatchError(`TX Failed: ${e.message}`);
        }
    }

    // --- Private Helpers ---

    _dispatchLog(text, type = "normal") {
        if (this.onLog) {
            this.onLog({ text, type, time: new Date().toLocaleTimeString([], {hour12: false}) });
        }
    }

    _dispatchError(msg) {
        if (this.onError) {
            this.onError(msg);
        }
        this._dispatchLog(`[ERR] ${msg}`, "error");
    }

    _autoColorize(text) {
        if (text.includes("[INFO]")) return "info";
        if (text.includes("[WIFI]")) return "wifi";
        if (text.includes("[WARN]")) return "warn";
        if (text.includes("[ERR]")) return "error";
        if (text.includes("[PCKT]")) return "pckt";
        return "normal";
    }
}

// Export for module usage, or attach to window for simple script tags
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarauderClient;
} else {
    window.MarauderClient = MarauderClient;
}
