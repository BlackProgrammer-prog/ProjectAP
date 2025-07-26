import React, { useState } from 'react';
import { Box, Stack, styled, Badge, Avatar, Typography, IconButton, Divider, useTheme } from '@mui/material';
import { faker } from '@faker-js/faker';
import { CaretDown, MagnifyingGlass, PhoneCall, VideoCamera } from 'phosphor-react';
import UserProfile from '../../layouts/dashboard/UserProfile';
import { useParams } from 'react-router-dom';
import { ChatList } from '../../data';

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

const Header = () => {
    const { username } = useParams();
    const theme = useTheme();
    const [showUserProfile, setShowUserProfile] = useState(false);

    // پیدا کردن اطلاعات کاربر از ChatList
    const chat = ChatList.find((c) => c.username === username);

    const handleAvatarClick = () => {
        setShowUserProfile(true);
    };

    const handleCloseProfile = () => {
        setShowUserProfile(false);
    };

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
                        width: '100%',
                        height: '100%'
                    }}>
                        <Typography variant="h6">Select a Contact</Typography>
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
                            variant={chat.online ? 'dot' : undefined}
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
                                    {chat.online ? "Online" : "Offline"}
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
                            <IconButton>
                                <PhoneCall />
                            </IconButton>
                            <IconButton>
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

            {/* نمایش پروفایل کاربر */}
            {showUserProfile && (
                <UserProfile onClose={handleCloseProfile} />
            )}
        </Stack>
    );
};

export default Header;
