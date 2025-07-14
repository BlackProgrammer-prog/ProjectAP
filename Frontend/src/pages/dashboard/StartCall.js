

// ===========================================================

import React, { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import {
    Box,
    Button,
    IconButton,
    TextField,
    Typography,
    Stack,
    Grid,
    Paper,
    Card,
    CardContent,
    Divider,
} from "@mui/material";
import {
    Assignment as AssignmentIcon,
    Phone as PhoneIcon,
    CallEnd as CallEndIcon,
} from "@mui/icons-material";

// const socket = io.connect("http://localhost:5000");

// const socket = io.connect("http://localhost:5000", {
//     withCredentials: true,
//     extraHeaders: {
//         "my-custom-header": "abcd"
//     }
// });
const socket = io.connect("http://localhost:5000", {
    withCredentials: true
});


const VideoCallApp = () => {
    const [me, setMe] = useState("");
    const [stream, setStream] = useState();
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [idToCall, setIdToCall] = useState("");
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    // useEffect(() => {
    //     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    //         .then((stream) => {
    //             setStream(stream);
    //             if (myVideo.current) {
    //                 myVideo.current.srcObject = stream;
    //             }
    //         })
    //         .catch(err => console.error("Error accessing media devices:", err));

    //     socket.on("me", (id) => {
    //         setMe(id);
    //     });

    //     socket.on("callUser", (data) => {
    //         setReceivingCall(true);
    //         setCaller(data.from);
    //         setName(data.name);
    //         setCallerSignal(data.signal);
    //     });

    //     return () => {
    //         if (stream) {
    //             stream.getTracks().forEach(track => track.stop());
    //         }
    //         socket.off("me");
    //         socket.off("callUser");
    //     };
    // }, []);



    useEffect(() => {
        // اطمینان از اینکه اتصال socket برقرار هست
        if (!socket.connected) {
            socket.connect();
        }

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setStream(stream);
                if (myVideo.current) {
                    myVideo.current.srcObject = stream;
                }
            })
            .catch(err => console.error("Error accessing media devices:", err));

        // تمیز کردن لیسنرهای قبلی برای جلوگیری از duplicate
        socket.off("me");
        socket.off("callUser");
        socket.off("callEnded");
        socket.off("userOffline");
        socket.off("callRejected");

        socket.on("me", (id) => {
            console.log("Received new ID:", id);
            setMe(id);
        });

        socket.on("callUser", (data) => {
            setReceivingCall(true);
            setCaller(data.from);
            setName(data.name);
            setCallerSignal(data.signal);
        });

        socket.on("callEnded", () => {
            setCallEnded(true);
            if (connectionRef.current) {
                connectionRef.current.destroy();
            }
        });

        socket.on("userOffline", (data) => {
            alert(`User ${data.userId} is offline`);
        });

        socket.on("callRejected", (data) => {
            alert(`Call rejected by user ${data.from}`);
        });

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            socket.off("me");
            socket.off("callUser");
            socket.off("callEnded");
            socket.off("userOffline");
            socket.off("callRejected");
        };
    }, []); // خالی گذاشتن dependency array برای اجرا در هر رندر

    const callUser = (id) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream
        });

        peer.on("signal", (data) => {
            socket.emit("callUser", {
                userToCall: id,
                signalData: data,
                from: me,
                name: name
            });
        });

        peer.on("stream", (stream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }
        });

        socket.on("callAccepted", (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
    };

    const answerCall = () => {
        setCallAccepted(true);
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        });

        peer.on("signal", (data) => {
            socket.emit("answerCall", { signal: data, to: caller });
        });

        peer.on("stream", (stream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }
        });

        peer.signal(callerSignal);
        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        connectionRef.current.destroy();
        window.location.reload();
    };

    return (
        <Stack sx={{ position: 'absolute', left: "108px", minHeight: "100vh", backgroundColor: "#f5f5f5", }}>
            <Box sx={{ p: 3 }}>
                <Grid container justifyContent="center" spacing={3}>
                    <Grid sx={{ left: "150px" }} item xs={12}>
                        <Typography variant="h3" component="h1" align="center" gutterBottom color="primary" sx={{ fontWeight: "bold" }}>
                            Video Call App
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h6" gutterBottom>
                                            Your Camera
                                        </Typography>
                                        <Box sx={{ width: "100%", height: "300px", backgroundColor: "black", borderRadius: 2, overflow: "hidden" }}>
                                            {stream && (
                                                <video
                                                    playsInline
                                                    muted
                                                    ref={myVideo}
                                                    autoPlay
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            )}
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h6" gutterBottom>
                                            Remote Camera
                                        </Typography>
                                        <Box sx={{ width: "100%", height: "300px", backgroundColor: "black", borderRadius: 2, overflow: "hidden" }}>
                                            {callAccepted && !callEnded ? (
                                                <video
                                                    playsInline
                                                    ref={userVideo}
                                                    autoPlay
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <Box display="flex" alignItems="center" justifyContent="center" height="100%" color="white">
                                                    <Typography>Waiting for connection...</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Stack spacing={3}>
                                    <TextField
                                        fullWidth
                                        label="Your Name"
                                        variant="outlined"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />

                                    <Divider />

                                    <Box>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Your ID:
                                        </Typography>
                                        <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                            {me || "Generating ID..."}
                                        </Typography>
                                        <CopyToClipboard text={me}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                startIcon={<AssignmentIcon />}
                                                disabled={!me}
                                                sx={{ mt: 1 }}
                                            >
                                                Copy Your ID
                                            </Button>
                                        </CopyToClipboard>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <TextField
                                            fullWidth
                                            label="ID to Call"
                                            variant="outlined"
                                            value={idToCall}
                                            onChange={(e) => setIdToCall(e.target.value)}
                                        />
                                        {callAccepted && !callEnded ? (
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="error"
                                                startIcon={<CallEndIcon />}
                                                onClick={leaveCall}
                                                size="large"
                                                sx={{ mt: 2 }}
                                            >
                                                End Call
                                            </Button>
                                        ) : (
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="primary"
                                                startIcon={<PhoneIcon />}
                                                onClick={() => callUser(idToCall)}
                                                disabled={!idToCall}
                                                size="large"
                                                sx={{ mt: 2 }}
                                            >
                                                Call
                                            </Button>
                                        )}
                                    </Box>

                                    {receivingCall && !callAccepted && (
                                        <Paper elevation={3} sx={{ p: 2, backgroundColor: "primary.light" }}>
                                            <Typography variant="h6" gutterBottom>
                                                Incoming Call from {name}
                                            </Typography>
                                            <Stack direction="row" spacing={2}>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    onClick={answerCall}
                                                    fullWidth
                                                >
                                                    Answer
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    onClick={() => setReceivingCall(false)}
                                                    fullWidth
                                                >
                                                    Decline
                                                </Button>
                                            </Stack>
                                        </Paper>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Stack>
    );
};

export default VideoCallApp;