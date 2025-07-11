
// // ................................................................

import { Avatar, Box, Divider, IconButton, Stack, Switch, useTheme, Menu, MenuItem, Typography } from "@mui/material";
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import logo from "../../assets/Images/logo.ico";
import { getProfileMenu, Nav_Buttons, Profile_Menu } from "../../data/index";
import { Brain, ChatCircleDots, GameController, Gear, Phone, Robot, SignOut, User, Users } from "phosphor-react";
import { faker } from "@faker-js/faker";
import useSettings from '../../hooks/useSettings';
import Profile from "./Profile";
import UserProfile from "./UserProfile";
import Settings from "../../pages/dashboard/Settings";
import Group from "../../pages/dashboard/Group";
import Chats from "../../pages/dashboard/Chats";
import Call from "../../pages/dashboard/Call";
import { useNavigate } from "react-router-dom";
import { OpenAiLogoIcon } from "@phosphor-icons/react";




const SideBar = () => {
    // const Profile_Menu = getProfileMenu(navigate);
    const them = useTheme();
    const navigate = useNavigate();
    const { onToggleMode } = useSettings();
    const location = useLocation();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [openChat, setOpenChat] = useState(false);
    const [select, setSelect] = useState(null);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const profileMenuOpen = Boolean(profileMenuAnchor);
    const [selectedIcon, setSelectedIcon] = useState(null);
    const [openSettings, setOpenSettings] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    if (location.pathname.startsWith("/Login-Register")) {
        return <Outlet />; // فقط محتوای صفحه را نمایش بده
    }

    const handleToggleSettings = () => {
        navigate("/settings");
    };



    const handleToggleGroup = () => {
        if (location.pathname === "/group") {
            navigate("/app"); // اگر در مسیر group هستیم، به app برگردیم
        } else {
            navigate("/group"); // اگر نیستیم، به group برویم
        }
    };



    const handleToggleChat = () => {
        if (openChat) {
            // اگر گروه باز است، آن را ببند
            setOpenChat(false);
            setSelectedIcon(null);
        } else {
            // اگر گروه بسته است، آن را باز کن
            setOpenChat(true);
            setSelectedIcon('gear');
        }
    };

    const handleToggleCall = () => {
        if (location.pathname === "/call") {
            navigate("/app"); // اگر در مسیر call هستیم، به app برگردیم
        } else {
            navigate("/call"); // اگر نیستیم، به call برویم
        }
    };

    const handleToggleAI = () => {
        if (location.pathname === "/AI") {
            navigate("/app"); // اگر در مسیر call هستیم، به app برگردیم
        } else {
            navigate("/AI"); // اگر نیستیم، به call برویم
        }
    };
    const handleToggleGame = () => {
        if (location.pathname === "/AI") {
            navigate("/app"); // اگر در مسیر call هستیم، به app برگردیم
        } else {
            navigate("/game"); // اگر نیستیم، به call برویم
        }
    };

    const handleProfileClick = (event) => {
        setProfileMenuAnchor(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setProfileMenuAnchor(null);
    };

    const handleMenuItemClick = (option) => {
        console.log(`Selected: ${option.title}`);
        if (option.title === 'Profile') {
            setShowProfile(!showProfile);  // Toggle visibility of Profile
        }
        handleProfileMenuClose();
    };

    const handleUserProfileToggle = () => {
        setShowUserProfile(!showUserProfile);
        setProfileMenuAnchor(null);
    };

    const handleOpenProfile = () => {
        setIsProfileOpen(true);
    };

    const handleCloseProfile = () => {
        setIsProfileOpen(false);
    };
    return (
        <Stack>
            <Box sx={{
                backgroundColor: them.palette.background.paper,
                boxShadow: "0px 0px 2px rgba(0,0,0,0.2)",
                height: "100vh",
                width: 100,
                paddingTop: 1
            }}>
                <Stack direction="column" alignItems={"center"} sx={{ width: "100%", height: "100%", flexDirection: "column", justifyContent: "space-between" }}>
                    <Box sx={{
                        backgroundColor: them.palette.primary.main,
                        height: 64,
                        width: 64,
                        borderRadius: 12,
                    }}>
                        <img src={logo || "/placeholder.svg"} alt="chat logo" />
                    </Box>

                    <Stack sx={{ width: "max-content", marginTop: 1 }} direction="column" spacing={2.5}>
                        {/* {Nav_Buttons.map((el) => (
                            <Box
                                key={el.index}
                                sx={{
                                    backgroundColor: select === el.index ? them.palette.primary.main : 'transparent',
                                    borderRadius: 1.5
                                }}
                            >
                                <IconButton
                                    onClick={() => handleToggleGroup('gear')}
                                    sx={{
                                        width: "max-content",
                                        color: select === el.index ? "#fff" : "#000"
                                    }}
                                >
                                    {el.icon}
                                </IconButton>
                            </Box>
                        ))} */}
                        <Box
                            sx={{
                                backgroundColor: select ? them.palette.primary.main : 'transparent',
                                borderRadius: 1.5
                            }}
                        >
                            <IconButton
                                onClick={() => navigate("/app")}
                                sx={{
                                    width: "max-content",
                                    color: select ? "#fff" : "#000"
                                }}
                            >
                                <ChatCircleDots />
                            </IconButton>
                        </Box>
                        <Box
                            sx={{
                                backgroundColor: select ? them.palette.primary.main : 'transparent',
                                borderRadius: 1.5
                            }}
                        >
                            <IconButton
                                onClick={() => handleToggleGroup()}
                                sx={{
                                    width: "max-content",
                                    color: select ? "#fff" : "#000"
                                }}
                            >
                                <Users />
                            </IconButton>
                        </Box>
                        <Box
                            sx={{
                                backgroundColor: select ? them.palette.primary.main : 'transparent',
                                borderRadius: 1.5
                            }}
                        >
                            <IconButton
                                onClick={() => { handleToggleCall() }}
                                sx={{
                                    width: "max-content",
                                    color: select ? "#fff" : "#000"
                                }}
                            >
                                <Phone />
                            </IconButton>
                        </Box>
                        <Divider />
                        <IconButton
                            onClick={handleToggleSettings}
                            sx={{
                                color: select === 'gear' ? "#fff" : "#000",
                                backgroundColor: select === 'gear' ? them.palette.primary.main : 'transparent',
                                borderRadius: 1.5
                            }}
                        >
                            <Gear />
                        </IconButton>
                        <IconButton sx={{
                            width: "max-content",
                            color: select ? "#fff" : "#000"
                        }}>
                            <Robot size={27} />
                        </IconButton>
                        <IconButton
                            onClick={() => { handleToggleGame() }}
                            sx={{
                                width: "max-content",
                                color: select ? "#fff" : "#000"
                            }}>
                            <GameController size={27} />
                        </IconButton>

                        <IconButton
                            onClick={() => { handleToggleAI() }}
                            sx={{
                                width: "max-content",
                                color: select ? "#fff" : "#000"
                            }}>
                            <OpenAiLogoIcon size={27} />
                        </IconButton>

                    </Stack>

                    <Box sx={{ marginTop: 'auto', marginBottom: 2 }}>
                        <Switch onChange={() => onToggleMode()} defaultChecked />
                    </Box>

                    <Box sx={{ marginBottom: 2, position: 'relative' }}>
                        <Avatar
                            src={faker.image.avatar()}
                            onClick={handleProfileClick}
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }
                            }}
                        />
                        <Menu
                            anchorEl={profileMenuAnchor}
                            open={profileMenuOpen}
                            onClose={handleProfileMenuClose}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            PaperProps={{
                                sx: {
                                    borderRadius: 3,
                                    minWidth: 180,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    border: `1px solid ${them.palette.divider}`,
                                    ml: 1.5,
                                    mt: -0.5,
                                    background: them.palette.mode === 'light'
                                        ? 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)'
                                        : them.palette.background.paper,
                                    backdropFilter: 'blur(10px)',
                                },
                            }}
                        >
                            <Stack spacing={0.5} py={1.5}>
                                {/* {Profile_Menu.map((option, index) => (
                                    <MenuItem
                                        key={index}
                                        onClick={() => {
                                            handleMenuItemClick(option);
                                            // اضافه کردن این خط برای مدیریت نمایش تنظیمات
                                            if (option.title === 'Settings') setShowSettings(true);
                                        }}
                                        sx={{
                                            mx: 1.5,
                                            borderRadius: 2,
                                            fontSize: '0.875rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            py: 1.5,
                                            px: 2,
                                            transition: 'all 0.2s ease',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&:hover': {
                                                backgroundColor: them.palette.mode === 'light'
                                                    ? 'rgba(25, 118, 210, 0.08)'
                                                    : 'rgba(144, 202, 249, 0.08)',
                                                transform: 'translateX(4px)',
                                            },
                                        }}
                                    >
                                        <Box
                                            className="menu-icon"
                                            sx={{
                                                color: them.palette.text.secondary,
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {option.icon}
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 500,
                                                color: them.palette.text.primary,
                                                letterSpacing: '0.025em'
                                            }}
                                        >
                                            {option.title}
                                        </Typography>
                                    </MenuItem>
                                ))} */}
                                {/* .................................. */}
                                <MenuItem
                                    onClick={handleOpenProfile}
                                    sx={{
                                        mx: 1.5,
                                        borderRadius: 2,
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        py: 1.5,
                                        px: 2,
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            backgroundColor: them.palette.mode === 'light'
                                                ? 'rgba(25, 118, 210, 0.08)'
                                                : 'rgba(144, 202, 249, 0.08)',
                                            transform: 'translateX(4px)',
                                        },
                                    }}
                                >
                                    <Box
                                        className="menu-icon"
                                        sx={{
                                            color: them.palette.text.secondary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <User />
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 500,
                                            color: them.palette.text.primary,
                                            letterSpacing: '0.025em'
                                        }}
                                    >
                                        Profile
                                    </Typography>
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        navigate('/settings')
                                    }}
                                    sx={{
                                        mx: 1.5,
                                        borderRadius: 2,
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        py: 1.5,
                                        px: 2,
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            backgroundColor: them.palette.mode === 'light'
                                                ? 'rgba(25, 118, 210, 0.08)'
                                                : 'rgba(144, 202, 249, 0.08)',
                                            transform: 'translateX(4px)',
                                        },
                                    }}
                                >
                                    <Box
                                        className="menu-icon"
                                        sx={{
                                            color: them.palette.text.secondary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <Gear />
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 500,
                                            color: them.palette.text.primary,
                                            letterSpacing: '0.025em'
                                        }}
                                    >
                                        Settings
                                    </Typography>
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        navigate('/Login-Register')
                                    }}
                                    sx={{
                                        mx: 1.5,
                                        borderRadius: 2,
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        py: 1.5,
                                        px: 2,
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            backgroundColor: them.palette.mode === 'light'
                                                ? 'rgba(25, 118, 210, 0.08)'
                                                : 'rgba(144, 202, 249, 0.08)',
                                            transform: 'translateX(4px)',
                                        },
                                    }}
                                >
                                    <Box
                                        className="menu-icon"
                                        sx={{
                                            color: them.palette.text.secondary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <SignOut />
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 500,
                                            color: them.palette.text.primary,
                                            letterSpacing: '0.025em'
                                        }}
                                    >
                                        LogOut
                                    </Typography>
                                </MenuItem>
                            </Stack>
                        </Menu>
                    </Box>
                </Stack>
            </Box>

            <Outlet />
            {/* {showProfile && <Profile onClose={() => setShowProfile(false)} />} */}
            {openChat && <Chats onClose={() => setOpenChat(false)} />}
            {isProfileOpen && <Profile onClose={handleCloseProfile} />}
        </Stack>
    );
};

export default SideBar;



// ..........................................................

