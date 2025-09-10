import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Swal from 'sweetalert2';
import { useContacts } from '../../contexts/ContactsContext';
import { useAuth } from '../../Login/Component/Context/AuthContext';

const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.body.appendChild(s);
});

const QRScanDialog = ({ open, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const frameReqRef = useRef(0);
    const [detectorSupported, setDetectorSupported] = useState(false);
    const [scanning, setScanning] = useState(false);
    const { addContact } = useContacts();
    const { token } = useAuth();

    useEffect(() => {
        setDetectorSupported('BarcodeDetector' in window);
    }, []);

    useEffect(() => {
        if (!open) {
            stopScanning();
            return;
        }
        startScanning();
        return () => stopScanning();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const startScanning = async () => {
        try {
            setScanning(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            if (detectorSupported) {
                const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
                const loop = async () => {
                    if (!videoRef.current) return;
                    try {
                        const barcodes = await detector.detect(videoRef.current);
                        if (Array.isArray(barcodes) && barcodes.length > 0) {
                            const raw = barcodes[0].rawValue || '';
                            handleDecoded(raw);
                            return;
                        }
                    } catch {}
                    frameReqRef.current = requestAnimationFrame(loop);
                };
                frameReqRef.current = requestAnimationFrame(loop);
            } else {
                // Fallback with jsQR from CDN
                await loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js');
                const loop = () => {
                    try {
                        const video = videoRef.current;
                        const canvas = canvasRef.current;
                        if (!video || !canvas) { frameReqRef.current = requestAnimationFrame(loop); return; }
                        const w = video.videoWidth || 640;
                        const h = video.videoHeight || 480;
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, w, h);
                        const imageData = ctx.getImageData(0, 0, w, h);
                        // eslint-disable-next-line no-undef
                        const code = jsQR(imageData.data, w, h);
                        if (code && code.data) {
                            handleDecoded(code.data);
                            return;
                        }
                    } catch {}
                    frameReqRef.current = requestAnimationFrame(loop);
                };
                frameReqRef.current = requestAnimationFrame(loop);
            }
        } catch (e) {
            setScanning(false);
            Swal.fire({ icon: 'error', title: 'دسترسی به دوربین امکان‌پذیر نیست', text: 'لطفاً دسترسی دوربین را فعال کنید.' });
        }
    };

    const stopScanning = () => {
        try {
            if (frameReqRef.current) cancelAnimationFrame(frameReqRef.current);
            frameReqRef.current = 0;
        } catch {}
        try {
            const stream = streamRef.current;
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
        } catch {}
        setScanning(false);
    };

    const isValidEmail = (text) => {
        if (typeof text !== 'string') return false;
        const re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
        return re.test(text.trim());
    };

    const handleDecoded = (raw) => {
        stopScanning();
        const email = String(raw || '').trim();
        if (!isValidEmail(email)) {
            Swal.fire({ icon: 'error', title: 'QR نامعتبر', text: 'ایمیل معتبر در QR یافت نشد.' });
            return;
        }
        if (!token) {
            Swal.fire({ icon: 'error', title: 'ابتدا وارد شوید', text: 'برای افزودن مخاطب باید وارد شوید.' });
            return;
        }
        addContact(email);
        onClose && onClose();
    };

    return (
        <Dialog open={!!open} onClose={() => { stopScanning(); onClose && onClose(); }} maxWidth="sm" fullWidth>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pr: 1 }}>
                <DialogTitle sx={{ pb: 0 }}>اسکن QR مخاطب</DialogTitle>
                <IconButton onClick={() => { stopScanning(); onClose && onClose(); }} aria-label="close">
                    <CloseIcon />
                </IconButton>
            </Stack>
            <DialogContent>
                <Stack spacing={2} alignItems="center">
                    <Box sx={{ width: '100%', aspectRatio: '3/2', background: '#000', borderRadius: 1, overflow: 'hidden' }}>
                        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        دوربین را به سوی QR ایمیل کاربر مقابل بگیرید
                    </Typography>
                    {!scanning && (
                        <Button variant="outlined" onClick={startScanning}>شروع مجدد اسکن</Button>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { stopScanning(); onClose && onClose(); }}>بستن</Button>
            </DialogActions>
        </Dialog>
    );
};

export default QRScanDialog;



