const { useState, useEffect, useRef } = React;

const Icon = ({ name, size = 18, className }) => {
    if (!window.lucide || !window.lucide.icons) return null;
    const LucideIcon = window.lucide.icons[name];
    if (!LucideIcon) return null;

    if (typeof window.lucide.createElement === 'function') {
        try {
            const svgElement = window.lucide.createElement(LucideIcon);
            svgElement.setAttribute('width', size);
            svgElement.setAttribute('height', size);
            svgElement.setAttribute('class', `lucide lucide-${name.toLowerCase()} ${className || ''}`.trim());
            svgElement.setAttribute('stroke', 'currentColor');
            svgElement.setAttribute('stroke-width', '2');
            svgElement.setAttribute('fill', 'none');
            return <span style={{ display: 'inline-flex', alignItems: 'center' }} dangerouslySetInnerHTML={{ __html: svgElement.outerHTML }} />;
        } catch (e) { return null; }
    }
    return null;
};

// Reusable UI Components
const ActionCard = ({ title, desc, icon, color, onClick, disabled }) => (
    <div onClick={() => !disabled && onClick()} className={`action-card ${color} ${disabled ? 'disabled' : ''}`}>
        <div className="icon-wrapper">
            <Icon name={icon} size={24} />
        </div>
        <div className="title">{title}</div>
        <div className="desc">{desc}</div>
    </div>
);

