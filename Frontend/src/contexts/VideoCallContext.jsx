import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../Login/Component/Context/AuthContext';

const VideoCallContext = createContext();

// Ring timeout in ms
const RING_TIMEOUT_MS = 30000;

export const VideoCallProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();

    const myUserId = useMemo(() => (user && (user.user_id || user.id || user.userId)) || null, [user]);
    const [selfUserId, setSelfUserId] = useState(null);

    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const localStreamRef = useRef(null);
    const ringTimeoutRef = useRef(null);
    const registerIntervalRef = useRef(null);
    const registeredRef = useRef(false);

    const [callState, setCallState] = useState('idle'); // 'idle' | 'ringingOutgoing' | 'ringingIncoming' | 'inCall'
    const [currentCall, setCurrentCall] = useState(null); // { callId, fromUserId, toUserId }
    const [remoteStream, setRemoteStream] = useState(null);
    const [localStream, setLocalStream] = useState(null);

    const cleanupMedia = useCallback(() => {
        try { pcRef.current && pcRef.current.getSenders && pcRef.current.getSenders().forEach((s) => s.track && s.track.stop()); } catch {}
        try { localStreamRef.current && localStreamRef.current.getTracks && localStreamRef.current.getTracks().forEach((t) => t.stop()); } catch {}
        try { pcRef.current && pcRef.current.close && pcRef.current.close(); } catch {}
        pcRef.current = null;
        localStreamRef.current = null;
        setLocalStream(null);
        setRemoteStream(null);
    }, []);

    const backToIdle = useCallback(() => {
        setCallState('idle');
        setCurrentCall(null);
    }, []);

    const ensureSocket = useCallback(() => {
        if (socketRef.current) return socketRef.current;
        const s = io('http://localhost:5000', { withCredentials: true });
        socketRef.current = s;

        // Log every outgoing emit to the 5000 server
        try {
            const originalEmit = s.emit.bind(s);
            s.emit = (event, ...args) => {
                try { console.log('[VC EMIT -> 5000]', event, ...(args || [])); } catch {}
                return originalEmit(event, ...args);
            };
            if (typeof s.onAny === 'function') {
                s.onAny((event, ...args) => {
                    try { console.log('[VC RECV <- 5000]', event, ...(args || [])); } catch {}
                });
            }
        } catch {}

        s.on('connect', () => {
            const bestIdentity = (selfUserId || myUserId || (user && (user.email || user.username || (user.profile && (user.profile.email || user.profile.username || user.profile.customUrl)))) || null);
            if (bestIdentity) {
                try {
                    s.emit('register', {
                        userId: bestIdentity,
                        identity: (user && (user.email || user.username || (user.profile && (user.profile.email || user.profile.username || user.profile.customUrl)))) || undefined,
                        email: (user && (user.email || (user.profile && user.profile.email))) || undefined,
                        username: (user && (user.username || (user.profile && user.profile.username))) || undefined,
                        customUrl: (user && ((user.customUrl) || (user.profile && user.profile.customUrl))) || undefined,
                    });
                } catch {}
            } else {
                try { console.warn('[VC] Connected but no identity to register'); } catch {}
            }
            // keep trying every 2s until server acknowledges registration
            clearInterval(registerIntervalRef.current);
            registerIntervalRef.current = setInterval(() => {
                if (registeredRef.current) { clearInterval(registerIntervalRef.current); return; }
                const idNow = (selfUserId || myUserId || (user && (user.email || user.username || (user.profile && (user.profile.email || user.profile.username || user.profile.customUrl)))) || null);
                if (idNow) {
                    try {
                        s.emit('register', {
                            userId: idNow,
                            identity: (user && (user.email || user.username || (user.profile && (user.profile.email || user.profile.username || user.profile.customUrl)))) || undefined,
                            email: (user && (user.email || (user.profile && user.profile.email))) || undefined,
                            username: (user && (user.username || (user.profile && user.profile.username))) || undefined,
                            customUrl: (user && ((user.customUrl) || (user.profile && user.profile.customUrl))) || undefined,
                        });
                    } catch {}
                }
                // also ask server whoami to normalize
                if (idNow) { try { s.emit('whoami', { userId: idNow }); } catch {} }
            }, 2000);
        });

        s.on('registered', (payload) => {
            registeredRef.current = true;
            clearInterval(registerIntervalRef.current);
            try {
                const serverUserId = payload && (payload.userId || payload.id);
                if (serverUserId) setSelfUserId(String(serverUserId));
            } catch {}
        });

        s.on('whoami_response', (payload) => {
            try {
                if (payload && payload.status === 'success' && payload.userId) {
                    setSelfUserId(String(payload.userId));
                }
            } catch {}
        });

        s.on('incomingCall', async ({ callId, fromUserId, fromSocketId, offer }) => {
            try { console.log('[VC] incomingCall -> set ringingIncoming'); } catch {}
            setCurrentCall({ callId, fromUserId, fromSocketId, toUserId: myUserId, offer });
            setCallState('ringingIncoming');
            // Auto-timeout
            clearTimeout(ringTimeoutRef.current);
            ringTimeoutRef.current = setTimeout(() => {
                try { s.emit('rejectCallUser', { callId, toUserId: fromUserId, fromUserId: myUserId, reason: 'timeout' }); } catch {}
                cleanupMedia();
                backToIdle();
            }, RING_TIMEOUT_MS);
        });

        // LEGACY bridge: support simple-peer style 'callUser' by mapping to incoming flow
        s.on('callUser', (data) => {
            try {
                const fromSocketId = data && data.from ? String(data.from) : null;
                const offer = data && data.signal ? data.signal : null;
                if (!offer) return;
                const callId = `${fromSocketId || 'legacy'}:${Date.now()}`;
                setCurrentCall({ callId, fromUserId: (data && data.name) ? String(data.name) : null, fromSocketId, toUserId: myUserId, offer });
                setCallState('ringingIncoming');
                try { console.log('[VC] legacy callUser -> set ringingIncoming'); } catch {}
                clearTimeout(ringTimeoutRef.current);
                ringTimeoutRef.current = setTimeout(() => {
                    try {
                        // If we only have socket id, try to signal by socket
                        if (fromSocketId) s.emit('rejectCallUser', { callId, toSocketId: fromSocketId, fromUserId: (selfUserId || myUserId), reason: 'timeout' });
                    } catch {}
                    cleanupMedia();
                    backToIdle();
                }, RING_TIMEOUT_MS);
            } catch {}
        });

        s.on('callAccepted', async ({ callId, fromUserId, answer }) => {
            try {
                if (pcRef.current) {
                    await pcRef.current.setRemoteDescription(answer);
                    // flush pending candidates if any
                    try {
                        const queue = pendingCandidatesRef.current || [];
                        for (const c of queue) { try { await pcRef.current.addIceCandidate(c); } catch (e) { console.error(e); } }
                    } catch {}
                    pendingCandidatesRef.current = [];
                    setCallState('inCall');
                    try { console.log('[VC] callAccepted -> set inCall'); } catch {}
                }
            } catch (e) { console.error(e); }
        });

        s.on('callRejected', ({ callId, fromUserId, reason }) => {
            try { if (reason) alert(`تماس رد شد: ${reason}`); else alert('تماس رد شد'); } catch {}
            cleanupMedia();
            backToIdle();
        });

        s.on('iceCandidate', async ({ fromUserId, candidate }) => {
            try {
                if (!pcRef.current || !candidate) return;
                const haveRemote = !!(pcRef.current.remoteDescription && pcRef.current.remoteDescription.type);
                if (haveRemote) {
                    await pcRef.current.addIceCandidate(candidate);
                } else {
                    (pendingCandidatesRef.current = pendingCandidatesRef.current || []).push(candidate);
                }
            } catch (e) { console.error(e); }
        });

        s.on('callEnded', () => {
            cleanupMedia();
            backToIdle();
        });

        s.on('userOffline', (payload) => {
            try {
                if (payload && payload.socketId) console.warn('User offline (socketId):', payload.socketId);
                alert('کاربر آفلاین است');
            } catch {}
            cleanupMedia();
            backToIdle();
        });

        s.on('callError', (err) => {
            try { const msg = (err && (err.message || err.code)) ? `${err.code || ''} ${err.message || ''}` : 'خطا در تماس'; alert(msg); } catch {}
            cleanupMedia();
            backToIdle();
        });

        s.on('disconnect', () => {
            registeredRef.current = false;
            clearInterval(registerIntervalRef.current);
            cleanupMedia();
            backToIdle();
        });

        return s;
    }, [myUserId, selfUserId, cleanupMedia, backToIdle, user]);

    useEffect(() => {
        if (!isAuthenticated) return;
        ensureSocket();
        // Do not remove listeners on re-renders; it causes lost handlers.
    }, [isAuthenticated, ensureSocket]);

    // Keep selfUserId in sync and resolve from DB if missing
    useEffect(() => {
        setSelfUserId(myUserId || null);
    }, [myUserId]);

    // If userId changes while socket is connected, re-register
    useEffect(() => {
        const s = socketRef.current;
        const uid = selfUserId || myUserId || (user && (user.email || user.username || (user.profile && (user.profile.email || user.profile.username || user.profile.customUrl))));
        if (s && s.connected && uid) {
            try {
                s.emit('register', {
                    userId: uid,
                    identity: (user && (user.email || user.username || (user.profile && (user.profile.email || user.profile.username || user.profile.customUrl)))) || undefined,
                    email: (user && (user.email || (user.profile && user.profile.email))) || undefined,
                    username: (user && (user.username || (user.profile && user.profile.username))) || undefined,
                    customUrl: (user && ((user.customUrl) || (user.profile && user.profile.customUrl))) || undefined,
                });
            } catch {}
        }
    }, [selfUserId, myUserId, user]);

    const resolvedOnceRef = useRef(false);
    useEffect(() => {
        const identity = (user && (user.email || user.username || (user.profile && (user.profile.email || user.profile.username)))) || null;
        if (!identity || resolvedOnceRef.current) return;
        (async () => {
            try {
                const resp = await fetch('http://localhost:5000/resolve-user', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity })
                });
                const data = await resp.json().catch(() => null);
                if (resp.ok && data && data.status === 'success' && data.userId) {
                    resolvedOnceRef.current = true;
                    setSelfUserId(String(data.userId));
                    const s = socketRef.current; if (s && s.connected) { try { s.emit('register', { userId: String(data.userId) }); } catch {} }
                }
            } catch {}
        })();
    }, [user]);

    const createPeerConnection = useCallback((target, fromUserIdParam = null) => {
        const toUserId = target && target.toUserId ? target.toUserId : null;
        const toSocketId = target && target.toSocketId ? target.toSocketId : null;
        const fromUid = fromUserIdParam || selfUserId || myUserId;
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                try {
                    const s = socketRef.current; if (!s) return;
                    if (!fromUid) return; // avoid emitting invalid payload
                    s.emit('iceCandidate', { toUserId: toUserId || undefined, toSocketId: toSocketId || undefined, fromUserId: fromUid, candidate: e.candidate });
                } catch {}
            }
        };
        pc.ontrack = (e) => { const rs = e.streams && e.streams[0]; if (rs) setRemoteStream(rs); };
        pcRef.current = pc;
        return pc;
    }, [myUserId, selfUserId]);

    const getLocalStream = useCallback(async () => {
        if (localStreamRef.current) return localStreamRef.current;
        const tryConstraints = async (constraints, label) => {
            try {
                const media = await navigator.mediaDevices.getUserMedia(constraints);
                return media;
            } catch (err) {
                try { console.warn('[VC] getUserMedia failed (' + label + '):', err && err.name); } catch {}
                return null;
            }
        };
        try { await navigator.mediaDevices.enumerateDevices(); } catch {}
        let ls = await tryConstraints({ video: true, audio: true }, 'video+audio');
        if (!ls) ls = await tryConstraints({ video: true, audio: false }, 'video-only');
        if (!ls) ls = await tryConstraints({ video: false, audio: true }, 'audio-only');
        if (!ls) {
            try { alert('هیچ دستگاه دوربین/میکروفنی یافت نشد یا دسترسی داده نشد'); } catch {}
            return null;
        }
        localStreamRef.current = ls; setLocalStream(ls);
        return ls;
    }, []);

    const startVideoCall = useCallback(async (toUserId = null, providedLocalStream = null, userIdOverride = null, toSocketId = null) => {
        const fromUserId = userIdOverride || selfUserId || myUserId;
        if (!fromUserId) { try { console.warn('[VC] Missing self userId; cannot start call'); alert('شناسه کاربری شما برای تماس نامعتبر است'); } catch {}; return; }
        if (!toUserId && !toSocketId) { try { console.warn('[VC] Missing target (toUserId/toSocketId)'); alert('مقصد تماس نامعتبر است'); } catch {}; return; }
        const s = ensureSocket();
        const ls = providedLocalStream || (await getLocalStream());
        const pc = createPeerConnection({ toUserId, toSocketId }, fromUserId);
        if (ls) { (ls.getTracks() || []).forEach((t) => pc.addTrack(t, ls)); }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const callId = `${fromUserId}:${(toUserId || toSocketId)}:${Date.now()}`;
        setCurrentCall({ callId, fromUserId, toUserId, toSocketId: toSocketId || null });
        setCallState('ringingOutgoing');
        if (toSocketId) { s.emit('startCall', { toSocketId, fromUserId, offer, callId }); }
        else { s.emit('startCall', { toUserId, fromUserId, offer, callId }); }

        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = setTimeout(() => {
            try { s.emit('hangupCall', { toUserId, fromUserId, callId }); } catch {}
            cleanupMedia();
            backToIdle();
        }, RING_TIMEOUT_MS);
    }, [myUserId, selfUserId, ensureSocket, getLocalStream, createPeerConnection, cleanupMedia, backToIdle]);

    const startCall = useCallback(async (toUserId) => startVideoCall(toUserId), [startVideoCall]);

    const acceptIncoming = useCallback(async () => {
        const info = currentCall || {};
        const toUserId = info.fromUserId; // respond back to caller
        const toSocketId = info.fromSocketId || null;
        if (!toUserId && !toSocketId) return;
        const s = ensureSocket();
        clearTimeout(ringTimeoutRef.current);

        // Ensure we have our own userId
        let ensureFromUserId = selfUserId || myUserId;
        if (!ensureFromUserId && user && (user.email || user.username || (user.profile && (user.profile.email || user.profile.username)))) {
            const identity = user.email || user.username || (user.profile && (user.profile.email || user.profile.username));
            try {
                const resp = await fetch('http://localhost:5000/resolve-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity }) });
                const data = await resp.json().catch(() => null);
                if (resp.ok && data && data.status === 'success' && data.userId) {
                    ensureFromUserId = String(data.userId);
                    setSelfUserId(ensureFromUserId);
                    if (s && s.connected) { try { s.emit('register', { userId: ensureFromUserId }); } catch {} }
                }
            } catch {}
        }
        if (!ensureFromUserId) { try { alert('شناسه کاربری شما برای پذیرش تماس نامعتبر است'); } catch {}; return; }

        const ls = await getLocalStream();
        const pc = createPeerConnection({ toUserId, toSocketId }, ensureFromUserId);
        if (ls) { (ls.getTracks() || []).forEach((t) => pc.addTrack(t, ls)); }

        try {
            if (info.offer) await pc.setRemoteDescription(info.offer);
        } catch (e) { console.error(e); }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const fromUserId = ensureFromUserId;
        if (toSocketId) s.emit('acceptCall', { callId: info.callId, toSocketId, fromUserId, answer });
        else s.emit('acceptCall', { callId: info.callId, toUserId, fromUserId, answer });
        setCallState('inCall');
    }, [currentCall, myUserId, selfUserId, ensureSocket, getLocalStream, createPeerConnection, user]);

    const rejectIncoming = useCallback((reason = 'busy') => {
        const info = currentCall || {};
        const toUserId = info && info.fromUserId ? info.fromUserId : null;
        const toSocketId = info && info.fromSocketId ? info.fromSocketId : null;
        if (!toUserId && !toSocketId) { backToIdle(); return; }
        const s = ensureSocket();
        try {
            const fromUserId = selfUserId || myUserId;
            if (toSocketId) s.emit('rejectCallUser', { callId: info.callId, toSocketId, fromUserId, reason });
            else s.emit('rejectCallUser', { callId: info.callId, toUserId, fromUserId, reason });
        } catch {}
        cleanupMedia();
        backToIdle();
    }, [currentCall, myUserId, selfUserId, ensureSocket, cleanupMedia, backToIdle]);

    const hangup = useCallback(() => {
        const info = currentCall || {};
        const toUserId = (info && (info.toUserId || info.fromUserId)) || null;
        const toSocketId = (info && (info.toSocketId || info.fromSocketId)) || null;
        const s = ensureSocket();
        try {
            const fromUserId = selfUserId || myUserId;
            if (toSocketId) s.emit('hangupCall', { toSocketId, fromUserId, callId: info.callId });
            else if (toUserId) s.emit('hangupCall', { toUserId, fromUserId, callId: info.callId });
        } catch {}
        cleanupMedia();
        backToIdle();
    }, [currentCall, myUserId, selfUserId, ensureSocket, cleanupMedia, backToIdle]);

    const hangupCall = useCallback((toUserIdParam, userIdParam, callIdParam, toSocketIdParam = null) => {
        const toUserId = toUserIdParam || (currentCall && (currentCall.toUserId || currentCall.fromUserId)) || null;
        const toSocketId = toSocketIdParam || (currentCall && (currentCall.toSocketId || currentCall.fromSocketId)) || null;
        const fromUserId = userIdParam || selfUserId || myUserId;
        const callId = callIdParam || (currentCall && currentCall.callId) || null;
        const s = ensureSocket();
        try {
            if (toSocketId) s.emit('hangupCall', { toSocketId, fromUserId, callId });
            else if (toUserId) s.emit('hangupCall', { toUserId, fromUserId, callId });
        } catch {}
        cleanupMedia();
        backToIdle();
    }, [currentCall, myUserId, selfUserId, ensureSocket, cleanupMedia, backToIdle]);

    const value = useMemo(() => ({
        // state
        callState, currentCall, localStream, remoteStream,
        // actions
        startCall, startVideoCall, acceptIncoming, rejectIncoming, hangup, hangupCall,
    }), [callState, currentCall, localStream, remoteStream, startCall, startVideoCall, acceptIncoming, rejectIncoming, hangup, hangupCall]);

    return (
        <VideoCallContext.Provider value={value}>
            {children}
        </VideoCallContext.Provider>
    );
};

export const useVideoCall = () => useContext(VideoCallContext);


