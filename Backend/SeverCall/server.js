
const express = require("express");
const http = require("http");
const cors = require("cors");
const fs = require("fs");
const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

const server = http.createServer(app);

const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const activeUsers = new Map();
// نگاشت کاربر به ساکت‌ها: userId (از دیتابیس) -> مجموعه‌ای از socketId ها
const userIdToSocketIds = new Map();
// نگاشت معکوس: socketId -> userId
const socketIdToUserId = new Map();
// صف تماس‌های در انتظار برای کاربرانی که هنوز register نشده‌اند
const pendingIncomingByUserId = new Map(); // userId -> [{ callId, fromUserId, offer, fromSocketId }]

// ابزار: ارسال یک رویداد به همه ساکت‌های یک کاربر خاص
function emitToUser(userId, eventName, payload, options = {}) {
    const socketSet = userIdToSocketIds.get(String(userId));
    if (!socketSet || socketSet.size === 0) return false;
    for (const sid of socketSet) {
        if (options.excludeSocketId && sid === options.excludeSocketId) continue;
        io.to(sid).emit(eventName, payload);
    }
    return true;
}
// Try multiple keys (numeric id and known aliases) to deliver an event
function emitToAnyKey(possibleKeys, eventName, payload, options = {}) {
    if (!Array.isArray(possibleKeys)) return false;
    let delivered = false;
    for (const key of possibleKeys) {
        if (!key) continue;
        const ok = emitToUser(String(key).toLowerCase(), eventName, payload, options) || emitToUser(String(key), eventName, payload, options);
        if (ok) delivered = true;
    }
    return delivered;
}

function isNumericId(v) {
    return /^\d+$/.test(String(v || ''));
}

// Fetch alias keys (email/username/customUrl) for a given numeric user id
async function getAliasKeysForUserId(userId) {
    const keys = [];
    try {
        if (!sqliteDb) return keys;
        const rowGet = (sql, params) => new Promise((resolve) => {
            sqliteDb.get(sql, params, (err, row) => resolve(err ? null : (row || null)));
        });
        const row = await rowGet(`SELECT email, username, customUrl, custom_url FROM users WHERE id = ? LIMIT 1`, [userId]);
        if (row) {
            const v = (x) => (x === undefined || x === null) ? null : String(x).trim();
            const email = v(row.email);
            const username = v(row.username);
            const customUrl = v(row.customUrl || row.custom_url);
            [email, username, customUrl].forEach((k) => { if (k) keys.push(k.toLowerCase()); });
        }
    } catch {}
    // Fallback: also include aliases learned at runtime via in-memory map
    try {
        const target = String(userId);
        for (const [alias, uid] of identityToUserId.entries()) {
            if (String(uid) === target) {
                const k = String(alias).toLowerCase();
                if (!keys.includes(k)) keys.push(k);
            }
        }
    } catch {}
    return keys;
}


// ابزار: ارسال به یک socketId خاص
function emitToSocketId(socketId, eventName, payload) {
    if (!socketId) return false;
    io.to(String(socketId)).emit(eventName, payload);
    return true;
}

