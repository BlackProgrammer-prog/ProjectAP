import React, { useEffect, useState } from "react";
import {
    Box,
    Stack,
    Typography,
    IconButton,
    Avatar,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
} from "@mui/material";
import { Plus, Users } from "phosphor-react";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import webSocketService from "../../Login/Component/Services/WebSocketService";

const Contacts = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openAdd, setOpenAdd] = useState(false);
    const [openSearch, setOpenSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [newContactEmail, setNewContactEmail] = useState("");

    const token = localStorage.getItem("token");

    // دریافت لیست مخاطبان
    const fetchContacts = () => {
        if (!token) return;
        webSocketService.send({
            type: "get_contacts",
            token,
        });
    };

    // افزودن مخاطب
    const handleAddContact = () => {
        if (!newContactEmail.trim() || !token) return;
        webSocketService.send({
            type: "add_contact",
            token,
            email: newContactEmail.trim(),
        });
        setNewContactEmail("");
        setOpenAdd(false);
    };

    // حذف مخاطب
    const handleRemoveContact = (email) => {
        if (!token) return;
        webSocketService.send({
            type: "remove_contact",
            token,
            email,
        });
    };

    // جست‌وجوی کاربر
    const handleSearchUser = () => {
        if (!searchQuery.trim() || !token) return;
        webSocketService.send({
            type: "search_user",
            token,
            query: searchQuery.trim(),
        });
    };

    // گوش دادن به پیام‌های WebSocket
    useEffect(() => {
        const handleMessage = (response) => {
            if (response.type === "get_contacts") {
                if (response.status === "success") {
                    setContacts(response.contacts);
                    setError(null);
                } else {
                    setError(response.message || "خطا در دریافت مخاطبان");
                    setContacts([]);
                }
                setLoading(false);
            }

            if (response.type === "add_contact") {
                if (response.status === "success") {
                    fetchContacts(); // دوباره لیست را بگیر
                } else {
                    alert(response.message || "افزودن مخاطب ناموفق بود");
                }
            }

            if (response.type === "remove_contact") {
                if (response.status === "success") {
                    fetchContacts(); // دوباره لیست را بگیر
                } else {
                    alert(response.message || "حذف مخاطب ناموفق بود");
                }
            }

            if (response.type === "search_user") {
                if (response.status === "success") {
                    setSearchResults(response.results);
                } else {
                    setSearchResults([]);
                }
            }
        };

        webSocketService.addListener("message", handleMessage);
        fetchContacts();

        return () => {
            webSocketService.removeListener("message", handleMessage);
        };
    }, [token]);

    if (loading) {
        return (
            <Stack alignItems="center" justifyContent="center" height="100vh">
                <CircularProgress />
            </Stack>
        );
    }

    if (error) {
        return (
            <Stack alignItems="center" justifyContent="center" height="100vh">
                <Alert severity="error">{error}</Alert>
            </Stack>
        );
    }

    return (
        <>
            <Stack direction="row" sx={{ width: "100%" }}>
                {/* پنل سمت چپ */}
                <Box
                    sx={{
                        height: "100vh",
                        backgroundColor:
                            theme.palette.mode === "light"
                                ? "#F8FAFF"
                                : theme.palette.background.paper,
                        width: 320,
                        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
                    }}
                >
                    <Stack p={3} spacing={2} sx={{ maxHeight: "100vh" }}>
                        <Stack alignItems="center" justifyContent="space-between" direction="row">
                            <Typography variant="h5">مخاطبان</Typography>
                            <IconButton onClick={() => setOpenSearch(true)}>
                                <SearchIcon />
                            </IconButton>

                        </Stack>

                        <Button
                            variant="contained"
                            startIcon={<Plus />}
                            onClick={() => setOpenAdd(true)}
                        >
                            افزودن مخاطب
                        </Button>

                        <Divider />

                        <Stack spacing={2} sx={{ flexGrow: 1, overflowY: "auto" }}>
                            {contacts.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    هیچ مخاطبی یافت نشد
                                </Typography>
                            ) : (
                                contacts.map((contact) => (
                                    <Stack
                                        key={contact.user_id}
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{
                                            cursor: "pointer",
                                            "&:hover": { backgroundColor: theme.palette.action.hover },
                                            p: 1.5,
                                            borderRadius: 1,
                                        }}
                                        onClick={() => navigate(`/app/chat/${contact.username}`)}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar
                                                alt={contact.username}
                                                src={contact.profile?.avatar || "/default-avatar.png"}
                                            />
                                            <Stack>
                                                <Typography variant="subtitle2">{contact.username}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {contact.status === "online" ? "آنلاین" : "آفلاین"}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveContact(contact.email);
                                            }}
                                        >
                                            حذف
                                        </Button>
                                    </Stack>
                                ))
                            )}
                        </Stack>
                    </Stack>
                </Box>

                {/* پنل سمت راست */}
                <Box
                    sx={{
                        height: "100%",
                        width: "calc(100vw - 320px)",
                        backgroundColor:
                            theme.palette.mode === "light"
                                ? "#FFF"
                                : theme.palette.background.default,
                    }}
                >
                    <Stack
                        spacing={2}
                        sx={{ height: "100%", width: "100%" }}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Typography variant="h6">یک مخاطب را انتخاب کنید</Typography>
                    </Stack>
                </Box>
            </Stack>

            {/* دیالوگ افزودن مخاطب */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
                <DialogTitle>افزودن مخاطب جدید</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="ایمیل مخاطب"
                        type="email"
                        fullWidth
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>لغو</Button>
                    <Button onClick={handleAddContact}>افزودن</Button>
                </DialogActions>
            </Dialog>

            {/* دیالوگ جست‌وجو */}
            <Dialog open={openSearch} onClose={() => setOpenSearch(false)}>
                <DialogTitle>جست‌وجوی کاربر</DialogTitle>
                <DialogContent>
                    <TextField            autoFocus
                                          margin="dense"
                                          label="نام کاربری یا ایمیل"
                                          type="text"
                                          fullWidth
                                          value={searchQuery}
                                          onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => {
                            handleSearchUser();
                            setOpenSearch(false);
                        }}
                    >
                        جست‌وجو
                    </Button>
                    {searchResults.length > 0 && (
                        <Stack spacing={1} mt={2}>
                            {searchResults.map((user) => (
                                <Button
                                    key={user.user_id}
                                    variant="outlined"
                                    onClick={() => {
                                        handleAddContact(user.email);
                                        setOpenSearch(false);
                                    }}
                                >
                                    افزودن {user.username}
                                </Button>
                            ))}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSearch(false)}>بستن</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Contacts;