

//...............................................................................................

import {
    Avatar,
    Box,
    Typography,
    Divider,
    Button,
    TextField,
    Stack,
    IconButton,
    InputAdornment
} from "@mui/material";
import { faker } from "@faker-js/faker";
import React, {useEffect, useState} from "react";
import { ArrowLeft, Phone, Pencil } from "phosphor-react";

const Profile = ({ onClose }) => {

    const [NameFull , setNameFull] = useState('');
    const [EmailFull, setEmailFull] = useState('');
    const [Biography , setBiography] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const UserObject = JSON.parse(storedUser);
                const ObjectProfile = UserObject.profile;
                setNameFull(ObjectProfile.fullName);
                setEmailFull(UserObject.email);
                setBiography(ObjectProfile.bio);

            }catch (error) {
                console.error("Error while fetching user data", error);
            }
        }
    }, []);

    const user = {
        name: NameFull,
        email: EmailFull,
        bio: Biography,
        avatar: faker.image.avatar(),
    };

    const [bio, setBio] = React.useState(user.bio);
    const [isEditing, setIsEditing] = React.useState(false);

    const handleSaveBio = () => {
        setIsEditing(false);

    };

    return (
        <Box
            sx={{
                width: "320px",
                height: "100vh",
                backgroundColor: "background.paper",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                position: "fixed",
                top: 0,
                left: 100,
                display: "flex",
                flexDirection: "column",
                zIndex: 1000,
                overflow: "hidden",
                borderLeft: "1px solid",
                borderColor: "divider",
                transition: "all 0.3s ease"
            }}
        >
            {/* هدر زیبا */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    background: "linear-gradient(135deg, #1976d2 0%, #115293 100%)",
                    color: "white",
                    boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)"
                }}
            >
                <IconButton
                    onClick={onClose}
                    sx={{
                        color: "inherit",
                        "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.15)",
                            transform: "scale(1.1)"
                        },
                        transition: "all 0.2s ease"
                    }}
                >
                    <ArrowLeft size={24} />
                </IconButton>
                <Typography variant="h6" sx={{ ml: 2, fontWeight: 700, letterSpacing: "0.5px" }}>
                    پروفایل کاربر
                </Typography>
            </Box>

            {/* محتوای اصلی */}
            <Box sx={{
                p: 3,
                overflowY: "auto",
                flex: 1,
                "&::-webkit-scrollbar": {
                    width: "6px",
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderRadius: "3px",
                }
            }}>
                <Stack alignItems="center" spacing={3}>
                    {/* آواتار */}
                    <Avatar
                        src={user.avatar}
                        sx={{
                            width: 120,
                            height: 120,
                            mb: 1,
                            border: "3px solid",
                            borderColor: "primary.main",
                            boxShadow: "0px 4px 15px rgba(25, 118, 210, 0.3)",
                            "&:hover": {
                                transform: "scale(1.05)",
                                boxShadow: "0px 4px 20px rgba(25, 118, 210, 0.4)"
                            },
                            transition: "all 0.3s ease"
                        }}
                    />
                    <Typography variant="h6" sx={{
                        fontWeight: 700,
                        color: "text.primary",
                        textAlign: "center"
                    }}>
                        {user.name}
                    </Typography>

                    <Divider sx={{
                        width: "100%",
                        my: 1,
                        borderColor: "divider",
                        opacity: 0.7
                    }} />

                    {/* فیلد تلفن */}
                    <TextField
                        label="ایمیل "
                        value={user.email}
                        fullWidth
                        disabled
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {/*<Phone size={20} color="#555" />*/}
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            mb: 2,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                "& fieldset": {
                                    borderColor: "rgba(0, 0, 0, 0.1)",
                                },
                                "&:hover fieldset": {
                                    borderColor: "primary.main",
                                },
                            },
                            "& .MuiInputLabel-root": {
                                color: "text.secondary",
                            }
                        }}
                    />

                    {/* فیلد بیوگرافی */}
                    <TextField
                        label="بیوگرافی"
                        value={user.bio}
                        onChange={(e) => setBio(e.target.value)}
                        multiline
                        rows={4}
                        fullWidth
                        disabled={!isEditing}
                        sx={{
                            mb: 2,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                "& fieldset": {
                                    borderColor: "rgba(0, 0, 0, 0.1)",
                                },
                                "&:hover fieldset": {
                                    borderColor: "primary.main",
                                },
                            },
                            "& .MuiInputLabel-root": {
                                color: "text.secondary",
                            }
                        }}
                    />

                    {/* دکمه ویرایش/ذخیره */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={isEditing ? handleSaveBio : () => setIsEditing(true)}
                        fullWidth
                        startIcon={<Pencil size={20} />}
                        sx={{
                            py: 1.5,
                            borderRadius: "12px",
                            fontWeight: 600,
                            textTransform: "none",
                            boxShadow: "none",
                            letterSpacing: "0.5px",
                            "&:hover": {
                                boxShadow: "0px 3px 10px rgba(25, 118, 210, 0.3)",
                                transform: "translateY(-1px)"
                            },
                            transition: "all 0.2s ease"
                        }}
                    >
                        {isEditing ? "ذخیره تغییرات" : "ویرایش بیوگرافی"}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        // onClick={}
                        fullWidth
                        startIcon={<Pencil size={20} />}
                        sx={{
                            py: 1.5,
                            borderRadius: "12px",
                            fontWeight: 600,
                            textTransform: "none",
                            boxShadow: "none",
                            letterSpacing: "0.5px",
                            "&:hover": {
                                boxShadow: "0px 3px 10px rgba(25, 118, 210, 0.3)",
                                transform: "translateY(-1px)"
                            },
                            transition: "all 0.2s ease"
                        }}
                    >
                        {isEditing ? "ذخیره تغییرات" : "ویرایش نام"}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
};

export default Profile;