io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // ارسال ID به فرانت بلافاصله بعد از اتصال
    socket.emit("me", socket.id);

    // ذخیره اطلاعات کاربر
    activeUsers.set(socket.id, {
        id: socket.id,
        connectedAt: new Date()
    });

    // ارسال لیست کاربران آنلاین (اختیاری)
    socket.emit("onlineUsers", Array.from(activeUsers.keys()).filter(id => id !== socket.id));

    // ثبت userId واقعی (از دیتابیس) برای این اتصال
    socket.on("register", async (data) => {
        let userId = data && (data.userId ?? data.id);
        if (!userId) {
            return socket.emit("registerError", { message: "userId is required" });
        }
        // If non-numeric, try resolve via DB so mapping standardizes to users.id
        if (!/^\d+$/.test(String(userId))) {
            try {
                const resolved = await findUserIdByIdentity(String(userId));
                if (resolved) userId = resolved;
            } catch {}
        }
        const userIdStr = String(userId);
        socketIdToUserId.set(socket.id, userIdStr);
        if (!userIdToSocketIds.has(userIdStr)) {
            userIdToSocketIds.set(userIdStr, new Set());
        }
        userIdToSocketIds.get(userIdStr).add(socket.id);
        console.log(`👤 Registered userId=${userIdStr} for socket=${socket.id}`);
        // Also register alias identities so startCall can target non-numeric keys when DB is unavailable
        let aliasSet = new Set();
        try {
            const aliases = new Set();
            const v = (x) => (x === undefined || x === null) ? null : String(x).trim();
            const identity = v(data && (data.identity));
            const email = v(data && (data.email));
            const username = v(data && (data.username));
            const customUrl = v(data && (data.customUrl || data.custom_url));
            [identity, email, username, customUrl].forEach((ali) => { if (ali) aliases.add(ali.toLowerCase()); });
            for (const alias of aliases) {
                if (!userIdToSocketIds.has(alias)) userIdToSocketIds.set(alias, new Set());
                userIdToSocketIds.get(alias).add(socket.id);
                try { identityToUserId.set(alias, userIdStr); } catch {}
            }
            aliasSet = aliases;
            if (aliases.size > 0) {
                console.log(`🔗 Aliases registered for ${socket.id}: ${Array.from(aliases).join(', ')}`);
            }
        } catch {}
        socket.emit("registered", { userId: userIdStr, socketId: socket.id });

        // پس از ثبت، تماس‌های در انتظار را تحویل بده
        const flushKeys = new Set([userIdStr]);
        try { for (const a of aliasSet) flushKeys.add(String(a).toLowerCase()); } catch {}
        for (const key of flushKeys) {
            const queued = pendingIncomingByUserId.get(key);
            if (queued && queued.length > 0) {
                console.log(`📨 Delivering ${queued.length} queued incomingCall(s) to key=${key}`);
                for (const p of queued) {
                    emitToAnyKey([userIdStr, key], "incomingCall", p);
                }
                pendingIncomingByUserId.delete(key);
            }
        }
    });

    // whoami: برگشت userId استاندارد سرور برای دیباگ/هم‌ترازی کلاینت
    socket.on("whoami", async (data) => {
        let identity = data && (data.userId ?? data.id ?? data.identity);
        if (!identity) return socket.emit("whoami_response", { status: 'error', message: 'identity required' });
        const resolved = await findUserIdByIdentity(String(identity));
        if (resolved) socket.emit("whoami_response", { status: 'success', userId: String(resolved) });
        else socket.emit("whoami_response", { status: 'error', message: 'not_found' });
    });

    socket.on("callUser", (data) => {
        console.log(`📞 Call request from ${socket.id} to ${data.userToCall}`);

        // بررسی اینکه کاربر مقصد آنلاین هست یا نه
        if (activeUsers.has(data.userToCall)) {
            io.to(data.userToCall).emit("callUser", {
                signal: data.signalData,
                from: data.from,
                name: data.name
            });
        } else {
            socket.emit("userOffline", { userId: data.userToCall });
        }
    });

    socket.on("answerCall", (data) => {
        console.log(`✅ Call answered from ${socket.id} to ${data.to}`);
        io.to(data.to).emit("callAccepted", data.signal);
    });

    socket.on("callEnded", (data) => {
        console.log(`❌ Call ended by ${socket.id}`);
        socket.broadcast.emit("callEnded", { from: socket.id });
    });

    socket.on("rejectCall", (data) => {
        console.log(`🚫 Call rejected by ${socket.id}`);
        io.to(data.to).emit("callRejected", { from: socket.id });
    });

    // -------------------- WebRTC signaling by userId --------------------
    // شروع تماس (مشابه واتساپ/تلگرام)
    socket.on("startCall", async (payload) => {
        // payload: { toUserId?, toSocketId?, fromUserId, offer, callId?, callType? ('video'|'audio') }
        const { toUserId, toSocketId, fromUserId, offer } = payload || {};
        const callType = (payload && payload.callType) ? String(payload.callType) : 'video';
        if (!fromUserId || !offer) {
            return socket.emit("callError", { code: "BAD_REQUEST", message: "fromUserId and offer are required" });
        }
        if (!toUserId && !toSocketId) {
            return socket.emit("callError", { code: "MISSING_TARGET", message: "toUserId or toSocketId is required" });
        }
        const callId = (payload && payload.callId) || `${fromUserId}:${(toUserId || toSocketId)}:${Date.now()}`;
        let delivered = false;
        if (toUserId) {
            const incomingPayload = {
                callId,
                fromUserId: String(fromUserId),
                offer,
                callType,
                fromSocketId: socket.id
            };
            const toKey = String(toUserId);
            const numeric = isNumericId(toKey);
            if (numeric) {
                const sockets = userIdToSocketIds.get(toKey) || userIdToSocketIds.get(toKey.toLowerCase());
                console.log(`➡️ startCall target user=${toKey}, sockets=${sockets ? Array.from(sockets).join(',') : 'NONE'}`);
                delivered = emitToUser(toKey, "incomingCall", incomingPayload);
                // legacy mirror
                try {
                    const setOfSockets = userIdToSocketIds.get(toKey) || userIdToSocketIds.get(toKey.toLowerCase());
                    if (setOfSockets && setOfSockets.size > 0) {
                        for (const sid of setOfSockets) {
                            io.to(sid).emit("callUser", { signal: offer, from: socket.id, name: String(fromUserId) });
                        }
                    }
                } catch {}
                if (!delivered) {
                    const aliases = await getAliasKeysForUserId(toKey);
                    if (aliases && aliases.length > 0) {
                        delivered = emitToAnyKey(aliases, "incomingCall", incomingPayload);
                    }
                }
                if (!delivered) {
                    const arr = pendingIncomingByUserId.get(toKey) || [];
                    arr.push(incomingPayload);
                    pendingIncomingByUserId.set(toKey, arr);
                    console.warn(`⏳ startCall queued for user=${toKey}; will deliver on register`);
                }
            } else {
                // Treat toUserId as an identity/alias
                const identityLower = toKey.toLowerCase();
                delivered = emitToAnyKey([identityLower, toKey], "incomingCall", incomingPayload);
                if (!delivered) {
                    const arr = pendingIncomingByUserId.get(identityLower) || [];
                    arr.push(incomingPayload);
                    pendingIncomingByUserId.set(identityLower, arr);
                    console.warn(`⏳ startCall queued for alias=${identityLower}; will deliver on register`);
                }
            }
        } else if (toSocketId) {
            const incomingPayload = {
                callId,
                fromUserId: String(fromUserId),
                offer,
                callType,
                fromSocketId: socket.id
            };
            delivered = emitToSocketId(String(toSocketId), "incomingCall", incomingPayload);
            // legacy mirror
            try { io.to(String(toSocketId)).emit("callUser", { signal: offer, from: socket.id, name: String(fromUserId) }); } catch {}
        }
        if (!delivered && !toUserId) {
            console.warn(`⚠️ startCall not delivered. toUserId=${toUserId || '-'} toSocketId=${toSocketId || '-'}`);
            return socket.emit("userOffline", { userId: toUserId ? String(toUserId) : undefined, socketId: toSocketId ? String(toSocketId) : undefined });
        }
        console.log(`📲 startCall: ${fromUserId} -> ${(toUserId || toSocketId)} (callId=${callId}, type=${callType})`);
        try { await logCallStarted(callId, fromUserId, (toUserId || toSocketId || null), callType); } catch {}
    });

    // پذیرش تماس
    socket.on("acceptCall", async (payload) => {
        // payload: { callId, toUserId? (caller), toSocketId?, fromUserId (callee), answer, callType? }
        const { callId, toUserId, toSocketId, fromUserId, answer } = payload || {};
        const callType = (payload && payload.callType) ? String(payload.callType) : null;
        if (!fromUserId || !answer) {
            return socket.emit("callError", { code: "BAD_REQUEST", message: "fromUserId and answer are required" });
        }
        if (!toUserId && !toSocketId) {
            return socket.emit("callError", { code: "MISSING_TARGET", message: "toUserId or toSocketId is required" });
        }
        let delivered = false;
        if (toUserId) {
            delivered = emitToAnyKey([String(toUserId)], "callAccepted", {
                callId: callId || null,
                fromUserId: String(fromUserId),
                answer,
                callType
            });
        } else if (toSocketId) {
            delivered = emitToSocketId(String(toSocketId), "callAccepted", {
                callId: callId || null,
                fromUserId: String(fromUserId),
                answer,
                callType
            });
        }
        if (!delivered) {
            return socket.emit("userOffline", { userId: toUserId ? String(toUserId) : undefined, socketId: toSocketId ? String(toSocketId) : undefined });
        }
        console.log(`🟢 acceptCall: ${fromUserId} -> ${(toUserId || toSocketId)} (callId=${callId || "-"})`);
        try { if (callId) await logCallAccepted(callId); } catch {}
    });

    // رد تماس (نسخه مبتنی بر userId برای جلوگیری از تداخل با نسخه legacy)
    socket.on("rejectCallUser", async (payload) => {
        // payload: { callId, toUserId? (caller), toSocketId?, fromUserId (callee), reason? }
        const { callId, toUserId, toSocketId, fromUserId, reason } = payload || {};
        if (!fromUserId) {
            return socket.emit("callError", { code: "BAD_REQUEST", message: "fromUserId is required" });
        }
        if (!toUserId && !toSocketId) {
            return socket.emit("callError", { code: "MISSING_TARGET", message: "toUserId or toSocketId is required" });
        }
        let delivered = false;
        if (toUserId) {
            delivered = emitToAnyKey([String(toUserId)], "callRejected", {
                callId: callId || null,
                fromUserId: String(fromUserId),
                reason: reason || null
            });
        } else if (toSocketId) {
            delivered = emitToSocketId(String(toSocketId), "callRejected", {
                callId: callId || null,
                fromUserId: String(fromUserId),
                reason: reason || null
            });
        }
        if (!delivered) {
            return socket.emit("userOffline", { userId: toUserId ? String(toUserId) : undefined, socketId: toSocketId ? String(toSocketId) : undefined });
        }
        console.log(`🔴 rejectCall: ${fromUserId} -> ${(toUserId || toSocketId)} (callId=${callId || "-"})`);
        try { if (callId) await logCallRejected(callId); } catch {}
    });

    // تبادل ICE Candidate
    socket.on("iceCandidate", (payload) => {
        // payload: { toUserId?, toSocketId?, fromUserId, candidate }
        const { toUserId, toSocketId, fromUserId, candidate } = payload || {};
        if (!fromUserId || !candidate) {
            return socket.emit("callError", { code: "BAD_REQUEST", message: "fromUserId and candidate are required" });
        }
        if (!toUserId && !toSocketId) {
            return socket.emit("callError", { code: "MISSING_TARGET", message: "toUserId or toSocketId is required" });
        }
        let delivered = false;
        if (toUserId) {
            delivered = emitToAnyKey([String(toUserId)], "iceCandidate", {
                fromUserId: String(fromUserId),
                candidate
            }, { excludeSocketId: socket.id });
        } else if (toSocketId) {
            delivered = emitToSocketId(String(toSocketId), "iceCandidate", {
                fromUserId: String(fromUserId),
                candidate
            });
        }
        if (!delivered) {
            return socket.emit("userOffline", { userId: toUserId ? String(toUserId) : undefined, socketId: toSocketId ? String(toSocketId) : undefined });
        }
    });

    // پایان تماس
    socket.on("hangupCall", async (payload) => {
        // payload: { toUserId?, toSocketId?, fromUserId, callId? }
        const { toUserId, toSocketId, fromUserId, callId } = payload || {};
        if (!fromUserId) {
            return socket.emit("callError", { code: "BAD_REQUEST", message: "fromUserId is required" });
        }
        if (!toUserId && !toSocketId) {
            return socket.emit("callError", { code: "MISSING_TARGET", message: "toUserId or toSocketId is required" });
        }
        if (toUserId) {
            emitToAnyKey([String(toUserId)], "callEnded", {
                callId: callId || null,
                fromUserId: String(fromUserId)
            });
        } else if (toSocketId) {
            emitToSocketId(String(toSocketId), "callEnded", {
                callId: callId || null,
                fromUserId: String(fromUserId)
            });
        }
        console.log(`⬛ hangupCall: ${fromUserId} -> ${(toUserId || toSocketId)} (callId=${callId || "-"})`);
        try { if (callId) await logCallEnded(callId); } catch {}
    });

    socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        activeUsers.delete(socket.id);
        // پاکسازی نگاشت‌های userId<->socketId
        const userId = socketIdToUserId.get(socket.id);
        if (userId) {
            const setOfSockets = userIdToSocketIds.get(userId);
            if (setOfSockets) {
                setOfSockets.delete(socket.id);
                if (setOfSockets.size === 0) {
                    userIdToSocketIds.delete(userId);
                }
            }
            socketIdToUserId.delete(socket.id);
        }
        socket.broadcast.emit("userLeft", socket.id);
        socket.broadcast.emit("callEnded");
    });

    socket.on("error", (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
    });
});

