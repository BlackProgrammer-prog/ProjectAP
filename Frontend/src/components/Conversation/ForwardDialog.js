import {
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    Box,
    Stack,
    useTheme,
    IconButton,
} from "@mui/material";
import { X, ArrowRight } from "phosphor-react";
import { ChatList } from "../../data";
import { useParams } from "react-router-dom";

const ForwardDialog = ({ open, onClose, onForward, message }) => {
    const theme = useTheme();
    const { username: currentChatUser } = useParams();

    // فیلتر کردن مخاطبین (حذف کاربر فعلی از لیست)
    const availableContacts = ChatList.filter(contact => contact.username !== currentChatUser);

    // پیدا کردن نام فرستنده پیام
    const getSenderName = () => {
        if (message.sender === "me") {
            return "شما";
        } else {
            const sender = ChatList.find(contact => contact.username === currentChatUser);
            return sender ? sender.name : "کاربر";
        }
    };

    const handleContactSelect = (contact) => {
        onForward(contact.username, message);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: "70vh",
                },
            }}
        >
            <DialogTitle>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        فوروارد پیام
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <X size={20} />
                    </IconButton>
                </Stack>

                {/* نمایش پیام فوروارد شده */}
                {message && (
                    <Box
                        sx={{
                            mt: 4,
                            p: 2,
                            backgroundColor: theme.palette.mode === "light" ? "#f5f5f5" : theme.palette.grey[800],
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <Typography variant="caption" sx={{color: theme.palette.text.secondary, mb: 1, display: "block" }}>
                            پیام از {getSenderName()}:
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                            {message.message}
                        </Typography>
                    </Box>
                )}
            </DialogTitle>

            <DialogContent>
                <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                    مخاطب مورد نظر را انتخاب کنید:
                </Typography>

                <List sx={{ p: 0 }}>
                    {availableContacts.map((contact) => (
                        <ListItem
                            key={contact.id}
                            onClick={() => handleContactSelect(contact)}
                            sx={{
                                cursor: "pointer",
                                borderRadius: 1,
                                mb: 1,
                                "&:hover": {
                                    backgroundColor: theme.palette.action.hover,
                                },
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar src={contact.img} alt={contact.name} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={contact.name}
                                secondary={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            {contact.online ? "آنلاین" : "آفلاین"}
                                        </Typography>
                                    </Stack>
                                }
                            />
                            <ArrowRight size={20} color={theme.palette.text.secondary} />
                        </ListItem>
                    ))}
                </List>

                {availableContacts.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            هیچ مخاطبی برای فوروارد موجود نیست
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ForwardDialog; 