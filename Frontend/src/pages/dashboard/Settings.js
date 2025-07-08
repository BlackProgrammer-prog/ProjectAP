// import React, { useState } from 'react';
// import { Avatar, Box, Divider, IconButton, Stack, Typography, useTheme } from '@mui/material';
// import { CaretLeft, Bell, Lock, Key, PencilCircle, Image, Note, Keyboard, Info } from 'phosphor-react';
// import { useNavigate } from 'react-router-dom';
// import { faker } from '@faker-js/faker';
// import Shortcuts from '../../Secctions/settings/Shortcuts';

// const Settings = ({ onClose }) => {
//     const theme = useTheme();
//     const navigate = useNavigate();
//     const [openShortcuts, setOpenShortcuts] = useState(false);

//     const handleOpenShortcuts = () => {
//         setOpenShortcuts(true);
//     };

//     const handleCloseShortcuts = () => {
//         setOpenShortcuts(false);
//     };

//     // تابع جدید برای مدیریت بازگشت
//     const handleBack = () => {
//         onClose(); // بستن صفحه تنظیمات
//         navigate(-1); // بازگشت به صفحه قبل در تاریخچه مرورگر
//     };

//     const list = [
//         { key: 0, icon: <Bell size={20} />, title: 'Notifications', onclick: () => { } },
//         { key: 1, icon: <Lock size={20} />, title: "Privacy", onclick: () => { } },
//         { key: 2, icon: <Key size={20} />, title: "Security", onclick: () => { } },
//         { key: 3, icon: <PencilCircle size={20} />, title: "Theme", onclick: () => { } },
//         { key: 4, icon: <Image size={20} />, title: "Chat Wallpaper", onclick: () => { } },
//         { key: 5, icon: <Note size={20} />, title: "Request Account Info", onclick: () => { } },
//         { key: 6, icon: <Keyboard size={20} />, title: "Keyboard Shortcuts", onclick: handleOpenShortcuts },
//         { key: 7, icon: <Info size={20} />, title: "Help", onclick: () => { } },
//     ];

//     return (
//         <>
//             <Stack sx={{
//                 position: 'fixed',
//                 left: 100,
//                 height: '100vh',
//                 width: 320,
//                 backgroundColor: theme.palette.mode === 'light' ? "#F8FAFF" : theme.palette.background.paper,
//                 boxShadow: "0px 0px 5px rgba(0,0,0,0.25)",
//                 zIndex:1000
//             }}>
//                 {/* Header */}
//                 <Stack direction="row" alignItems="center" sx={{ p: 3 }}>
//                     <IconButton
//                         onClick={handleBack} // استفاده از تابع handleBack
//                         sx={{ mr: 1 }}
//                     >
//                         <CaretLeft
//                             size={26}
//                             color={theme.palette.mode === 'dark' ? '#fff' : '#4b4b4b'}
//                         />
//                     </IconButton>
//                     <Typography variant='h5'>Settings</Typography>
//                 </Stack>

//                 {/* Profile */}
//                 <Stack direction="row" spacing={2} sx={{ p: 3, alignItems: 'center' }}>
//                     <Avatar sx={{ width: 60, height: 60 }} src={faker.image.avatar()} alt='A' />
//                     <Stack>
//                         <Typography variant='subtitle1'>Ali Zandi</Typography>
//                         <Typography variant='body2' color="text.secondary">
//                             Programmer
//                         </Typography>
//                     </Stack>
//                 </Stack>

//                 {/* Settings List */}
//                 <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
//                     {list.map((item, index) => (
//                         <React.Fragment key={item.key}>
//                             <Stack
//                                 direction="row"
//                                 spacing={2}
//                                 alignItems="center"
//                                 onClick={item.onclick}
//                                 sx={{
//                                     p: 2,
//                                     '&:hover': {
//                                         backgroundColor: theme.palette.action.hover,
//                                         cursor: 'pointer'
//                                     }
//                                 }}
//                             >
//                                 <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>
//                                     {item.icon}
//                                 </Box>
//                                 <Typography variant='body1'>{item.title}</Typography>
//                             </Stack>
//                             {index !== list.length - 1 && <Divider />}
//                         </React.Fragment>
//                     ))}
//                 </Box>
//             </Stack>
//             {/* Right Panel */}
//             {openShortcuts && <Shortcuts open={openShortcuts} handleClose={handleCloseShortcuts} />}
//         </>
//     );
// };

// export default Settings;

// ==========================================================

import React, { useState } from 'react';
import { Avatar, Box, Divider, IconButton, Stack, Typography, useTheme } from '@mui/material';
import { CaretLeft, Bell, Lock, Key, PencilCircle, Image, Note, Keyboard, Info } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { faker } from '@faker-js/faker';
// import Shortcuts from '../../Secctions/settings/Shortcuts';
import Shortcuts from "../../Section/Settings/Shortcuts";

const Settings = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [openShortcuts, setOpenShortcuts] = useState(false);

    const handleOpenShortcuts = () => {
        setOpenShortcuts(true);
    };

    const handleCloseShortcuts = () => {
        setOpenShortcuts(false);
    };

    // تابع جدید برای مدیریت بازگشت
    const handleBack = () => {
        navigate(-1); // بازگشت به صفحه قبل
    };
    const list = [
        { key: 0, icon: <Bell size={20} />, title: 'Notifications', onclick: () => { } },
        { key: 1, icon: <Lock size={20} />, title: "Privacy", onclick: () => { } },
        { key: 2, icon: <Key size={20} />, title: "Security", onclick: () => { } },
        { key: 3, icon: <PencilCircle size={20} />, title: "Theme", onclick: () => { } },
        { key: 4, icon: <Image size={20} />, title: "Chat Wallpaper", onclick: () => { } },
        { key: 5, icon: <Note size={20} />, title: "Request Account Info", onclick: () => { } },
        { key: 6, icon: <Keyboard size={20} />, title: "Keyboard Shortcuts", onclick: handleOpenShortcuts },
        { key: 7, icon: <Info size={20} />, title: "Help", onclick: () => { } },
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
                    <IconButton
                        onClick={handleBack} // استفاده از تابع handleBack
                        sx={{ mr: 1 }}
                    >
                        <CaretLeft
                            size={26}
                            color={theme.palette.mode === 'dark' ? '#fff' : '#4b4b4b'}
                        />
                    </IconButton>
                    <Typography variant='h5'>Settings</Typography>
                </Stack>

                {/* Profile */}
                <Stack direction="row" spacing={2} sx={{ p: 3, alignItems: 'center' }}>
                    <Avatar sx={{ width: 60, height: 60 }} src={faker.image.avatar()} alt='A' />
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
                                <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>
                                    {item.icon}
                                </Box>
                                <Typography variant='body1'>{item.title}</Typography>
                            </Stack>
                            {index !== list.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </Box>
            </Stack>
            {/* Right Panel */}
            {openShortcuts && <Shortcuts open={openShortcuts} handleClose={handleCloseShortcuts} />}
        </>
    );
};

export default Settings;