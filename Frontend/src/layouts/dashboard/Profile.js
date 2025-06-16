// import {
//     Avatar,
//     Box,
//     Typography,
//     Divider,
//     Button,
//     TextField,
//     Stack,
// } from "@mui/material";
// import { faker } from "@faker-js/faker";
// import React from "react";

// const Profile = () => {
//     const user = {
//         name: faker.name.fullName(),
//         phone: faker.phone.number(),
//         bio: faker.lorem.sentence(),
//         avatar: faker.image.avatar(),
//         isBlocked: false,
//     };

//     const [bio, setBio] = React.useState(user.bio);
//     const [isBlocked, setIsBlocked] = React.useState(user.isBlocked);

//     return (
//         <Box
//             sx={{
//                 width: "320px",
//                 height: "100vh",
//                 backgroundColor: "background.paper",
//                 position: "fixed",
//                 top: 0,
//                 left: 100, // مطابق با عرض SideBar
//                 boxShadow: 3,
//                 p: 3,
//                 overflowY: "auto",
//             }}
//         >
//             <Stack alignItems="center" spacing={2}>
//                 <Avatar
//                     src={user.avatar}
//                     sx={{ width: 100, height: 100, mb: 2 }}
//                 />
//                 <Typography variant="h6">{user.name}</Typography>

//                 <Divider sx={{ width: "100%", my: 2 }} />

//                 <TextField
//                     label="شماره تلفن"
//                     value={user.phone}
//                     fullWidth
//                     disabled
//                     sx={{ mb: 2 }}
//                 />

//                 <TextField
//                     label="بیو"
//                     value={bio}
//                     onChange={(e) => setBio(e.target.value)}
//                     multiline
//                     rows={4}
//                     fullWidth
//                     sx={{ mb: 2 }}
//                 />

//                 <Button
//                     variant="contained"
//                     color={isBlocked ? "success" : "error"}
//                     onClick={() => setIsBlocked(!isBlocked)}
//                     fullWidth
//                 >
//                     {isBlocked ? "آنبلاک کاربر" : "بلاک کاربر"}
//                 </Button>
//             </Stack>
//         </Box>
//     );
// };


// export default Profile;

//.........................................................

"use client"

import React, { useState } from "react";
import {
    Avatar,
    Box,
    Typography,
    Divider,
    Button,
    TextField,
    Stack,
    Chip,
    IconButton,
    InputAdornment,
    Badge
} from "@mui/material";
import {
    Block,
    CheckCircle,
    Phone,
    Person,
    Edit,
    Save,
    CameraAlt,
    Email
} from "@mui/icons-material";
import { faker } from "@faker-js/faker";

