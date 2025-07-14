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

    socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        activeUsers.delete(socket.id);
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🌐 Socket.IO server ready for connections`);
});