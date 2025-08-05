import WallpaperDialog from '../../components/WallpaperDialog'; // add
import React, { useState, useRef } from 'react';
import {
    Avatar, Box, Divider, IconButton, Stack,
    Typography, useTheme, Dialog
} from '@mui/material';
import { CaretLeft, Bell, Lock, Key, PencilCircle, Image, Note, Keyboard, Info } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { faker } from '@faker-js/faker';
// <<<<<<< HEAD
import Shortcuts from '../../Secctions/settings/Shortcuts';
// =======
import Webcam from 'react-webcam';
import axios from 'axios';
import Help from '../../Secctions/help/help';
// import Shortcuts from "../../Section/Settings/Shortcuts";
// >>>>>>> 90a019c9be9d997c87283da3a0386c119010ecdf

const Settings = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    const [avatarUrl, setAvatarUrl] = useState(faker.image.avatar());
    const [openShortcuts, setOpenShortcuts] = useState(false);
    const [openCamera, setOpenCamera] = useState(false);
    const [openWallpaperDialog, setOpenWallpaperDialog] = useState(false); //add
    const [showHelp, setShowHelp] = useState(false);
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
    const handleHelpClick = () => {
        setShowHelp(true);  // نمایش کامپوننت Help
    };

    const list = [
        { key: 0, icon: <Bell size={20} />, title: 'Notifications', onclick: () => { } },
        { key: 1, icon: <Lock size={20} />, title: "Privacy", onclick: () => { } },
        { key: 2, icon: <Key size={20} />, title: "Security", onclick: () => { } },
        { key: 3, icon: <PencilCircle size={20} />, title: "Theme", onclick: () => { } },
        { key: 4, icon: <Image size={20} />, title: "Chat Wallpaper", onclick: () => setOpenWallpaperDialog(true) }, // add
        { key: 5, icon: <Note size={20} />, title: "Request Account Info", onclick: () => { } },
        { key: 6, icon: <Keyboard size={20} />, title: "Keyboard Shortcuts", onclick: handleOpenShortcuts },
        { key: 7, icon: <Info size={20} />, title: "Help", onclick: handleClickOpen },
    ];

    return (
        <>
            <Stack sx={{
                position: 'fixed',
                left: 100,
                height: '100vh',
                width: 320,
                backgroundColor: theme.palette.mode === 'light' ? "#F8FAFF" : theme.palette.background.paper,
                boxShadow: "0px 0px 5px rgba(0,0,0,0.25)",
                zIndex: 1000
            }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" sx={{ p: 3 }}>
                    <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                        <CaretLeft size={26} color={theme.palette.mode === 'dark' ? '#fff' : '#4b4b4b'} />
                    </IconButton>
                    <Typography variant='h5'>Settings</Typography>
                </Stack>

                {/* Profile */}
                <Stack direction="row" spacing={2} sx={{ p: 3, alignItems: 'center' }}>
                    <Avatar
                        sx={{ width: 60, height: 60, cursor: 'pointer' }}
                        src={avatarUrl}
                        alt='avatar'
                        onClick={() => setOpenCamera(true)}
                    />
                    <Stack>
                        <Typography variant='subtitle1'>Ali Zandi</Typography>
                        <Typography variant='body2' color="text.secondary">
                            Programmer
                        </Typography>
                    </Stack>
                </Stack>

                {/* Settings List */}
                <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
                    {list.map((item, index) => (
                        <React.Fragment key={item.key}>
                            <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                                onClick={item.onclick}
                                sx={{
                                    p: 2,
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover,
                                        cursor: 'pointer'
                                    }
                                }}
                            >
                                <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>{item.icon}
                                </Box>
                                <Typography variant='body1'>{item.title}</Typography>
                            </Stack>
                            {index !== list.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </Box>
            </Stack>

            {/* Shortcuts Panel */}
            {openShortcuts && <Shortcuts open={openShortcuts} handleClose={handleCloseShortcuts} />}
            {open && <Help open={open} handleClose={handleClose} />}
            {openWallpaperDialog && (
                <WallpaperDialog
                    open={openWallpaperDialog}
                    onClose={() => setOpenWallpaperDialog(false)}
                    onSelectWallpaper={(wallpaper) => {
                        // اینجا می‌توانید والپیپر انتخاب شده را مدیریت کنید
                        // یا می‌توانید از context/state management استفاده کنید
                    }}
                />
            )} //add

            {/* Camera Modal */}
            <Dialog open={openCamera} onClose={() => setOpenCamera(false)} maxWidth="sm">
                <Stack spacing={2} alignItems="center" p={2}>
                    <Typography variant="h6">Take a Profile Photo</Typography>
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        width={300}
                        height={300}
                        videoConstraints={{ facingMode: "user" }}
                        style={{ borderRadius: 10 }}
                    />
                    <IconButton onClick={captureAndSend} sx={{ mt: 1 }}>
                        📸 Take Photo
                    </IconButton>
                </Stack>
            </Dialog>
        </>
    );
};

export default Settings;