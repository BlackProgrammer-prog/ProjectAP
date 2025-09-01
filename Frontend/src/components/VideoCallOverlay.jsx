import React from 'react';
import { Box, Stack, Typography, IconButton, Avatar, Button, Portal } from '@mui/material';
import { PhoneCall, PhoneDisconnect, VideoCamera } from 'phosphor-react';
import { useVideoCall } from '../contexts/VideoCallContext';

const OverlayButton = ({ color, onClick, children }) => (
    <IconButton onClick={onClick} sx={{ width: 64, height: 64, backgroundColor: color + '.main', color: color + '.contrastText', '&:hover': { opacity: 0.9 } }}>
        {children}
    </IconButton>
);

const VideoElement = ({ stream, muted }) => (
    <video
        playsInline
        muted={muted}
        autoPlay
        ref={(el) => { if (el && stream) el.srcObject = stream; }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
    />
);

const VideoCallOverlay = () => {
    const { callState, currentCall, localStream, remoteStream, acceptIncoming, rejectIncoming, hangup } = useVideoCall();

    if (callState === 'idle' && !currentCall) return null;

    const inCall = callState === 'inCall';
    const isIncoming = callState === 'ringingIncoming' || (!!currentCall && !!currentCall.offer && !inCall);
    const isOutgoing = callState === 'ringingOutgoing' && !isIncoming;

    return (
        <Portal container={typeof document !== 'undefined' ? document.body : undefined}>
            <Box sx={{ position: 'fixed', inset: 0, zIndex: 20000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack spacing={2} sx={{ width: 'min(900px, 92vw)', height: 'min(560px, 80vh)', backgroundColor: 'background.paper', borderRadius: 3, p: 2, boxShadow: 8 }}>
                    <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
                        <Box sx={{ flex: 1, backgroundColor: '#000', borderRadius: 2, overflow: 'hidden' }}>
                            {localStream ? <VideoElement stream={localStream} muted /> : (
                                <Stack sx={{ width: '100%', height: '100%' }} alignItems="center" justifyContent="center">
                                    <VideoCamera size={32} color="#fff" />
                                </Stack>
                            )}
                        </Box>
                        <Box sx={{ flex: 1, backgroundColor: '#000', borderRadius: 2, overflow: 'hidden' }}>
                            {remoteStream ? <VideoElement stream={remoteStream} /> : (
                                <Stack sx={{ width: '100%', height: '100%' }} alignItems="center" justifyContent="center">
                                    <Typography color="#fff">{isOutgoing ? 'در انتظار پاسخ...' : (isIncoming ? 'تماس ورودی' : 'در حال اتصال...')}</Typography>
                                </Stack>
                            )}
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        {isIncoming && (
                            <>
                                <OverlayButton color="success" onClick={acceptIncoming}><PhoneCall /></OverlayButton>
                                <OverlayButton color="error" onClick={() => rejectIncoming('busy')}><PhoneDisconnect /></OverlayButton>
                            </>
                        )}
                        {isOutgoing && (
                            <OverlayButton color="error" onClick={hangup}><PhoneDisconnect /></OverlayButton>
                        )}
                        {inCall && (
                            <OverlayButton color="error" onClick={hangup}><PhoneDisconnect /></OverlayButton>
                        )}
                    </Stack>
                </Stack>
            </Box>
        </Portal>
    );
};

export default VideoCallOverlay;



