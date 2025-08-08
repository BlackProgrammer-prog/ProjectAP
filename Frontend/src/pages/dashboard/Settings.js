import WallpaperDialog from '../../components/WallpaperDialog';
import React, { useState, useRef } from 'react'; // Removed useEffect as it's not needed for the logic kept
import {
    Avatar, Box, Divider, IconButton, Stack,
    Typography, useTheme, Dialog, Switch
} from '@mui/material';
import { CaretLeft, Bell, Lock, Key, PencilCircle, Image, Note, Keyboard, Info } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { faker } from '@faker-js/faker';
import Shortcuts from '../../Secctions/settings/Shortcuts';
import Help from '../../Secctions/help/help';
import { useAuth } from '../../Login/Component/Context/AuthContext';
import ChangePasswordDialog from '../../Secctions/settings/ChangePasswordDialog';
import UpdateAvatarDialog from '../../Secctions/settings/UpdateAvatarDialog'; // Import the new dialog

const Settings = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, setNotificationStatus } = useAuth();

    // State for all dialogs
    const [openShortcuts, setOpenShortcuts] = useState(false);
    const [openWallpaperDialog, setOpenWallpaperDialog] = useState(false);
    const [openHelpDialog, setOpenHelpDialog] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [openUpdateAvatar, setOpenUpdateAvatar] = useState(false); // New state for avatar dialog
    
    const handleBack = () => navigate(-1);
    
    const handleToggleNotifications = () => {
        const newStatus = !user.settings.notificationsEnabled;
        setNotificationStatus(newStatus);
    };

    const list = [
        { key: 0, icon: <Bell size={20} />, title: 'Notifications', control: (<Switch checked={user?.settings?.notificationsEnabled || false} onChange={handleToggleNotifications} />) },
        { key: 1, icon: <Lock size={20} />, title: "Privacy", onclick: () => {} },
        { key: 2, icon: <Key size={20} />, title: "Security", onclick: () => setOpenChangePassword(true) },
        { key: 3, icon: <PencilCircle size={20} />, title: "Theme", onclick: () => {} },
        { key: 4, icon: <Image size={20} />, title: "Chat Wallpaper", onclick: () => setOpenWallpaperDialog(true) },
        { key: 5, icon: <Note size={20} />, title: "Request Account Info", onclick: () => {} },
        { key: 6, icon: <Keyboard size={20} />, title: "Keyboard Shortcuts", onclick: () => setOpenShortcuts(true) },
        { key: 7, icon: <Info size={20} />, title: "Help", onclick: () => setOpenHelpDialog(true) },
    ];
    
    return (
        <>
            <Stack sx={{ position: 'fixed', left: 100, height: '100vh', width: 320, backgroundColor: theme.palette.mode === 'light' ? "#F8FAFF" : theme.palette.background.paper, boxShadow: "0px 0px 5px rgba(0,0,0,0.25)", zIndex: 1000 }}>
                <Stack direction="row" alignItems="center" sx={{ p: 3 }}>
                    <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                        <CaretLeft size={26} color={theme.palette.mode === 'dark' ? '#fff' : '#4b4b4b'} />
                    </IconButton>
                    <Typography variant='h5'>Settings</Typography>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ p: 3, alignItems: 'center' }}>
                    {/* Updated the onClick to open the new dialog */}
                    <Avatar sx={{ width: 60, height: 60, cursor: 'pointer' }} src={user?.profile?.avatarUrl|| faker.image.avatar()} alt={user?.username} onClick={() => setOpenUpdateAvatar(true)} />
                    <Stack>
                        <Typography variant='subtitle1'>{user?.profile?.fullName || user?.username}</Typography>
                        <Typography variant='body2' color="text.secondary">{user?.username}</Typography>
                    </Stack>
                </Stack>
                <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
                    {list.map((item) => (
                        <React.Fragment key={item.key}>
                            <Stack
                                direction="row"
                                spacing={2}
                                justifyContent="space-between"
                                alignItems="center"
                                onClick={item.onclick}
                                sx={{ p: 2, '&:hover': { backgroundColor: item.control ? '' : theme.palette.action.hover, cursor: item.control ? 'default' : 'pointer' } }}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>{item.icon}</Box>
                                    <Typography variant='body1'>{item.title}</Typography>
                                </Stack>
                                {item.control && <Box>{item.control}</Box>} 
                            </Stack>
                            <Divider />
                        </React.Fragment>
                    ))}
                </Box>
            </Stack>
            
            {/* Render all dialogs here */}
            {openShortcuts && <Shortcuts open={openShortcuts} handleClose={() => setOpenShortcuts(false)} />}
            {openHelpDialog && <Help open={openHelpDialog} handleClose={() => setOpenHelpDialog(false)} />}
            {openWallpaperDialog && <WallpaperDialog open={openWallpaperDialog} onClose={() => setOpenWallpaperDialog(false)} />}
            {openChangePassword && <ChangePasswordDialog open={openChangePassword} handleClose={() => setOpenChangePassword(false)} />}
            {openUpdateAvatar && <UpdateAvatarDialog open={openUpdateAvatar} handleClose={() => setOpenUpdateAvatar(false)} />}
        </>
    );
};

export default Settings;
