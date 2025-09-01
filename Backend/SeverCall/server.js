// const express = require("express")
// const http = require("http")
// const app = express()
// const server = http.createServer(app)
// const io = require("socket.io")(server, {
//     cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"]
//     }
// })

// io.on("connection", (socket) => {
//     socket.emit("me", socket.id)

//     socket.on("disconnect", () => {
//         socket.broadcast.emit("callEnded")
//     })

//     socket.on("callUser", (data) => {
//         io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
//     })

//     socket.on("answerCall", (data) => {
//         io.to(data.to).emit("callAccepted", data.signal)
//     })
// })

// server.listen(5000, () => console.log("server is running on port 5000"))

// .......................................................

// const express = require("express");
// const http = require("http");
// const app = express();
// const server = http.createServer(app);
// const io = require("socket.io")(server, {
//     cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"],
//         credentials: true
//     }
// });


// // ذخیره کاربران متصل
// const users = {};

// io.on("connection", (socket) => {
//     console.log(`New client connected: ${socket.id}`);

//     // ذخیره اطلاعات کاربر
//     socket.on("registerUser", (name) => {
//         users[socket.id] = { name, id: socket.id };
//         console.log(`User registered: ${name} (${socket.id})`);
//     });

//     // ارسال ID به کلاینت
//     socket.emit("me", socket.id);

//     socket.on("disconnect", () => {
//         console.log(`Client disconnected: ${socket.id}`);
//         delete users[socket.id];
//         socket.broadcast.emit("callEnded");
//     });

//     socket.on("callUser", (data) => {
//         console.log(`Call from ${data.from} to ${data.userToCall}`);
//         io.to(data.userToCall).emit("callUser", {
//             signal: data.signalData,
//             from: data.from,
//             name: data.name
//         });
//     });

//     socket.on("answerCall", (data) => {
//         console.log(`Call answered by ${data.to}`);
//         io.to(data.to).emit("callAccepted", data.signal);
//     });

//     socket.on("endCall", (data) => {
//         io.to(data.to).emit("callEnded");
//     });
// });

// server.listen(5000, () => console.log("Server is running on port 5000"));
// =========================================================================================
// server.js
// const express = require("express");
// const http = require("http");
// const cors = require("cors");
// const app = express();

// app.use(cors({
//     origin: "http://localhost:3000",
//     credentials: true
// }));

// const server = http.createServer(app);

// const io = require("socket.io")(server, {
//     cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"],
//         credentials: true
//     }
// });

// io.on("connection", (socket) => {
//     console.log(`New client connected: ${socket.id}`);
//     socket.emit("me", socket.id);

//     socket.on("callUser", (data) => {
//         io.to(data.userToCall).emit("callUser", {
//             signal: data.signalData,
//             from: data.from,
//             name: data.name
//         });
//     });

//     socket.on("answerCall", (data) => {
//         io.to(data.to).emit("callAccepted", data.signal);
//     });

//     socket.on("disconnect", () => {
//         socket.broadcast.emit("callEnded");
//     });
// });

// server.listen(5000, () => console.log("✅ Server is running on port 5000"));

// =========================================================================

const express = require("express");
const http = require("http");
const cors = require("cors");
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
// ضد-تکرار رویدادها برای جلوگیری از چندبار ارسال ناخواسته
const recentEventKeys = new Map(); // key -> lastTs