const Profile = () => {
    const user = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        bio: faker.lorem.paragraph(),
        avatar: faker.image.avatar(),
        isBlocked: false,
        status: "online"
    };

    const [bio, setBio] = useState(user.bio);
    const [email, setEmail] = useState(user.email);
    const [isEditing, setIsEditing] = useState(false);
    const [isBlocked, setIsBlocked] = useState(user.isBlocked);

    const handleSave = () => setIsEditing(false);

    return (
        <Box
            sx={{
                width: "350px",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 100,
                boxShadow: "0 6px 36px rgba(0,0,0,0.10)",
                p: 3,
                overflowY: "auto",
                zIndex: 1200,
                background: "linear-gradient(135deg, #f5f7fa 0%, #f8fafc 100%)",
                borderLeft: "1px solid rgba(0,0,0,0.05)",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(0,0,0,0.09)", borderRadius: "3px"
                }
            }}
        >
            <Stack spacing={3}>
                {/* Avatar */}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        variant="dot"
                        color={user.status === "online" ? "success" : "error"}
                        sx={{
                            "& .MuiBadge-badge": {
                                width: 15,
                                height: 15,
                                borderRadius: "50%",
                                border: "2px solid white"
                            }
                        }}
                    >
                        <Avatar
                            src={user.avatar}
                            sx={{
                                width: 112,
                                height: 112,
                                border: "4px solid #fff",
                                boxShadow: "0 4px 20px rgba(100,116,139,0.12)",
                                mb: 2,
                                transition: "transform .25s",
                                "&:hover": { transform: "scale(1.05)" }
                            }}
                        />
                    </Badge>
                    <IconButton
                        sx={{
                            position: "absolute", right: 80, bottom: 18,
                            backgroundColor: "#667eea", color: "#fff", p: 0.8,
                            "&:hover": { backgroundColor: "#5a67d8" }
                        }}
                    >
                        <CameraAlt fontSize="small" />
                    </IconButton>
                </Box>

                {/* User Name & Status */}
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a202c", textAlign: "center" }}>
                    {user.name}
                </Typography>
                <Chip
                    icon={isBlocked ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                    label={isBlocked ? "کاربر مسدود" : "کاربر فعال"}
                    color={isBlocked ? "error" : "success"}
                    size="small"
                    sx={{ fontWeight: 600, px: 1, borderRadius: 1, mx: "auto" }}
                />

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Email */}
                {/* ایمیل */}
                <TextField
                    label="ایمیل"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Email sx={{ color: "#718096" }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        mb: 1,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: isEditing ? "#fff" : "#f7fafc",
                        },
                    }}
                />

                {/* شماره تلفن */}
                <TextField
                    label="شماره تلفن"
                    value="123-456-7890" // مقدار ثابت برای شماره تلفن
                    fullWidth
                    disabled
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Phone sx={{ color: "#667eea" }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        mb: 1,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: "#f7fafc",
                        },
                    }}
                />

                {/* بیوگرافی */}
                <TextField
                    label="بیوگرافی"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    disabled={!isEditing}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Person sx={{ color: "#667eea" }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        mb: 1,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: isEditing ? "#fff" : "#f7fafc",
                        },
                    }}
                />

                {/* Action Buttons */}
                <Stack direction="row" spacing={2}>
                    {isEditing ? (
                        <>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => setIsEditing(false)}
                                sx={{
                                    py: 1.2, borderRadius: 2, fontWeight: 600, textTransform: "none",
                                    color: "#4a5568", borderColor: "#cbd5e1",
                                    "&:hover": { borderColor: "#a0aec0" }
                                }}
                            >
                                لغو
                            </Button>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleSave}
                                startIcon={<Save />}
                                sx={{
                                    py: 1.2, borderRadius: 2, fontWeight: 600, textTransform: "none",
                                    background: "linear-gradient(135deg, #667eea 0%, #5a67d8 100%)",
                                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
                                    "&:hover": {
                                        background: "linear-gradient(135deg, #5a67d8 0%, #667eea 100%)",
                                    }
                                }}
                            >
                                ذخیره تغییرات
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setIsEditing(true)}
                            startIcon={<Edit />}
                            sx={{
                                py: 1.2, borderRadius: 2, fontWeight: 600, textTransform: "none",
                                background: "linear-gradient(135deg, #667eea 0%, #5a67d8 100%)",
                                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.18)",
                                "&:hover": { background: "linear-gradient(135deg, #5a67d8 0%, #667eea 100%)" }
                            }}
                        >
                            ویرایش پروفایل
                        </Button>
                    )}
                </Stack>

                {/* Block/Unblock */}
                <Button
                    variant="contained"
                    color={isBlocked ? "success" : "error"}
                    onClick={() => setIsBlocked(!isBlocked)}
                    fullWidth
                    startIcon={isBlocked ? <CheckCircle /> : <Block />}
                    sx={{
                        py: 1.1, borderRadius: 2, fontWeight: 600, textTransform: "none",
                        background: isBlocked
                            ? "linear-gradient(135deg, #48bb78 0%, #38a169 100%)"
                            : "linear-gradient(135deg, #f56565 0%, #e53e3e 100%)",
                        boxShadow: isBlocked
                            ? "0 4px 12px rgba(72, 187, 120, 0.15)"
                            : "0 4px 12px rgba(245, 101, 101, 0.13)",
                        "&:hover": {
                            boxShadow: isBlocked
                                ? "0 6px 15px rgba(72, 187, 120, 0.23)"
                                : "0 6px 15px rgba(245, 101, 101, 0.21)",
                        }
                    }}
                >
                    {isBlocked ? "آنبلاک کاربر" : "بلاک کاربر"}
                </Button>
            </Stack>
        </Box>
    );
};

