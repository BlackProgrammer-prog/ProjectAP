// import { Avatar, Box, Divider, IconButton, Stack, Switch, useTheme } from "@mui/material";
// import React, { useState } from "react";
// import { Outlet } from "react-router-dom";
// import logo from "../../assets/Images/logo.ico"
// import { Nav_Buttons } from "../../data/index";
// import { Gear } from "phosphor-react";
// import { faker } from "@faker-js/faker";
// import useSettings from '../../hooks/useSettings'





// const SideBar = () => {
//     const them = useTheme();
//     const { onToggleMode } = useSettings()
//     const [select, setSelect] = useState(null); // تغییر داده‌ام تا ابتدا هیچ دکمه‌ای انتخاب نشود

//     const handleClick = (index) => {
//         setSelect(index); // با کلیک دکمه انتخاب می‌شود
//     };

//     return (
//         <Stack >
//             <Box sx={{
//                 backgroundColor: them.palette.background.paper,
//                 boxShadow: "0px 0px 2px rgba(0,0,0,0.2)",
//                 height: "100vh",
//                 width: 100,
//                 paddingTop: 1

//             }}>
//                 <Stack direction="column" alignItems={"center"} sx={{ width: "100%", height: "100%", flexDirection: "column", justifyContent: "space-between" }} >
//                     <Box sx={{
//                         backgroundColor: them.palette.primary.main,
//                         height: 64,
//                         width: 64,
//                         borderRadius: 12,
//                     }}>
//                         <img src={logo} alt="chat logo" />
//                     </Box>

//                     <Stack sx={{ width: "max-content", marginTop: 1 }} direction="column" spacing={2.5}>
//                         {Nav_Buttons.map((el) => (
//                             <Box
//                                 key={el.index}
//                                 sx={{
//                                     backgroundColor: select === el.index ? them.palette.primary.main : 'transparent',
//                                     borderRadius: 1.5
//                                 }}
//                             >
//                                 <IconButton
//                                     onClick={() => handleClick(el.index)}
//                                     sx={{
//                                         width: "max-content",
//                                         color: select === el.index ? "#fff" : "#000" // تغییر رنگ بر اساس انتخاب
//                                     }}
//                                 >
//                                     {el.icon}
//                                 </IconButton>
//                             </Box>
//                         ))}
//                         <Divider />
//                         {/* دکمه Gear */}
//                         <IconButton
//                             onClick={() => handleClick('gear')} // یک شناسه خاص برای Gear تنظیم کردیم
//                             sx={{
//                                 color: select === 'gear' ? "#fff" : "#000", // تغییر رنگ برای Gear
//                                 backgroundColor: select === 'gear' ? them.palette.primary.main : 'transparent',
//                                 borderRadius: 1.5
//                             }}
//                         >
//                             <Gear />
//                         </IconButton>
//                     </Stack>

//                     {/* جایگذاری Switch بالاتر از Avatar */}
//                     <Box sx={{ marginTop: 'auto', marginBottom: 2 }}>
//                         <Switch onChange={() => {
//                             return (
//                                 onToggleMode()
//                             )
//                         }} defaultChecked />
//                     </Box>

//                     {/* Avatar در پایین‌تر از Switch */}
//                     <Box sx={{ marginBottom: 2 }}>
//                         <Avatar src={faker.image.avatar()} />
//                     </Box>
//                 </Stack>
//             </Box>
//             <Outlet />
//         </Stack>
//     )
// }

// export default SideBar

// ...................................................................MAIN

// import { Avatar, Box, Divider, IconButton, Stack, Switch, useTheme, Menu, MenuItem, Typography } from "@mui/material";
// import React, { useState } from "react";
// import { Outlet } from "react-router-dom";
// import logo from "../../assets/Images/logo.ico"
// import { Nav_Buttons, Profile_Menu } from "../../data/index";
// import { Gear } from "phosphor-react";
// import { faker } from "@faker-js/faker";
// import useSettings from '../../hooks/useSettings'
// import Profile from "./Profile";
// import UserProfile from "./UserProfile";



// const SideBar = () => {
//     const them = useTheme();
//     const { onToggleMode } = useSettings()
//     const [select, setSelect] = useState(null);
//     const [showUserProfile, setShowUserProfile] = useState(false);
//     const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
//     const [showProfile, setShowProfile] = useState(false);
//     const profileMenuOpen = Boolean(profileMenuAnchor);


//     const handleClick = (index) => {
//         setSelect(index);
//     };

//     const handleProfileClick = (event) => {
//         setProfileMenuAnchor(event.currentTarget);
//     };

