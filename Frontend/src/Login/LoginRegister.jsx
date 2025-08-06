import React, { useState, useEffect } from 'react';
import backgroundImage from './Assist/background.jpg';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Stack,
    Link,
    InputAdornment,
    IconButton,
    FormControlLabel,
    Checkbox,
    CircularProgress,
    Alert
} from '@mui/material';
import { Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material';
import { EnvelopeSimple } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Component/Context/AuthContext';

const LoginRegister = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [alert, setAlert] = useState(null);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { login, register, isAuthenticated, isLoading } = useAuth();

    const handleSubmit = () => {
        if (isLogin) {
            console.log('Submitting login form...');
            login(username, password);
        } else {
            console.log('Submitting registration form...');
            register(username, email, password);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            console.log('User authenticated, redirecting to /app...');
            navigate('/app');
        }
    }, [isAuthenticated, navigate]);

    const handleToggleMode = () => {
        setIsLogin(!isLogin);
        setAlert(null);
        // Reset form fields
        setUsername('');
        setEmail('');
        setPassword('');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                p: 2
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 400,
                    borderRadius: 2
                }}
            >
                <Stack spacing={3}>
                    <Typography variant="h4" textAlign="center">
                        {isLogin ? 'ورود' : 'ثبت نام'}
                    </Typography>

                    {alert && (
                        <Alert severity={alert.type} onClose={() => setAlert(null)}>
                            {alert.message}
                        </Alert>
                    )}

                    <TextField
                        label="نام کاربری"
                        fullWidth
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Person />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {!isLogin && (
                        <TextField
                            label="ایمیل"
                            type="email"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EnvelopeSimple size={20} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}

                    <TextField
                        label="رمز عبور"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {isLogin ? (
                        <Stack direction="row" justifyContent="space-between">
                            <FormControlLabel
                                control={<Checkbox />}
                                label="مرا به خاطر بسپار"
                            />
                            <Link href="#" variant="body2">
                                رمز عبور را فراموش کرده‌اید؟
                            </Link>
                        </Stack>
                    ) : (
                        <FormControlLabel
                            control={<Checkbox />}
                            label="با شرایط و قوانین موافقم"
                        />
                    )}

                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} /> : null}
                    >
                        {isLoading ? (
                            <CircularProgress size={24} />
                        ) : (
                            isLogin ? 'ورود' : 'ثبت نام'
                        )}
                    </Button>

                    <Typography textAlign="center">
                        {isLogin ? "حساب کاربری ندارید؟" : "حساب کاربری دارید؟"}{' '}
                        <Link
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleToggleMode();
                            }}
                            sx={{ cursor: 'pointer' }}
                        >
                            {isLogin ? 'ثبت نام' : 'ورود'}
                        </Link>
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
};

export default LoginRegister;