function App() {
    // We instantiate our core logic class ONCE
    const [client] = useState(() => new MarauderClient());

    // Serial State mirroring the client
    const [isConnected, setIsConnected] = useState(false);
    const [baudRate, setBaudRate] = useState(115200);

    // App State
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('wifi'); // wifi, ble, flasher

    // UI State
    const [toasts, setToasts] = useState([]);
    const [autoScroll, setAutoScroll] = useState(true);

    const terminalEndRef = useRef(null);

    // Initial setup to bind client callbacks to React state
    useEffect(() => {
        client.onConnect = () => setIsConnected(true);
        client.onDisconnect = () => setIsConnected(false);
        client.onLog = (logObj) => {
            setLogs(prev => {
                const newLogs = [...prev, logObj];
                return newLogs.length > 500 ? newLogs.slice(-500) : newLogs;
            });
        };
        client.onError = (msg) => showToast(msg, "error");

        // Cleanup on unmount
        return () => {
            client.onConnect = null;
            client.onDisconnect = null;
            client.onLog = null;
            client.onError = null;
        };
    }, [client]);

    useEffect(() => {
        if (autoScroll && terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, autoScroll]);

    const showToast = (message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // UI Actions passed to the client
    const connectSerial = () => client.connect(baudRate);
    const disconnectSerial = () => client.disconnect();
    const sendCommand = (cmd) => client.sendCommand(cmd);
    const clearLogs = () => setLogs([]);

    // Helper to format log lines
    const renderLogLine = (log, i) => {
        let colorClass = "text-slate-300";
        if (log.type === "info") colorClass = "log-info";
        if (log.type === "error") colorClass = "log-error";
        if (log.type === "warn") colorClass = "log-warn";
        if (log.type === "success") colorClass = "log-success";
        if (log.type === "wifi") colorClass = "log-wifi";
        if (log.type === "pckt") colorClass = "log-pckt";

        return (
            <div key={i} className="flex gap-3 hover:bg-white/5 px-2 py-0.5 rounded transition-colors break-all">
                <span className="text-slate-600 shrink-0">[{log.time}]</span>
                <span className={colorClass}>{log.text}</span>
            </div>
        );
    };

    return (
        <div className="h-screen w-full flex flex-col pt-2 px-2 pb-2 gap-2">

            {/* TOP HEADER */}
            <header className="panel flex justify-between items-center px-4 py-3 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-cyan-500/20 p-2 rounded text-cyan-400 border border-cyan-500/30">
                        <Icon name="TerminalSquare" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
                            MARAUDER_CONSOLE <span className="text-cyan-400 text-sm">_V2</span>
                        </h1>
                        <div className="text-[10px] text-cyan-500/70 tracking-widest uppercase mt-1 flex items-center gap-2">
                            Netrunner Protocol: Active
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            STATUS: <span className={isConnected ? "text-green-400" : "text-slate-500"}>{isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
                            <span className="opacity-30">//</span>
                            BAUD: <span className="text-slate-300">{baudRate}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded mt-1 overflow-hidden">
                            {isConnected && <div className="h-full bg-green-500 w-full animate-pulse opacity-50"></div>}
                        </div>
                    </div>

                    <select
                        value={baudRate}
                        onChange={(e) => setBaudRate(e.target.value)}
                        className="input-tech h-[36px]"
                        disabled={isConnected}
                    >
                        <option value="115200">115200</option>
                        <option value="9600">9600</option>
                    </select>

                    {!isConnected ? (
                        <button onClick={connectSerial} className="btn primary h-[36px]">
                            <Icon name="Usb" size={16} /> CONNECT
                        </button>
                    ) : (
                        <button onClick={disconnectSerial} className="btn danger h-[36px]">
                            <Icon name="PowerOff" size={16} /> DISCONNECT
                        </button>
                    )}
                </div>
            </header>

            {/* MAIN CONTENT DIVIDER */}
            <div className="flex-1 flex flex-col lg:flex-row gap-2 min-h-0">

                {/* LEFT: TERMINAL */}
                <div className="panel flex-1 flex flex-col min-h-0 p-4">
                    <div className="flex justify-between items-center mb-3 shrink-0">
                        <div className="section-title mb-0">
                            <Icon name="Code2" size={14} className="text-cyan-400" /> SERIAL MONITOR OUTPUT
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white transition-colors">
                                <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="accent-cyan-500" />
                                AUTO-SCROLL
                            </label>
                            <button onClick={clearLogs} className="text-slate-500 hover:text-white transition-colors" title="Clear Logs">
                                <Icon name="Trash2" size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Log Area */}
                    <div className="flex-1 bg-black/40 border border-[#1f2937] rounded-md overflow-y-auto p-3 terminal-container">
                        {logs.length === 0 && <div className="text-slate-600 italic mt-2 text-center">Awaiting serial connection...</div>}
                        {logs.map((log, i) => renderLogLine(log, i))}
                        <div ref={terminalEndRef} />
                    </div>

                    {/* CLI Input */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendCommand(e.target.elements.cmd.value);
                            e.target.elements.cmd.value = '';
                        }}
                        className="mt-3 flex gap-2 shrink-0"
                    >
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-mono">{'>'}</span>
                            <input
                                name="cmd"
                                autoComplete="off"
                                disabled={!isConnected}
                                className="input-tech w-full pl-8 h-[40px]"
                                placeholder="Enter manual command..."
                            />
                        </div>
                        <button type="submit" disabled={!isConnected} className="btn h-[40px]">
                            SEND
                        </button>
                    </form>
                </div>

                {/* RIGHT: COMMAND DECK */}
                <div className="w-full lg:w-[400px] flex flex-col gap-2 shrink-0 overflow-y-auto">

                    {/* Hardware Stats (Mocked conceptually for aesthetic) */}
                    <div className="panel p-4 shrink-0">
                        <div className="section-title">SYSTEM RESOURCES</div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                                    <span>CPU LOAD</span>
                                    <span className="text-cyan-400">24%</span>
                                </div>
                                <div className="progress-track"><div className="progress-fill" style={{ width: '24%' }}></div></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-center">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Queue</div>
                                    <div className="font-mono text-white text-lg">0</div>
                                </div>
                                <div className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-center">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Channel</div>
                                    <div className="font-mono text-cyan-400 text-lg">6</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Command Tabs */}
                    <div className="panel flex flex-col flex-1 min-h-[400px]">
                        <div className="flex border-b border-gray-800 shrink-0 px-2 pt-2">
                            {['wifi', 'ble', 'flasher'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`tab-btn flex-1 ${activeTab === tab ? 'active' : ''}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto">
                            <div className="section-title mb-4">
                                <Icon name="LayoutGrid" size={14} className="text-cyan-400" /> {activeTab.toUpperCase()} PROTOCOLS
                            </div>

                            {activeTab === 'wifi' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <ActionCard
                                            title="SCAN APs" desc="Discover networks" icon="Wifi" color="cyan"
                                            disabled={!isConnected} onClick={() => sendCommand('scanap')}
                                        />
                                        <ActionCard
                                            title="SCAN STAs" desc="Find clients" icon="Smartphone" color="cyan"
                                            disabled={!isConnected} onClick={() => sendCommand('scansta')}
                                        />
                                    </div>

                                    <ActionCard
                                        title="SNIFF PACKETS" desc="Capture raw traffic data" icon="Focus" color="cyan"
                                        disabled={!isConnected} onClick={() => sendCommand('sniffbeacon')}
                                    />

                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div className="col-span-2 text-[10px] text-slate-500 uppercase tracking-widest border-b border-gray-800 pb-1 mb-1">Offensive Operations</div>
                                        <ActionCard
                                            title="DEAUTH" desc="Disconnect target" icon="WifiOff" color="red"
                                            disabled={!isConnected} onClick={() => sendCommand('attack -t deauth')}
                                        />
                                        <ActionCard
                                            title="BEACON SPAM" desc="Flood SSIDs" icon="Radio" color="red"
                                            disabled={!isConnected} onClick={() => sendCommand('attack -t beacon -r')}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <button onClick={() => sendCommand('reboot')} disabled={!isConnected} className="btn h-[50px] flex-col gap-1 text-[10px]">
                                            <Icon name="RefreshCcw" size={14} /> REBOOT
                                        </button>
                                        <button onClick={() => sendCommand('stopscan')} disabled={!isConnected} className="btn h-[50px] flex-col gap-1 text-[10px] hover:border-red-500 hover:text-red-500">
                                            <Icon name="StopCircle" size={14} /> STOP PROCESS
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ble' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <ActionCard
                                            title="SNIFF BT" desc="Bluetooth Recon" icon="Bluetooth" color="cyan"
                                            disabled={!isConnected} onClick={() => sendCommand('sniffbt')}
                                        />
                                        <ActionCard
                                            title="WARDRIVE" desc="Map devices" icon="MapPin" color="cyan"
                                            disabled={!isConnected} onClick={() => sendCommand('btwardrive')}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div className="col-span-2 text-[10px] text-slate-500 uppercase tracking-widest border-b border-gray-800 pb-1 mb-1">Targeted Spam</div>
                                        <button onClick={() => sendCommand('blespam -t apple')} disabled={!isConnected} className="btn danger">APPLE</button>
                                        <button onClick={() => sendCommand('blespam -t google')} disabled={!isConnected} className="btn danger">GOOGLE</button>
                                        <button onClick={() => sendCommand('blespam -t samsung')} disabled={!isConnected} className="btn danger">SAMSUNG</button>
                                        <button onClick={() => sendCommand('blespam -t windows')} disabled={!isConnected} className="btn danger">WINDOWS</button>
                                        <button onClick={() => sendCommand('blespam -t all')} disabled={!isConnected} className="btn danger col-span-2 py-3 bg-red-900/10">SPAM ALL DEVICES</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'flasher' && (
                                <div className="space-y-4">
                                    <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded text-sm text-blue-200">
                                        <Icon name="Info" className="inline mr-2 text-blue-400" size={16} />
                                        Ensure Serial connection is <strong className="text-white">Disconnected</strong> before flashing new firmware via Web USB.
                                    </div>

                                    <div className="mt-4 border border-gray-800 rounded p-4 flex flex-col items-center justify-center min-h-[150px] bg-black/50">
                                        <esp-web-install-button manifest="https://raw.githubusercontent.com/justcallmekoko/ESP32Marauder/master/firmware/manifest.json"></esp-web-install-button>
                                        <p className="text-[10px] text-slate-500 mt-4 text-center">
                                            Powered by esp-web-tools
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Status */}
            <footer className="flex justify-between items-center px-4 py-2 mt-auto text-[10px] text-slate-500 font-mono shrink-0">
                <div className="flex gap-4">
                    <span><span className="text-green-500">●</span> SD: MOUNTED</span>
                    <span><span className="text-green-500">●</span> GPS: FIXED (3 SATS)</span>
                </div>
                <div className="flex gap-4">
                    <span>NETRUNNER_CONSOLE_V2 // READY</span>
                    <span className="text-cyan-500">TIME: {new Date().toLocaleTimeString([], { hour12: false })} UTC</span>
                </div>
            </footer>

            {/* Toast Notifications */}
            <div className="toast-container font-mono">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
