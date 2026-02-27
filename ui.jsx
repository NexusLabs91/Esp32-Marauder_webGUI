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
        {desc && <div className="desc">{desc}</div>}
    </div>
);

const SectionHeader = ({ title, icon }) => (
    <div className="col-span-full text-[10px] text-slate-500 uppercase tracking-widest border-b border-gray-800 pb-1 mb-2 mt-4 flex items-center gap-2">
        {icon && <Icon name={icon} size={12} />}
        {title}
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
    const [activeTab, setActiveTab] = useState('wifi'); // wifi, ble, system, macros, flasher

    // UI State
    const [toasts, setToasts] = useState([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const [isMacroRunning, setIsMacroRunning] = useState(false);

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

    // Macro Runner
    const runMacro = async (sequenceName, steps) => {
        if (!isConnected) {
            showToast("Not connected to device", "error");
            return;
        }
        if (isMacroRunning) {
            showToast("A macro is already running!", "warn");
            return;
        }

        setIsMacroRunning(true);
        showToast(`Starting Macro: ${sequenceName}`, "info");
        client._dispatchLog(`[MACRO] --- STARTING SEQUENCE: ${sequenceName} ---`, "info");

        try {
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                if (step.cmd) {
                    await client.sendCommand(step.cmd);
                } else if (step.delay) {
                    client._dispatchLog(`[MACRO] Waiting ${step.delay}ms...`, "info");
                    await new Promise(resolve => setTimeout(resolve, step.delay));
                }
            }
            client._dispatchLog(`[MACRO] --- SEQUENCE COMPLETE: ${sequenceName} ---`, "success");
            showToast(`Macro ${sequenceName} Complete`, "success");
        } catch (err) {
            client._dispatchLog(`[MACRO] ERROR: ${err.message}`, "error");
        } finally {
            setIsMacroRunning(false);
        }
    };

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
                        <button onClick={disconnectSerial} className="btn danger h-[36px] bg-red-900/20">
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
                <div className="w-full lg:w-[450px] flex flex-col gap-2 shrink-0 overflow-y-auto">

                    {/* Main Command Tabs */}
                    <div className="panel flex flex-col flex-1 min-h-[500px]">
                        <div className="flex border-b border-gray-800 shrink-0 px-2 pt-2 overflow-x-auto no-scrollbar">
                            {['wifi', 'ble', 'system', 'macros', 'flasher'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`tab-btn flex-1 whitespace-nowrap px-3 ${activeTab === tab ? 'active' : ''}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto">

                            {/* --- WIFI TAB --- */}
                            {activeTab === 'wifi' && (
                                <div className="space-y-2">
                                    <SectionHeader title="Scanning" icon="Search" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <ActionCard title="Scan APs" icon="Wifi" color="cyan" onClick={() => sendCommand('scanap')} disabled={!isConnected} />
                                        <ActionCard title="Scan Stations" icon="Smartphone" color="cyan" onClick={() => sendCommand('scansta')} disabled={!isConnected} />
                                        <ActionCard title="Scan All" icon="Globe" color="cyan" onClick={() => sendCommand('scanall')} disabled={!isConnected} />
                                        <ActionCard title="List APs" icon="List" color="cyan" onClick={() => sendCommand('listap')} disabled={!isConnected} />
                                        <ActionCard title="List STAs" icon="Users" color="cyan" onClick={() => sendCommand('liststa')} disabled={!isConnected} />
                                        <ActionCard title="Clear List" icon="Trash" color="cyan" onClick={() => sendCommand('clearlist -a')} disabled={!isConnected} />
                                    </div>

                                    <SectionHeader title="Sniffing" icon="Focus" />
                                    <div className="grid grid-cols-3 gap-2">
                                        <ActionCard title="Probe" icon="RadioReceiver" color="cyan" onClick={() => sendCommand('sniffprobe')} disabled={!isConnected} />
                                        <ActionCard title="Beacon" icon="Radio" color="cyan" onClick={() => sendCommand('sniffbeacon')} disabled={!isConnected} />
                                        <ActionCard title="Deauth" icon="WifiOff" color="cyan" onClick={() => sendCommand('sniffdeauth')} disabled={!isConnected} />
                                        <ActionCard title="Raw" icon="Binary" color="cyan" onClick={() => sendCommand('sniffraw')} disabled={!isConnected} />
                                        <ActionCard title="PMKID" icon="Key" color="cyan" onClick={() => sendCommand('sniffpmkid')} disabled={!isConnected} />
                                        <ActionCard title="ESP" icon="Cpu" color="cyan" onClick={() => sendCommand('sniffesp')} disabled={!isConnected} />
                                        <ActionCard title="SigMon" icon="Activity" color="cyan" onClick={() => sendCommand('sigmon')} disabled={!isConnected} />
                                        <ActionCard title="PktMon" icon="Eye" color="cyan" onClick={() => sendCommand('packetmonitor')} disabled={!isConnected} />
                                        <ActionCard title="Pwnagotchi" icon="Ghost" color="cyan" onClick={() => sendCommand('sniffpwn')} disabled={!isConnected} />
                                        <button onClick={() => sendCommand('wardrive')} disabled={!isConnected} className="btn col-span-3">Wardrive Mode</button>
                                    </div>

                                    <SectionHeader title="Attacks" icon="AlertTriangle" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <ActionCard title="Deauth Broad" icon="WifiOff" color="red" onClick={() => sendCommand('attack -t deauth')} disabled={!isConnected} />
                                        <ActionCard title="Deauth STA" icon="UserX" color="red" onClick={() => sendCommand('attack -t deauth -c')} disabled={!isConnected} />
                                        <ActionCard title="Spam (List)" icon="Radio" color="red" onClick={() => sendCommand('attack -t beacon -l')} disabled={!isConnected} />
                                        <ActionCard title="Spam (Rand)" icon="Shuffle" color="red" onClick={() => sendCommand('attack -t beacon -r')} disabled={!isConnected} />
                                        <ActionCard title="Spam (Clone)" icon="Copy" color="red" onClick={() => sendCommand('attack -t beacon -a')} disabled={!isConnected} />
                                        <ActionCard title="Probe Flood" icon="Waves" color="red" onClick={() => sendCommand('attack -t probe')} disabled={!isConnected} />
                                        <ActionCard title="Rickroll" icon="Music" color="red" onClick={() => sendCommand('attack -t rickroll')} disabled={!isConnected} />
                                        <ActionCard title="Karma" icon="Zap" color="red" onClick={() => sendCommand('karma')} disabled={!isConnected} />
                                        <ActionCard title="Evil Portal" icon="Globe" color="red" onClick={() => sendCommand('evilportal')} disabled={!isConnected} />
                                        <ActionCard title="Bad Message" icon="MessageSquareWarning" color="red" onClick={() => sendCommand('attack -t badmsg')} disabled={!isConnected} />
                                        <button onClick={() => sendCommand('attack -t sleep')} disabled={!isConnected} className="btn danger col-span-2">Sleep Attack</button>
                                    </div>

                                    <SectionHeader title="Channel Control" icon="SlidersHorizontal" />
                                    <div className="grid grid-cols-3 gap-2 pb-4">
                                        <button onClick={() => sendCommand('channel -p')} disabled={!isConnected} className="btn text-xs">Ch Down</button>
                                        <button onClick={() => sendCommand('channel -n')} disabled={!isConnected} className="btn text-xs">Ch Up</button>
                                        <div className="flex gap-1 justify-center">
                                            {[1, 6, 11].map(ch => (
                                                <button key={ch} onClick={() => sendCommand(`channel -s ${ch}`)} disabled={!isConnected} className="btn text-xs px-2 flex-1">{ch}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <SectionHeader title="SSIDs" icon="ListOrdered" />
                                    <div className="grid grid-cols-2 gap-2 pb-4">
                                        <button onClick={() => sendCommand('listssid')} disabled={!isConnected} className="btn text-xs">List Mine</button>
                                        <button onClick={() => sendCommand('ssid -g 10')} disabled={!isConnected} className="btn text-xs">Random 10</button>
                                        <button onClick={() => sendCommand('save -s')} disabled={!isConnected} className="btn text-xs">SD Save</button>
                                        <button onClick={() => sendCommand('load -s')} disabled={!isConnected} className="btn text-xs">SD Load</button>
                                        <button onClick={() => sendCommand('clearlist -s')} disabled={!isConnected} className="btn danger text-xs col-span-2">Clear SSIDs</button>
                                    </div>
                                </div>
                            )}

                            {/* --- BLE TAB --- */}
                            {activeTab === 'ble' && (
                                <div className="space-y-2">
                                    <SectionHeader title="Recon & Sniff" icon="Bluetooth" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <ActionCard title="Sniff BT" icon="BluetoothSearching" color="cyan" onClick={() => sendCommand('sniffbt')} disabled={!isConnected} />
                                        <ActionCard title="Wardrive" icon="MapPin" color="cyan" onClick={() => sendCommand('btwardrive')} disabled={!isConnected} />
                                        <ActionCard title="Sniff AirTags" icon="Target" color="cyan" onClick={() => sendCommand('sniffat')} disabled={!isConnected} />
                                        <ActionCard title="Spoof AirTag" icon="Cast" color="cyan" onClick={() => sendCommand('spoofat')} disabled={!isConnected} />
                                    </div>

                                    <SectionHeader title="Spam Attacks" icon="AlertTriangle" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => sendCommand('sourapple')} disabled={!isConnected} className="btn danger">Sour Apple</button>
                                        <button onClick={() => sendCommand('swiftpair')} disabled={!isConnected} className="btn danger">Swift Pair</button>
                                        <button onClick={() => sendCommand('samsungblespam')} disabled={!isConnected} className="btn danger">Samsung Spam</button>
                                        <button onClick={() => sendCommand('flipperble')} disabled={!isConnected} className="btn danger">Flipper Spam</button>
                                        <button onClick={() => sendCommand('btspamall')} disabled={!isConnected} className="btn danger col-span-2 py-3 bg-red-900/10"><Icon name="Zap" size={14} /> SPAM ALL MODES</button>
                                    </div>
                                </div>
                            )}

                            {/* --- SYSTEM TAB --- */}
                            {activeTab === 'system' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <ActionCard title="Info" icon="Info" color="cyan" onClick={() => sendCommand('info')} disabled={!isConnected} />
                                        <ActionCard title="Help" icon="HelpCircle" color="cyan" onClick={() => sendCommand('help')} disabled={!isConnected} />
                                    </div>

                                    <SectionHeader title="Network Utils" icon="Network" />
                                    <div className="flex gap-2">
                                        <button onClick={() => sendCommand('pingscan')} disabled={!isConnected} className="btn flex-1">Ping Scan</button>
                                        <button onClick={() => sendCommand('gpsdata')} disabled={!isConnected} className="btn flex-1">GPS Data</button>
                                    </div>

                                    <SectionHeader title="Settings" icon="Settings" />
                                    <div className="space-y-2 bg-black/40 border border-gray-800 rounded p-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Force PMKID</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => sendCommand('settings -s ForcePMKID enable')} disabled={!isConnected} className="btn text-[10px] px-2 py-1">ON</button>
                                                <button onClick={() => sendCommand('settings -s ForcePMKID disable')} disabled={!isConnected} className="btn text-[10px] px-2 py-1">OFF</button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Enable LED</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => sendCommand('settings -s EnableLED enable')} disabled={!isConnected} className="btn text-[10px] px-2 py-1">ON</button>
                                                <button onClick={() => sendCommand('settings -s EnableLED disable')} disabled={!isConnected} className="btn text-[10px] px-2 py-1">OFF</button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Save PCAP</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => sendCommand('settings -s SavePCAP enable')} disabled={!isConnected} className="btn text-[10px] px-2 py-1">ON</button>
                                                <button onClick={() => sendCommand('settings -s SavePCAP disable')} disabled={!isConnected} className="btn text-[10px] px-2 py-1">OFF</button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-gray-800">
                                            <button onClick={() => sendCommand('settings')} disabled={!isConnected} className="btn text-xs">View Settings</button>
                                            <button onClick={() => sendCommand('settings -r')} disabled={!isConnected} className="btn danger text-xs">Restore Defaults</button>
                                        </div>
                                    </div>

                                    <SectionHeader title="Power" icon="Power" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => sendCommand('update')} disabled={!isConnected} className="btn text-xs">Update FW</button>
                                        <button onClick={() => sendCommand('reboot')} disabled={!isConnected} className="btn danger text-xs"><Icon name="RefreshCcw" size={12} /> Reboot</button>
                                    </div>
                                </div>
                            )}

                            {/* --- MACROS TAB --- */}
                            {activeTab === 'macros' && (
                                <div className="space-y-4">
                                    <div className="bg-cyan-900/10 border border-cyan-500/20 p-4 rounded text-xs text-cyan-200 mb-4">
                                        <Icon name="Info" className="inline mr-2 text-cyan-400" size={16} />
                                        Macros run a predefined sequence of commands with delays. Do not interrupt while running.
                                    </div>

                                    <button
                                        disabled={!isConnected || isMacroRunning}
                                        onClick={() => runMacro("Full Recon Workflow", [
                                            { cmd: "scanap" }, { delay: 5000 },
                                            { cmd: "listap" },
                                            { cmd: "scansta" }, { delay: 3000 },
                                            { cmd: "liststa" }
                                        ])}
                                        className="w-full btn primary h-[60px] flex justify-between px-4 group"
                                    >
                                        <div className="text-left">
                                            <div className="font-bold">Full Recon Workflow</div>
                                            <div className="text-[10px] opacity-70 normal-case">scanap {'>'} 5s {'>'} listap {'>'} scansta {'>'} 3s {'>'} liststa</div>
                                        </div>
                                        <Icon name="Play" className="group-hover:scale-110 transition-transform" />
                                    </button>

                                    <button
                                        disabled={!isConnected || isMacroRunning}
                                        onClick={() => runMacro("Evil Portal Setup", [
                                            { cmd: "scanap" }, { delay: 3000 },
                                            { cmd: "select -a 0" },
                                            { cmd: "evilportal" }
                                        ])}
                                        className="w-full btn danger h-[60px] flex justify-between px-4 group border-red-500/50"
                                    >
                                        <div className="text-left">
                                            <div className="font-bold">Evil Portal Setup</div>
                                            <div className="text-[10px] opacity-70 normal-case bg-transparent">scanap {'>'} 3s {'>'} select -a 0 {'>'} evilportal</div>
                                        </div>
                                        <Icon name="Play" className="group-hover:scale-110 transition-transform" />
                                    </button>

                                    <button
                                        disabled={!isConnected || isMacroRunning}
                                        onClick={() => runMacro("Deauth Target 0", [
                                            { cmd: "select -a 0" },
                                            { cmd: "attack -t deauth" }
                                        ])}
                                        className="w-full btn danger h-[60px] flex justify-between px-4 group border-red-500/50"
                                    >
                                        <div className="text-left">
                                            <div className="font-bold">Deauth Selected Target</div>
                                            <div className="text-[10px] opacity-70 normal-case bg-transparent">select -a 0 {'>'} attack -t deauth</div>
                                        </div>
                                        <Icon name="Play" className="group-hover:scale-110 transition-transform" />
                                    </button>

                                    <button
                                        disabled={!isConnected || isMacroRunning}
                                        onClick={() => runMacro("Capture PMKID Workflow", [
                                            { cmd: "settings -s ForcePMKID enable" },
                                            { cmd: "sniffpmkid" },
                                            // The user would normally let this run, then stop and disable later.
                                            // Leaving disable out of the instant sequence.
                                        ])}
                                        className="w-full btn h-[60px] flex justify-between px-4 group border-cyan-500/50"
                                    >
                                        <div className="text-left">
                                            <div className="font-bold">Capture PMKID</div>
                                            <div className="text-[10px] opacity-70 normal-case">ForcePMKID enable {'>'} sniffpmkid</div>
                                        </div>
                                        <Icon name="Play" className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            )}

                            {/* --- FLASHER TAB --- */}
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

                        {/* GLOBAL STOP BUTTON */}
                        <div className="p-4 border-t border-gray-800 shrink-0">
                            <button onClick={() => sendCommand('stopscan')} disabled={!isConnected} className="w-full btn danger h-[50px] bg-red-900/20 hover:bg-red-900/40 border-red-500">
                                <Icon name="Octagon" size={18} /> STOP CURRENT PROCESS
                            </button>
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