//     const handleProfileMenuClose = () => {
//         setProfileMenuAnchor(null);
//     };

//     const handleMenuItemClick = (option) => {
//         console.log(`Selected: ${option.title}`);
//         if (option.title === 'Profile') {
//             setShowProfile(!showProfile);
//         }
//         handleProfileMenuClose();
//     };
//     const handleUserProfileToggle = () => {
//         setShowUserProfile(!showUserProfile);
//         setProfileMenuAnchor(null);
//     };


//     return (
//         <Stack >
//             <Box sx={{
//                 backgroundColor: them.palette.background.paper,
//                 boxShadow: "0px 0px 2px rgba(0,0,0,0.2)",
//                 height: "100vh",
//                 width: 100,
//                 paddingTop: 1

//             }}>
//                 <Stack direction="column" alignItems={"center"} sx={{ width: "100%", height: "100%", flexDirection: "column", justifyContent: "space-between" }} >
//                     <Box sx={{
//                         backgroundColor: them.palette.primary.main,
//                         height: 64,
//                         width: 64,
//                         borderRadius: 12,
//                     }}>
//                         <img src={logo || "/placeholder.svg"} alt="chat logo" />
//                     </Box>

//                     <Stack sx={{ width: "max-content", marginTop: 1 }} direction="column" spacing={2.5}>
//                         {Nav_Buttons.map((el) => (
//                             <Box
//                                 key={el.index}
//                                 sx={{
//                                     backgroundColor: select === el.index ? them.palette.primary.main : 'transparent',
//                                     borderRadius: 1.5
//                                 }}
//                             >
//                                 <IconButton
//                                     onClick={() => handleClick(el.index)}
//                                     sx={{
//                                         width: "max-content",
//                                         color: select === el.index ? "#fff" : "#000"
//                                     }}
//                                 >
//                                     {el.icon}
//                                 </IconButton>
//                             </Box>
//                         ))}
//                         <Divider />
//                         <IconButton
//                             onClick={() => handleClick('gear')}
//                             sx={{
//                                 color: select === 'gear' ? "#fff" : "#000",
//                                 backgroundColor: select === 'gear' ? them.palette.primary.main : 'transparent',
//                                 borderRadius: 1.5
//                             }}
//                         >
//                             <Gear />
//                         </IconButton>
//                     </Stack>

//                     <Box sx={{ marginTop: 'auto', marginBottom: 2 }}>
//                         <Switch onChange={() => {
//                             return (
//                                 onToggleMode()
//                             )
//                         }} defaultChecked />
//                     </Box>