// اضافه کردن یک روت ساده برای چک کردن وضعیت سرور
app.get("/", (req, res) => {
    res.json({
        status: "running",
        onlineUsers: activeUsers.size,
        timestamp: new Date().toISOString()
    });
});

// Debug: show current userId<->socketId registrations
app.get("/debug/registrations", (req, res) => {
    const users = Array.from(userIdToSocketIds.entries()).map(([userId, setOfSockets]) => ({ userId, sockets: Array.from(setOfSockets.values()) }));
    const sockets = Array.from(socketIdToUserId.entries()).map(([socketId, userId]) => ({ socketId, userId }));
    res.json({ users, sockets });
});

// ------------------- DB-backed user resolver (SQLite) -------------------
// Set your SQLite DB path here (Windows path supported)
const DB_PATH = process.env.DB_PATH || "C:/Users/HOME/Desktop/ProjectAP/ProjectAP/Database/app_database.db";
let sqliteDb = null;
let sqliteStatus = { initialized: false, path: DB_PATH, exists: null, error: null };
try {
    const sqlite3 = require('sqlite3').verbose();
    if (!DB_PATH) {
        console.warn('DB_PATH not set. Using in-memory identity map fallback.');
        sqliteStatus.error = 'DB_PATH not set';
    }
    if (DB_PATH) {
        const exists = fs.existsSync(DB_PATH);
        sqliteStatus.exists = exists;
        if (!exists) {
            console.warn('SQLite file does not exist at path:', DB_PATH);
        }
        sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Failed to open SQLite DB at', DB_PATH, err.message);
                sqliteStatus.error = err.message || String(err);
            } else {
                console.log('✅ SQLite connected at', DB_PATH);
                sqliteStatus.initialized = true;
                try { initializeCallLogsSchema(); } catch (e) { console.error('Failed to ensure call_logs schema', e && e.message); }
            }
        });
    }
} catch (e) {
    console.warn('sqlite3 not installed; using in-memory identity map fallback.');
    sqliteStatus.error = 'sqlite3 not installed';
}

