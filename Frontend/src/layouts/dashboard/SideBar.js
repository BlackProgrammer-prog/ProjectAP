import { Avatar, Box, Divider, IconButton, Stack, Switch, useTheme, Menu, MenuItem, Typography } from "@mui/material";
import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/Images/logo.ico";
import {
    AddressBook, ChatCircleDots, CirclesThreePlus, GameController, Gear,
    Phone, SignOut, User, Users
} from "phosphor-react";
import { faker } from "@faker-js/faker";
import useSettings from '../../hooks/useSettings';
import Profile from "./Profile";
import Chats from "../../pages/dashboard/Chats";
import { OpenAiLogoIcon } from "@phosphor-icons/react";
import { useAuth } from "../../Login/Component/Context/AuthContext"; // Import useAuth

const SideBar = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { onToggleMode } = useSettings();
    const location = useLocation();
    const { logout } = useAuth(); // Get the logout function from AuthContext

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [openChat, setOpenChat] = useState(false);
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
    const profileMenuOpen = Boolean(profileMenuAnchor);

    if (location.pathname.startsWith("/Login-Register")) {
        return <Outlet />;
    }

    const handleNavigate = (path) => {
        if (location.pathname !== path) {
            navigate(path);
        } else {
            navigate("/app"); // Toggle behavior: if already on the page, go back to main chat
        }
    };
    
    const handleProfileClick = (event) => {
        setProfileMenuAnchor(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setProfileMenuAnchor(null);
    };

    const handleLogout = () => {
        logout(); // This will clear localStorage and update auth state
        handleProfileMenuClose();
        // The redirection logic will be handled in the DashboardLayout
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
                    {/* Logo */}
                    <Box sx={{ backgroundColor: theme.palette.primary.main, height: 64, width: 64, borderRadius: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img src={logo} alt="chat logo" style={{ width: '80%', height: '80%' }} />
                    </Box>

                    {/* Navigation Buttons */}
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
                    
                    {/* Bottom part of sidebar */}
                    <Stack direction="column" alignItems="center" spacing={2} sx={{ marginBottom: 2 }}>
                        <Switch onChange={onToggleMode} defaultChecked />
                        <Avatar src={faker.image.avatar()} onClick={handleProfileClick} sx={{ cursor: 'pointer' }} />
                        
                        {/* Profile Menu */}
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