export default Profile;


//.....................................................................................


// "use client"

// import React, { useState } from "react";
// import {
//     Avatar,
//     Box,
//     Typography,
//     Divider,
//     Button,
//     TextField,
//     Stack,
//     Chip,
//     IconButton,
//     InputAdornment,
//     Badge
// } from "@mui/material";
// import { faker } from "@faker-js/faker";
// import {
//     Block,
//     CheckCircle,
//     Phone,
//     Person,
//     Edit,
//     Save,
//     CameraAlt,
//     Email,
//     Language,
//     LocationOn
// } from "@mui/icons-material";
// import { ArrowLeft, Info } from "phosphor-react";

// const Profile = ({ onClose }) => {
//     const user = {
//         name: faker.person.fullName(),
//         email: faker.internet.email(),
//         phone: faker.phone.number(),
//         bio: faker.lorem.paragraph(),
//         website: faker.internet.url(),
//         location: faker.location.city(),
//         avatar: faker.image.avatar(),
//         isBlocked: false,
//         status: "online"
//     };

//     const [bio, setBio] = useState(user.bio);
//     const [isEditing, setIsEditing] = useState(false);
//     const [isBlocked, setIsBlocked] = useState(user.isBlocked);

//     const handleSave = () => {
//         setIsEditing(false);
//         // Here you would typically save to backend
//     };

//     return (
//         <Box
//             sx={{
//                 width: "360px",
//                 height: "100vh",
//                 position: "fixed",
//                 top: 0,
//                 left: 100,
//                 boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
//                 p: 3,
//                 overflowY: "auto",
//                 zIndex: 1200,
//                 background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)",
//                 borderLeft: "1px solid rgba(0, 0, 0, 0.05)",
//                 '&::-webkit-scrollbar': {
//                     width: '6px',
//                 },
//                 '&::-webkit-scrollbar-thumb': {
//                     backgroundColor: 'rgba(0,0,0,0.1)',
//                     borderRadius: '3px',
//                 },
//             }}
//         >
//             <Stack spacing={3}>
//                 {/* Header with back button */}
//                 <Box sx={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                     mb: 2
//                 }}>
//                     <IconButton onClick={onClose} sx={{
//                         color: '#4a5568',
//                         '&:hover': {
//                             backgroundColor: 'rgba(102, 126, 234, 0.1)'
//                         }
//                     }}>
//                         <ArrowLeft size={24} />
//                     </IconButton>
//                     <Typography variant="h6" sx={{
//                         fontWeight: 700,
//                         color: '#2d3748'
//                     }}>
//                         User Profile
//                     </Typography>
//                     <Box sx={{ width: 40 }} /> {/* Spacer */}
//                 </Box>

//                 {/* Avatar Section */}
//                 <Box sx={{
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center',
//                     position: 'relative'
//                 }}>
//                     <Badge
//                         overlap="circular"
//                         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//                         variant="dot"
//                         color={user.status === "online" ? "success" : "error"}
//                         sx={{
//                             '& .MuiBadge-badge': {
//                                 width: 16,
//                                 height: 16,
//                                 borderRadius: '50%',
//                                 border: '2px solid white',
//                             }
//                         }}
//                     >
//                         <Avatar
//                             src={user.avatar}
//                             sx={{
//                                 width: 120,
//                                 height: 120,
//                                 border: '4px solid white',
//                                 boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//                                 mb: 2,
//                             }}
//                         />
//                     </Badge>
//                     <IconButton
//                         sx={{
//                             position: 'absolute',
//                             right: 90,
//                             bottom: 20,
//                             backgroundColor: '#667eea',
//                             color: 'white',
//                             '&:hover': {
//                                 backgroundColor: '#5a67d8'
//                             }
//                         }}
//                     >
//                         <CameraAlt fontSize="small" />
//                     </IconButton>
//                     <Typography variant="h5" sx={{
//                         fontWeight: 700,
//                         color: '#1a202c',
//                         mb: 0.5
//                     }}>
//                         {user.name}
//                     </Typography>
//                     <Chip
//                         label={isBlocked ? "Blocked" : "Active"}
//                         color={isBlocked ? "error" : "success"}
//                         size="small"
//                         sx={{
//                             fontWeight: 600,
//                             px: 1,
//                             borderRadius: 1
//                         }}
//                     />
//                 </Box>