async function findUserIdByIdentity(identity) {
    const value = String(identity || '').trim();
    if (!value) return null;
    // If the identity looks like a numeric id, accept it directly
    if (/^\d+$/.test(value)) {
        return String(value);
    }
    // If SQLite is available and path configured, query it
    if (sqliteDb) {
        const rowGet = (sql, params) => new Promise((resolve) => {
            sqliteDb.get(sql, params, (err, row) => {
                if (err) return resolve({ err, row: null });
                resolve({ err: null, row: row || null });
            });
        });
        const allGet = (sql, params = []) => new Promise((resolve) => {
            sqliteDb.all(sql, params, (err, rows) => {
                if (err) return resolve({ err, rows: [] });
                resolve({ err: null, rows: rows || [] });
            });
        });

        // 1) Explicit schema: users(id, email, username, customUrl/custom_url) with case-insensitive match
        {
            const { err, row } = await rowGet(
                `SELECT id FROM users 
                 WHERE email = ? COLLATE NOCASE 
                    OR username = ? COLLATE NOCASE 
                    OR customUrl = ? COLLATE NOCASE 
                    OR custom_url = ? COLLATE NOCASE 
                 LIMIT 1`,
                [value, value, value, value]
            );
            if (!err && row && (row.id !== undefined && row.id !== null)) return String(row.id);
            // If table exists but returns no row, fall through to autodetect
        }

        // 2) Auto-detect table and columns
        try {
            const { rows: tables } = await allGet(`SELECT name FROM sqlite_master WHERE type='table'`);
            for (const t of tables) {
                const tableName = t && t.name;
                if (!tableName) continue;
                // Skip SQLite internal tables
                if (String(tableName).startsWith('sqlite_')) continue;
                const { rows: cols } = await allGet(`PRAGMA table_info(${tableName})`);
                const colNames = cols.map(c => String(c.name || '').toLowerCase());
                const hasEmail = colNames.includes('email');
                const hasUsername = colNames.includes('username') || colNames.includes('user_name');
                const hasCustom = colNames.includes('customurl') || colNames.includes('custom_url');
                const idCol = colNames.includes('id') ? 'id' : (colNames.includes('user_id') ? 'user_id' : null);
                if (!idCol || (!hasEmail && !hasUsername && !hasCustom)) continue;
                const whereParts = [];
                const params = [];
                if (hasEmail) { whereParts.push('email = ? COLLATE NOCASE'); params.push(value); }
                if (hasUsername) { whereParts.push((colNames.includes('username') ? 'username' : 'user_name') + ' = ? COLLATE NOCASE'); params.push(value); }
                if (hasCustom) { whereParts.push((colNames.includes('customurl') ? 'customUrl' : 'custom_url') + ' = ? COLLATE NOCASE'); params.push(value); }
                const sql = `SELECT ${idCol} as resolved_id FROM ${tableName} WHERE ${whereParts.join(' OR ')} LIMIT 1`;
                const { err, row } = await rowGet(sql, params);
                if (!err && row && (row.resolved_id !== undefined && row.resolved_id !== null)) return String(row.resolved_id);
            }
        } catch (e) {
            console.error('SQLite autodetect error:', e.message);
        }
        return null;
    }
    // Fallback to in-memory map if DB not configured
    return identityToUserId.get(value) || null;
}

