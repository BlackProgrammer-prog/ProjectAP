import React, { useState, useEffect } from 'react';
import { Box, Stack, styled, Badge, Avatar, Typography, IconButton, Divider, useTheme, TextField, InputAdornment } from '@mui/material';
import { faker } from '@faker-js/faker';
import { CaretDown, MagnifyingGlass, PhoneCall, VideoCamera, X, DownloadSimple } from 'phosphor-react';
import UserProfile from '../../layouts/dashboard/UserProfile';
import { useParams } from 'react-router-dom';
import { clearPrivateChat } from '../../utils/chatStorage';
import StartCall from '../../Secctions/main/StartCall';
import { loadPV } from '../../utils/pvStorage';
import { useVideoCall } from '../../contexts/VideoCallContext';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';
import { useAuth } from '../../Login/Component/Context/AuthContext';
import webSocketService from '../../Login/Component/Services/WebSocketService';

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#44b700',
        color: '#44b700',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
        },
    },
    '@keyframes ripple': {
        '0%': { transform: 'scale(.8)', opacity: 1 },
        '100%': { transform: 'scale(2.4)', opacity: 0 },
    },
}));

const Header = ({ chatData, onBlockUser, onDeleteChat, onSearchChange, isSearchActive, onExportChat }) => {
    const { username } = useParams();
    const theme = useTheme();
    const { startCall, startVoiceCall } = useVideoCall();
    const { token } = useAuth();
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState(() => {
        const stored = localStorage.getItem('blocked_users');
        return stored ? JSON.parse(stored) : [];
    });
    const [searchQuery, setSearchQuery] = useState('');

    // یافتن و نرمال‌سازی اطلاعات چت: ابتدا از prop، سپس از PV (localStorage)
    const normalize = (p) => p ? ({
        username: p.customUrl,
        name: p.fullName || p.username || p.email,
        img: resolveAvatarUrl(p.avatarUrl),
    }) : null;
    const [contact, setContact] = useState(() => {
        const pv = loadPV();
        const pvChat = (pv || []).find((p) => p && (p.customUrl === username || p.username === username || p.email === username));
        return chatData ? normalize(chatData) : normalize(pvChat);
    });
    const [online, setOnline] = useState(false);
    useEffect(() => {
        const update = () => {
            const pv = loadPV();
            const pvChat = (pv || []).find((p) => p && (p.customUrl === username || p.username === username || p.email === username));
            const norm = chatData ? normalize(chatData) : normalize(pvChat);
            if (norm) setContact(norm);
            setOnline(!!pvChat && Number(pvChat.status) === 1);
        };
        update();
        const id = setInterval(update, 1500);
        return () => clearInterval(id);
    }, [username, chatData]);
    const isBlocked = blockedUsers.includes(username);

    const handleAvatarClick = () => {
        setShowUserProfile(true);
    };

    const handleCloseProfile = () => {
        setShowUserProfile(false);
    };

    const handleBlockUser = (userToBlock) => {
        const newBlockedUsers = blockedUsers.includes(userToBlock)
            ? blockedUsers.filter(user => user !== userToBlock)
            : [...blockedUsers, userToBlock];

        setBlockedUsers(newBlockedUsers);
        localStorage.setItem('blocked_users', JSON.stringify(newBlockedUsers));

        if (onBlockUser) {
            onBlockUser(userToBlock, newBlockedUsers.includes(userToBlock));
        }
    };

    const handleDeleteChat = (userToDelete) => {
        // حذف پیام‌ها از localStorage
        clearPrivateChat(userToDelete);

        if (onDeleteChat) {
            onDeleteChat(userToDelete);
        }
    };

    // Search functionality
    const handleSearchClick = () => {
        if (onSearchChange) {
            onSearchChange(true);
        }
    };

    const handleSearchInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (onSearchChange) {
            onSearchChange(true, query);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        if (onSearchChange) {
            onSearchChange(false, '');
        }
    };
    const [openDialog, setOpenDialog] = useState(false);
    const handleCloseDialog = () => {
        setOpenDialog(false)
    }

    // اگر کاربر پیدا نشد، هدر خالی نمایش بده
    if (!contact) {
        return (
            <Stack>
                <Box
                    sx={{
                        height: "100px",
                        width: '100%',
                        backgroundColor: theme.palette.mode === 'light' ? "#F8FAFF" : theme.palette.background.paper,
                        boxShadow: "0px 0px 2px rgba(0,0,0,0.25)",
                        position: 'fixed',
                        top: 0,
                        left: 422,
                    }}
                >
                    <Stack alignItems={'center'} direction={'row'} justifyContent={'center'} sx={{
                        width: '70%',
                        height: '100%'
                    }}>
                        <Typography variant="h6">Select a Chat</Typography>
                    </Stack>
                </Box>
            </Stack>
        );
    }

    return (
        <Stack>
            <Box
                sx={{
                    height: "100px",
                    width: '100%',
                    backgroundColor: theme.palette.mode === 'light' ? "#F8FAFF" : theme.palette.background.paper,
                    boxShadow: "0px 0px 2px rgba(0,0,0,0.25)",
                    position: 'fixed',
                    top: 0,
                    left: 422,
                }}
            >
                <Stack alignItems={'center'} direction={'row'} justifyContent={'space-between'} sx={{
                    width: '100%',
                    height: '100%'
                }} />
            </Box>
            <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} sx={{
                position: 'fixed',
                top: 30,
                left: 460
            }}>
                <Stack spacing={2}>
                    <Box>
                        <StyledBadge
                            overlap='circular'
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right'
                            }}
                            variant={online && !isBlocked ? 'dot' : undefined}
                        >
                            <Avatar
                                src={contact.img}
                                onClick={handleAvatarClick}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        opacity: 0.8,
                                        transform: 'scale(1.05)',
                                        transition: 'all 0.2s ease'
                                    }
                                }}
                            />
                        </StyledBadge>
                        <Stack sx={{
                            position: 'fixed',
                            top: 30,
                            left: 520
                        }}>
                            <Typography variant="h6">{contact.name}</Typography>
                            <Stack sx={{
                                position: 'fixed',
                                top: 60
                            }}>
                                {!isBlocked && online && (
                                    <Typography variant='caption' color={'success.main'}>
                                        Online
                                    </Typography>
                                )}
                            </Stack>
                        </Stack>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={4}
                            sx={{
                                position: 'fixed',
                                right: 30,
                                top: 33
                            }}
                        >
                            <IconButton onClick={() => {
                                try {
                                    const pv = loadPV();
                                    const u = (pv || []).find((p) => p && (p.customUrl === username || p.username === username || p.email === username));
                                    const toUserId = u && (u.user_id || u.id || u.userId);
                                    if (toUserId) { startCall(String(toUserId)); return; }

                                    const targetEmail = (u && u.email) || (username && username.includes('@') ? username : null) || (u && u.username) || null;
                                    const httpResolve = async (identity) => {
                                        try {
                                            if (!identity) return false;
                                            const resp = await fetch('http://localhost:5000/resolve-user', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ identity })
                                            });
                                            const data = await resp.json().catch(() => null);
                                            if (resp.ok && data && data.status === 'success' && data.userId) {
                                                startCall(String(data.userId));
                                                return true;
                                            }
                                        } catch {}
                                        return false;
                                    };
                                    if (token && targetEmail) {
                                        let resolved = false;
                                        const off = webSocketService.addGeneralListener((raw) => {
                                            let data; try { data = JSON.parse(raw); } catch { return; }
                                            if ((data?.type === 'get_profile_response' || data?.profile) && data?.status === 'success' && data?.profile) {
                                                const same = String(data.profile.email || data.profile.username || '').toLowerCase() === String(targetEmail).toLowerCase();
                                                if (!same) return;
                                                const id = data.profile.user_id || data.profile.id || data.profile.userId;
                                                if (id && !resolved) { resolved = true; off && off(); startCall(String(id)); }
                                            }
                                        });
                                        try { webSocketService.send({ type: 'get_profile', token, email: targetEmail }); } catch {}
                                        setTimeout(async () => {
                                            if (!resolved) {
                                                off && off();
                                                const ok = await httpResolve(targetEmail);
                                                if (!ok) alert('شناسه کاربر برای تماس پیدا نشد');
                                            }
                                        }, 1500);
                                        return;
                                    }

                                    (async () => {
                                        const identity = targetEmail || username || null;
                                        const ok = await httpResolve(identity);
                                        if (!ok) alert('شناسه کاربر برای تماس پیدا نشد');
                                    })();
                                } catch { alert('شناسه کاربر برای تماس پیدا نشد'); }
                            }}>
                                <VideoCamera size={22} />
                            </IconButton>
                            <IconButton onClick={() => {
                                try {
                                    const pv = loadPV();
                                    const u = (pv || []).find((p) => p && (p.customUrl === username || p.username === username || p.email === username));
                                    const toUserId = u && (u.user_id || u.id || u.userId);
                                    if (toUserId) { startVoiceCall(String(toUserId)); return; }

                                    const targetIdentity = (u && (u.email || u.username || u.customUrl)) || username || null;
                                    if (targetIdentity) { startVoiceCall(String(targetIdentity)); return; }

                                    alert('شناسه کاربر برای تماس صوتی پیدا نشد');
                                } catch { alert('شناسه کاربر برای تماس صوتی پیدا نشد'); }
                            }}>
                                <PhoneCall />
                            </IconButton>
                            <IconButton onClick={handleSearchClick}>
                                <MagnifyingGlass />
                            </IconButton>
                            <IconButton onClick={() => { try { onExportChat && onExportChat(); } catch {} }} title={'خروجی گرفتن از چت'}>
                                <DownloadSimple />
                            </IconButton>
                            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                            <IconButton>
                                <CaretDown />
                            </IconButton>
                        </Stack>
                    </Box>
                </Stack>
            </Stack>

            {/* Search input field */}
            {isSearchActive && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 100,
                        left: 422,
                        right: 1,
                        zIndex: 1000,
                        backgroundColor: theme.palette.mode === 'light' ? "#F8FAFF" : theme.palette.background.paper,
                        padding: 2,
                        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                    }}
                >
                    <TextField
                        fullWidth
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        placeholder="Search..."
                        variant="outlined"
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <MagnifyingGlass size={20} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleClearSearch} size="small">
                                        <X size={16} />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                        }}
                    />
                </Box>
            )}

            {/* نمایش پروفایل کاربر */}
            {showUserProfile && (
                <UserProfile
                    onClose={handleCloseProfile}
                    onBlockUser={handleBlockUser}
                    onDeleteChat={handleDeleteChat}
                    isBlocked={isBlocked}
                />
            )}
            {openDialog && <StartCall open={openDialog} handleClose={handleCloseDialog} />}
        </Stack>
    );
};

export default Header;
