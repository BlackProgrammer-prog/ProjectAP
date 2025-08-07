import WallpaperDialog from '../../components/WallpaperDialog';
import React, { useState, useRef, useEffect } from 'react';
import {
    Avatar, Box, Divider, IconButton, Stack,
    Typography, useTheme, Dialog, Switch
} from '@mui/material';
import { CaretLeft, Bell, Lock, Key, PencilCircle, Image, Note, Keyboard, Info } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { faker } from '@faker-js/faker';
import Shortcuts from '../../Secctions/settings/Shortcuts';
import Webcam from 'react-webcam';
import axios from 'axios';
import Help from '../../Secctions/help/help';
import { useAuth } from '../../Login/Component/Context/AuthContext';
import ChangePasswordDialog from '../../Secctions/settings/ChangePasswordDialog'; // Import the new dialog

const Settings = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, setNotificationStatus } = useAuth();

    // State for all dialogs
    const [openShortcuts, setOpenShortcuts] = useState(false);
    const [openCamera, setOpenCamera] = useState(false);
    const [openWallpaperDialog, setOpenWallpaperDialog] = useState(false);
    const [openHelpDialog, setOpenHelpDialog] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false); // New state for password dialog
    
    // Existing states and refs
    const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatarUrl || faker.image.avatar());
    const webcamRef = useRef(null);

    const handleBack = () => navigate(-1);
    
    const handleToggleNotifications = () => {
        const newStatus = !user.settings.notificationsEnabled;
        setNotificationStatus(newStatus);
    };

    const list = [
        { 
            key: 0, 
            icon: <Bell size={20} />, 
            title: 'Notifications', 
            control: (
                <Switch 
                    checked={user?.settings?.notificationsEnabled || false} 
                    onChange={handleToggleNotifications} 
                />
            ) 
        },
        { key: 1, icon: <Lock size={20} />, title: "Privacy", onclick: () => {} },
        // Updated "Security" item to open the new dialog
        { key: 2, icon: <Key size={20} />, title: "Security", onclick: () => setOpenChangePassword(true) },
        { key: 3, icon: <PencilCircle size={20} />, title: "Theme", onclick: () => {} },
        { key: 4, icon: <Image size={20} />, title: "Chat Wallpaper", onclick: () => setOpenWallpaperDialog(true) },
        { key: 5, icon: <Note size={20} />, title: "Request Account Info", onclick: () => {} },
        { key: 6, icon: <Keyboard size={20} />, title: "Keyboard Shortcuts", onclick: () => setOpenShortcuts(true) },
        { key: 7, icon: <Info size={20} />, title: "Help", onclick: () => setOpenHelpDialog(true) },
    ];
    
    // This part was added by the user, I will keep it as is.
    const [UserNameFull , setUserNameFull] = useState('');
    const [UserNameUser ,SetUserNameUser ] = useState('');
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser){
            try {
                const UserObject = JSON.parse(storedUser);
                const ObjectProfile = UserObject.profile;
                setUserNameFull(ObjectProfile.fullName);
                SetUserNameUser(UserObject.username);
            }catch (error) {
                console.error("Error while fetching user data", error);
            }
        }
    } , []);
    const [open, setOpen] = useState(false);
    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const captureAndSend = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        const blob = await (await fetch(imageSrc)).blob();
        const formData = new FormData();
        formData.append("image", blob, "avatar.jpg");
        try {
            const response = await axios.post("http://127.0.0.1:5000/animefy", formData, {
                responseType: "blob",
            });
            if (!response.data || response.data.size === 0) {
                console.error("❌ تصویر دریافتی خالیه!");
                return;
            }
            const imageUrl = URL.createObjectURL(response.data);
            console.log("✅ تصویر کارتونی آماده:", imageUrl);
            setAvatarUrl(imageUrl);
            setOpenCamera(false);
        } catch (err) {
            console.error("❌ خطا در ارسال تصویر:", err);
        }
    };
    // End of user-added part

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
                    <Avatar sx={{ width: 60, height: 60, cursor: 'pointer' }} src={avatarUrl} alt='avatar' onClick={() => setOpenCamera(true)} />
                    <Stack>
                        <Typography variant='subtitle1'>{UserNameFull}</Typography>
                        <Typography variant='body2' color="text.secondary">{UserNameUser}</Typography>
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
            {open && <Help open={open} handleClose={handleClose} />}
            {openWallpaperDialog && <WallpaperDialog open={openWallpaperDialog} onClose={() => setOpenWallpaperDialog(false)} />}
            {openChangePassword && <ChangePasswordDialog open={openChangePassword} handleClose={() => setOpenChangePassword(false)} />}

            <Dialog open={openCamera} onClose={() => setOpenCamera(false)} maxWidth="sm">
                <Stack spacing={2} alignItems="center" p={2}>
                    <Typography variant="h6">Take a Profile Photo</Typography>
                    <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" width={300} height={300} videoConstraints={{ facingMode: "user" }} style={{ borderRadius: 10 }} />
                    <IconButton onClick={captureAndSend} sx={{ mt: 1 }}>📸 Take Photo</IconButton>
                </Stack>
            </Dialog>
        </>
    );
};

export default Settings;