// Temporary in-memory map for development fallback; you can seed here
const identityToUserId = new Map();

app.use(express.json());
app.post('/resolve-user', async (req, res) => {
    try {
        const identity = String(req.body?.identity || '').trim();
        if (!identity) return res.status(400).json({ status: 'error', message: 'identity required' });
        // Resolve via SQLite (or fallback map)
        const userId = await findUserIdByIdentity(identity);
        if (!userId) return res.status(404).json({ status: 'error', message: 'not_found' });
        return res.json({ status: 'success', userId: String(userId) });
    } catch (e) {
        console.error('resolve-user error', e);
        return res.status(500).json({ status: 'error', message: 'internal_error' });
    }
});

// --- Debug endpoints for DB health/logging ---
app.get('/debug/db', (req, res) => {
    res.json({
        status: sqliteDb ? 'available' : 'unavailable',
        sqliteStatus,
    });
});

app.get('/debug/resolve', async (req, res) => {
    const identity = String(req.query.identity || '').trim();
    if (!identity) return res.status(400).json({ status: 'error', message: 'identity query required' });
    try {
        const userId = await findUserIdByIdentity(identity);
        if (!userId) return res.status(404).json({ status: 'error', message: 'not_found' });
        return res.json({ status: 'success', identity, userId });
    } catch (e) {
        return res.status(500).json({ status: 'error', message: e.message || 'internal_error' });
    }
});

