import { Avatar, Box, Typography, Divider, Button, TextField, Stack, IconButton, InputAdornment } from "@mui/material";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Pencil } from "phosphor-react";
import { useAuth } from "../../Login/Component/Context/AuthContext"; // ** Import useAuth **
import { faker } from "@faker-js/faker";

const Profile = ({ onClose }) => {
    const { user, updateUser } = useAuth(); // ** Use context instead of localStorage **

    // State for editing modes
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);

    // State for form fields, initialized from context
    const [fullName, setFullName] = useState(user?.profile?.fullName || "");
    const [bio, setBio] = useState(user?.profile?.bio || "");

    // Update local state if user context changes from above
    useEffect(() => {
        setFullName(user?.profile?.fullName || "");
        setBio(user?.profile?.bio || "");
    }, [user]);
    
    const handleSaveName = () => {
        updateUser({ profile_json: { fullName: fullName } });
        setIsEditingName(false); // Exit editing mode
    };
    
    const handleSaveBio = () => {
        updateUser({ profile_json: { bio: bio } });
        setIsEditingBio(false); // Exit editing mode
    };

    return (
        <Box
            sx={{
                width: "320px", height: "100vh", backgroundColor: "background.paper",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)", position: "fixed",
                top: 0, left: 100, display: "flex", flexDirection: "column",
                zIndex: 1000, overflow: "hidden", borderLeft: "1px solid",
                borderColor: "divider", transition: "all 0.3s ease"
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", p: 2, borderBottom: "1px solid", borderColor: "divider", background: "linear-gradient(135deg, #1976d2 0%, #115293 100%)", color: "white", boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)" }}>
                <IconButton onClick={onClose} sx={{ color: "inherit", "&:hover": { backgroundColor: "rgba(255,255,255,0.15)", transform: "scale(1.1)" }, transition: "all 0.2s ease" }}>
                    <ArrowLeft size={24} />
                </IconButton>
                <Typography variant="h6" sx={{ ml: 2, fontWeight: 700, letterSpacing: "0.5px" }}>پروفایل کاربر</Typography>
            </Box>

            <Box sx={{ p: 3, overflowY: "auto", flex: 1, "&::-webkit-scrollbar": { width: "6px" }, "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "3px" } }}>
                <Stack alignItems="center" spacing={3}>
                    <Avatar src={user?.profile?.avatarUrl || faker.image.avatar()} sx={{ width: 120, height: 120, mb: 1, border: "3px solid", borderColor: "primary.main", boxShadow: "0px 4px 15px rgba(25, 118, 210, 0.3)", "&:hover": { transform: "scale(1.05)", boxShadow: "0px 4px 20px rgba(25, 118, 210, 0.4)" }, transition: "all 0.3s ease" }} />
                    
                    {/* Conditional rendering for Name */}
                    {isEditingName ? (
                        <TextField label="نام کامل" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth />
                    ) : (
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", textAlign: "center" }}>
                            {user?.profile?.fullName || "بدون نام"}
                        </Typography>
                    )}

                    <Divider sx={{ width: "100%", my: 1, borderColor: "divider", opacity: 0.7 }} />
                    
                    <TextField label="ایمیل" value={user?.email || ''} fullWidth disabled InputProps={{ startAdornment: (<InputAdornment position="start"></InputAdornment>), sx: { borderRadius: "12px" } }} />

                    {/* Conditional rendering for Bio */}
                    <TextField label="بیوگرافی" value={bio} onChange={(e) => setBio(e.target.value)} multiline rows={4} fullWidth disabled={!isEditingBio} sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }} />
                    
                    {/* Buttons */}
                    <Button
                        variant="contained" color="primary"
                        onClick={isEditingName ? handleSaveName : () => setIsEditingName(true)}
                        fullWidth startIcon={<Pencil size={20} />}
                        sx={{ py: 1.5, borderRadius: "12px", fontWeight: 600 }}
                    >
                        {isEditingName ? "ذخیره نام" : "ویرایش نام"}
                    </Button>
                    <Button
                        variant="contained" color="primary"
                        onClick={isEditingBio ? handleSaveBio : () => setIsEditingBio(true)}
                        fullWidth startIcon={<Pencil size={20} />}
                        sx={{ py: 1.5, borderRadius: "12px", fontWeight: 600 }}
                    >
                        {isEditingBio ? "ذخیره بیوگرافی" : "ویرایش بیوگرافی"}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
};

export default Profile;
