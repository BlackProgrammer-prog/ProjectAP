import React, { useState, useEffect } from 'react';
import { Box, Stack, styled, Badge, Avatar, Typography, IconButton, Divider, useTheme, TextField, InputAdornment } from '@mui/material';
import { faker } from '@faker-js/faker';
import { CaretDown, MagnifyingGlass, PhoneCall, VideoCamera, X } from 'phosphor-react';
import UserProfile from '../../layouts/dashboard/UserProfile';
import { useParams } from 'react-router-dom';
import { clearPrivateChat } from '../../utils/chatStorage';
import StartCall from '../../Secctions/main/StartCall';
import { loadPV } from '../../utils/pvStorage';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';

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

const Header = ({ chatData, onBlockUser, onDeleteChat, onSearchChange, isSearchActive }) => {
    const { username } = useParams();
    const theme = useTheme();
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
        online: false,
    }) : null;
    const pv = loadPV();
    const pvChat = (pv || []).find((p) => p.customUrl === username);
    const chat = chatData ? normalize(chatData) : normalize(pvChat);
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
    if (!chat) {
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
                            variant={chat.online && !isBlocked ? 'dot' : undefined}
                        >
                            <Avatar
                                src={chat.img}
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
                            <Typography variant="h6">{chat.name}</Typography>
                            <Stack sx={{
                                position: 'fixed',
                                top: 60
                            }}>
                                <Typography variant='caption'>
                                    {isBlocked ? "Blocked" : (chat.online ? "Online" : "Offline")}
                                </Typography>
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
                            <IconButton>
                                <VideoCamera size={22} />
                            </IconButton>
                            <IconButton onClick={() => setOpenDialog(true)}>
                                <PhoneCall />
                            </IconButton>
                            <IconButton onClick={handleSearchClick}>
                                <MagnifyingGlass />
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