// ------------------- Call Logs (SQLite) -------------------
function initializeCallLogsSchema() {
    if (!sqliteDb) return;
    const ddl = [
        `CREATE TABLE IF NOT EXISTS call_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            call_id TEXT UNIQUE,
            from_user_id TEXT,
            to_user_id TEXT,
            call_type TEXT,
            status TEXT,
            started_at INTEGER,
            accepted_at INTEGER,
            ended_at INTEGER,
            duration_sec INTEGER,
            extra_json TEXT
        )`,
        `CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id)`,
        `CREATE INDEX IF NOT EXISTS idx_call_logs_users ON call_logs(from_user_id, to_user_id)`
    ];
    sqliteDb.serialize(() => { ddl.forEach((sql) => sqliteDb.run(sql)); });
}

function runDb(sql, params = []) {
    return new Promise((resolve) => {
        if (!sqliteDb) return resolve({ err: 'db_unavailable' });
        sqliteDb.run(sql, params, function (err) {
            resolve({ err: err || null, changes: this && this.changes, lastID: this && this.lastID });
        });
    });
}

function getDb(sql, params = []) {
    return new Promise((resolve) => {
        if (!sqliteDb) return resolve({ err: 'db_unavailable', row: null });
        sqliteDb.get(sql, params, (err, row) => resolve({ err: err || null, row: row || null }));
    });
}

