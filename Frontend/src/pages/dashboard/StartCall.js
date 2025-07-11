// import React, { useEffect, useRef, useState } from "react";
// import {
//     Button,
//     IconButton,
//     TextField,
//     Card,
//     CardContent,
//     Typography,
//     Box,
//     Paper,
//     Avatar,
//     CircularProgress,
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogActions
// } from '@mui/material';
// import {
//     Assignment as AssignmentIcon,
//     Phone as PhoneIcon,
//     Videocam as VideocamIcon,
//     VideocamOff as VideocamOffIcon,
//     Mic as MicIcon,
//     MicOff as MicOffIcon,
//     CallEnd as CallEndIcon,
//     Person as PersonIcon
// } from '@mui/icons-material';
// import { CopyToClipboard } from "react-copy-to-clipboard";
// import Peer from "simple-peer";
// import io from "socket.io-client";

// const socket = io.connect('http://localhost:5000');

// const StartCall = () => {
//     const [me, setMe] = useState("");
//     const [stream, setStream] = useState();
//     const [receivingCall, setReceivingCall] = useState(false);
//     const [caller, setCaller] = useState("");
//     const [callerSignal, setCallerSignal] = useState();
//     const [callAccepted, setCallAccepted] = useState(false);
//     const [idToCall, setIdToCall] = useState("");
//     const [callEnded, setCallEnded] = useState(false);
//     const [name, setName] = useState("");
//     const [videoEnabled, setVideoEnabled] = useState(true);
//     const [audioEnabled, setAudioEnabled] = useState(true);
//     const [callDialogOpen, setCallDialogOpen] = useState(false);

//     const myVideo = useRef();
//     const userVideo = useRef();
//     const connectionRef = useRef();

//     useEffect(() => {
//         navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
//             setStream(stream);
//             if (myVideo.current) {
//                 myVideo.current.srcObject = stream;
//             }
//         }).catch(err => {
//             console.error("Failed to get media devices", err);
//         });

//         socket.on("me", (id) => {
//             setMe(id);
//         });

//         socket.on("callUser", (data) => {
//             setReceivingCall(true);
//             setCaller(data.from);
//             setName(data.name);
//             setCallerSignal(data.signal);
//             setCallDialogOpen(true);
//         });
//     }, []);

//     const callUser = (id) => {
//         const peer = new Peer({
//             initiator: true,
//             trickle: false,
//             stream: stream
//         });

//         peer.on("signal", (data) => {
//             socket.emit("callUser", {
//                 userToCall: id,
//                 signalData: data,
//                 from: me,
//                 name: name
//             });
//         });

//         peer.on("stream", (stream) => {
//             if (userVideo.current) {
//                 userVideo.current.srcObject = stream;
//             }
//         });

//         socket.on("callAccepted", (signal) => {
//             setCallAccepted(true);
//             peer.signal(signal);
//         });

//         connectionRef.current = peer;
//     };

//     const answerCall = () => {
//         setCallAccepted(true);
//         setCallDialogOpen(false);
//         const peer = new Peer({
//             initiator: false,
//             trickle: false,
//             stream: stream
//         });

//         peer.on("signal", (data) => {
//             socket.emit("answerCall", { signal: data, to: caller });
//         });

//         peer.on("stream", (stream) => {
//             if (userVideo.current) {
//                 userVideo.current.srcObject = stream;
//             }
//         });

//         peer.signal(callerSignal);
//         connectionRef.current = peer;
//     };

//     const leaveCall = () => {
//         setCallEnded(true);
//         connectionRef.current.destroy();
//     };

//     const toggleVideo = () => {
//         if (stream) {
//             const videoTracks = stream.getVideoTracks();
//             videoTracks.forEach(track => {
//                 track.enabled = !track.enabled;
//             });
//             setVideoEnabled(!videoEnabled);
//         }
//     };

//     const toggleAudio = () => {
//         if (stream) {
//             const audioTracks = stream.getAudioTracks();
//             audioTracks.forEach(track => {
//                 track.enabled = !track.enabled;
//             });
//             setAudioEnabled(!audioEnabled);
//         }
//     };

//     return (
//         // sx={{
//         //     display: 'flex',
//         //     flexDirection: 'column',
//         //     alignItems: 'center',
//         //     justifyContent: 'center',
//         //     minHeight: '100vh',
//         //     backgroundColor: '#f5f5f5',
//         //     padding: 2
//         // }}
//         <Box sx={{
//             position: 'absolute',
//             left: '110px',
//             alignItems: 'center',
//             justifyContent: 'center',
//             minHeight: '100vh',
//             padding: 2
//         }}>
//             <Typography variant="h3" component="h1" gutterBottom sx={{
//                 mb: 4,
//                 color: 'primary.main',
//                 fontWeight: 'bold'
//             }}>
//                 VideoCall
//             </Typography>

