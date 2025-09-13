import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../Login/Component/Context/AuthContext';

const FaceEnrollDialog = ({ open, handleClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const { user } = useAuth();
    const [isCapturing, setIsCapturing] = useState(false);
    const [previewDataUrl, setPreviewDataUrl] = useState(null);
    const [status, setStatus] = useState(null);
    const [apiBase, setApiBase] = useState('');
    const [apiBaseDraft, setApiBaseDraft] = useState('');
    const [probing, setProbing] = useState(false);

    useEffect(() => {
        const startCamera = async () => {
            if (!open) return;
            setStatus(null);
            setPreviewDataUrl(null);
            try {
                const saved = localStorage.getItem('FACE_API_BASE') || '';
                if (saved) {
                    setApiBase(saved);
                    setApiBaseDraft(saved);
                }
            } catch {}
            try {
                const constraints = { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch (e) {
                console.error('Failed to open webcam', e);
                setStatus({ type: 'error', message: 'دسترسی به وب‌کم مقدور نیست' });
            }
        };
        startCamera();
        return () => {
            try {
                const s = streamRef.current;
                if (s) s.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            } catch {}
        };
    }, [open]);

    const captureFrame = () => {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        return dataUrl;
    };

    const handleCapture = () => {
        const dataUrl = captureFrame();
        if (!dataUrl) {
            setStatus({ type: 'error', message: 'خطا در گرفتن تصویر' });
            return;
        }
        setPreviewDataUrl(dataUrl);
        setStatus(null);
    };

    const testHealth = async (base) => {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 1200);
            const res = await fetch(`${base}/health`, { method: 'GET', headers: { 'Accept': 'application/json' }, signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) return true;
        } catch {
            try {
                const controller2 = new AbortController();
                const timer2 = setTimeout(() => controller2.abort(), 1000);
                await fetch(`${base}/health`, { method: 'GET', mode: 'no-cors', signal: controller2.signal });
                clearTimeout(timer2);
                return true;
            } catch {}
        }
        return false;
    };

    const resolveFaceApiBase = async () => {
        try {
            const saved = (localStorage.getItem('FACE_API_BASE') || '').trim();
            if (saved) {
                if (await testHealth(saved)) return saved;
            }
            const candidates = [
                'http://localhost:10000',
                'http://127.0.0.1:10000',
                `${window.location.protocol}//${window.location.hostname}:10000`,
                'http://[::1]:10000'
            ];
            for (const base of candidates) {
                if (await testHealth(base)) return base;
            }
        } catch {}
        return 'http://localhost:10000';
    };

    const postEnroll = async (baseUrl, email, imageDataUrl) => {
        // First try normal CORS request expecting JSON
        try {
            const res = await fetch(`${baseUrl}/face/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, image: imageDataUrl })
            });
            const json = await res.json().catch(() => ({}));
            return { ok: res.ok && json && json.success, json };
        } catch (e) {
            // Likely CORS/network. Try a no-cors fallback; server uses force=True so JSON will parse even without headers
            try {
                await fetch(`${baseUrl}/face/enroll`, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({ email, image: imageDataUrl })
                });
                // We cannot read response; assume success if no exception
                return { ok: true, json: { success: true, message: 'درخواست ارسال شد (CORS opaque)' } };
            } catch (e2) {
                throw e2;
            }
        }
    };

    const handleSubmit = async () => {
        if (!previewDataUrl) {
            setStatus({ type: 'error', message: 'ابتدا یک تصویر بگیرید' });
            return;
        }
        const email = user?.email || user?.username;
        if (!email) {
            setStatus({ type: 'error', message: 'شناسه کاربر یافت نشد' });
            return;
        }
        setIsCapturing(true);
        setStatus(null);
        try {
            const baseUrl = apiBase && apiBase.trim().length > 0 ? apiBase.trim() : await resolveFaceApiBase();
            setApiBase(baseUrl);
            const result = await postEnroll(baseUrl, email, previewDataUrl);
            if (result.ok) {
                setStatus({ type: 'success', message: (result.json && result.json.message) || 'الگوی چهره با موفقیت ذخیره شد' });
                setTimeout(() => handleClose(), 1200);
            } else {
                setStatus({ type: 'error', message: (result.json && result.json.message) || 'ثبت الگوی چهره ناموفق بود' });
            }
        } catch (e) {
            console.error('Enroll request failed', e);
            setStatus({ type: 'error', message: 'عدم دسترسی به سرور تشخیص چهره (بررسی کنید: اجرا بودن سرویس، پورت 10000، CORS)' });
        } finally {
            setIsCapturing(false);
        }
    };

    const handleProbeAndSave = async () => {
        const base = (apiBaseDraft || '').trim();
        if (!base) return;
        setProbing(true);
        try {
            const ok = await testHealth(base);
            if (ok) {
                setApiBase(base);
                try { localStorage.setItem('FACE_API_BASE', base); } catch {}
                setStatus({ type: 'success', message: 'اتصال موفق به سرویس تشخیص چهره' });
            } else {
                setStatus({ type: 'error', message: 'عدم امکان اتصال به /health روی آدرس واردشده' });
            }
        } finally {
            setProbing(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>ثبت الگوی چهره</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ minWidth: 92 }}>آدرس API:</Typography>
                        <input
                            value={apiBaseDraft}
                            onChange={(e) => setApiBaseDraft(e.target.value)}
                            placeholder="مثال: http://localhost:10000"
                            style={{ flex: 1, height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #ccc' }}
                        />
                        <Button size="small" onClick={handleProbeAndSave} disabled={probing}>
                            {probing ? <CircularProgress size={18} /> : 'تست و ذخیره'}
                        </Button>
                    </Stack>
                    {apiBase && (
                        <Typography variant="caption" color="text.secondary">استفاده از: {apiBase}</Typography>
                    )}
                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', backgroundColor: 'black', borderRadius: 1, overflow: 'hidden' }}>
                        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </Box>
                    {previewDataUrl && (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>پیش‌نمایش</Typography>
                            <img src={previewDataUrl} alt="preview" style={{ width: '100%', borderRadius: 8 }} />
                        </Box>
                    )}
                    {status && (
                        <Typography color={status.type === 'error' ? 'error' : 'success.main'}>
                            {status.message}
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCapture} disabled={isCapturing}>گرفتن عکس</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={isCapturing || !previewDataUrl}>
                    {isCapturing ? <CircularProgress size={20} /> : 'ارسال'}
                </Button>
                <Button onClick={handleClose} color="inherit" disabled={isCapturing}>بستن</Button>
            </DialogActions>
        </Dialog>
    );
};

export default FaceEnrollDialog;