function isDuplicateEventKey(key, ttlMs = 2000) {
    const now = Date.now();
    const last = recentEventKeys.get(key) || 0;
    if (now - last < ttlMs) return true;
    recentEventKeys.set(key, now);
    return false;
}

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
    socket.on("register", (data) => {
        const userId = data && (data.userId ?? data.id);
        if (!userId) {
            return socket.emit("registerError", { message: "userId is required" });
        }
        const userIdStr = String(userId);
        // از ثبت تکراری برای همان ساکت جلوگیری می‌کنیم
        const already = socketIdToUserId.get(socket.id);
        if (already === userIdStr) {
            return; // قبلا ثبت شده
        }
        socketIdToUserId.set(socket.id, userIdStr);
        if (!userIdToSocketIds.has(userIdStr)) {
            userIdToSocketIds.set(userIdStr, new Set());
        }
        userIdToSocketIds.get(userIdStr).add(socket.id);
        console.log(`👤 Registered userId=${userIdStr} for socket=${socket.id}`);
        socket.emit("registered", { userId: userIdStr, socketId: socket.id });
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
    socket.on("startCall", (payload) => {
        // payload: { toUserId?, toSocketId?, fromUserId, offer, callId? }
        const { toUserId, toSocketId, fromUserId, offer } = payload || {};
        if (!fromUserId || !offer) {
            return socket.emit("callError", { code: "BAD_REQUEST", message: "fromUserId and offer are required" });
        }
        if (!toUserId && !toSocketId) {
            return socket.emit("callError", { code: "MISSING_TARGET", message: "toUserId or toSocketId is required" });
        }
        const callId = (payload && payload.callId) || `${fromUserId}:${(toUserId || toSocketId)}:${Date.now()}`;
        // لاگِ مقصد تماس برای اشکال‌زدایی
        if (toUserId) {
            const set = userIdToSocketIds.get(String(toUserId));
            const list = set ? Array.from(set).join(',') : '';
            console.log(`➡️ startCall target user=${toUserId}, sockets=${list}`);
        }

        let delivered = false;
        if (toUserId) {
            delivered = emitToUser(String(toUserId), "incomingCall", {
                callId,
                fromUserId: String(fromUserId),
                offer,
                fromSocketId: socket.id
            });
        } else if (toSocketId) {
            delivered = emitToSocketId(String(toSocketId), "incomingCall", {
                callId,
                fromUserId: String(fromUserId),
                offer,
                fromSocketId: socket.id
            });
        }
        if (!delivered) {
            return socket.emit("userOffline", { userId: toUserId ? String(toUserId) : undefined, socketId: toSocketId ? String(toSocketId) : undefined });
        }
        console.log(`📲 startCall: ${fromUserId} -> ${(toUserId || toSocketId)} (callId=${callId})`);
    });

    // پذیرش تماس
    socket.on("acceptCall", (payload) => {
        // payload: { callId, toUserId? (caller), toSocketId?, fromUserId (callee), answer }
        const { callId, toUserId, toSocketId, fromUserId, answer } = payload || {};
        if (!fromUserId || !answer) {
            return socket.emit("callError", { code: "BAD_REQUEST", message: "fromUserId and answer are required" });
        }
        if (!toUserId && !toSocketId) {
            return socket.emit("callError", { code: "MISSING_TARGET", message: "toUserId or toSocketId is required" });
        }
        let delivered = false;
        if (toUserId) {
            delivered = emitToUser(String(toUserId), "callAccepted", {
                callId: callId || null,
                fromUserId: String(fromUserId),
                answer
            });
        } else if (toSocketId) {
            delivered = emitToSocketId(String(toSocketId), "callAccepted", {
                callId: callId || null,
                fromUserId: String(fromUserId),
                answer
            });
        }
        if (!delivered) {
            return socket.emit("userOffline", { userId: toUserId ? String(toUserId) : undefined, socketId: toSocketId ? String(toSocketId) : undefined });
        }
        console.log(`🟢 acceptCall: ${fromUserId} -> ${(toUserId || toSocketId)} (callId=${callId || "-"})`);
    });

    // رد تماس (نسخه مبتنی بر userId برای جلوگیری از تداخل با نسخه legacy)
    socket.on("rejectCallUser", (payload) => {
        // payload: { callId, toUserId? (caller), toSocketId?, fromUserId (callee), reason? }
        const { callId, toUserId, toSocketId, fromUserId, reason } = payload || {};
        if (!fromUserId) {
            return socket.emit("callError", { code: "BAD_REQUEST", message: "fromUserId is required" });
        }
        if (!toUserId && !toSocketId) {
            return socket.emit("callError", { code: "MISSING_TARGET", message: "toUserId or toSocketId is required" });
        }
        // ضد-تکرار رد تماس (برخی کلاینت‌ها دوبار می‌فرستند)
        const dupKey = JSON.stringify({ ev: 'reject', callId: callId || null, toUserId: toUserId || null, toSocketId: toSocketId || null, fromUserId: fromUserId || null });
        if (isDuplicateEventKey(dupKey)) {
            return;
        }

        let delivered = false;
        if (toUserId) {
            delivered = emitToUser(String(toUserId), "callRejected", {
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
            delivered = emitToUser(String(toUserId), "iceCandidate", {
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
    socket.on("hangupCall", (payload) => {
        // payload: { toUserId?, toSocketId?, fromUserId, callId? }
        const { toUserId, toSocketId, fromUserId, callId } = payload || {};
        if (!fromUserId) {
            return socket.emit("callError", { code: "BAD_REQUEST", message: "fromUserId is required" });
        }
        if (!toUserId && !toSocketId) {
            return socket.emit("callError", { code: "MISSING_TARGET", message: "toUserId or toSocketId is required" });
        }
        // ضد-تکرار پایان تماس
        const dupKey = JSON.stringify({ ev: 'hangup', callId: callId || null, toUserId: toUserId || null, toSocketId: toSocketId || null, fromUserId: fromUserId || null });
        if (isDuplicateEventKey(dupKey)) {
            return;
        }

        if (toUserId) {
            emitToUser(String(toUserId), "callEnded", {
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
        // از ارسال callEnded همگانی خودداری می‌کنیم؛ فقط userLeft کافی است
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🌐 Socket.IO server ready for connections`);
});