//             <Box sx={{
//                 display: 'flex',
//                 flexDirection: { xs: 'column', md: 'row' },
//                 gap: 4,
//                 width: '100%',
//                 maxWidth: '1200px'
//             }}>
//                 {/* Video Container */}
//                 <Paper elevation={3} sx={{
//                     flex: 2,
//                     borderRadius: 2,
//                     overflow: 'hidden',
//                     backgroundColor: '#000',
//                     position: 'relative',
//                     minHeight: '400px'
//                 }}>
//                     {callAccepted && !callEnded ? (
//                         <Box sx={{
//                             display: 'flex',
//                             flexDirection: 'column',
//                             height: '100%'
//                         }}>
//                             <Box sx={{
//                                 flex: 1,
//                                 position: 'relative'
//                             }}>
//                                 <video
//                                     playsInline
//                                     ref={userVideo}
//                                     autoPlay
//                                     style={{
//                                         width: '100%',
//                                         height: '100%',
//                                         objectFit: 'cover'
//                                     }}
//                                 />
//                                 <Box sx={{
//                                     position: 'absolute',
//                                     bottom: 16,
//                                     left: 16,
//                                     backgroundColor: 'rgba(0,0,0,0.5)',
//                                     borderRadius: 2,
//                                     padding: 1
//                                 }}>
//                                     <Typography variant="subtitle1" color="white">
//                                         {name}
//                                     </Typography>
//                                 </Box>
//                             </Box>
//                             <Box sx={{
//                                 height: '120px',
//                                 position: 'relative'
//                             }}>
//                                 <video
//                                     playsInline
//                                     muted
//                                     ref={myVideo}
//                                     autoPlay
//                                     style={{
//                                         width: '160px',
//                                         height: '120px',
//                                         objectFit: 'cover',
//                                         position: 'absolute',
//                                         right: 16,
//                                         bottom: 16,
//                                         borderRadius: '8px',
//                                         border: '2px solid white'
//                                     }}
//                                 />
//                             </Box>
//                         </Box>
//                     ) : stream ? (
//                         <Box sx={{
//                             display: 'flex',
//                             justifyContent: 'center',
//                             alignItems: 'center',
//                             height: '100%'
//                         }}>
//                             <video
//                                 playsInline
//                                 muted
//                                 ref={myVideo}
//                                 autoPlay
//                                 style={{
//                                     width: '100%',
//                                     height: '100%',
//                                     objectFit: 'cover'
//                                 }}
//                             />
//                         </Box>
//                     ) : (
//                         <Box sx={{
//                             display: 'flex',
//                             justifyContent: 'center',
//                             alignItems: 'center',
//                             height: '100%',
//                             color: 'white'
//                         }}>
//                             <CircularProgress color="inherit" />
//                         </Box>
//                     )}
//                 </Paper>

//                 {/* Controls and Info */}
//                 <Box sx={{
//                     flex: 1,
//                     display: 'flex',
//                     flexDirection: 'column',
//                     gap: 2
//                 }}>
//                     <Card>
//                         <CardContent>
//                             <Typography variant="h6" gutterBottom>
//                                 Your Information
//                             </Typography>
//                             <TextField
//                                 fullWidth
//                                 label="Your Name"
//                                 variant="outlined"
//                                 value={name}
//                                 onChange={(e) => setName(e.target.value)}
//                                 sx={{ mb: 2 }}
//                             />
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                 <TextField
//                                     fullWidth
//                                     label="Your ID"
//                                     variant="outlined"
//                                     value={me}
//                                     disabled
//                                 />
//                                 <CopyToClipboard text={me}>
//                                     <IconButton color="primary">
//                                         <AssignmentIcon />
//                                     </IconButton>
//                                 </CopyToClipboard>
//                             </Box>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardContent>
//                             <Typography variant="h6" gutterBottom>
//                                 Start a Call
//                             </Typography>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
//                                 <TextField
//                                     fullWidth
//                                     label="ID to call"
//                                     variant="outlined"
//                                     value={idToCall}
//                                     onChange={(e) => setIdToCall(e.target.value)}
//                                 />
//                                 <IconButton
//                                     color="primary"
//                                     aria-label="call"
//                                     onClick={() => callUser(idToCall)}
//                                     disabled={!idToCall}
//                                     sx={{
//                                         backgroundColor: 'primary.main',
//                                         color: 'white',
//                                         '&:hover': {
//                                             backgroundColor: 'primary.dark'
//                                         }
//                                     }}
//                                 >
//                                     <PhoneIcon />
//                                 </IconButton>
//                             </Box>
//                         </CardContent>
//                     </Card>

