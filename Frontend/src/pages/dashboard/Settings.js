import WallpaperDialog from '../../components/WallpaperDialog';
import React, { useState, useRef, useEffect } from 'react';
import {
    Avatar, Box, Divider, IconButton, Stack,
    Typography, useTheme, Dialog, Switch // Import Switch
} from '@mui/material';
import { CaretLeft, Bell, Lock, Key, PencilCircle, Image, Note, Keyboard, Info } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { faker } from '@faker-js/faker';
import Shortcuts from '../../Secctions/settings/Shortcuts';
import Webcam from 'react-webcam';
import axios from 'axios';
import Help from '../../Secctions/help/help';
import { useAuth } from '../../Login/Component/Context/AuthContext'; // Import useAuth

const Settings = () => {

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

    const theme = useTheme();
    const navigate = useNavigate();
    const { user, setNotificationStatus } = useAuth(); // Get user and the new function

    const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatarUrl || faker.image.avatar());
    const [openShortcuts, setOpenShortcuts] = useState(false);
    const [openCamera, setOpenCamera] = useState(false);
    const [openWallpaperDialog, setOpenWallpaperDialog] = useState(false);
    const [openHelpDialog, setOpenHelpDialog] = useState(false);

    const webcamRef = useRef(null);

    const handleBack = () => navigate(-1);
    const handleOpenShortcuts = () => setOpenShortcuts(true);
    const handleCloseShortcuts = () => setOpenShortcuts(false);


    const [open, setOpen] = useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const captureAndSend = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        const blob = await (await fetch(imageSrc)).blob();
        const formData = new FormData();
        formData.append("image", blob, "avatar.jpg");

        try {
            const response = await axios.post("http://127.0.0.1:5000/animefy", formData, {
                responseType: "blob",
            });

            // چک کنیم blob معتبره یا نه
            if (!response.data || response.data.size === 0) {
                console.error("❌ تصویر دریافتی خالیه!");
                return;
            }

            // ساخت آدرس blob و تنظیم آواتار
            const imageUrl = URL.createObjectURL(response.data);
            console.log("✅ تصویر کارتونی آماده:", imageUrl);
            setAvatarUrl(imageUrl);
            setOpenCamera(false);
        } catch (err) {
            console.error("❌ خطا در ارسال تصویر:", err);
        }
    };

    
    // --- ** NEW HANDLER FOR NOTIFICATIONS ** ---
    const handleToggleNotifications = () => {
        const newStatus = !user.settings.notificationsEnabled;
        setNotificationStatus(newStatus);
    };

    // This list will now be dynamically generated inside the component
    const list = [
        // The Notifications item is now an object with more properties
        { 
            key: 0, 
            icon: <Bell size={20} />, 
            title: 'Notifications', 
            // The onclick now does nothing, as the switch handles it.
            // But we add a control element to be rendered.
            control: (
                <Switch 
                    checked={user?.settings?.notificationsEnabled || false} 
                    onChange={handleToggleNotifications} 
                />
            ) 
        },
        { key: 1, icon: <Lock size={20} />, title: "Privacy", onclick: () => {} },
        { key: 2, icon: <Key size={20} />, title: "Security", onclick: () => {} },
        { key: 3, icon: <PencilCircle size={20} />, title: "Theme", onclick: () => {} },
        { key: 4, icon: <Image size={20} />, title: "Chat Wallpaper", onclick: () => setOpenWallpaperDialog(true) },
        { key: 5, icon: <Note size={20} />, title: "Request Account Info", onclick: () => {} },
        { key: 6, icon: <Keyboard size={20} />, title: "Keyboard Shortcuts", onclick: handleOpenShortcuts },
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
                    <Avatar sx={{ width: 60, height: 60, cursor: 'pointer' }} src={avatarUrl} alt='avatar' onClick={() => setOpenCamera(true)} />
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
                                justifyContent="space-between" // Align items to have space between them
                                alignItems="center"
                                onClick={item.onclick} // Keep original onclick for navigation items
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
            {openShortcuts && <Shortcuts open={openShortcuts} handleClose={handleCloseShortcuts} />}
            {openHelpDialog && <Help open={openHelpDialog} handleClose={() => setOpenHelpDialog(false)} />}
            {openWallpaperDialog && <WallpaperDialog open={openWallpaperDialog} onClose={() => setOpenWallpaperDialog(false)} />}
            <Dialog open={openCamera} onClose={() => setOpenCamera(false)} maxWidth="sm">
                <Stack spacing={2} alignItems="center" p={2}>
                    <Typography variant="h6">Take a Profile Photo</Typography>
                    <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" width={300} height={300} videoConstraints={{ facingMode: "user" }} style={{ borderRadius: 10 }} />
                </Stack>
            </Dialog>
        </>
    );
};

export default Settings;