//                     <Box sx={{ marginBottom: 2, position: 'relative' }}>
//                         <Avatar
//                             src={faker.image.avatar()}
//                             onClick={handleProfileClick}
//                             sx={{
//                                 cursor: 'pointer',
//                                 transition: 'all 0.3s ease',
//                                 '&:hover': {
//                                     transform: 'scale(1.05)',
//                                     boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
//                                 }
//                             }}
//                         />
//                         <Menu
//                             anchorEl={profileMenuAnchor}
//                             open={profileMenuOpen}
//                             onClose={handleProfileMenuClose}
//                             anchorOrigin={{
//                                 vertical: 'top',
//                                 horizontal: 'right',
//                             }}
//                             transformOrigin={{
//                                 vertical: 'bottom',
//                                 horizontal: 'left',
//                             }}
//                             PaperProps={{
//                                 sx: {
//                                     borderRadius: 3,
//                                     minWidth: 180,
//                                     boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
//                                     border: `1px solid ${them.palette.divider}`,
//                                     ml: 1.5,
//                                     mt: -0.5,
//                                     background: them.palette.mode === 'light'
//                                         ? 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)'
//                                         : them.palette.background.paper,
//                                     backdropFilter: 'blur(10px)',
//                                 },
//                             }}
//                             sx={{
//                                 '& .MuiMenu-paper': {
//                                     animation: 'slideUp 0.3s ease-out',
//                                 },
//                                 '@keyframes slideUp': {
//                                     '0%': {
//                                         opacity: 0,
//                                         transform: 'translateY(10px) scale(0.95)',
//                                     },
//                                     '100%': {
//                                         opacity: 1,
//                                         transform: 'translateY(0) scale(1)',
//                                     },
//                                 },
//                             }}
//                         >
//                             <Stack spacing={0.5} py={1.5}>
//                                 {Profile_Menu.map((option, index) => (
//                                     <MenuItem
//                                         key={index}
//                                         onClick={() => handleMenuItemClick(option)}
//                                         sx={{
//                                             mx: 1.5,
//                                             borderRadius: 2,
//                                             fontSize: '0.875rem',
//                                             display: 'flex',
//                                             alignItems: 'center',
//                                             gap: 2,
//                                             py: 1.5,
//                                             px: 2,
//                                             transition: 'all 0.2s ease',
//                                             position: 'relative',
//                                             overflow: 'hidden',
//                                             '&:hover': {
//                                                 backgroundColor: them.palette.mode === 'light'
//                                                     ? 'rgba(25, 118, 210, 0.08)'
//                                                     : 'rgba(144, 202, 249, 0.08)',
//                                                 transform: 'translateX(4px)',
//                                                 '& .menu-icon': {
//                                                     color: them.palette.primary.main,
//                                                     transform: 'scale(1.1)',
//                                                 },
//                                                 '&::before': {
//                                                     opacity: 1,
//                                                     transform: 'scaleX(1)',
//                                                 }
//                                             },
//                                             '&::before': {
//                                                 content: '""',
//                                                 position: 'absolute',
//                                                 left: 0,
//                                                 top: 0,
//                                                 bottom: 0,
//                                                 width: '3px',
//                                                 backgroundColor: them.palette.primary.main,
//                                                 opacity: 0,
//                                                 transform: 'scaleX(0)',
//                                                 transformOrigin: 'left',
//                                                 transition: 'all 0.2s ease',
//                                             }
//                                         }}
//                                     >
//                                         <Box
//                                             className="menu-icon"
//                                             sx={{
//                                                 color: them.palette.text.secondary,
//                                                 display: 'flex',
//                                                 alignItems: 'center',
//                                                 transition: 'all 0.2s ease',
//                                             }}
//                                         >
//                                             {option.icon}
//                                         </Box>
//                                         <Typography
//                                             variant="body2"
//                                             sx={{
//                                                 fontWeight: 500,
//                                                 color: them.palette.text.primary,
//                                                 letterSpacing: '0.025em'
//                                             }}
//                                         >
//                                             {option.title}
//                                         </Typography>
//                                     </MenuItem>
//                                 ))}
//                             </Stack>
//                         </Menu>
//                     </Box>
//                 </Stack>
//             </Box>

//             <Outlet />
//             {showProfile && <Profile />}
//             {showUserProfile && (
//                 <UserProfile onClose={() => setShowUserProfile(false)} />
//             )}
//         </Stack>
//     )
// }

// export default SideBar

// ................................................................

import { Avatar, Box, Divider, IconButton, Stack, Switch, useTheme, Menu, MenuItem, Typography } from "@mui/material";
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import logo from "../../assets/Images/logo.ico";
import { Nav_Buttons, Profile_Menu } from "../../data/index";
import { Gear } from "phosphor-react";
import { faker } from "@faker-js/faker";
import useSettings from '../../hooks/useSettings';
import Profile from "./Profile";
import UserProfile from "./UserProfile";

const SideBar = () => {
    const them = useTheme();
    const { onToggleMode } = useSettings();
    const [select, setSelect] = useState(null);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const profileMenuOpen = Boolean(profileMenuAnchor);

    const handleClick = (index) => {
        setSelect(index);
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
                        {Nav_Buttons.map((el) => (
                            <Box
                                key={el.index}
                                sx={{
                                    backgroundColor: select === el.index ? them.palette.primary.main : 'transparent',
                                    borderRadius: 1.5
                                }}
                            >
                                <IconButton
                                    onClick={() => handleClick(el.index)}
                                    sx={{
                                        width: "max-content",
                                        color: select === el.index ? "#fff" : "#000"
                                    }}
                                >
                                    {el.icon}
                                </IconButton>
                            </Box>
                        ))}
                        <Divider />
                        <IconButton
                            onClick={() => handleClick('gear')}
                            sx={{
                                color: select === 'gear' ? "#fff" : "#000",
                                backgroundColor: select === 'gear' ? them.palette.primary.main : 'transparent',
                                borderRadius: 1.5
                            }}
                        >
                            <Gear />
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
                                {Profile_Menu.map((option, index) => (
                                    <MenuItem
                                        key={index}
                                        onClick={() => handleMenuItemClick(option)}
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
                                ))}
                            </Stack>
                        </Menu>
                    </Box>
                </Stack>
            </Box>

            <Outlet />
            {showProfile && <Profile />}
            {showUserProfile && (
                <UserProfile onClose={() => setShowUserProfile(false)} />
            )}
        </Stack>
    );
};

export default SideBar;
