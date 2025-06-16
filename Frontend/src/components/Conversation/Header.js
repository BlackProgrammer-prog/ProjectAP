import React, { useState } from 'react';
import { Box, Stack, styled, Badge, Avatar, Typography, IconButton, Divider, useTheme } from '@mui/material';
import { faker } from '@faker-js/faker';
import { CaretDown, MagnifyingGlass, PhoneCall, VideoCamera } from 'phosphor-react';
import UserProfile from '../../layouts/dashboard/UserProfile'; // فرض می‌کنیم UserProfile در همان دایرکتوری قرار دارد

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
    const theme = useTheme();
    const [showUserProfile, setShowUserProfile] = useState(false);

    const handleAvatarClick = () => {
        setShowUserProfile(true);
    };

    const handleCloseProfile = () => {
        setShowUserProfile(false);
    };

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
                            variant='dot'
                        >
                            <Avatar
                                src={faker.image.avatar()}
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
                            <Typography variant='subtitle2' spacing={0.2}>
                                meysam
                            </Typography>
                            <Stack sx={{
                                position: 'fixed',
                                top: 60
                            }}>
                                <Typography variant='caption'>Online</Typography>
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

// ................................................................

// "use client"

// import { Box, Stack, Badge, Avatar, IconButton, Divider, useTheme } from "@mui/material"
// import { styled } from "@mui/material/styles"
// import { CaretDown, MagnifyingGlass, PhoneCall, VideoCamera, UserCirclePlus } from "phosphor-react"

// const StyledBadge = styled(Badge)(({ theme }) => ({
//     "& .MuiBadge-badge": {
//         backgroundColor: "#44b700",
//         color: "#44b700",
//         boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
//         "&::after": {
//             position: "absolute",
//             top: 0,
//             left: 0,
//             width: "100%",
//             height: "100%",
//             borderRadius: "50%",
//             animation: "ripple 1.2s infinite ease-in-out",
//             border: "1px solid currentColor",
//             content: '""',
//         },
//     },
//     "@keyframes ripple": {
//         "0%": { transform: "scale(.8)", opacity: 1 },
//         "100%": { transform: "scale(2.4)", opacity: 0 },
//     },
// }))

// const Header = ({ onToggleContact }) => {
//     const theme = useTheme()

//     return (
//         <Box>
//             {/* Header Background */}
//             <Box
//                 sx={{
//                     height: "100px",
//                     width: "100%",
//                     backgroundColor: theme.palette.mode === "light" ? "#F8FAFF" : theme.palette.background.paper,
//                     boxShadow: "0px 0px 2px rgba(0,0,0,0.25)",
//                     position: "fixed",
//                     top: 0,
//                     left: 422,
//                     right: 320,
//                     zIndex: 10,
//                 }}
//             />

//             {/* Header Content */}
//             <Stack
//                 direction="row"
//                 alignItems="center"
//                 justifyContent="space-between"
//                 sx={{
//                     position: "fixed",
//                     top: 0,
//                     left: 422,
//                     right: 320,
//                     height: "100px",
//                     px: 3,
//                     zIndex: 11,
//                 }}
//             >
//                 {/* User Info Section */}
//                 <Stack direction="row" alignItems="center" spacing={2}>
//                     <StyledBadge
//                         overlap="circular"
//                         anchorOrigin={{
//                             vertical: "bottom",
//                             horizontal: "right",
//                         }}
//                         variant="dot"
//                     >
//                         <Avatar src="/placeholder.svg?text=M" />
//                     </StyledBadge>

//                     <Stack>
//                         <Box component="span" sx={{ fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.2 }}>
//                             Meysam
//                         </Box>
//                         <Box component="span" sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
//                             Online
//                         </Box>
//                     </Stack>
//                 </Stack>

//                 {/* Action Buttons */}
//                 <Stack direction="row" alignItems="center" spacing={1}>
//                     <IconButton>
//                         <VideoCamera size={22} />
//                     </IconButton>
//                     <IconButton>
//                         <PhoneCall size={22} />
//                     </IconButton>
//                     <IconButton>
//                         <MagnifyingGlass size={22} />
//                     </IconButton>
//                     <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />
//                     <IconButton onClick={onToggleContact}>
//                         <UserCirclePlus size={22} />
//                     </IconButton>
//                     <IconButton>
//                         <CaretDown size={22} />
//                     </IconButton>
//                 </Stack>
//             </Stack>
//         </Box>
//     )
// }

// export default Header