//                 {/* Divider */}
//                 <Divider sx={{
//                     my: 1,
//                     borderColor: 'rgba(0, 0, 0, 0.08)'
//                 }} />

//                 {/* Contact Info Section */}
//                 <Box>
//                     <Typography variant="subtitle1" sx={{
//                         fontWeight: 600,
//                         color: '#4a5568',
//                         mb: 2,
//                         display: 'flex',
//                         alignItems: 'center'
//                     }}>
//                         <Info sx={{ mr: 1, fontSize: 20, color: '#667eea' }} />
//                         Contact Information
//                     </Typography>

//                     {/* Email */}
//                     <TextField
//                         fullWidth
//                         label="Email"
//                         value={user.email}
//                         disabled={!isEditing}
//                         InputProps={{
//                             startAdornment: (
//                                 <InputAdornment position="start">
//                                     <Email sx={{ color: '#718096' }} />
//                                 </InputAdornment>
//                             ),
//                         }}
//                         sx={{
//                             mb: 2,
//                             '& .MuiOutlinedInput-root': {
//                                 borderRadius: 2,
//                                 bgcolor: isEditing ? '#fff' : '#f7fafc',
//                             }
//                         }}
//                     />

//                     {/* Phone */}
//                     <TextField
//                         fullWidth
//                         label="Phone"
//                         value={user.phone}
//                         disabled={!isEditing}
//                         InputProps={{
//                             startAdornment: (
//                                 <InputAdornment position="start">
//                                     <Phone sx={{ color: '#718096' }} />
//                                 </InputAdornment>
//                             ),
//                         }}
//                         sx={{
//                             mb: 2,
//                             '& .MuiOutlinedInput-root': {
//                                 borderRadius: 2,
//                                 bgcolor: isEditing ? '#fff' : '#f7fafc',
//                             }
//                         }}
//                     />

//                     {/* Website */}
//                     <TextField
//                         fullWidth
//                         label="Website"
//                         value={user.website}
//                         disabled={!isEditing}
//                         InputProps={{
//                             startAdornment: (
//                                 <InputAdornment position="start">
//                                     <Language sx={{ color: '#718096' }} />
//                                 </InputAdornment>
//                             ),
//                         }}
//                         sx={{
//                             mb: 2,
//                             '& .MuiOutlinedInput-root': {
//                                 borderRadius: 2,
//                                 bgcolor: isEditing ? '#fff' : '#f7fafc',
//                             }
//                         }}
//                     />

//                     {/* Location */}
//                     <TextField
//                         fullWidth
//                         label="Location"
//                         value={user.location}
//                         disabled={!isEditing}
//                         InputProps={{
//                             startAdornment: (
//                                 <InputAdornment position="start">
//                                     <LocationOn sx={{ color: '#718096' }} />
//                                 </InputAdornment>
//                             ),
//                         }}
//                         sx={{
//                             mb: 2,
//                             '& .MuiOutlinedInput-root': {
//                                 borderRadius: 2,
//                                 bgcolor: isEditing ? '#fff' : '#f7fafc',
//                             }
//                         }}
//                     />
//                 </Box>

