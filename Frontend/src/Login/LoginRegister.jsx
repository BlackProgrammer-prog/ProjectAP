import React, { useState, useEffect } from 'react';
import {
    Box, Paper, TextField, Button, Typography, Stack, Link, InputAdornment,
    IconButton, FormControlLabel, Checkbox, CircularProgress, Alert
} from '@mui/material';
import { Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material';
import { EnvelopeSimple } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Component/Context/AuthContext';
import backgroundImage from './Assist/background.jpg';
import FaceResetDialog from './Component/FaceResetDialog';

const LoginRegister = () => {
    const navigate = useNavigate();
    const { login, register, isAuthenticated, isLoading, setOnRegisterSuccess } = useAuth();
    
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [alertInfo, setAlertInfo] = useState(null);
    const [openFaceReset, setOpenFaceReset] = useState(false);

    // Form fields
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Redirect if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            console.log('✅ User is authenticated, redirecting to /app...');
            navigate('/app');
        }
    }, [isAuthenticated, navigate]);

    // *** This is the core of the new registration flow ***
    useEffect(() => {
        // Define the action to take after a successful registration
        const handleSuccessfulRegister = () => {
            // Switch the form to login mode
            setIsLogin(true); 
            // Clear all input fields
            setUsername('');
            setEmail('');
            setPassword('');
        };
        
        // Pass this function to the AuthContext
        setOnRegisterSuccess(handleSuccessfulRegister);

        // Clean up the callback when the component unmounts
        return () => setOnRegisterSuccess(null); 
    }, [setOnRegisterSuccess]);
    // *** End of new registration flow logic ***

    const handleSubmit = (e) => {
        e.preventDefault();
        setAlertInfo(null);

        if (isLogin) {
            if (!email || !password) {
                setAlertInfo({ type: 'error', message: 'لطفا ایمیل و رمز عبور را وارد کنید.' });
                return;
            }
            login(email, password);
        } else {
            if (!username || !email || !password) {
                setAlertInfo({ type: 'error', message: 'لطفا تمام فیلدها را پر کنید.' });
                return;
            }
            register(username, email, password);
        }
    };

    const handleToggleMode = () => {
        setIsLogin(!isLogin);
        setAlertInfo(null);
        // Reset form fields when toggling
        setUsername('');
        setEmail('');
        setPassword('');
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' }}>
            <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 2 }}>
                <Stack spacing={3}>
                    <Typography variant="h4" textAlign="center">
                        {isLogin ? 'ورود' : 'ثبت نام'}
                    </Typography>

                    {alertInfo && (
                        <Alert severity={alertInfo.type} onClose={() => setAlertInfo(null)}>
                            {alertInfo.message}
                        </Alert>
                    )}

                    {!isLogin && (
                        <TextField label="نام کاربری" required fullWidth value={username} onChange={(e) => setUsername(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><Person /></InputAdornment>) }} />
                    )}

                    <TextField label="ایمیل" type="email" required fullWidth value={email} onChange={(e) => setEmail(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><EnvelopeSimple size={20} /></InputAdornment>) }} />
                    
                    <TextField label="رمز عبور" type={showPassword ? 'text' : 'password'} required fullWidth value={password} onChange={(e) => setPassword(e.target.value)} InputProps={{
                        startAdornment: (<InputAdornment position="start"><Lock /></InputAdornment>),
                        endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>),
                    }} />

                    {isLogin ? (
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <FormControlLabel control={<Checkbox />} label="مرا به خاطر بسپار" />
                            <Link href="#" variant="body2" onClick={(e) => { e.preventDefault(); setOpenFaceReset(true); }}>رمز عبور را فراموش کرده‌اید؟</Link>
                        </Stack>
                    ) : (
                        <FormControlLabel control={<Checkbox required />} label="با شرایط و قوانین موافقم" />
                    )}

                    <Button type="submit" variant="contained" size="large" fullWidth disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? 'ورود' : 'ثبت نام')}
                    </Button>

                    <Typography textAlign="center">
                        {isLogin ? "حساب کاربری ندارید؟" : "حساب کاربری دارید؟"}{' '}
                        <Link href="#" onClick={handleToggleMode} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                            {isLogin ? 'ثبت نام کنید' : 'وارد شوید'}
                        </Link>
                    </Typography>
                </Stack>
            </Paper>
            {openFaceReset && (
                <FaceResetDialog
                    open={openFaceReset}
                    handleClose={() => setOpenFaceReset(false)}
                    defaultEmail={email}
                />
            )}
        </Box>
    );
};

export default LoginRegister;