function allDb(sql, params = []) {
    return new Promise((resolve) => {
        if (!sqliteDb) return resolve({ err: 'db_unavailable', rows: [] });
        sqliteDb.all(sql, params, (err, rows) => resolve({ err: err || null, rows: rows || [] }));
    });
}

async function logCallStarted(callId, fromUserId, toUserId, callType) {
    if (!sqliteDb || !callId) return;
    const now = Date.now();
    await runDb(
        `INSERT OR IGNORE INTO call_logs (call_id, from_user_id, to_user_id, call_type, status, started_at)
         VALUES (?, ?, ?, ?, 'started', ?)`,
        [String(callId), String(fromUserId || ''), String(toUserId || ''), String(callType || 'video'), now]
    );
}

async function logCallAccepted(callId) {
    if (!sqliteDb || !callId) return;
    const ts = Date.now();
    await runDb(
        `UPDATE call_logs SET status = 'accepted', accepted_at = COALESCE(accepted_at, ?) WHERE call_id = ?`,
        [ts, String(callId)]
    );
}

async function logCallRejected(callId) {
    if (!sqliteDb || !callId) return;
    const ts = Date.now();
    await runDb(
        `UPDATE call_logs SET status = 'rejected', ended_at = COALESCE(ended_at, ?), duration_sec = 0 WHERE call_id = ?`,
        [ts, String(callId)]
    );
}

async function logCallEnded(callId) {
    if (!sqliteDb || !callId) return;
    const ts = Date.now();
    const { row } = await getDb(`SELECT started_at, accepted_at, status FROM call_logs WHERE call_id = ?`, [String(callId)]);
    let durationSec = null;
    let status = 'ended';
    if (row && row.started_at) {
        durationSec = Math.max(0, Math.floor((ts - (row.accepted_at || row.started_at)) / 1000));
        if (!row.accepted_at && (row.status === 'started' || row.status === 'rejected')) {
            status = row.status === 'rejected' ? 'rejected' : 'missed';
            durationSec = 0;
        }
    }
    await runDb(
        `UPDATE call_logs SET status = ?, ended_at = COALESCE(ended_at, ?), duration_sec = COALESCE(duration_sec, ?) WHERE call_id = ?`,
        [status, ts, durationSec, String(callId)]
    );
}

// GET /call-logs?userId=123&limit=50
app.get('/call-logs', async (req, res) => {
    try {
        if (!sqliteDb) return res.status(503).json({ status: 'error', message: 'db_unavailable' });
        const userId = String(req.query.userId || '').trim();
        if (!userId) return res.status(400).json({ status: 'error', message: 'userId required' });
        const limit = Math.max(1, Math.min(200, parseInt(String(req.query.limit || '50'), 10) || 50));
        const { err, rows } = await allDb(
            `SELECT id, call_id, from_user_id, to_user_id, call_type, status, started_at, accepted_at, ended_at, duration_sec
             FROM call_logs
             WHERE from_user_id = ? OR to_user_id = ?
             ORDER BY started_at DESC
             LIMIT ?`,
            [userId, userId, limit]
        );
        if (err) return res.status(500).json({ status: 'error', message: String(err) });
        return res.json({ status: 'success', logs: rows || [] });
    } catch (e) {
        return res.status(500).json({ status: 'error', message: e.message || 'internal_error' });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🌐 Socket.IO server ready for connections`);
});