//                 {/* Bio Section */}
//                 <Box>
//                     <Typography variant="subtitle1" sx={{
//                         fontWeight: 600,
//                         color: '#4a5568',
//                         mb: 2,
//                         display: 'flex',
//                         alignItems: 'center'
//                     }}>
//                         <Person sx={{ mr: 1, fontSize: 20, color: '#667eea' }} />
//                         About
//                     </Typography>
//                     <TextField
//                         multiline
//                         rows={4}
//                         fullWidth
//                         value={bio}
//                         onChange={(e) => setBio(e.target.value)}
//                         disabled={!isEditing}
//                         sx={{
//                             mb: 2,
//                             '& .MuiOutlinedInput-root': {
//                                 borderRadius: 2,
//                                 bgcolor: isEditing ? '#fff' : '#f7fafc',
//                             }
//                         }}
//                     />
//                 </Box>

//                 {/* Action Buttons */}
//                 <Stack direction="row" spacing={2}>
//                     {isEditing ? (
//                         <>
//                             <Button
//                                 variant="outlined"
//                                 fullWidth
//                                 onClick={() => setIsEditing(false)}
//                                 sx={{
//                                     py: 1.5,
//                                     borderRadius: 2,
//                                     fontWeight: 600,
//                                     textTransform: 'none',
//                                     color: '#4a5568',
//                                     borderColor: '#e2e8f0',
//                                     '&:hover': {
//                                         borderColor: '#cbd5e0'
//                                     }
//                                 }}
//                             >
//                                 Cancel
//                             </Button>
//                             <Button
//                                 variant="contained"
//                                 fullWidth
//                                 onClick={handleSave}
//                                 startIcon={<Save />}
//                                 sx={{
//                                     py: 1.5,
//                                     borderRadius: 2,
//                                     fontWeight: 600,
//                                     textTransform: 'none',
//                                     background: 'linear-gradient(135deg, #667eea 0%, #5a67d8 100%)',
//                                     boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
//                                     '&:hover': {
//                                         transform: 'translateY(-1px)',
//                                         boxShadow: '0 6px 15px rgba(102, 126, 234, 0.4)',
//                                     }
//                                 }}
//                             >
//                                 Save Changes
//                             </Button>
//                         </>
//                     ) : (
//                         <Button
//                             variant="contained"
//                             fullWidth
//                             onClick={() => setIsEditing(true)}
//                             startIcon={<Edit />}
//                             sx={{
//                                 py: 1.5,
//                                 borderRadius: 2,
//                                 fontWeight: 600,
//                                 textTransform: 'none',
//                                 background: 'linear-gradient(135deg, #667eea 0%, #5a67d8 100%)',
//                                 boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
//                                 '&:hover': {
//                                     transform: 'translateY(-1px)',
//                                     boxShadow: '0 6px 15px rgba(102, 126, 234, 0.4)',
//                                 }
//                             }}
//                         >
//                             Edit Profile
//                         </Button>
//                     )}
//                 </Stack>

//                 {/* Block Button */}
//                 <Button
//                     variant="contained"
//                     color={isBlocked ? "success" : "error"}
//                     onClick={() => setIsBlocked(!isBlocked)}
//                     fullWidth
//                     startIcon={isBlocked ? <CheckCircle /> : <Block />}
//                     sx={{
//                         py: 1.5,
//                         borderRadius: 2,
//                         fontWeight: 600,
//                         textTransform: 'none',
//                         background: isBlocked
//                             ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'
//                             : 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
//                         boxShadow: isBlocked
//                             ? '0 4px 12px rgba(72, 187, 120, 0.3)'
//                             : '0 4px 12px rgba(245, 101, 101, 0.3)',
//                         '&:hover': {
//                             transform: 'translateY(-1px)',
//                             boxShadow: isBlocked
//                                 ? '0 6px 15px rgba(72, 187, 120, 0.4)'
//                                 : '0 6px 15px rgba(245, 101, 101, 0.4)',
//                         }
//                     }}
//                 >
//                     {isBlocked ? "Unblock User" : "Block User"}
//                 </Button>
//             </Stack>
//         </Box>
//     );
// };

// export default Profile;