//                     {callAccepted && !callEnded && (
//                         <Paper elevation={3} sx={{
//                             display: 'flex',
//                             justifyContent: 'center',
//                             gap: 2,
//                             p: 2,
//                             borderRadius: 2
//                         }}>
//                             <IconButton
//                                 color={videoEnabled ? 'primary' : 'secondary'}
//                                 onClick={toggleVideo}
//                                 sx={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
//                             >
//                                 {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
//                             </IconButton>
//                             <IconButton
//                                 color={audioEnabled ? 'primary' : 'secondary'}
//                                 onClick={toggleAudio}
//                                 sx={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
//                             >
//                                 {audioEnabled ? <MicIcon /> : <MicOffIcon />}
//                             </IconButton>
//                             <IconButton
//                                 color="error"
//                                 onClick={leaveCall}
//                                 sx={{
//                                     backgroundColor: 'error.main',
//                                     color: 'white',
//                                     '&:hover': {
//                                         backgroundColor: 'error.dark'
//                                     }
//                                 }}
//                             >
//                                 <CallEndIcon />
//                             </IconButton>
//                         </Paper>
//                     )}
//                 </Box>
//             </Box>

//             {/* Incoming Call Dialog */}
//             <Dialog open={callDialogOpen} onClose={() => setCallDialogOpen(false)}>
//                 <DialogTitle>
//                     <Typography variant="h6">Incoming Call</Typography>
//                 </DialogTitle>
//                 <DialogContent>
//                     <Box sx={{
//                         display: 'flex',
//                         flexDirection: 'column',
//                         alignItems: 'center',
//                         gap: 2,
//                         p: 2
//                     }}>
//                         <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
//                             <PersonIcon sx={{ fontSize: 40 }} />
//                         </Avatar>
//                         <Typography variant="h5">{name}</Typography>
//                         <Typography variant="body1">is calling you...</Typography>
//                     </Box>
//                 </DialogContent>
//                 <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 3 }}>
//                     <Button
//                         variant="contained"
//                         color="error"
//                         onClick={() => setCallDialogOpen(false)}
//                         startIcon={<CallEndIcon />}
//                     >
//                         Decline
//                     </Button>
//                     <Button
//                         variant="contained"
//                         color="success"
//                         onClick={answerCall}
//                         startIcon={<PhoneIcon />}
//                     >
//                         Answer
//                     </Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// };

// export default StartCall;

// =====================================================================

// import Button from '@mui/material/Button';
// import IconButton from '@mui/material/IconButton';
// import TextField from '@mui/material/TextField';
// import AssignmentIcon from '@mui/icons-material/Assignment';
// import PhoneIcon from '@mui/icons-material/Phone';

// import React, { useEffect, useRef, useState } from "react"
// import { CopyToClipboard } from "react-copy-to-clipboard"
// import Peer from "simple-peer"
// import io from "socket.io-client"
// import { Stack, Typography } from '@mui/material';

// const socket = io.connect('http://localhost:5000')

// const StartCall = () => {
//     const [me, setMe] = useState("")
//     const [stream, setStream] = useState()
//     const [receivingCall, setReceivingCall] = useState(false)
//     const [caller, setCaller] = useState("")
//     const [callerSignal, setCallerSignal] = useState()
//     const [callAccepted, setCallAccepted] = useState(false)
//     const [idToCall, setIdToCall] = useState("")
//     const [callEnded, setCallEnded] = useState(false)
//     const [name, setName] = useState("")

//     const myVideo = useRef()
//     const userVideo = useRef()
//     const connectionRef = useRef()

//     useEffect(() => {
//         navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
//             setStream(stream)
//             if (myVideo.current) {
//                 myVideo.current.srcObject = stream
//             }
//         })

//         socket.on("me", (id) => {
//             setMe(id)
//         })

//         socket.on("callUser", (data) => {
//             setReceivingCall(true)
//             setCaller(data.from)
//             setName(data.name)
//             setCallerSignal(data.signal)
//         })
//     }, [])

