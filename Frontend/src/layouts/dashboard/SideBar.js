import { Avatar, Box, Divider, IconButton, Stack, Switch, useTheme, Menu, MenuItem, Typography } from "@mui/material";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/Images/logo.ico";
import {
    AddressBook, ChatCircleDots, CirclesThreePlus, GameController, Gear,
    Phone, SignOut, User, Users
} from "phosphor-react";
import { faker } from "@faker-js/faker";
import useSettings from '../../hooks/useSettings';
import Chats from "../../pages/dashboard/Chats";
import { OpenAiLogoIcon } from "@phosphor-icons/react";
import { useAuth } from "../../Login/Component/Context/AuthContext";
import Profile from "./Profile"; // Import useAuth

const SideBar = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { onToggleMode } = useSettings();
    const { user, logout, updateUser } = useAuth(); // Get user and updateUser for theme toggle
    const location = useLocation();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [openChat, setOpenChat] = useState(false);
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
    const profileMenuOpen = Boolean(profileMenuAnchor);

    // Voice navigation state
    const [isVoiceListening, setIsVoiceListening] = useState(false);
    const recognitionRef = useRef(null);
    const hasRequestedMediaRef = useRef(false);

    const ensureMicPermission = useCallback(async () => {
        if (hasRequestedMediaRef.current) return true;
        try {
            const isLocalhost = typeof window !== 'undefined' && (/^(localhost|127\.0\.0\.1|\[::1\])$/i).test(window.location.hostname);
            const isSecure = typeof window !== 'undefined' && (window.isSecureContext || isLocalhost);
            if (!isSecure) {
                alert("برای استفاده از فرمان صوتی، برنامه باید روی HTTPS یا localhost اجرا شود.");
                return false;
            }
            if (!navigator?.mediaDevices?.getUserMedia) return true;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            try { (stream.getTracks() || []).forEach(t => t.stop()); } catch {}
            hasRequestedMediaRef.current = true;
            return true;
        } catch (err) {
            try { console.error('Mic permission error (voice nav):', err); } catch {}
            alert("دسترسی به میکروفون رد شد یا در دسترس نیست. لطفاً اجازه دسترسی را فعال کنید.");
            return false;
        }
    }, []);

    const stopVoiceRecognition = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
            try { recognitionRef.current.abort && recognitionRef.current.abort(); } catch {}
            recognitionRef.current = null;
        }
        setIsVoiceListening(false);
    }, []);

    const routeMap = useMemo(() => {
        // keys are normalized (lowercase, spaces simplified). values are absolute paths
        return new Map([
            // English keys
            ["app", "/app"],
            ["home", "/app"],
            ["group", "/group"],
            ["call", "/call"],
            ["contacts", "/contacts"],
            ["settings", "/settings"],
            ["games", "/games"],
            ["video call", "/video-call"],
            ["profile", "/profile"],
            ["ai", "/AI/state"],
            ["ai state", "/AI/state"],
            ["ai/state", "/AI/state"],
            ["chatgpt", "/chatgpt"],
            ["deepseek", "/deepseek"],
            ["gemini", "/gemini"],
            ["tictactoe", "/tictactoe"],
            ["pacman", "/pacman"],
            ["chess", "/chess"],
            ["services", "/services"],
            ["calculate", "/Calculate"],
            ["calender", "/Calender"],
            ["coin", "/Coin"],
            ["compiler", "/Compiler"],
            ["robot", "/Robot"],
            ["weather", "/Weather"],
            // Persian keys
            ["خانه", "/app"],
            ["صفحه اصلی", "/app"],
            ["چت", "/app"],
            ["گروه", "/group"],
            ["تماس", "/call"],
            ["تماس ها", "/call"],
            ["مخاطبین", "/contacts"],
            ["تنظیمات", "/settings"],
            ["بازی", "/games"],
            ["بازی ها", "/games"],
            ["ویدیو کال", "/video-call"],
            ["تماس ویدیو", "/video-call"],
            ["پروفایل", "/profile"],
            ["نمایه", "/profile"],
            ["هوش مصنوعی", "/AI/state"],
            ["ای آی", "/AI/state"],
            ["چت جی پی تی", "/chatgpt"],
            ["دیپ سیک", "/deepseek"],
            ["دیپسیک", "/deepseek"],
            ["جمنی", "/gemini"],
            ["جِمینی", "/gemini"],
            ["دوز", "/tictactoe"],
            ["تی تَک تو", "/tictactoe"],
            ["تیک تاک تو", "/tictactoe"],
            ["پک من", "/pacman"],
            ["شطرنج", "/chess"],
            ["سرویس", "/services"],
            ["سرویس ها", "/services"],
            ["ماشین حساب", "/Calculate"],
            ["تقویم", "/Calender"],
            ["سکه", "/Coin"],
            ["کامپایلر", "/Compiler"],
            ["ربات", "/Robot"],
            ["آب و هوا", "/Weather"],
        ]);
    }, []);

    const normalize = useCallback((text) => {
        if (!text) return "";
        return String(text)
            .toLowerCase()
            .replace(/\u200c/g, ' ')
            .replace(/[^a-z0-9\u0600-\u06FF\s\/:-]/g, '') // strip punctuation except separators
            .replace(/\s+/g, ' ')
            .trim();
    }, []);

    const handleVoiceLogoClick = useCallback(async () => {
        try {
            if (!isVoiceListening) {
                const allowed = await ensureMicPermission();
                if (!allowed) return;

                const RecognitionCtor = (typeof window !== 'undefined') && (window.webkitSpeechRecognition || window.SpeechRecognition);
                if (!RecognitionCtor) {
                    alert("تبدیل گفتار به متن در این مرورگر پشتیبانی نمی‌شود. Chrome/Edge پیشنهاد می‌شود.");
                    return;
                }

                const recognition = new RecognitionCtor();
                recognition.lang = 'fa-IR';
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;
                recognition.onstart = () => setIsVoiceListening(true);
                recognition.onerror = (e) => { try { console.warn('Voice nav error:', e?.error || e); } catch {}; stopVoiceRecognition(); };
                recognition.onend = () => setIsVoiceListening(false);
                recognition.onresult = (event) => {
                    // Examine both interim and final results for faster response
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const result = event.results[i];
                        const transcript = (result[0] && result[0].transcript) ? result[0].transcript : "";
                        const normPiece = normalize(transcript);
                        for (const [key, path] of routeMap.entries()) {
                            if (normPiece === key || normPiece.includes(key)) {
                                stopVoiceRecognition();
                                if (location.pathname !== path) navigate(path);
                                return;
                            }
                        }
                    }
                };
                try { recognition.start(); } catch {}
                recognitionRef.current = recognition;
            } else {
                stopVoiceRecognition();
            }
        } catch {}
    }, [isVoiceListening, ensureMicPermission, normalize, routeMap, navigate, stopVoiceRecognition, location?.pathname]);

    useEffect(() => {
        return () => {
            stopVoiceRecognition();
        };
    }, [stopVoiceRecognition]);

    if (location.pathname.startsWith("/Login-Register")) {
        return <Outlet />;
    }

    const handleNavigate = (path) => {
        if (location.pathname !== path) {
            navigate(path);
        } else {
            navigate("/app");
        }
    };
    
    const handleProfileClick = (event) => {
        setProfileMenuAnchor(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setProfileMenuAnchor(null);
    };

    const handleLogout = () => {
        logout();
        handleProfileMenuClose();
    };

    // Handler for Theme Toggle
    const handleThemeToggle = () => {
        onToggleMode(); // Toggles theme visually
        updateUser({ // Updates backend and localStorage
            settings_json: { darkMode: !user.settings.darkMode }
        });
    };

    return (
        <Stack>
            <Box sx={{
                backgroundColor: theme.palette.background.paper,
                boxShadow: "0px 0px 2px rgba(0,0,0,0.2)",
                height: "100vh",
                width: 100,
                paddingTop: 1
            }}>
                <Stack direction="column" alignItems="center" sx={{ width: "100%", height: "100%", justifyContent: "space-between" }}>
                    <Box onClick={handleVoiceLogoClick} sx={{ backgroundColor: theme.palette.primary.main, height: 64, width: 64, borderRadius: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', position: 'relative', boxShadow: isVoiceListening ? `0 0 0 3px ${theme.palette.success.main}` : 'none' }}>
                        <img src={logo} alt="chat logo" style={{ width: '80%', height: '80%' }} />
                        {isVoiceListening && (
                            <Box sx={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: '50%', backgroundColor: theme.palette.success.main }} />
                        )}
                    </Box>

                    <Stack sx={{ width: "max-content", marginTop: 1 }} direction="column" spacing={2.5}>
                        <IconButton onClick={() => navigate("/app")}><ChatCircleDots /></IconButton>
                        <IconButton onClick={() => handleNavigate("/group")}><Users /></IconButton>
                        <IconButton onClick={() => handleNavigate("/call")}><Phone /></IconButton>
                        <IconButton onClick={() => handleNavigate("/contacts")}><AddressBook /></IconButton>
                        <Divider />
                        <IconButton onClick={() => navigate("/settings")}><Gear /></IconButton>
                        <IconButton onClick={() => handleNavigate("/services")}><CirclesThreePlus size={27} /></IconButton>
                        <IconButton onClick={() => handleNavigate("/games")}><GameController size={27} /></IconButton>
                        <IconButton onClick={() => handleNavigate("/ai/state")}><OpenAiLogoIcon size={27} /></IconButton>
                    </Stack>
                    
                    <Stack direction="column" alignItems="center" spacing={2} sx={{ marginBottom: 2 }}>
                        {/* Connect the switch to the new handler and user state */}
                        <Switch onChange={handleThemeToggle} checked={user?.settings?.darkMode || false} />
                        <Avatar src={user?.profile?.avatarUrl || faker.image.avatar()} onClick={handleProfileClick} sx={{ cursor: 'pointer' }} />
                        
                        <Menu
                            anchorEl={profileMenuAnchor}
                            open={profileMenuOpen}
                            onClose={handleProfileMenuClose}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            PaperProps={{ sx: { borderRadius: 2, minWidth: 180, boxShadow: 3, ml: 1, mt: -1 } }}
                        >
                            <Stack spacing={0.5} py={1}>
                                <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
                                    <User />
                                    <Typography sx={{ ml: 1.5 }}>Profile</Typography>
                                </MenuItem>
                                <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
                                    <Gear />
                                    <Typography sx={{ ml: 1.5 }}>Settings</Typography>
                                </MenuItem>
                                <Divider sx={{ my: 0.5 }} />
                                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                                    <SignOut />
                                    <Typography sx={{ ml: 1.5 }}>Logout</Typography>
                                </MenuItem>
                            </Stack>
                        </Menu>
                    </Stack>
                </Stack>
            </Box>

            <Outlet />
            {isProfileOpen && <Profile onClose={() => setIsProfileOpen(false)} />}
            {openChat && <Chats onClose={() => setOpenChat(false)} />}
        </Stack>
    );
};

export default SideBar;
