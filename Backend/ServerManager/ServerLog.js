// server.js
const WebSocket = require('ws');
const si = require('systeminformation');

const PORT = 9030;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server listening on ws://localhost:${PORT}`);

wss.on('connection', (ws, req) => {
    console.log('client connected:', req.socket.remoteAddress);
    ws.send(JSON.stringify({ msg: 'welcome', serverTime: new Date().toISOString() }));

    ws.on('close', () => console.log('client disconnected'));
    ws.on('error', (err) => console.error('ws error', err));
});

async function gatherSystemInfo() {
    try {
        const [
            cpuLoad,
            mem,
            osInfo,
            fs,
            processes,
            networkStats,
            networkInterfaces,
            time
        ] = await Promise.all([
            si.currentLoad(),        // {avgload, currentload, cores...}
            si.mem(),                // {total, free, used, active, available}
            si.osInfo(),             // platform, distro, release, hostname
            si.fsSize(),             // array of disks with size, used, use
            si.processes(),          // processes object {all, list, ...}
            si.networkStats(),       // array with bytes, tx, rx
            si.networkInterfaces(),  // list of interfaces
            si.time()                // uptime, boot time
        ]);

        // شکل‌دهی قابل مصرف برای کلاینت
        return {
            timestamp: new Date().toISOString(),
            cpu: {
                avgLoad: cpuLoad.avgload,
                currentLoad: cpuLoad.currentload,
                perCore: cpuLoad.cpus ? cpuLoad.cpus.map(c => c.load) : []
            },
            memory: {
                total: mem.total,
                free: mem.free,
                used: mem.used,
                active: mem.active,
                available: mem.available
            },
            os: osInfo,
            disks: fs.map(d => ({
                fs: d.fs, mount: d.mount, type: d.type, size: d.size, used: d.used, use: d.use
            })),
            processes: {
                all: processes.all,
                running: processes.running,
                blocked: processes.blocked,
                listTop: processes.list
                    .sort((a,b)=> (b.cpu || 0) - (a.cpu || 0))
                    .slice(0, 10)
                    .map(p => ({ pid: p.pid, name: p.name, cpu: p.cpu, mem: p.mem, user: p.user }))
            },
            network: {
                stats: networkStats,
                interfaces: networkInterfaces
            },
            time
        };
    } catch (err) {
        return { error: String(err), timestamp: new Date().toISOString() };
    }
}
const BROADCAST_INTERVAL_MS = 2000;
setInterval(async () => {
    const info = await gatherSystemInfo();
    const payload = JSON.stringify(info);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}, BROADCAST_INTERVAL_MS);