//     const callUser = (id) => {
//         const peer = new Peer({
//             initiator: true,
//             trickle: false,
//             stream: stream
//         })

//         peer.on("signal", (data) => {
//             socket.emit("callUser", {
//                 userToCall: id,
//                 signalData: data,
//                 from: me,
//                 name: name
//             })
//         })

//         peer.on("stream", (stream) => {
//             if (userVideo.current) {
//                 userVideo.current.srcObject = stream
//             }
//         })

//         socket.on("callAccepted", (signal) => {
//             setCallAccepted(true)
//             peer.signal(signal)
//         })

//         connectionRef.current = peer
//     }

//     const answerCall = () => {
//         setCallAccepted(true)
//         const peer = new Peer({
//             initiator: false,
//             trickle: false,
//             stream: stream
//         })

//         peer.on("signal", (data) => {
//             socket.emit("answerCall", { signal: data, to: caller })
//         })

//         peer.on("stream", (stream) => {
//             if (userVideo.current) {
//                 userVideo.current.srcObject = stream
//             }
//         })

//         peer.signal(callerSignal)
//         connectionRef.current = peer
//     }

//     const leaveCall = () => {
//         setCallEnded(true)
//         connectionRef.current.destroy()
//     }
//     return (
//         <>
//             <Stack sx={{
//                 position: "absolute",
//                 left: '110px',
//             }}>
//                 {/* <h1 style={{ textAlign: "center", color: '#fff' }}>Zoomish</h1> */}
//                 <Stack sx={{
//                     position:'relative',
//                     left:'500px',
//                     paddingBottom:'50px'
//                 }}>
//                     <Typography color='primary' variant='h1'>
//                         VideoCall
//                     </Typography>
//                 </Stack>
//                 <div className="container">
//                     <div className="video-container">
//                         <div className="video">
//                             {stream && (
//                                 <video
//                                     playsInline
//                                     muted
//                                     ref={myVideo}
//                                     autoPlay
//                                     style={{ width: "400px" }}
//                                 />
//                             )}
//                         </div>
//                         <div className="video">
//                             {callAccepted && !callEnded ? (
//                                 <video
//                                     playsInline
//                                     ref={userVideo}
//                                     autoPlay
//                                     style={{ width: "400px" }}
//                                 />
//                             ) : null}
//                         </div>
//                     </div>
//                     <div className="myId">
//                         <TextField
//                             id="filled-basic"
//                             label="Name"
//                             variant="filled"
//                             value={name}
//                             onChange={(e) => setName(e.target.value)}
//                             style={{ marginBottom: "20px" }}
//                         />
//                         <CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
//                             <Button
//                                 variant="contained"
//                                 color="primary"
//                                 startIcon={<AssignmentIcon fontSize="large" />}
//                             >
//                                 Copy ID
//                             </Button>
//                         </CopyToClipboard>

//                         <TextField
//                             id="filled-basic"
//                             label="ID to call"
//                             variant="filled"
//                             value={idToCall}
//                             onChange={(e) => setIdToCall(e.target.value)}
//                         />
//                         <div className="call-button">
//                             {callAccepted && !callEnded ? (
//                                 <Button variant="contained" color="secondary" onClick={leaveCall}>
//                                     End Call
//                                 </Button>
//                             ) : (
//                                 <IconButton
//                                     color="primary"
//                                     aria-label="call"
//                                     onClick={() => callUser(idToCall)}
//                                 >
//                                     <PhoneIcon fontSize="large" />
//                                 </IconButton>
//                             )}
//                             {idToCall}
//                         </div>
//                     </div>
//                     <div>
//                         {receivingCall && !callAccepted ? (
//                             <div className="caller">
//                                 <h1>{name} is calling...</h1>
//                                 <Button variant="contained" color="primary" onClick={answerCall}>
//                                     Answer
//                                 </Button>
//                             </div>
//                         ) : null}
//                     </div>
//                 </div>
//             </Stack>
//         </>
//     )
// }

// export default StartCall

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

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setStream(stream);
                if (myVideo.current) {
                    myVideo.current.srcObject = stream;
                }
            })
            .catch(err => console.error("Error accessing media devices:", err));

        socket.on("me", (id) => {
            setMe(id);
        });

        socket.on("callUser", (data) => {
            setReceivingCall(true);
            setCaller(data.from);
            setName(data.name);
            setCallerSignal(data.signal);
        });

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            socket.off("me");
            socket.off("callUser");
        };
    }, []);

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