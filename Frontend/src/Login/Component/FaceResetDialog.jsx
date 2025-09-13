import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, Box, CircularProgress, TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const FaceResetDialog = ({ open, handleClose, defaultEmail = '' }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [email, setEmail] = useState(defaultEmail || '');
    const [threshold, setThreshold] = useState(90);

    const [apiBase, setApiBase] = useState('');
    const [apiBaseDraft, setApiBaseDraft] = useState('');
    const [probing, setProbing] = useState(false);

    const [isBusy, setIsBusy] = useState(false);
    const [status, setStatus] = useState(null);
    const [previewDataUrl, setPreviewDataUrl] = useState(null);
    const [verified, setVerified] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (!open) return;
        setStatus(null);
        setPreviewDataUrl(null);
        setVerified(false);
        setNewPassword('');
        setConfirmPassword('');
        try {
            const saved = localStorage.getItem('FACE_API_BASE') || '';
            if (saved) {
                setApiBase(saved);
                setApiBaseDraft(saved);
            }
        } catch {}
        const start = async () => {
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
        start();
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
        return canvas.toDataURL('image/jpeg', 0.85);
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
            if (saved && await testHealth(saved)) return saved;
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

    const handleCapture = () => {
        const dataUrl = captureFrame();
        if (!dataUrl) {
            setStatus({ type: 'error', message: 'خطا در گرفتن تصویر' });
            return;
        }
        setPreviewDataUrl(dataUrl);
        setStatus(null);
    };

    const handleVerify = async () => {
        if (!email) {
            setStatus({ type: 'error', message: 'ایمیل را وارد کنید' });
            return;
        }
        if (!previewDataUrl) {
            setStatus({ type: 'error', message: 'ابتدا یک تصویر بگیرید' });
            return;
        }
        setIsBusy(true);
        setStatus(null);
        try {
            const baseUrl = apiBase && apiBase.trim().length > 0 ? apiBase.trim() : await resolveFaceApiBase();
            setApiBase(baseUrl);
            const res = await fetch(`${baseUrl}/face/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, image: previewDataUrl, threshold: Number(threshold) || 90 })
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json && json.success) {
                setVerified(true);
                setStatus({ type: 'success', message: `تأیید شد (${json.similarity_percentage}% ≥ ${json.required_threshold}%)` });
            } else {
                const sim = json && json.similarity_percentage;
                const thresh = json && json.required_threshold;
                setStatus({ type: 'error', message: sim !== undefined ? `شباهت کافی نیست (${sim}% < ${thresh}%)` : 'تأیید چهره ناموفق بود' });
            }
        } catch (e) {
            console.error('Verify request failed', e);
            setStatus({ type: 'error', message: 'عدم دسترسی به سرویس /face/verify' });
        } finally {
            setIsBusy(false);
        }
    };

    const handleResetPassword = async () => {
        if (!verified) {
            setStatus({ type: 'error', message: 'ابتدا تأیید چهره را انجام دهید' });
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            setStatus({ type: 'error', message: 'رمز عبور باید حداقل 6 کاراکتر باشد' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'تکرار رمز عبور مطابقت ندارد' });
            return;
        }
        setIsBusy(true);
        setStatus(null);
        try {
            const baseUrl = apiBase && apiBase.trim().length > 0 ? apiBase.trim() : await resolveFaceApiBase();
            setApiBase(baseUrl);
            const res = await fetch(`${baseUrl}/face/reset_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, new_password: newPassword })
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json && json.success) {
                setStatus({ type: 'success', message: json.message || 'پسورد با موفقیت تغییر کرد' });
                setTimeout(() => handleClose(), 1200);
            } else {
                setStatus({ type: 'error', message: (json && json.message) || 'تغییر پسورد ناموفق بود' });
            }
        } catch (e) {
            console.error('Reset password request failed', e);
            setStatus({ type: 'error', message: 'عدم دسترسی به سرویس /face/reset_password' });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>بازیابی رمز عبور با چهره</DialogTitle>
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

                    <TextField label="ایمیل" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />

                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', backgroundColor: 'black', borderRadius: 1, overflow: 'hidden' }}>
                        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button onClick={handleCapture} disabled={isBusy}>گرفتن عکس</Button>
                        <TextField label="threshold" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} sx={{ width: 140 }} />
                        <Button variant="contained" onClick={handleVerify} disabled={isBusy || !previewDataUrl}>تأیید چهره</Button>
                    </Stack>
                    {previewDataUrl && (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>پیش‌نمایش</Typography>
                            <img src={previewDataUrl} alt="preview" style={{ width: '100%', borderRadius: 8 }} />
                        </Box>
                    )}

                    {verified && (
                        <Stack spacing={2}>
                            <Typography variant="subtitle2">تغییر رمز عبور</Typography>
                            <TextField label="رمز عبور جدید" type={showNew ? 'text' : 'password'} fullWidth value={newPassword} onChange={(e) => setNewPassword(e.target.value)} InputProps={{ endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowNew(!showNew)} edge="end">{showNew ? <VisibilityOff /> : <Visibility />}</IconButton>
                                </InputAdornment>
                            ) }} />
                            <TextField label="تکرار رمز عبور" type={showConfirm ? 'text' : 'password'} fullWidth value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} InputProps={{ endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">{showConfirm ? <VisibilityOff /> : <Visibility />}</IconButton>
                                </InputAdornment>
                            ) }} />
                            <Button variant="contained" onClick={handleResetPassword} disabled={isBusy}>تغییر رمز</Button>
                        </Stack>
                    )}

                    {status && (
                        <Typography color={status.type === 'error' ? 'error' : 'success.main'}>
                            {status.message}
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="inherit" disabled={isBusy}>بستن</Button>
            </DialogActions>
        </Dialog>
    );
};

export default FaceResetDialog;


